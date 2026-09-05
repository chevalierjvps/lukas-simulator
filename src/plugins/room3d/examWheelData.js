import { BODY_REGIONS, EXAM_TECHNIQUES } from '../../data/examRegions';
import { SUPINE_REGIONS_3D } from './examRegions3d.js';
import { regionLabel, techniqueLabel, specialTestLabel } from '../../components/examination/examinationLabels';

// Adapts Rohy's exam model (BODY_REGIONS examTypes + specialTests) into the
// 3D room's exam-wheel contract: each region gets exams [{id, label, hint,
// tests?}] so the wheel renders REAL techniques for that region, and every
// wedge click round-trips through the same model ids the 2D examination
// room uses. No technique or test is invented here — this file only
// relabels what examRegions.js declares.
//
// Every label routes through `t`, bound to the 'examination' namespace by
// the caller (Exam3DScreen) — the wheel used to hardcode English verb/hint
// pairs regardless of the student's UI language ("INSPECT / Look" showing
// up inside an otherwise fully Spanish session). `t` defaults to identity
// so a caller that forgets to pass one gets the raw i18n key back rather
// than a crash — a visible bug, not a silent one.

// Wedge copy per canonical technique: an imperative verb plus a one-word
// hint, both translated (wheel_verb_*/wheel_hint_* in examination.json).
// Techniques outside the canon (the neuro set) fall back to the technique's
// own translated name (technique_*) so nothing is dropped.
const TECHNIQUE_WEDGE_KEYS = {
    inspection: { verb: 'wheel_verb_inspection', hint: 'wheel_hint_inspection' },
    palpation: { verb: 'wheel_verb_palpation', hint: 'wheel_hint_palpation' },
    percussion: { verb: 'wheel_verb_percussion', hint: 'wheel_hint_percussion' },
    auscultation: { verb: 'wheel_verb_auscultation', hint: 'wheel_hint_auscultation' },
    special: { verb: 'wheel_verb_special', hint: 'wheel_hint_special' },
};

/**
 * Exam-wheel definitions for one region, or null for a region the model
 * does not know. Special tests ride along on the special technique; the
 * room flattens a single test onto the main ring and sub-rings 2+.
 *
 * @param {string} regionId
 * @param {(key: string) => string} [t] Translator bound to the
 *   'examination' namespace. Defaults to identity (returns the raw key).
 */
export function examsForRegion(regionId, t = (key) => key) {
    const region = BODY_REGIONS[regionId];
    if (!region) return null;
    return region.examTypes.map((typeId) => {
        const wedge = TECHNIQUE_WEDGE_KEYS[typeId];
        const technique = EXAM_TECHNIQUES[typeId];
        const fallbackName = techniqueLabel(t, typeId, technique?.name ?? typeId);
        const tests = typeId === 'special' && region.specialTests?.length
            // The wheel's sub-ring holds at most 7 named tests (8 wedges
            // with Back); the model's current maximum is 7, so the slice
            // only guards future content growth.
            ? { tests: region.specialTests.slice(0, 7).map((name) => specialTestLabel(t, name)) }
            : {};
        return {
            id: typeId,
            label: wedge ? t(wedge.verb, { defaultValue: fallbackName }) : fallbackName,
            hint: wedge ? t(wedge.hint, { defaultValue: '' }) : '',
            ...tests,
        };
    });
}

/**
 * The supine 3D regions with their real exams attached — the body_regions
 * value Exam3DScreen mounts the room with.
 *
 * @param {(key: string) => string} [t] Translator bound to the
 *   'examination' namespace.
 */
export function supineRegionsWithExams(t = (key) => key) {
    return SUPINE_REGIONS_3D.map((region) => {
        const exams = examsForRegion(region.id, t);
        const label = regionLabel(t, region.id, region.label);
        return exams ? { ...region, label, exams } : { ...region, label };
    });
}
