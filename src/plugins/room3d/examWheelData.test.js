import { describe, it, expect } from 'vitest';
import { BODY_REGIONS } from '../../data/examRegions';
import { SUPINE_REGIONS_3D } from './examRegions3d.js';
import { examsForRegion, supineRegionsWithExams } from './examWheelData.js';
import enExamination from '../../locales/en/examination.json';
import { SPECIAL_TEST_KEYS } from '../../components/examination/examinationLabels';

// A minimal i18next-shaped translator over the REAL en examination.json —
// so this test is a regression lock against the actual locale file (the
// thing a learner sees), not a second hardcoded copy of the same strings
// that can drift from it silently.
const t = (key, opts) => enExamination[key] ?? opts?.defaultValue ?? key;

describe('examWheelData', () => {
    it('maps every supine region onto its real model techniques', () => {
        supineRegionsWithExams(t).forEach((region) => {
            const model = BODY_REGIONS[region.id];
            expect(model, `${region.id} must exist in the exam model`).toBeDefined();
            expect(region.exams.map((exam) => exam.id)).toEqual(model.examTypes);
        });
        expect(supineRegionsWithExams(t).length).toBe(SUPINE_REGIONS_3D.length);
    });

    it('labels canonical techniques as translated verbs and keeps translated model names otherwise', () => {
        const chest = examsForRegion('chestAnterior', t);
        expect(chest.find((exam) => exam.id === 'auscultation')).toMatchObject({
            label: enExamination.wheel_verb_auscultation,
            hint: enExamination.wheel_hint_auscultation,
        });
        expect(chest.every((exam) => exam.tests === undefined)).toBe(true);
    });

    it('falls back to the raw i18n key when no translator is supplied — a visible bug, not a crash', () => {
        const chest = examsForRegion('chestAnterior');
        expect(chest.find((exam) => exam.id === 'auscultation').label).toBe('wheel_verb_auscultation');
    });

    it('translates the special tests it attaches to the special wedge', () => {
        const abdomen = examsForRegion('abdomen', t);
        const special = abdomen.find((exam) => exam.id === 'special');
        expect(special.tests).toEqual(
            BODY_REGIONS.abdomen.specialTests.map((name) => {
                const key = SPECIAL_TEST_KEYS[name];
                return key ? enExamination[key] : name;
            })
        );
        expect(special.tests.length).toBeGreaterThanOrEqual(2);
        expect(examsForRegion('unknownRegion', t)).toBeNull();
    });

    it('translates each supine region\'s own label', () => {
        const head = supineRegionsWithExams(t).find((region) => region.id === 'head');
        expect(head.label).toBe(enExamination.region_head);
    });

    it('keeps every region inside the wheel contract (max 8 techniques, 7 tests)', () => {
        supineRegionsWithExams(t).forEach((region) => {
            expect(region.exams.length).toBeLessThanOrEqual(8);
            region.exams.forEach((exam) => {
                if (exam.tests) expect(exam.tests.length).toBeLessThanOrEqual(7);
                expect(exam.label.length).toBeGreaterThan(0);
            });
        });
    });
});
