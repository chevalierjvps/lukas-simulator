// Regression lock (2026-09): default exam findings must follow the CASE's
// language (case_language, surfaced as caseLanguage in LanguageContext), not
// the student's UI chrome language. Before this fix, ManikinPanel passed
// i18n.language (UI language) into getDefaultFinding, so a Spanish-language
// case ('es') showed English findings regardless of UI language — getDefaultFinding
// had no 'es' branch at all and everything non-'pt' fell through to English.

import { describe, it, expect } from 'vitest';
import { getDefaultFinding } from './examRegions.js';

describe('getDefaultFinding — resolves by case language, not UI language (bug fix)', () => {
    it('returns Spanish findings for an es case regardless of what the UI language would have been', () => {
        // 'chest' exists in both the English source and the Spanish overlay.
        const es = getDefaultFinding('chest', 'inspection', 'es');
        expect(es).toBeTruthy();
        expect(es).not.toMatch(/^Chest wall is symmetrical/); // not the raw English default
    });

    it('returns Portuguese findings for a pt case even if UI language differs', () => {
        const pt = getDefaultFinding('abdomen', 'palpation', 'pt');
        expect(pt).toBeTruthy();
        expect(pt).not.toMatch(/^Abdomen is soft/); // not the raw English default
    });

    it('the neurological/gait block — the exact region the bug report showed in English — resolves in Spanish for an es case', () => {
        const gait = getDefaultFinding('neurological', 'gait', 'es');
        expect(gait).toBeTruthy();
        expect(gait).not.toMatch(/Observation of Gait/); // not the raw English default
    });

    it('falls back to English (never throws, never blank) when a region/examType has no es/pt override yet', () => {
        // A region+examType combo unlikely to exist in either overlay file.
        const result = getDefaultFinding('nose', 'palpation', 'es');
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });
});
