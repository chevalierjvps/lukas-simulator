// Contract for RoomNavigator — the bottom nav shared across every
// in-session surface (chat, exam, investigations, consultant). It must:
//   1. Render all five room buttons as peers (no special end action).
//   2. Mark the active room (aria-pressed=true) and only that one.
//   3. Invoke onSelectRoom(key) when a room is clicked.
// The actual session-end action lives on the patient room's
// End & Debrief button, not in this nav.

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { setAppLanguage } from '../../i18n/index.js';
import RoomNavigator from './RoomNavigator';

function renderNav(overrides = {}) {
    const onSelectRoom = overrides.onSelectRoom ?? vi.fn();
    render(
        <RoomNavigator
            currentRoom={overrides.currentRoom ?? 'chat'}
            onSelectRoom={onSelectRoom}
        />
    );
    return { onSelectRoom };
}

beforeEach(async () => {
    await setAppLanguage('en');
});

afterEach(async () => {
    await setAppLanguage('pt');
    cleanup();
});

describe('RoomNavigator', () => {
    it('renders all five peer room buttons', () => {
        renderNav();
        expect(screen.getByRole('button', { name: /Patient/ })).toBeTruthy();
        expect(screen.getByRole('button', { name: /Examination/ })).toBeTruthy();
        expect(screen.getByRole('button', { name: /Laboratory/ })).toBeTruthy();
        expect(screen.getByRole('button', { name: /Radiology/ })).toBeTruthy();
        expect(screen.getByRole('button', { name: /Consultant/ })).toBeTruthy();
    });

    it('does not render an End-session button (that lives in the patient room)', () => {
        renderNav();
        expect(screen.queryByRole('button', { name: /End & consult/i })).toBeNull();
        expect(screen.queryByRole('button', { name: /End Session/i })).toBeNull();
    });

    it('aria-pressed reflects the active room', () => {
        renderNav({ currentRoom: 'lab' });
        const lab = screen.getByRole('button', { name: /Laboratory/ });
        const chat = screen.getByRole('button', { name: /Patient/ });
        expect(lab.getAttribute('aria-pressed')).toBe('true');
        expect(chat.getAttribute('aria-pressed')).toBe('false');
    });

    it.each([
        ['Patient', 'chat'],
        ['Examination', 'examination'],
        ['Laboratory', 'lab'],
        ['Radiology', 'radiology'],
        ['Consultant', 'consultant'],
    ])('clicking %s calls onSelectRoom(%s)', (label, expected) => {
        const { onSelectRoom } = renderNav({ currentRoom: 'chat' });
        fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }));
        expect(onSelectRoom).toHaveBeenCalledWith(expected);
    });

    // The room key stays `radiology` (URL/state/tests depend on it); only the
    // student-facing label says the room also holds the diagnostic tests
    // (ECG, Holter, echo, cath live under the 'Cardiac' modality there).
    it('labels the radiology room "Radiology & diagnostics" in English', () => {
        renderNav();
        const button = screen.getByRole('button', { name: /Radiology & diagnostics/ });
        expect(button).toBeTruthy();
        expect(button.textContent).toMatch(/imaging & tests/);
    });

    it('labels the radiology room "Radiologia e diagnostica" in Italian', async () => {
        renderNav();
        await setAppLanguage('it');
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Radiologia e diagnostica/ })).toBeTruthy();
        });
    });

    // PACS no longer gets its own nav tab — its viewer is the "Imágenes" tab
    // inside the Radiology room now (App.jsx's radiologyTab state), reached
    // via InvestigationsScreen's onOpenImagesTab or the tablist App.jsx
    // renders there, never via a RoomNavigator button. Two unsynchronized
    // rooms describing the same imaging (one generic/global, one
    // case-authored with the real DICOM series) is the bug that merge fixed;
    // this locks the nav side of it so a future plugin-manifest change can't
    // silently bring the standalone tab back.
    it('never renders a standalone PACS tab, even with the plugin enabled', () => {
        render(
            <RoomNavigator currentRoom="radiology" onSelectRoom={vi.fn()} enabledPlugins={['pacs']} />
        );
        expect(screen.queryByRole('button', { name: /PACS/i })).toBeNull();
    });
});
