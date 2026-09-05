// Contract for ReferenceLibraryRoom's radiology tab.
//
// Two regressions this pins:
//   1. It called GET /radiology-database with no `lang`, so the Spanish UI
//      showed Spanish chrome ("Hallazgos normales") over whatever language
//      each catalogue study happened to be authored in — mostly English.
//   2. It never showed an actual image for ANY study — even ones the
//      platform has real bundled DICOM imaging for (server/plugin-content/
//      pacs) — only a text-only "normal findings" modal. A study the
//      archive backs must open the real reader (the same one Radiología's
//      Imágenes tab uses), not the text fallback.

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../tests/utils/renderWithProviders.jsx';
import { ReferenceLibraryRoom } from './ReferenceLibraryRoom.jsx';

const STUDIES_EN = [
    { id: 'xray_pelvis', name: 'Pelvis X-Ray', modality: 'X-Ray', body_region: 'Pelvis', normal_findings: 'The pelvis is intact.', normal_interpretation: '1. No fracture.' },
    { id: 'xray_wrist', name: 'Wrist X-Ray', modality: 'X-Ray', body_region: 'Wrist', normal_findings: 'The wrist is intact.', normal_interpretation: '1. No fracture.' },
];
const STUDIES_ES = [
    { id: 'xray_pelvis', name: 'Radiografía de Pelvis', modality: 'X-Ray', body_region: 'Pelvis', normal_findings: 'La pelvis está íntegra.', normal_interpretation: '1. Sin fractura.' },
    { id: 'xray_wrist', name: 'Wrist X-Ray', modality: 'X-Ray', body_region: 'Wrist', normal_findings: 'The wrist is intact.', normal_interpretation: '1. No fracture.' },
];

const ARCHIVE = {
    version: 1,
    name: 'Test archive',
    entries: [
        {
            id: 'normal/xr_pelvis',
            studyId: 'xray_pelvis',
            modality: 'CR',
            bodyRegion: 'Pelvis',
            label: 'Pelvis X-Ray (AP)',
            series: [{ key: 's6', description: 'AP Pelvis', plane: 'unknown', instances: 1, ref: 'remote:dicom/normal/xray_pelvis/s6/' }],
        },
        // xray_wrist has NO archive entry — it must fall back to text.
    ],
};

const apiFetchMock = vi.fn((path) => {
    if (path.startsWith('/radiology-database')) {
        const lang = new URL(`http://x${path}`).searchParams.get('lang');
        return Promise.resolve({ studies: lang?.startsWith('es') ? STUDIES_ES : STUDIES_EN });
    }
    if (path === '/plugins/pacs/catalog') {
        return Promise.resolve({ catalog: ARCHIVE });
    }
    return Promise.resolve({});
});

vi.mock('../../services/apiClient', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, apiFetch: (...args) => apiFetchMock(...args) };
});

vi.mock('../hostAssetService.js', () => ({
    createHostAssetService: () => ({ list: () => Promise.resolve({ assets: [] }) }),
}));

// PacsScreen pulls in a real DICOM reader stack (canvas rendering, series
// loading) that jsdom cannot run; the contract this test owns is "the real
// reader mounts for an archive-backed study", not its internals — those are
// PacsScreen's own test suite's job.
vi.mock('../../components/pacs/PacsScreen.jsx', () => ({
    PacsScreen: ({ worklist }) => <div data-testid="pacs-screen">{worklist[0]?.description}</div>,
}));

beforeEach(() => {
    apiFetchMock.mockClear();
});

async function openLibraryOnRadiologyTab() {
    const user = userEvent.setup();
    renderWithProviders(<ReferenceLibraryRoom t={(key, fallback) => fallback ?? key} />);
    await user.click(screen.getByRole('tab', { name: /Radiology/i }));
    return user;
}

describe('ReferenceLibraryRoom — radiology tab language', () => {
    it('sends the UI language to /radiology-database, and the catalogue renders in it', async () => {
        await openLibraryOnRadiologyTab();
        await waitFor(() => expect(screen.getByText('Pelvis X-Ray')).toBeTruthy());
        const call = apiFetchMock.mock.calls.find(([path]) => path.startsWith('/radiology-database'));
        expect(call[0]).toMatch(/\/radiology-database\?lang=en/);
    });
});

describe('ReferenceLibraryRoom — radiology tab opens the real reader when the archive backs a study', () => {
    it('opens PacsScreen (the real DICOM reader) for a study the archive has imaging for', async () => {
        const user = await openLibraryOnRadiologyTab();
        await waitFor(() => expect(screen.getByText('Pelvis X-Ray')).toBeTruthy());
        await user.click(screen.getByText('Pelvis X-Ray'));
        expect(await screen.findByTestId('pacs-screen')).toBeTruthy();
        expect(screen.queryByText('Hallazgos normales')).toBeNull();
    });

    it('falls back to the text-only normal report for a study the archive has nothing for', async () => {
        const user = await openLibraryOnRadiologyTab();
        await waitFor(() => expect(screen.getByText('Wrist X-Ray')).toBeTruthy());
        await user.click(screen.getByText('Wrist X-Ray'));
        expect(await screen.findByText('The wrist is intact.')).toBeTruthy();
        expect(screen.queryByTestId('pacs-screen')).toBeNull();
    });

    it('marks only the archive-backed card as having imaging', async () => {
        await openLibraryOnRadiologyTab();
        await waitFor(() => expect(screen.getByText('Pelvis X-Ray')).toBeTruthy());
        const pelvisCard = screen.getByText('Pelvis X-Ray').closest('button');
        const wristCard = screen.getByText('Wrist X-Ray').closest('button');
        expect(pelvisCard.textContent).toMatch(/Imaging available/i);
        expect(wristCard.textContent).not.toMatch(/Imaging available/i);
    });
});
