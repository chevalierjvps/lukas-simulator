import { describe, it, expect } from 'vitest';
import { interpretLab } from './labInterpretations';

describe('interpretLab', () => {
    it('returns null for a normal result', () => {
        expect(interpretLab({ test_name: 'Hematocrit', status: 'normal' })).toBe(null);
    });

    it('returns null for a test with no dictionary entry', () => {
        expect(interpretLab({ test_name: 'Something Unmapped', status: 'high' })).toBe(null);
    });

    it('returns null for a missing/undefined lab', () => {
        expect(interpretLab(null)).toBe(null);
        expect(interpretLab(undefined)).toBe(null);
    });

    it('matches pt-BR test names with diacritics', () => {
        expect(interpretLab({ test_name: 'Leucócitos Totais', status: 'low' }, 'pt')).toMatch(/leucopenia/i);
        expect(interpretLab({ test_name: 'Albumina Sérica', status: 'low' }, 'pt')).toMatch(/hipoalbuminemia/i);
    });

    it('resolves the direction (high vs low) correctly for the same test', () => {
        const high = interpretLab({ test_name: 'Leucócitos Totais', status: 'high' }, 'pt');
        const low = interpretLab({ test_name: 'Leucócitos Totais', status: 'low' }, 'pt');
        expect(high).not.toBe(low);
        expect(high).toMatch(/leucocitose/i);
        expect(low).toMatch(/leucopenia/i);
    });

    it('falls back to null when only one direction is mapped', () => {
        // AST is only mapped for 'high' — dengue never presents a low AST case.
        expect(interpretLab({ test_name: 'AST (SGOT)', status: 'low' }, 'pt')).toBe(null);
        expect(interpretLab({ test_name: 'AST (SGOT)', status: 'high' }, 'pt')).toMatch(/hepatocelular/i);
    });

    it('supports the English table for the default STEMI case language', () => {
        expect(interpretLab({ test_name: 'Platelet Count', status: 'low' }, 'en')).toMatch(/thrombocytopenia/i);
    });
});
