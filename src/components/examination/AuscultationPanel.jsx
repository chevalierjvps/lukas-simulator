import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Volume2, VolumeX, AlertTriangle, CheckCircle, Heart, Wind, Activity, Radio } from 'lucide-react';
import EventLogger from '../../services/eventLogger';
import { baseUrl } from '../../config/api';
import { ClinicalAudio } from '../../services/clinicalAudioSynthesizer';
import { usePatientRecord } from '../../services/PatientRecord';

/**
 * Auscultation Panel - zoomed body view with audio playback.
 *
 * Region-aware (Bug 19, 18.5.2026): auscultating the abdomen previously
 * rendered the cardiac chest diagram, auto-played a heart sound and
 * labelled the player "Heart/Lung sounds". The panel now selects a
 * per-region PROFILE so the abdomen shows the four bowel-sound quadrants
 * plus the aortic/renal/femoral bruit points, and cardiopulmonary regions
 * keep their exact previous behaviour.
 */

// Default audio files for normal findings. `baseUrl(...)` prepends the
// SPA's deploy base (e.g. /rohy/ in production behind nginx) so the
// absolute path resolves to the same static directory Express serves
// `frontend/sounds/` from. Hardcoding the bare `/sounds/...` path
// bypasses the prefix and 404s on every `--base=/rohy/` deploy.
// There is no canned bowel-sound asset, so abdominal points have no
// default audio — the panel honestly shows "No audio available" unless
// the case author uploads a clip (which still flows via audioUrls/audioUrl).
const DEFAULT_SOUNDS = {
    heart: baseUrl('/sounds/normal-heart.mp3'),
    lung: baseUrl('/sounds/normal-lung.mp3')
};

// Cardiopulmonary auscultation points (percentage coordinates).
// type: 'heart' or 'lung' determines which default sound to use.
// `label`/`description` are the canonical English strings kept for
// EventLogger payloads; `labelKey`/`descKey` are the explicit i18n keys
// (namespace 'examination') used at every display site — the en values
// are byte-identical to label/description.
// Exported so PhysicalExamEditor can build its per-focus sound pickers
// against the SAME point set this panel renders/plays — the alternative
// (a second, hand-maintained point list in the editor) is exactly the kind
// of drift that leaves an admin configuring a focus that doesn't exist, or
// missing one that does.
export const CARDIO_POINTS = {
    aortic: { x: 54, y: 22, label: 'Aortic', description: '2nd ICS, right sternal border', labelKey: 'point_aortic', descKey: 'point_aortic_desc', type: 'heart' },
    pulmonic: { x: 46, y: 22, label: 'Pulmonic', description: '2nd ICS, left sternal border', labelKey: 'point_pulmonic', descKey: 'point_pulmonic_desc', type: 'heart' },
    erb: { x: 46, y: 30, label: "Erb's Point", description: '3rd ICS, left sternal border', labelKey: 'point_erb', descKey: 'point_erb_desc', type: 'heart' },
    tricuspid: { x: 50, y: 38, label: 'Tricuspid', description: '4th ICS, left sternal border', labelKey: 'point_tricuspid', descKey: 'point_tricuspid_desc', type: 'heart' },
    mitral: { x: 42, y: 42, label: 'Mitral (Apex)', description: '5th ICS, midclavicular line', labelKey: 'point_mitral', descKey: 'point_mitral_desc', type: 'heart' },
    lungLeft: { x: 35, y: 28, label: 'L. Lung', description: 'Left anterior chest', labelKey: 'point_lung_left', descKey: 'point_lung_left_desc', type: 'lung' },
    lungRight: { x: 65, y: 28, label: 'R. Lung', description: 'Right anterior chest', labelKey: 'point_lung_right', descKey: 'point_lung_right_desc', type: 'lung' },
    lungBaseLeft: { x: 38, y: 45, label: 'L. Base', description: 'Left lung base', labelKey: 'point_lung_base_left', descKey: 'point_lung_base_left_desc', type: 'lung' },
    lungBaseRight: { x: 62, y: 45, label: 'R. Base', description: 'Right lung base', labelKey: 'point_lung_base_right', descKey: 'point_lung_base_right_desc', type: 'lung' }
};

// Abdominal auscultation: four quadrants for bowel sounds + the three
// classic vascular bruit sites. Patient's right is on the viewer's left.
const ABDOMEN_POINTS = {
    ruq: { x: 38, y: 32, label: 'RUQ', description: 'Right upper quadrant — bowel sounds', labelKey: 'point_ruq', descKey: 'point_ruq_desc', type: 'bowel' },
    luq: { x: 62, y: 32, label: 'LUQ', description: 'Left upper quadrant — bowel sounds', labelKey: 'point_luq', descKey: 'point_luq_desc', type: 'bowel' },
    rlq: { x: 38, y: 62, label: 'RLQ', description: 'Right lower quadrant (ileocaecal) — bowel sounds', labelKey: 'point_rlq', descKey: 'point_rlq_desc', type: 'bowel' },
    llq: { x: 62, y: 62, label: 'LLQ', description: 'Left lower quadrant — bowel sounds', labelKey: 'point_llq', descKey: 'point_llq_desc', type: 'bowel' },
    aorticBruit: { x: 50, y: 40, label: 'Aorta', description: 'Epigastrium / midline — aortic bruit', labelKey: 'point_aorta', descKey: 'point_aorta_desc', type: 'bruit' },
    renalRight: { x: 40, y: 46, label: 'R. Renal', description: 'Para-umbilical right — renal artery bruit', labelKey: 'point_renal_right', descKey: 'point_renal_right_desc', type: 'bruit' },
    renalLeft: { x: 60, y: 46, label: 'L. Renal', description: 'Para-umbilical left — renal artery bruit', labelKey: 'point_renal_left', descKey: 'point_renal_left_desc', type: 'bruit' },
    femoralRight: { x: 40, y: 78, label: 'R. Femoral', description: 'Right groin — iliac/femoral bruit', labelKey: 'point_femoral_right', descKey: 'point_femoral_right_desc', type: 'bruit' },
    femoralLeft: { x: 60, y: 78, label: 'L. Femoral', description: 'Left groin — iliac/femoral bruit', labelKey: 'point_femoral_left', descKey: 'point_femoral_left_desc', type: 'bruit' }
};

// Visual + audio behaviour per point type.
const POINT_TYPE = {
    heart: { Icon: Heart, color: 'red' },
    lung: { Icon: Wind, color: 'cyan' },
    bowel: { Icon: Volume2, color: 'amber' },
    bruit: { Icon: Activity, color: 'violet' }
};

const ABDOMEN_KEYS = new Set(['abdomen', 'abdominal']);

// Profile resolution is data-driven first: the region may declare
// `auscultationProfile` in examRegions.js (the explicit, greppable
// contract). The lowercased name match is only a defensive fallback so a
// region that forgets the field still degrades to a best guess rather
// than silently to the chest diagram.
function getProfile(profileId, selectedRegion, regionName) {
    const explicit = String(profileId || '').toLowerCase();
    const key = String(selectedRegion || regionName || '').toLowerCase();
    if (explicit === 'abdomen' || (!explicit && ABDOMEN_KEYS.has(key))) {
        return {
            points: ABDOMEN_POINTS,
            // Bowel sounds are classically auscultated first; RLQ over the
            // ileocaecal valve is the conventional starting point.
            defaultPoint: 'rlq',
            playerLabelKey: 'sounds_bowel_bruit',
            renderBackground: () => (
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                    {/* Abdominal wall outline */}
                    <rect x="22" y="18" width="56" height="68" rx="14"
                        fill="none" stroke="rgba(100,116,139,0.3)" strokeWidth="1" />
                    {/* Quadrant cross-lines through the umbilicus */}
                    <line x1="50" y1="20" x2="50" y2="84" stroke="rgba(100,116,139,0.2)" strokeWidth="0.5" />
                    <line x1="24" y1="48" x2="76" y2="48" stroke="rgba(100,116,139,0.2)" strokeWidth="0.5" />
                    {/* Umbilicus */}
                    <circle cx="50" cy="48" r="1.4" fill="rgba(100,116,139,0.35)" />
                </svg>
            )
        };
    }
    return {
        points: CARDIO_POINTS,
        // Mitral (apex) is clinically the most important first listen.
        defaultPoint: 'mitral',
        playerLabelKey: 'sounds_heart_lung',
        renderBackground: () => (
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                {/* Simple chest outline */}
                <ellipse cx="50" cy="35" rx="35" ry="30" fill="none" stroke="rgba(100,116,139,0.3)" strokeWidth="1" />
                {/* Sternum line */}
                <line x1="50" y1="15" x2="50" y2="55" stroke="rgba(100,116,139,0.2)" strokeWidth="0.5" />
                {/* Rib lines */}
                {[20, 28, 36, 44].map((y, i) => (
                    <g key={i}>
                        <path d={`M 50 ${y} Q 35 ${y + 3} 25 ${y + 8}`} fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth="0.5" />
                        <path d={`M 50 ${y} Q 65 ${y + 3} 75 ${y + 8}`} fill="none" stroke="rgba(100,116,139,0.15)" strokeWidth="0.5" />
                    </g>
                ))}
            </svg>
        )
    };
}

// Tailwind class fragments per point colour. Static strings so the
// Tailwind JIT keeps them (no dynamic `bg-${color}-500` interpolation).
const COLOR_CLASSES = {
    red: { sel: 'bg-red-500 ring-2 ring-red-400 ring-offset-1 ring-offset-slate-900 scale-125', idle: 'bg-red-600/80 hover:bg-red-500 hover:scale-110', ping: 'bg-red-400', text: 'text-red-300' },
    cyan: { sel: 'bg-cyan-500 ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-900 scale-125', idle: 'bg-cyan-600/80 hover:bg-cyan-500 hover:scale-110', ping: 'bg-cyan-400', text: 'text-cyan-300' },
    amber: { sel: 'bg-amber-500 ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900 scale-125', idle: 'bg-amber-600/80 hover:bg-amber-500 hover:scale-110', ping: 'bg-amber-400', text: 'text-amber-300' },
    violet: { sel: 'bg-violet-500 ring-2 ring-violet-400 ring-offset-1 ring-offset-slate-900 scale-125', idle: 'bg-violet-600/80 hover:bg-violet-500 hover:scale-110', ping: 'bg-violet-400', text: 'text-violet-300' }
};

export default function AuscultationPanel({
    finding,
    isAbnormal,
    audioUrl,          // Single audio for the whole region (legacy support)
    audioUrls = {},    // Multiple audio files for different points { pointId: url }
    heartAudio,        // Custom heart sound (overrides default for all heart points)
    lungAudio,         // Custom lung sound (overrides default for all lung points)
    points: pointTypes = {},  // Per-point synth type override { pointId: 'normal'|'murmur'|'vesicular'|'wheeze'|'crackles'|'diminished' } — case-authored, see PhysicalExamEditor's per-focus pickers. Falls back to the flat isAbnormal behaviour for any point not listed, so an old case with no points map still works exactly as before.
    selectedRegion,        // Region key — fallback profile heuristic
    auscultationProfile,   // Explicit profile id from examRegions.js (preferred)
    regionName = 'Chest'
}) {
    const { t } = useTranslation('examination');
    const profile = getProfile(auscultationProfile, selectedRegion, regionName);
    const POINTS = profile.points;

    // Sprint 4: heart/lung points with no case-authored audio (the common
    // case — most cases never upload a clip) used to fall back to one
    // canned "normal" mp3, or to nothing at all when the finding was
    // abnormal. They now play the live Web Audio DSP synth instead
    // (clinicalAudioSynthesizer.js) — it covers both normal AND abnormal
    // findings, and the heart tempo tracks the monitor's actual current HR
    // (PatientRecord, the same live channel PatientMonitor/TacticalClinicalHud
    // already publish to) instead of playing at a fixed recorded tempo.
    const { record } = usePatientRecord();
    const liveHr = record?.current_state?.vitals?.hr;
    const canUseSynth = typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);

    const [selectedPoint, setSelectedPoint] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [hasAutoPlayed, setHasAutoPlayed] = useState(false);
    const audioRef = useRef(null);
    const synthTimeoutRef = useRef(null);

    // Normalise any audio URL to the SPA's deploy base. Uploaded audio
    // arrives as either `./uploads/foo.mp3` (legacy relative) or
    // `/uploads/foo.mp3` (absolute) — both get rewritten to
    // `<base>/uploads/foo.mp3`, which is what Express actually serves
    // once nginx strips the `/rohy/` prefix. Already-absolute http(s)
    // URLs pass through unchanged.
    const resolveAudio = (url) => {
        if (!url) return null;
        if (/^https?:\/\//i.test(url)) return url;
        // Strip any leading `./` so baseUrl() doesn't emit `/rohy/./uploads/...`
        const trimmed = url.replace(/^\.\//, '');
        return baseUrl(trimmed.startsWith('/') ? trimmed : '/' + trimmed);
    };

    // Get the configured audio FILE url for a point, if any. Does NOT
    // consider the live synth — that's not a seekable/pausable <audio> src,
    // so it's handled separately (isPointSynthCapable / playPointSynth).
    const getAudioForPoint = (pointId) => {
        // Priority: specific point audio > type-specific audio > general audio.
        if (audioUrls[pointId]) return resolveAudio(audioUrls[pointId]);

        const point = POINTS[pointId];
        if (point) {
            if (point.type === 'heart' && heartAudio) return resolveAudio(heartAudio);
            if (point.type === 'lung' && lungAudio) return resolveAudio(lungAudio);
            // The canned "normal" clip is now only reached when Web Audio
            // truly isn't available — the synth covers this case otherwise.
            if (!canUseSynth && !isAbnormal && DEFAULT_SOUNDS[point.type]) {
                return DEFAULT_SOUNDS[point.type];
            }
        }

        return resolveAudio(audioUrl);
    };

    // Whether this point can fall back to the live DSP synth (heart/lung
    // only — there's no bowel/bruit synth model).
    const isPointSynthCapable = (point) => canUseSynth && (point?.type === 'heart' || point?.type === 'lung');

    // Roughly how long the synth call takes to finish, so the "playing"
    // pulse in the UI tracks it even though there's no HTMLMediaElement to
    // read a real duration from.
    const synthDurationMs = (point) =>
        point?.type === 'heart' ? (60 / (liveHr || 75)) * 4 * 1000 + 400 : 2200;

    // Sprint 5: "foco estéreo ativo" — each point's own x coordinate (a
    // percentage across the 280px chest/lung diagram, ~35-65 with 50 as
    // the sternal midline) becomes a stereo pan (-1 hard left .. 1 hard
    // right), so listening at the left lung base audibly comes from the
    // left channel and the right lung base from the right, matching where
    // the student actually placed the stethoscope.
    const panForPoint = (point) => Math.max(-1, Math.min(1, ((point?.x ?? 50) - 50) / 15));

    const playPointSynth = (point, pointId) => {
        const pan = panForPoint(point);
        // A case-authored override for THIS specific point wins — the whole
        // reason points exists is so "the case is abnormal" doesn't blanket
        // every focus with the same finding (dengue: normal heart sounds,
        // decreased breath sounds at exactly the effusion's base, nowhere
        // else). No override falls back to the old flat isAbnormal behaviour
        // so a case that never configured per-point sounds is unaffected.
        const override = pointId ? pointTypes[pointId] : null;
        if (point.type === 'heart') {
            const type = override || (isAbnormal ? 'murmur' : 'normal');
            ClinicalAudio.playHeartSound({ rate: liveHr || 75, type, pan });
        } else if (point.type === 'lung') {
            const type = override || (isAbnormal ? 'crackles' : 'vesicular');
            ClinicalAudio.playLungSound(type, { pan });
        }
        if (synthTimeoutRef.current) clearTimeout(synthTimeoutRef.current);
        setIsPlaying(true);
        synthTimeoutRef.current = setTimeout(() => setIsPlaying(false), synthDurationMs(point));
    };

    const handlePointClick = (pointId) => {
        // Stop current audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (synthTimeoutRef.current) clearTimeout(synthTimeoutRef.current);
        setSelectedPoint(pointId);
        setIsPlaying(false);

        // Get point info for logging
        const point = POINTS[pointId];
        const audioSrc = getAudioForPoint(pointId);
        const synthCapable = isPointSynthCapable(point);
        const hasAudio = !!audioSrc || synthCapable;

        // Log auscultation event with audio URL
        EventLogger.auscultationPerformed(
            point?.label || pointId,
            point?.type || 'unknown',
            finding || 'No finding',
            hasAudio,
            audioSrc || (synthCapable ? 'synth:clinicalAudioSynthesizer' : null)
        );

        if (audioSrc && audioRef.current) {
            audioRef.current.src = audioSrc;
            audioRef.current.load();
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(err => {
                console.log('Autoplay prevented:', err);
            });
        } else if (synthCapable) {
            playPointSynth(point, pointId);
        }
    };

    // Auto-select the profile's first point and play on mount
    useEffect(() => {
        if (!hasAutoPlayed && audioRef.current) {
            const defaultPoint = profile.defaultPoint;
            setSelectedPoint(defaultPoint);
            setHasAutoPlayed(true);

            const point = POINTS[defaultPoint];
            const audioSrc = getAudioForPoint(defaultPoint);
            const synthCapable = isPointSynthCapable(point);
            if (audioSrc) {
                audioRef.current.src = audioSrc;
                audioRef.current.load();
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                }).catch(err => {
                    console.log('Autoplay prevented:', err);
                });
            } else if (synthCapable) {
                playPointSynth(point, defaultPoint);
            }

            // Log the auto-played auscultation with audio URL
            EventLogger.auscultationPerformed(
                point?.label || defaultPoint,
                point?.type || 'unknown',
                finding || 'No finding',
                !!audioSrc || synthCapable,
                audioSrc || (synthCapable ? 'synth:clinicalAudioSynthesizer' : null)
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasAutoPlayed, finding]);

    // Clear any pending synth "playing" pulse timeout on unmount.
    useEffect(() => () => {
        if (synthTimeoutRef.current) clearTimeout(synthTimeoutRef.current);
    }, []);

    // Update audio source when point changes (for prop changes)
    useEffect(() => {
        if (audioRef.current && selectedPoint) {
            const newSrc = getAudioForPoint(selectedPoint);
            if (newSrc && !audioRef.current.src.endsWith(newSrc.split('/').pop())) {
                audioRef.current.src = newSrc;
                audioRef.current.load();
            }
        }
    }, [audioUrls, heartAudio, lungAudio]);

    const togglePlay = () => {
        const currentPoint = selectedPoint ? POINTS[selectedPoint] : null;
        const audioSrc = selectedPoint ? getAudioForPoint(selectedPoint) : null;
        if (audioSrc && audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        } else if (currentPoint && isPointSynthCapable(currentPoint)) {
            // The synth is a fire-and-forget Web Audio burst, not a
            // seekable/pausable element — "play" replays it; there's
            // nothing meaningful to pause mid-way through.
            playPointSynth(currentPoint, selectedPoint);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const currentAudioUrl = selectedPoint ? getAudioForPoint(selectedPoint) : null;
    const currentPoint = selectedPoint ? POINTS[selectedPoint] : null;
    const currentMeta = currentPoint ? (POINT_TYPE[currentPoint.type] || POINT_TYPE.heart) : null;

    return (
        <div className={`rounded-lg border p-4 ${isAbnormal ? 'bg-red-950/30 border-red-800' : 'bg-slate-800/50 border-slate-700'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-cyan-400" />
                    <span className="text-white font-medium">{t('auscultation_title', { region: regionName })}</span>
                </div>
                {isAbnormal ? (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-red-900/50 text-red-400 rounded">
                        <AlertTriangle className="w-3 h-3" />
                        {t('abnormal')}
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-emerald-900/50 text-emerald-400 rounded">
                        <CheckCircle className="w-3 h-3" />
                        {t('normal')}
                    </span>
                )}
            </div>

            <div className="flex gap-4">
                {/* Zoomed body view */}
                <div className="relative bg-slate-900 rounded-lg overflow-hidden" style={{ width: '280px', height: '280px' }}>
                    {profile.renderBackground()}

                    {/* Auscultation points */}
                    {Object.entries(POINTS).map(([id, point]) => {
                        const pointHasAudio = !!getAudioForPoint(id) || isPointSynthCapable(point);
                        const isSelected = selectedPoint === id;
                        const meta = POINT_TYPE[point.type] || POINT_TYPE.heart;
                        const PointIcon = meta.Icon;
                        const cc = COLOR_CLASSES[meta.color];
                        return (
                            <button
                                key={id}
                                onClick={() => handlePointClick(id)}
                                className={`absolute w-7 h-7 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all flex items-center justify-center cursor-pointer ${
                                    isSelected
                                        ? cc.sel
                                        : pointHasAudio
                                        ? cc.idle
                                        : 'bg-slate-600 hover:bg-slate-500'
                                }`}
                                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                                title={t('point_tooltip', { label: t(point.labelKey), description: t(point.descKey) })}
                            >
                                <PointIcon className="w-3.5 h-3.5 text-white" />
                                {isSelected && (
                                    <span className={`absolute inset-0 rounded-full animate-ping opacity-50 ${cc.ping}`} />
                                )}
                            </button>
                        );
                    })}

                    {/* Point label */}
                    {currentPoint && currentMeta && (
                        <div className="absolute bottom-1 left-1 right-1 bg-black/70 rounded px-2 py-1 text-center">
                            <div className={`text-xs font-medium flex items-center justify-center gap-1 ${COLOR_CLASSES[currentMeta.color].text}`}>
                                <currentMeta.Icon className="w-3 h-3" />
                                {t(currentPoint.labelKey)}
                            </div>
                            <div className="text-[10px] text-slate-400">{t(currentPoint.descKey)}</div>
                        </div>
                    )}
                </div>

                {/* Right side - Finding and Audio */}
                <div className="flex-1 flex flex-col">
                    {/* Finding text */}
                    <div className={`flex-1 text-sm leading-relaxed p-3 rounded bg-slate-900/50 mb-3 ${isAbnormal ? 'text-red-200' : 'text-slate-200'}`}>
                        {finding || t('auscultate_prompt')}
                    </div>

                    {/* Hidden audio element - always rendered so ref is available */}
                    <audio
                        ref={audioRef}
                        onEnded={() => setIsPlaying(false)}
                        onError={() => console.error('Audio failed to load')}
                    />

                    {/* Audio Player */}
                    {(() => {
                        const usingSynth = !currentAudioUrl && currentPoint && isPointSynthCapable(currentPoint);
                        if (!currentAudioUrl && !usingSynth) {
                            return (
                                <div className="bg-slate-900/50 rounded-lg p-3 text-center text-slate-500 text-xs">
                                    {t('no_audio')}
                                </div>
                            );
                        }
                        return (
                            <div className="bg-slate-900 rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={togglePlay}
                                        className="w-10 h-10 rounded-full bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center transition-colors"
                                        title={usingSynth ? t('replay_live_sound', { defaultValue: 'Repetir som ao vivo' }) : undefined}
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-5 h-5 text-white" />
                                        ) : (
                                            <Play className="w-5 h-5 text-white ml-0.5" />
                                        )}
                                    </button>
                                    <div className="flex-1">
                                        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                                            {currentPoint ? t('point_sounds', { point: t(currentPoint.labelKey) }) : t(profile.playerLabelKey)}
                                            {usingSynth && (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400" title={t('live_synth_hint', { defaultValue: 'Sintetizado ao vivo, sincronizado com a FC atual' })}>
                                                    <Radio className="w-3 h-3" />
                                                    {t('live_synth_label', { defaultValue: 'ao vivo' })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full bg-cyan-500 transition-all ${isPlaying ? 'animate-pulse' : ''}`} style={{ width: isPlaying ? '60%' : '0%' }} />
                                        </div>
                                        {/* Stereo focus indicator: the dot sits at the point's
                                            actual L/R pan so the player visually confirms which
                                            ear should hear it loudest — "foco estéreo ativo". */}
                                        {usingSynth && currentPoint && (
                                            <div className="flex items-center gap-1.5 mt-1.5" title={t('stereo_focus_hint', { defaultValue: 'Panorâmica estéreo de acordo com a posição do foco' })}>
                                                <span className="text-[9px] text-slate-500">L</span>
                                                <div className="relative flex-1 h-1 bg-slate-700 rounded-full">
                                                    <div
                                                        className="absolute top-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 -translate-y-1/2 -translate-x-1/2"
                                                        style={{ left: `${((panForPoint(currentPoint) + 1) / 2) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-[9px] text-slate-500">R</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Mute only applies to real <audio> playback — the synth
                                        writes straight to the AudioContext destination, so
                                        there's no element-level volume to toggle. */}
                                    {!usingSynth && (
                                        <button
                                            onClick={toggleMute}
                                            className="p-2 text-slate-400 hover:text-white"
                                        >
                                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Auscultation point legend */}
            <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="text-xs text-slate-500 mb-2">{t('legend_click_points')}</div>
                <div className="flex flex-wrap gap-2">
                    {Object.entries(POINTS).map(([id, point]) => (
                        <button
                            key={id}
                            onClick={() => handlePointClick(id)}
                            className={`px-2 py-0.5 rounded text-xs transition-colors ${
                                selectedPoint === id
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {t(point.labelKey)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
