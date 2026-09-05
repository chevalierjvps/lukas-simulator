import { lazy, Suspense, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Loader2 } from 'lucide-react';
import { useVoice } from '../../contexts/VoiceContext';
import { PATIENT_AOI_ID, FACE_BOX } from '../oyon/screenAois';
import { useAoiPublisher } from '../oyon/useAoiPublisher';
import { usePatientRecord } from '../../services/PatientRecord';

// Lazy-load the 3D head — pulls in three.js / r3f / drei (~250 KB gzip).
const PatientAvatar = lazy(() => import('../chat/PatientAvatar'));

// Renders the active speaker's avatar in the patient panel. The active
// speaker is provided via the `participant` prop — it can be the patient
// (derived from caseData) or any agent (Nurse / Consultant / Relative)
// when the trainee switches tabs in the multi-agent UI.
//
// Participant shape:
//   {
//     avatar_id?:    string  — GLB filename
//     avatar_camera?: { pos, lookY, fov }
//     gender?:       string  — for platform-default fallback resolution
//     genderSource?: 'declared' | 'guessed' — 'guessed' means it came from a
//                    name/role heuristic (agents carry no stored gender), so
//                    it may route an avatar but must never be CAPTIONED: the
//                    seeded nurse was labelled "male" under her own face
//                    (2026-08-30 UI review, #35b).
//     name?:         string
//     age?:          number  — for the demographic auto-pick fallback
//   }
//
// For backward compatibility, if no `participant` is passed but `caseData`
// is, we synthesise a participant from caseData.config.
export default function PatientVisual({ caseData, participant }) {
    const { t } = useTranslation('patient');
    const { speaking, listening, visemes, voiceSettings, headManifest, platformAvatars, activeParticipant } = useVoice();

    // Stable fallback when no explicit/context participant is supplied — memo
    // keeps the same object reference across re-renders so PatientAvatar
    // doesn't re-resolve / re-mount the GLB on each parent render.
    const caseFallback = useMemo(() => {
        const c = caseData?.config || {};
        return {
            avatar_id: c.avatar_id || null,
            avatar_camera: c.avatar_camera || null,
            gender: caseData?.patient_gender || c.demographics?.gender,
            name: caseData?.patient_name || c.patient_name,
            age: caseData?.patient_age || c.demographics?.age,
            id: caseData?.id
        };
    }, [caseData?.id, caseData?.config, caseData?.patient_name, caseData?.patient_age, caseData?.patient_gender]);

    const p = participant || activeParticipant || caseFallback;

    // Live-vitals ring around the avatar stage: a heartbeat pulse (cadence
    // = 60/hr seconds, so it visibly speeds up with tachycardia and stops
    // with asystole — a real clinical signal, not decoration) tinted by how
    // distressed the patient currently is (pain/anxiety), using the same
    // calm->amber->critical palette TacticalClinicalHud already uses
    // elsewhere so the whole app reads as one consistent visual language.
    // Reads the same PatientRecord channel PatientMonitor publishes to
    // every tick (Sprint 2+) — no new plumbing.
    const { record } = usePatientRecord();
    const liveVitals = record?.current_state?.vitals;
    const liveHr = liveVitals?.hr;
    const distress = Math.max(liveVitals?.pain || 0, liveVitals?.anxiety || 0);
    const ringTone = distress >= 7
        ? { ring: 'ring-rose-500/70', glow: 'rgba(244,63,94,0.55)' }
        : distress >= 4
        ? { ring: 'ring-amber-500/60', glow: 'rgba(245,158,11,0.45)' }
        : { ring: 'ring-emerald-500/50', glow: 'rgba(16,185,129,0.4)' };
    const heartbeatActive = Number.isFinite(liveHr) && liveHr > 0;

    // Always render the avatar when the manifest is loaded — every case now
    // resolves to a GLB (explicit, platform-default, or demographic auto-pick).
    // The `avatar_type === 'none'` global toggle still wins as a kill switch.
    const showLiveHead = !!headManifest && voiceSettings?.avatar_type !== 'none';

    // "Looking at the patient": publish this stage's face region as a live
    // gaze AOI. useAoiPublisher owns the whole lifecycle (rAF-throttled on
    // resize/scroll/stage-resize, null on unmount, so "patient not on screen"
    // stays distinct from "not looking at the patient"); Oyon's gaze
    // aggregator turns it into per-window dwell (aoi_dwell_ms.patient_face)
    // and the capture widget forwards updates to the running <oyon-app>.
    // FACE_BOX picks the face out of the square stage — the one AOI that
    // targets an inset instead of its full rect.
    const stageRef = useRef(null);
    useAoiPublisher(stageRef, PATIENT_AOI_ID, { insetBox: FACE_BOX, enabled: showLiveHead });

    return (
        <div className="console-patient-bay h-full flex flex-col overflow-hidden relative">
            {/* The faint grid is the same "instrument" texture the monitor's
                own panels read against — this bay is a vitals instrument
                trained on a person, not a portrait frame, so it should not
                look like one. */}
            <div className="console-patient-grid absolute inset-0 pointer-events-none" aria-hidden="true" />

            <div className="absolute inset-0 flex items-center justify-center p-4">
                {showLiveHead ? (
                    /* The measured AOI stage wraps the Suspense boundary: it
                       must exist from the FIRST render (the effect above runs
                       once per showLiveHead flip), not only after the lazy 3D
                       head resolves. */
                    <div className="relative aspect-square h-full max-h-full max-w-full">
                        {/* Corner brackets — a lock/track reticle around the
                            live feed, echoing the monitor's own instrument
                            language (mirrors how the tactical HUD's targeting
                            reads elsewhere) instead of a plain portrait ring. */}
                        <svg className="absolute -inset-3 pointer-events-none" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {[[6, 6, 1, 1], [94, 6, -1, 1], [6, 94, 1, -1], [94, 94, -1, -1]].map(([x, y, dx, dy], i) => (
                                <path
                                    key={i}
                                    d={`M ${x} ${y + dy * 9} L ${x} ${y} L ${x + dx * 9} ${y}`}
                                    fill="none"
                                    stroke="var(--console-human-accent)"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                    opacity="0.55"
                                />
                            ))}
                        </svg>
                        {/* Heartbeat ring — purely decorative, sits in its own
                            layer so it never perturbs stageRef's measured box
                            (the AOI gaze publisher below reads that rect).
                            Pulses at 60/hr seconds/cycle (stops entirely at
                            hr<=0 — asystole reads as asystole, not decoration)
                            and tints calm/amber/critical off live pain &
                            anxiety, the same palette TacticalClinicalHud uses. */}
                        <div
                            aria-hidden="true"
                            className={`absolute -inset-1.5 rounded-full ring-4 pointer-events-none transition-colors duration-700 ${ringTone.ring} ${heartbeatActive ? 'animate-pulse' : ''}`}
                            style={{
                                boxShadow: `0 0 ${heartbeatActive ? 24 : 10}px ${heartbeatActive ? 4 : 1}px ${ringTone.glow}`,
                                ...(heartbeatActive ? { animationDuration: `${(60 / liveHr).toFixed(3)}s` } : {}),
                            }}
                        />
                        <div ref={stageRef} className="absolute inset-0">
                            <Suspense fallback={
                                <div className="console-patient-panel w-full h-full rounded-full flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--console-human-muted)' }} />
                                </div>
                            }>
                                <PatientAvatar
                                    patient={p}
                                    speaking={speaking}
                                    listening={listening}
                                    visemes={visemes}
                                    headManifest={headManifest}
                                    avatarId={p.avatar_id}
                                    cameraOverride={p.avatar_camera}
                                    platformAvatars={platformAvatars}
                                />
                            </Suspense>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--console-human-faint)' }}>
                        <User className="w-24 h-24" />
                    </div>
                )}
            </div>

            {/* Live/heartbeat indicator — top-left, the same corner an
                instrument names its channel, so the bay reads as monitored
                rather than merely photographed. */}
            {heartbeatActive && (
                <div
                    className="console-patient-live absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full pointer-events-none select-none"
                    aria-hidden="true"
                >
                    <span className="console-patient-live-dot" style={{ animationDuration: `${(60 / liveHr).toFixed(3)}s` }} />
                    <span className="text-[10px] font-bold tracking-[0.14em]" style={{ color: 'var(--console-human-accent)' }}>
                        {t('live_indicator')}
                    </span>
                </div>
            )}

            {/* Speaker caption — the patient's (or active agent's) name lives
                here, on the face it belongs to. Bottom-center overlay so it
                reads as a caption under the avatar without reserving layout
                height. */}
            {p?.name && (
                <div className="console-patient-caption absolute bottom-3 left-1/2 -translate-x-1/2 z-10 max-w-[85%] px-4 py-1.5 rounded-full text-center pointer-events-none select-none">
                    {/* Only a DECLARED gender is captioned — a guessed one
                        drives avatar routing and nothing the learner reads. */}
                    <div className="text-base font-bold leading-tight truncate" style={{ color: 'var(--console-human-text)' }}>{p.name}</div>
                    {(() => {
                        const shownGender = p.genderSource === 'guessed' ? '' : (p.gender || '');
                        if (!p.age && !shownGender) return null;
                        return (
                            <div className="text-[11px] leading-tight truncate" style={{ color: 'var(--console-human-muted)' }}>
                                {p.age ? t('age_y', { age: p.age }) : ''}{p.age && shownGender ? ' ' : ''}{shownGender}
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
