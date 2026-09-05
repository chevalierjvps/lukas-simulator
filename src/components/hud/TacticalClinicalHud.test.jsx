// Regression lock: the defibrillator delivered "successful" feedback and
// logged the same treatment order regardless of the current rhythm — a
// shock on NSR looked identical, in the UI and in the debrief, to a shock on
// VFib. ACLS: unsynchronized shock is only indicated for VF or pulseless VT.

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../tests/utils/renderWithProviders.jsx';

const apiPost = vi.fn().mockResolvedValue({});
vi.mock('../../services/apiClient', () => ({
    apiPost: (...args) => apiPost(...args),
}));

const playDefibrillatorCharge = vi.fn();
const playDefibrillatorShock = vi.fn();
vi.mock('../../services/clinicalAudioSynthesizer', () => ({
    ClinicalAudio: {
        playDefibrillatorCharge: (...a) => playDefibrillatorCharge(...a),
        playDefibrillatorShock: (...a) => playDefibrillatorShock(...a),
    },
}));

import { TacticalClinicalHud } from './TacticalClinicalHud.jsx';

// tests/setup.js sets the global i18n instance to 'en' before every test,
// so the HUD's now-translated (previously hardcoded-Portuguese) strings
// render in English here — these assertions are pinned to src/locales/en/hud.json.
async function chargeAndDeliver(user) {
    await user.keyboard('4'); // open the defib menu (hotkey 4)
    await user.click(await screen.findByText(/Charge 200J Biphasic/i));
    await user.click(await screen.findByText(/DELIVER SHOCK/i, {}, { timeout: 4000 }));
}

beforeEach(() => {
    apiPost.mockReset().mockResolvedValue({});
    playDefibrillatorCharge.mockClear();
    playDefibrillatorShock.mockClear();
});

describe('TacticalClinicalHud — defibrillator only "works" on a shockable rhythm', () => {
    it('shows success feedback for VFib', async () => {
        const user = userEvent.setup();
        renderWithProviders(
            <TacticalClinicalHud sessionId="sess-1" vitals={{ hr: 0, rhythm: 'VFib' }} />
        );

        await chargeAndDeliver(user);

        // Defibrillation has no `case_treatments`/`treatment_effects` row —
        // it's not prescribed-then-administered like a drug — so it stays a
        // direct client-side action and never calls apiPost.
        expect(await screen.findByText(/Order Executed!/i)).toBeTruthy();
        expect(apiPost).not.toHaveBeenCalled();
    });

    it('shows success feedback for pulseless VTach too', async () => {
        const user = userEvent.setup();
        renderWithProviders(
            <TacticalClinicalHud sessionId="sess-1" vitals={{ hr: 180, rhythm: 'VTach' }} />
        );

        await chargeAndDeliver(user);

        expect(await screen.findByText(/Order Executed!/i)).toBeTruthy();
        expect(apiPost).not.toHaveBeenCalled();
    });

    it('does NOT show success feedback for a shock on normal sinus rhythm — warns as a non-indicated shock instead', async () => {
        const user = userEvent.setup();
        renderWithProviders(
            <TacticalClinicalHud sessionId="sess-1" vitals={{ hr: 80, rhythm: 'NSR' }} />
        );

        await chargeAndDeliver(user);

        expect(screen.queryByText(/Order Executed!/i)).toBeNull();
        expect(await screen.findByText(/Shock without indication/i)).toBeTruthy();
        expect(apiPost).not.toHaveBeenCalled();
    });

    it('warns for Asystole (not a shockable rhythm, despite being a real arrest)', async () => {
        const user = userEvent.setup();
        renderWithProviders(
            <TacticalClinicalHud sessionId="sess-1" vitals={{ hr: 0, rhythm: 'Asystole' }} />
        );

        await chargeAndDeliver(user);

        expect(await screen.findByText(/Shock without indication/i)).toBeTruthy();
    });

    it('the physical discharge still fires regardless of rhythm — a manual defibrillator does not refuse to shock', async () => {
        const user = userEvent.setup();
        renderWithProviders(
            <TacticalClinicalHud sessionId="sess-1" vitals={{ hr: 80, rhythm: 'NSR' }} />
        );

        await chargeAndDeliver(user);

        expect(playDefibrillatorShock).toHaveBeenCalledTimes(1);
    });
});

// Regression lock: the HUD's drug/fluid/O2 hotkeys posted to
// `/sessions/:id/orders` (plural) — a path the server never registered (only
// the singular `/order`, for lab/investigation IDs) — so every quick order
// 404ed silently while still showing "Order Executed!". This locks the fix:
// the hotkeys go through the same order-treatment → administer pair
// TreatmentPanel.jsx uses. `treatment_name` stays the exact catalogue
// identifier ('Morfina', not the translated display text) — the display
// label is what's translated, not the wire value matched against
// treatment_effects.json.
describe('TacticalClinicalHud — quick orders use the real Tratamentos pipeline', () => {
    it('prescribes then administers Morphine via order-treatment + administer, not the old /orders path', async () => {
        apiPost.mockImplementation((path) => (
            path.endsWith('/order-treatment') ? Promise.resolve({ order_id: 42 }) : Promise.resolve({})
        ));
        const user = userEvent.setup();
        renderWithProviders(<TacticalClinicalHud sessionId="sess-1" vitals={{ hr: 90 }} />);

        await user.keyboard('3'); // open the meds menu (hotkey 3)
        await user.click(await screen.findByText(/Morphine 4 mg IV/i));

        await screen.findByText(/Order Executed!/i);
        expect(apiPost).toHaveBeenCalledWith('/sessions/sess-1/order-treatment', expect.objectContaining({
            treatment_type: 'medication', treatment_name: 'Morfina', route: 'IV', dose: '4 mg', urgency: 'stat',
        }));
        expect(apiPost).toHaveBeenCalledWith('/sessions/sess-1/administer/42');
    });

    it('surfaces a contraindication warning instead of a fake success when order-treatment flags one', async () => {
        apiPost.mockImplementation((path) => (
            path.endsWith('/order-treatment')
                ? Promise.resolve({ order_id: 7, is_contraindicated: true, contraindication_feedback: 'Contraindicado neste quadro.' })
                : Promise.resolve({})
        ));
        const user = userEvent.setup();
        renderWithProviders(<TacticalClinicalHud sessionId="sess-1" vitals={{ hr: 90 }} />);

        await user.keyboard('3');
        await user.click(await screen.findByText(/Morphine 4 mg IV/i));

        expect(await screen.findByText(/Contraindicated in this case/i)).toBeTruthy();
        expect(screen.queryByText(/Order Executed!/i)).toBeNull();
    });
});

// Regression lock: Exames called onOpenInvestigations() → navigateToRoom
// ('investigations'), a room key nothing in App.jsx's ROOM_KEYS recognized —
// clicking it silently did nothing. Ausculta opened a local mini-menu that
// only played a synthesized demo tone, with no link at all to the real
// per-region auscultation. Both now call the room-navigation callbacks the
// app actually wires to valid rooms ('radiology'/'room3d' in App.jsx — the
// old 'examination' 2D room Ausculta used to open no longer exists, the 3D
// Bedside room replaces it), so this test only needs to confirm the HUD
// calls the callback — which room it resolves to is App.jsx's concern.
describe('TacticalClinicalHud — Exames and Ausculta navigate instead of no-op / demo sound', () => {
    it('Exames calls onOpenInvestigations, not a dead local menu', async () => {
        const onOpenInvestigations = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(
            <TacticalClinicalHud sessionId="sess-1" vitals={{ hr: 90 }} onOpenInvestigations={onOpenInvestigations} />
        );

        await user.click(screen.getByTitle(/Exams & Imaging/i));

        expect(onOpenInvestigations).toHaveBeenCalledTimes(1);
    });

    it('Ausculta calls onOpenExam (hotkey and click), not the old demo-tone menu', async () => {
        const onOpenExam = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(
            <TacticalClinicalHud sessionId="sess-1" vitals={{ hr: 90 }} onOpenExam={onOpenExam} />
        );

        await user.click(screen.getByTitle(/Auscultation — open the 3D Room/i));
        expect(onOpenExam).toHaveBeenCalledTimes(1);

        await user.keyboard('5');
        expect(onOpenExam).toHaveBeenCalledTimes(2);

        // No demo-tone menu ever opens for either trigger.
        expect(screen.queryByText(/Bulhas B1\/B2/i)).toBeNull();
    });
});
