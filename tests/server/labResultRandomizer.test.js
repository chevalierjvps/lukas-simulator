// Unit tests for the per-session lab value sampler. Statistical rather than
// exact-value assertions (the function is a deliberate RNG) — the contract
// under test is the invariant that must hold on every draw: normal labs
// never leave the normal range, abnormal labs never cross back into it, and
// extreme excursions are rare, not routine.

import { describe, it, expect } from 'vitest';
import { rollLabValue } from '../../server/services/labResultRandomizer.js';

const TRIALS = 2000;

describe('rollLabValue', () => {
    it('samples a normal lab strictly within [min_value, max_value]', () => {
        const lab = { min_value: 40, max_value: 54, current_value: 42, is_abnormal: false };
        for (let i = 0; i < TRIALS; i++) {
            const v = rollLabValue(lab);
            expect(v).toBeGreaterThanOrEqual(40);
            expect(v).toBeLessThanOrEqual(54);
        }
    });

    it('never lets an abnormal-high lab fall back into the normal range', () => {
        // Dengue hematocrit: normal range 40-54, authored (target) 58.
        const lab = { min_value: 40, max_value: 54, current_value: 58, is_abnormal: true };
        for (let i = 0; i < TRIALS; i++) {
            expect(rollLabValue(lab)).toBeGreaterThan(54);
        }
    });

    it('never lets an abnormal-low lab rise back into the normal range', () => {
        // Dengue platelets: normal range 150000-400000, authored (target) 38000.
        const lab = { min_value: 150000, max_value: 400000, current_value: 38000, is_abnormal: true };
        for (let i = 0; i < TRIALS; i++) {
            expect(rollLabValue(lab)).toBeLessThan(150000);
        }
    });

    it('produces varied values across repeated rolls, not a constant', () => {
        const lab = { min_value: 40, max_value: 54, current_value: 58, is_abnormal: true };
        const values = new Set();
        for (let i = 0; i < 200; i++) values.add(rollLabValue(lab));
        expect(values.size).toBeGreaterThan(20);
    });

    it('keeps most abnormal draws close to the authored target (typical band dominates)', () => {
        const lab = { min_value: 40, max_value: 54, current_value: 58, is_abnormal: true };
        const excess = 58 - 54; // 4
        let nearTarget = 0;
        for (let i = 0; i < TRIALS; i++) {
            const v = rollLabValue(lab);
            if (Math.abs(v - 58) <= excess * 0.2) nearTarget++;
        }
        // ~70% typical band; assert a comfortable majority to avoid flaking
        // on the ~15% band-boundary rounding.
        expect(nearTarget / TRIALS).toBeGreaterThan(0.5);
    });

    it('makes large excursions rare, not routine', () => {
        const lab = { min_value: 40, max_value: 54, current_value: 58, is_abnormal: true };
        const excess = 58 - 54;
        let extreme = 0;
        for (let i = 0; i < TRIALS; i++) {
            const v = rollLabValue(lab);
            if (v - 58 > excess * 0.6) extreme++;
        }
        const rate = extreme / TRIALS;
        expect(rate).toBeGreaterThan(0); // the tail must be reachable
        expect(rate).toBeLessThan(0.15); // but clearly the minority
    });

    it('falls back to the authored value when no range is configured', () => {
        expect(rollLabValue({ current_value: 12, is_abnormal: true })).toBe(12);
        expect(rollLabValue({ current_value: null, is_abnormal: false })).toBe(null);
    });

    it('handles an abnormal lab with no authored target without throwing', () => {
        const v = rollLabValue({ min_value: 10, max_value: 40, current_value: null, is_abnormal: true });
        expect(Number.isFinite(v)).toBe(true);
        expect(v).toBeGreaterThan(40);
    });

    it('rounds to a magnitude-appropriate step (no false precision on cell counts)', () => {
        const lab = { min_value: 150000, max_value: 400000, current_value: 38000, is_abnormal: true };
        const v = rollLabValue(lab);
        expect(v % 10).toBe(0);
    });

    it('never draws a negative value for a low-abnormal lab whose excess dwarfs its target', () => {
        // Regression: platelets (target 38,000 against a 150,000 floor —
        // excess 112,000, larger than the target) rolled to -1410 before the
        // 85%-of-base downward cap was added.
        const lab = { min_value: 150000, max_value: 400000, current_value: 38000, is_abnormal: true };
        for (let i = 0; i < TRIALS; i++) {
            expect(rollLabValue(lab)).toBeGreaterThanOrEqual(0);
        }
    });

    it('never produces binary-float display noise', () => {
        const highLab = { min_value: 40, max_value: 54, current_value: 58, is_abnormal: true };
        const normalLab = { min_value: 27, max_value: 33, current_value: 30, is_abnormal: false };
        for (let i = 0; i < 500; i++) {
            for (const v of [rollLabValue(highLab), rollLabValue(normalLab)]) {
                expect(v).toBe(Number(v.toFixed(2)));
            }
        }
    });
});
