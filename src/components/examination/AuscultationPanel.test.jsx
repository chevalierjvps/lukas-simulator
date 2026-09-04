// Regression lock: a case flagged abnormal used to blanket EVERY
// auscultation point with the same finding (murmur on all 5 heart points,
// crackles on all 4 lung points) — no way to say "heart is normal, only the
// left lung base is diminished" (dengue: pleural effusion, no cardiac
// finding). `points` is the per-focus override that fixes this; any point
// not listed keeps the old flat isAbnormal behaviour, so an existing case
// with no points map is unaffected.

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, render, fireEvent } from '@testing-library/react';
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

describe('AuscultationPanel — per-focus sound override (points)', () => {
    beforeEach(() => {
        playHeartSound.mockReset();
        playLungSound.mockReset();
        // jsdom has no real Web Audio API; AuscultationPanel only needs
        // AudioContext (or its webkit-prefixed name — tests/setup.js's
        // global stub sets both) to EXIST to decide the synth path is
        // available. Scoped to this describe only — a later describe (the
        // manikin/transport/chrome suites below) relies on the DEFAULT (no
        // AudioContext) behaviour to exercise the real-<audio> paths
        // deterministically, so this polyfill must not leak into them.
        window.AudioContext = window.AudioContext || function AudioContext() {};
        window.webkitAudioContext = window.webkitAudioContext || window.AudioContext;
    });

    afterEach(() => {
        delete window.AudioContext;
        delete window.webkitAudioContext;
    });

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

// The `figure` prop is ADDITIVE: 'diagram' (the default, used by the 2D
// examination room) must keep the schematic background exactly as it was,
// while 'manikin' swaps in the shared examination figure with anatomical
// point placement for the 3D room.

const baseProps = {
    finding: 'Vesicular breath sounds throughout.',
    isAbnormal: false,
    selectedRegion: 'chestAnterior',
    regionName: 'Chest',
};

// The figure is Cardoyon's ink-coverage mask painted through an SVG mask,
// so its presence is an <image> inside a mask, not an <img> tag.
const figureMask = (container) => container.querySelector('mask image');

describe('AuscultationPanel figure', () => {
    beforeEach(() => {
        vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
        vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
        vi.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    });

    it('defaults to the schematic diagram with no body figure', () => {
        const { container } = render(<AuscultationPanel {...baseProps} />);
        expect(figureMask(container)).toBeNull();
        // The auscultation points themselves are unaffected by the default.
        expect(container.querySelectorAll('button[title]').length).toBeGreaterThanOrEqual(5);
    });

    it('draws the examination manikin when asked, keeping every point', () => {
        const diagram = render(<AuscultationPanel {...baseProps} />);
        const diagramPoints = diagram.container.querySelectorAll('button[title]').length;
        diagram.unmount();

        const { container } = render(<AuscultationPanel {...baseProps} figure="manikin" />);
        const image = figureMask(container);
        expect(image).not.toBeNull();
        // Cardoyon's figure travels as an inline ink-coverage mask.
        expect(image.getAttribute('href')).toMatch(/^data:image\/png;base64,/);
        expect(container.querySelectorAll('button[title]').length).toBe(diagramPoints);
    });

    it('names the intercostal spaces the way a clinician would', () => {
        const { container } = render(<AuscultationPanel {...baseProps} figure="manikin" />);
        const labels = [...container.querySelectorAll('svg text')].map((node) => node.textContent);
        expect(labels).toContain('4th');
        expect(labels).toContain('5th');
        // Dashed landmarks, not solid rules — they orient, they do not shout.
        expect(container.querySelector('svg line').getAttribute('stroke-dasharray')).toBeTruthy();
    });

    it('places cardiac points on the correct side: aortic right of sternum, apex left', () => {
        const { container } = render(<AuscultationPanel {...baseProps} figure="manikin" />);
        const byTitle = (fragment) => [...container.querySelectorAll('button[title]')]
            .find((button) => button.getAttribute('title').toLowerCase().includes(fragment));
        const left = (button) => parseFloat(button.style.left);
        // Anterior view: the patient's right is the viewer's left, so the
        // aortic area sits left of the midline and the apex well right of it.
        expect(left(byTitle('aortic'))).toBeLessThan(left(byTitle('pulmonic')));
        expect(left(byTitle('mitral'))).toBeGreaterThan(left(byTitle('tricuspid')));
        // Every point stays inside the viewport.
        [...container.querySelectorAll('button[title]')].forEach((button) => {
            expect(parseFloat(button.style.left)).toBeGreaterThan(0);
            expect(parseFloat(button.style.left)).toBeLessThan(100);
            expect(parseFloat(button.style.top)).toBeGreaterThan(0);
            expect(parseFloat(button.style.top)).toBeLessThan(100);
        });
    });

    it('places abdominal points around the umbilicus for the abdomen profile', () => {
        const { container } = render(
            <AuscultationPanel
                {...baseProps}
                selectedRegion="abdomen"
                auscultationProfile="abdomen"
                regionName="Abdomen"
                figure="manikin"
            />,
        );
        expect(figureMask(container)).not.toBeNull();
        const byTitle = (fragment) => [...container.querySelectorAll('button[title]')]
            .find((button) => button.getAttribute('title').toLowerCase().includes(fragment));
        // Upper quadrants sit above the lower ones.
        expect(parseFloat(byTitle('ruq').style.top)).toBeLessThan(parseFloat(byTitle('rlq').style.top));
        // The patient's right quadrant is on the viewer's left.
        expect(parseFloat(byTitle('ruq').style.left)).toBeLessThan(parseFloat(byTitle('luq').style.left));
    });
});

describe('AuscultationPanel transport and verdict', () => {
    beforeEach(() => {
        vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
        vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
        vi.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
        // These tests exercise the real <audio>-element transport, not the
        // live stethoscope synth — drop the global AudioContext stub
        // (tests/setup.js sets both the plain and webkit-prefixed names)
        // for their duration so getAudioForPoint falls back to the
        // deterministic canned default clip instead of preferring the
        // synth (AuscultationPanel only prefers the synth when Web Audio
        // is actually available).
        delete window.AudioContext;
        delete window.webkitAudioContext;
    });

    afterEach(() => {
        window.AudioContext = window.AudioContext || function AudioContext() {};
        window.webkitAudioContext = window.webkitAudioContext || window.AudioContext;
    });

    it('labels a normal finding by default and withholds that verdict on request', () => {
        const withLabel = render(<AuscultationPanel {...baseProps} />);
        expect(withLabel.queryAllByText(/normal/i).length).toBeGreaterThan(0);
        withLabel.unmount();

        const { container } = render(<AuscultationPanel {...baseProps} normalLabel={false} />);
        // The finding text may still say "normal"; the verdict BADGE must not.
        const badges = [...container.querySelectorAll('span')]
            .filter((node) => /bg-emerald-900/.test(node.className));
        expect(badges).toHaveLength(0);
    });

    it('offers a real seek control in the compact transport', () => {
        const { container, getByLabelText } = render(
            <AuscultationPanel {...baseProps} transport="compact" />,
        );
        const seek = getByLabelText('Seek');
        expect(seek.getAttribute('type')).toBe('range');
        // Seeking moves the audio element, not just the slider.
        const audio = container.querySelector('audio');
        Object.defineProperty(audio, 'duration', { value: 12, configurable: true });
        fireEvent.loadedMetadata(audio);
        fireEvent.change(seek, { target: { value: '6' } });
        expect(audio.currentTime).toBe(6);
        expect(getByLabelText('Play')).toBeDefined();
    });

    it('drives the default progress bar from real playback, not a fixed width', () => {
        const { container } = render(<AuscultationPanel {...baseProps} />);
        const audio = container.querySelector('audio');
        const bar = () => container.querySelector('.bg-cyan-500');
        expect(bar().style.width).toBe('0%');
        Object.defineProperty(audio, 'duration', { value: 10, configurable: true });
        fireEvent.loadedMetadata(audio);
        Object.defineProperty(audio, 'currentTime', { value: 5, configurable: true, writable: true });
        fireEvent.timeUpdate(audio);
        expect(bar().style.width).toBe('50%');
    });
});

describe('AuscultationPanel stacked order', () => {
    beforeEach(() => {
        vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
        vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
        vi.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
        // Real <audio>-element transport, not the live synth — see the
        // identical comment in "transport and verdict" above.
        delete window.AudioContext;
        delete window.webkitAudioContext;
    });

    afterEach(() => {
        window.AudioContext = window.AudioContext || function AudioContext() {};
        window.webkitAudioContext = window.webkitAudioContext || window.AudioContext;
    });

    // Stacked panels read top-down: body, then the controls for the site
    // clicked on it, then the finding. The player must not land after the
    // paragraph, where it is a scroll away from the figure it belongs to.
    it('puts the player directly under the figure, above the finding text', () => {
        const { container } = render(
            <AuscultationPanel {...baseProps} figure="manikin" layout="stack" transport="compact" />,
        );
        const seek = container.querySelector('input[type="range"]');
        const findingText = [...container.querySelectorAll('div')]
            .find((node) => node.textContent.trim().startsWith('Vesicular breath sounds')
                && node.children.length === 0);
        const figure = container.querySelector('svg mask').closest('div');
        expect(seek).not.toBeNull();
        expect(findingText).toBeDefined();
        const order = (node) => [...container.querySelectorAll('*')].indexOf(node);
        expect(order(figure)).toBeLessThan(order(seek));
        expect(order(seek)).toBeLessThan(order(findingText));
    });

    it('keeps the finding above the player when there is room side by side', () => {
        const { container } = render(
            <AuscultationPanel {...baseProps} figure="manikin" layout="row" transport="compact" />,
        );
        const seek = container.querySelector('input[type="range"]');
        const findingText = [...container.querySelectorAll('div')]
            .find((node) => node.textContent.trim().startsWith('Vesicular breath sounds')
                && node.children.length === 0);
        const order = (node) => [...container.querySelectorAll('*')].indexOf(node);
        expect(order(findingText)).toBeLessThan(order(seek));
    });
});

describe('AuscultationPanel chrome', () => {
    beforeEach(() => {
        vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
        vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
        vi.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    });

    it('keeps its own card and header by default', () => {
        const { container, getByText } = render(<AuscultationPanel {...baseProps} />);
        expect(container.firstChild.className).toMatch(/rounded-lg border/);
        expect(getByText(/Auscultation/)).toBeDefined();
    });

    it('drops the frame and the duplicated header when the host owns them', () => {
        const { container } = render(<AuscultationPanel {...baseProps} chrome="bare" />);
        expect(container.firstChild.className).not.toMatch(/rounded-lg border/);
        // The region/technique heading is the host's job in bare mode.
        const heading = [...container.querySelectorAll('div')]
            .find((node) => /items-center justify-between mb-3/.test(node.className));
        expect(heading.className).toMatch(/hidden/);
        // The clinical content itself is untouched.
        expect(container.querySelectorAll('button[title]').length).toBeGreaterThanOrEqual(5);
    });
});
