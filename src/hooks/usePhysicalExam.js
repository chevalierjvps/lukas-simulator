import { useCallback } from 'react';
import { getDefaultFinding } from '../data/examRegions';
import { usePatientRecord } from '../services/PatientRecord';
import { apiPost } from '../services/apiClient';

/**
 * Perform one physical examination — the single implementation.
 *
 * Extracted verbatim from ManikinPanel.handleExamTypeSelect so the 2D
 * examination room and the 3D room run the SAME code rather than two copies
 * that drift. (They already had: the 3D room's copy was writing the
 * "<test>: <finding>" string into the patient record where ManikinPanel
 * writes the raw finding.)
 *
 * What it owns: resolving the finding (case config first, model default
 * second), recording it to the PatientRecord, persisting it to the session
 * (when a session id is given), and returning the log entry.
 *
 * What it deliberately does NOT own: EventLogger. Analytics stays with the
 * screen, exactly as before — App logs for PhysicalExamScreen and the 3D
 * room logs with its own `room3d` marker, so the two rooms stay tellable
 * apart in the data.
 *
 * @param {{physicalExam: object|null, sessionId?: string|number|null, caseLanguage?: string|null}} options
 *   Case exam config (`case.config.physical_exam`); null falls back to model
 *   defaults. `sessionId`, when present, persists each performed exam to
 *   `POST /sessions/:id/exam-findings` so the case summary can list it —
 *   from whichever room performed it. `caseLanguage` picks the language of
 *   the MODEL default finding when the case itself configures none — the
 *   case's own authored language, not the student's UI chrome language
 *   (see LanguageContext.jsx) — and falls back to `getDefaultFinding`'s own
 *   PT-BR default when absent.
 * @return {(regionId: string, examType: string, specialTestName?: string|null) => {
 *   regionId: string, examType: string, specialTest: string|null,
 *   finding: string, rawFinding: string, abnormal: boolean,
 *   audioUrl: string|null, audioUrls: object, heartAudio: string|null,
 *   lungAudio: string|null, points: object|null, timestamp: string
 * }} performExam — returns the log entry it just recorded.
 */
export default function usePhysicalExam({ physicalExam = null, sessionId = null, caseLanguage = null } = {}) {
    const { examined, elicited } = usePatientRecord();

    return useCallback((regionId, examType, specialTestName = null) => {
        const examData = physicalExam ?? {};
        const configured = examData[regionId] && examData[regionId][examType];

        let finding = '';
        let abnormal = false;
        let audioUrl = null;
        let audioUrls = {};
        let heartAudio = null;
        let lungAudio = null;
        // Per-focus synth override (auscultation only) — see
        // AuscultationPanel's `points` prop and PhysicalExamEditor's
        // per-focus pickers. Absent on every case authored before this.
        let points = null;

        if (configured) {
            finding = configured.finding;
            abnormal = configured.abnormal || false;
            audioUrl = configured.audioUrl || null;
            audioUrls = configured.audioUrls || {};
            heartAudio = configured.heartAudio || null;
            lungAudio = configured.lungAudio || null;
            points = configured.points || null;
        } else {
            finding = getDefaultFinding(regionId, examType, caseLanguage);
            abnormal = false;
        }

        // specialTestName records WHICH special test the learner ran; the
        // finding itself is the region's combined `special` result, since
        // that is all the data model carries.
        const entry = {
            regionId,
            examType,
            specialTest: specialTestName || null,
            finding: specialTestName ? `${specialTestName}: ${finding}` : finding,
            rawFinding: finding,
            abnormal,
            audioUrl,
            audioUrls,
            heartAudio,
            lungAudio,
            points,
            timestamp: new Date().toISOString()
        };

        // The record keeps the raw finding: the named test belongs to the
        // exam log, not to the clinical text of what was elicited.
        examined(regionId, examType, finding);
        if (finding) {
            elicited('exam', finding, abnormal, {
                category: regionId,
                significance: abnormal ? 'Abnormal finding' : 'Normal finding'
            });
        }

        // Persist to the session record (bug report 2.9.15 #16): the server
        // has carried POST /sessions/:id/exam-findings + the
        // physical_exam_findings table since day one, but no client called
        // it, so the case-summary modal's GET always came back empty. It
        // lives in the shared hook so the 2D and 3D rooms persist alike.
        // Best-effort fire-and-forget, matching how PatientMonitor persists
        // vitals snapshots: a network blip must never break the exam
        // interaction. The endpoint is idempotent on
        // (session, body_region, exam_type), so repeats are safe.
        if (sessionId) {
            apiPost(`/sessions/${sessionId}/exam-findings`, {
                body_region: regionId,
                exam_type: examType,
                finding: entry.finding,
                is_abnormal: abnormal,
            }).catch(err => console.warn('[usePhysicalExam] exam finding persist failed:', err.message));
        }

        return entry;
    }, [physicalExam, sessionId, caseLanguage, examined, elicited]);
}
