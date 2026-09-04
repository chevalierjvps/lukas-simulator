// Regression lock: a case flagged abnormal used to blanket EVERY
// auscultation point with the same finding (murmur on all 5 heart points,
// crackles on all 4 lung points) — no way to say "heart is normal, only the
// left lung base is diminished" (dengue: pleural effusion, no cardiac
// finding). `points` is the per-focus override that fixes this; any point
// not listed keeps the old flat isAbnormal behaviour, so an existing case
// with no points map is unaffected.

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../tests/utils/renderWithProviders.jsx';

vi.mock('../../services/PatientRecord', () => ({
    usePatientRecord: () => ({ record: { current_state: { vitals: { hr: 80 } } } }),
}));

const playHeartSound = vi.fn();
const playLungSound = vi.fn();
vi.mock('../../services/clinicalAudioSynthesizer', () => ({
    ClinicalAudio: {
        playHeartSound: (...args) => playHeartSound(...args),
        playLungSound: (...args) => playLungSound(...args),
    },
}));

import AuscultationPanel from './AuscultationPanel.jsx';

beforeEach(() => {
    playHeartSound.mockReset();
    playLungSound.mockReset();
    // jsdom has no real Web Audio API; AuscultationPanel only needs
    // AudioContext to EXIST to decide the synth path is available.
    window.AudioContext = window.AudioContext || function AudioContext() {};
});

describe('AuscultationPanel — per-focus sound override (points)', () => {
    it('plays the point-specific override instead of the flat isAbnormal type', async () => {
        const user = userEvent.setup();
        renderWithProviders(
            <AuscultationPanel
                isAbnormal={true}
                points={{ lungBaseLeft: 'diminished' }}
                selectedRegion="chestAnterior"
                regionName="Chest"
            />
        );

        await user.click(screen.getByRole('button', { name: 'L. Base' }));

        expect(playLungSound).toHaveBeenCalledWith('diminished', expect.any(Object));
    });

    it('falls back to the flat isAbnormal behaviour for a point with no override', async () => {
        const user = userEvent.setup();
        renderWithProviders(
            <AuscultationPanel
                isAbnormal={true}
                points={{ lungBaseLeft: 'diminished' }}
                selectedRegion="chestAnterior"
                regionName="Chest"
            />
        );

        // mitral has no entry in `points` — must still take the old
        // abnormal-blanket path (murmur), unaffected by the lung override.
        await user.click(screen.getByRole('button', { name: 'Mitral (Apex)' }));

        expect(playHeartSound).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'murmur' })
        );
    });

    it('a case with no points map at all behaves exactly as before', async () => {
        const user = userEvent.setup();
        renderWithProviders(
            <AuscultationPanel
                isAbnormal={false}
                selectedRegion="chestAnterior"
                regionName="Chest"
            />
        );

        await user.click(screen.getByRole('button', { name: 'L. Base' }));

        expect(playLungSound).toHaveBeenCalledWith('vesicular', expect.any(Object));
    });

    it('normal heart focus stays normal even while a lung focus is abnormal (dengue: no cardiac finding, decreased breath sounds at the effusion base)', async () => {
        const user = userEvent.setup();
        renderWithProviders(
            <AuscultationPanel
                isAbnormal={true}
                points={{ lungBaseLeft: 'diminished', mitral: 'normal', aortic: 'normal', pulmonic: 'normal', tricuspid: 'normal', erb: 'normal' }}
                selectedRegion="chestAnterior"
                regionName="Chest"
            />
        );

        await user.click(screen.getByRole('button', { name: 'Mitral (Apex)' }));
        expect(playHeartSound).toHaveBeenCalledWith(expect.objectContaining({ type: 'normal' }));

        await user.click(screen.getByRole('button', { name: 'L. Base' }));
        expect(playLungSound).toHaveBeenCalledWith('diminished', expect.any(Object));
    });
});
