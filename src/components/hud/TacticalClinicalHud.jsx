import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Heart, Wind, Droplets, Zap,
    Stethoscope, FileText, CheckCircle2, ChevronRight, X, AlertTriangle
} from 'lucide-react';
import { ClinicalAudio } from '../../services/clinicalAudioSynthesizer';
import { apiPost } from '../../services/apiClient';
import { RHYTHM_LABEL_KEYS } from '../../services/rhythms';

// ACLS: unsynchronized shock is only indicated for VF or pulseless VT — this
// simulator has no separate "stable VT with a pulse" state (VTach only
// appears in arrest-adjacent scenarios alongside VFib/Asystole), so both
// count as shockable. Every other rhythm delivered here is a real teaching
// mistake, not a no-op: it's logged and fed back as one, not silently
// dropped or — worse — treated as a successful intervention.
const SHOCKABLE_RHYTHMS = new Set(['VFib', 'VTach']);

/**
 * Tactical Clinical HUD & Action Wheel for Lukas 1.0 (by Jvps)
 * Gamified emergency command center, stability gauge, visual vignettes, and instant actions.
 */
export function TacticalClinicalHud({
    sessionId,
    vitals = {},
    // Pre-existing unused prop, kept for the caller's benefit (App.jsx
    // passes it) but not read here — underscore-prefixed per this repo's
    // convention for intentionally-unused args.
    patientName: _patientName = 'Paciente',
    onOpenInvestigations,
    onOpenExam,
    onTreatmentAdministered
}) {
    const { t } = useTranslation('hud');
    // Rhythm names come from the monitor's own vocabulary (RHYTHM_LABEL_KEYS)
    // so this HUD and the bedside monitor can never name a rhythm differently.
    const { t: tMonitor } = useTranslation('monitor');
    const [activeActionMenu, setActiveActionMenu] = useState(null); // 'airway' | 'fluids' | 'meds' | 'defib' | 'labs'
    const [defibState, setDefibState] = useState('idle'); // 'idle' | 'charging' | 'charged'
    const [actionFeedback, setActionFeedback] = useState(null);

    const hr = vitals.hr || 80;
    const bpSys = vitals.bpSys || vitals.bp_sys || 120;
    const spo2 = vitals.spo2 || 98;
    const pain = vitals.pain != null ? vitals.pain : 5;
    const rhythm = vitals.rhythm || null;

    // 2. Keyboard Action Hotkeys (1-6)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === '1') setActiveActionMenu(prev => prev === 'airway' ? null : 'airway');
            if (e.key === '2') setActiveActionMenu(prev => prev === 'fluids' ? null : 'fluids');
            if (e.key === '3') setActiveActionMenu(prev => prev === 'meds' ? null : 'meds');
            if (e.key === '4') setActiveActionMenu(prev => prev === 'defib' ? null : 'defib');
            if (e.key === '5') onOpenExam?.();
            if (e.key === '6') setActiveActionMenu(prev => prev === 'labs' ? null : 'labs');
            if (e.key === 'Escape') setActiveActionMenu(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onOpenExam]);

    // 3. Quick Emergency Treatment Dispatch — prescribe THEN administer
    // through the real Tratamentos pipeline (order-treatment → administer),
    // the same one TreatmentPanel.jsx uses. This used to POST to
    // `/sessions/:id/orders` (plural), a path nothing on the server ever
    // registered (only the singular `/order`, for lab/investigation IDs,
    // and a read-only GET `/orders`) — every HUD hotkey 404ed silently, the
    // catch block only logged it, and the "Ordem Executada!" banner fired
    // regardless. `treatmentType` must be one of the four
    // `case_treatments`/`treatment_effects` types ('medication', 'iv_fluid',
    // 'oxygen', 'nursing') and `treatmentName` must match a catalogue row
    // exactly — both endpoints look the order up by that pair, not by
    // free text.
    const handleQuickOrder = async (treatmentType, treatmentName, route = 'IV', dose = '1 dose', feedbackOverride = null) => {
        if (!sessionId) return;
        try {
            const order = await apiPost(`/sessions/${sessionId}/order-treatment`, {
                treatment_type: treatmentType,
                treatment_name: treatmentName,
                dose,
                route,
                urgency: 'stat'
            });
            await apiPost(`/sessions/${sessionId}/administer/${order.order_id}`);

            const feedback = feedbackOverride || (order.is_contraindicated
                ? {
                    type: 'warning',
                    title: t('feedback_contraindicated_title'),
                    desc: order.contraindication_feedback || t('feedback_contraindicated_desc', { treatment: treatmentName })
                }
                : { title: t('feedback_order_executed_title'), desc: t('feedback_order_executed_desc', { treatment: treatmentName, dose, route }) });
            setActionFeedback(feedback);
            setTimeout(() => setActionFeedback(null), feedback.type === 'warning' ? 4500 : 3500);

            onTreatmentAdministered?.();
            setActiveActionMenu(null);
        } catch (err) {
            console.error('Falha ao enviar ordem rápida:', err);
            setActionFeedback({
                type: 'warning',
                title: t('feedback_order_failed_title'),
                desc: err?.message || t('feedback_order_failed_desc', { treatment: treatmentName })
            });
            setTimeout(() => setActionFeedback(null), 4500);
        }
    };

    // 4. Defibrillator Charge & Discharge Logic
    const handleChargeDefib = () => {
        setDefibState('charging');
        ClinicalAudio.playDefibrillatorCharge();
        setTimeout(() => {
            setDefibState('charged');
        }, 2600);
    };

    const handleDeliverShock = () => {
        // The machine discharges either way — a manual defibrillator (unlike
        // an AED) doesn't refuse to fire. What must NOT happen is treating an
        // inappropriate shock as a successful intervention: same green
        // "Ordem Executada!" banner regardless of rhythm was the actual bug
        // report ("choque só deveria funcionar em ritmo chocável").
        // Defibrillation has no `case_treatments`/`treatment_effects` row —
        // that catalogue is a prescribe-then-administer formulary
        // (medication/iv_fluid/oxygen/nursing) and a shock is neither
        // prescribed nor administered later by a nurse, it's instant. So
        // this stays a direct client-side action (audio + rhythm gate +
        // feedback banner) rather than being forced through
        // order-treatment/administer like the drug/fluid/O2 hotkeys above.
        ClinicalAudio.playDefibrillatorShock();
        setDefibState('idle');
        const isShockable = SHOCKABLE_RHYTHMS.has(rhythm);
        onTreatmentAdministered?.();
        setActiveActionMenu(null);
        if (isShockable) {
            setActionFeedback({ title: t('feedback_order_executed_title'), desc: t('feedback_shock_success_desc') });
            setTimeout(() => setActionFeedback(null), 3500);
            return;
        }
        const rhythmKey = rhythm ? RHYTHM_LABEL_KEYS[rhythm] : null;
        const rhythmName = rhythmKey ? tMonitor(rhythmKey) : t('unknown_rhythm');
        setActionFeedback({
            type: 'warning',
            title: t('feedback_shock_no_indication_title'),
            desc: t('feedback_shock_no_indication_desc', { rhythm: rhythmName })
        });
        setTimeout(() => setActionFeedback(null), 4500);
    };

    return (
        <>
            {/* --- VISUAL DECOMPENSATION VIGNETTES --- */}
            {/* Hypoxia / Cyanosis Vignette (SpO2 < 88%) */}
            {spo2 < 88 && (
                <div
                    className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-1000"
                    style={{
                        background: 'radial-gradient(circle, transparent 55%, rgba(14, 165, 233, 0.25) 90%, rgba(2, 132, 199, 0.45) 100%)',
                        opacity: Math.min(1, (88 - spo2) / 15)
                    }}
                />
            )}

            {/* Shock & Agony Throbbing Red Vignette (PAS < 80 or Dor >= 8),
                pulse cadence synced to the current HR (60/hr seconds per
                cycle) instead of Tailwind's fixed 2s animate-pulse — a
                tachycardic patient's vignette now visibly throbs faster,
                not at some unrelated constant rate. animationDuration as
                inline style overrides the 2s baked into the animate-pulse
                utility class (longhand beats shorthand at equal
                specificity here since it's inline). */}
            {(bpSys < 80 || pain >= 8) && (
                <div
                    className="fixed inset-0 pointer-events-none z-30 animate-pulse transition-opacity duration-700"
                    style={{
                        background: 'radial-gradient(circle, transparent 50%, rgba(225, 29, 72, 0.2) 85%, rgba(159, 18, 57, 0.45) 100%)',
                        opacity: 0.8,
                        animationDuration: `${(hr > 0 ? 60 / hr : 2).toFixed(3)}s`
                    }}
                />
            )}

            {/* --- HUD TOP BAR ---
                The vital-stability gauge (0-100% derived score) is removed
                for now — Jvps flagged it as not working as intended and
                asked for it out until it's revisited. The action-feedback
                toast (confirms a quick order fired) stays; it's independent
                of the stability score. */}
            <div className="fixed top-14 left-0 right-0 z-30 px-4 pointer-events-none">
                <div className="max-w-6xl mx-auto flex items-center justify-end">
                    {/* Action Feedback Banner — warning (e.g. shock on a
                        non-shockable rhythm) reads visually distinct from a
                        genuine successful order, not the same green pill. */}
                    {actionFeedback && (
                        <div className={`console-toast pointer-events-auto shadow-xl animate-bounce ${
                            actionFeedback.type === 'warning' ? 'warn' : 'ok'
                        }`}>
                            {actionFeedback.type === 'warning'
                                ? <AlertTriangle className="w-4 h-4 shrink-0" />
                                : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                            <span>
                                {/* `title` existed on this object since before this
                                    change but was never actually rendered — only
                                    `desc` was. Surfacing it too matters more now
                                    that "Ordem Executada!" and "Choque sem
                                    indicação" need to read as visibly different
                                    outcomes, not the same sentence with a
                                    different color. */}
                                {actionFeedback.title && <strong className="mr-1">{actionFeedback.title}</strong>}
                                {actionFeedback.desc}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* --- BOTTOM TACTICAL ACTION WHEEL / HOTKEYS ---
                Bumped from bottom-14 (56px) to a fixed 130px: the bottom of
                the screen is contested real estate — RoomNavigator sits at
                bottom-0 and its pull-tab + dock run ~105-110px tall, so at
                56px this wheel sat BEHIND RoomNavigator's dock (same
                horizontal center, same z-tier) and was unreachable. 130px
                clears it with margin. The action-menu popup below is offset
                to match (was 56px above the wheel, still is). */}
            <div className="fixed bottom-[130px] left-1/2 -translate-x-1/2 z-40 px-3 py-2">
                {/* Console do Leito: a control console, not a row of pills — one
                    button component (.console-hud-key) reused for all six, each
                    reading as a physical key (bezel, inset highlight, keycap
                    number) instead of six subtly-different ad-hoc styles. Every
                    onClick/title/popup below is unchanged from before this pass. */}
                <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
                    {/* Hotkey 1: Airway & O2 */}
                    <button
                        type="button"
                        onClick={() => setActiveActionMenu(prev => prev === 'airway' ? null : 'airway')}
                        className={`console-hud-key console-hud-key--airway ${activeActionMenu === 'airway' ? 'is-active' : ''}`}
                        title={t('btn_airway_title')}
                    >
                        <span className="console-hud-kbd">1</span>
                        <Wind className="w-5 h-5" />
                        <span className="console-hud-label">{t('btn_airway_label')}</span>
                    </button>

                    {/* Hotkey 2: Fluids & Access */}
                    <button
                        type="button"
                        onClick={() => setActiveActionMenu(prev => prev === 'fluids' ? null : 'fluids')}
                        className={`console-hud-key console-hud-key--volume ${activeActionMenu === 'fluids' ? 'is-active' : ''}`}
                        title={t('btn_volume_title')}
                    >
                        <span className="console-hud-kbd">2</span>
                        <Droplets className="w-5 h-5" />
                        <span className="console-hud-label">{t('btn_volume_label')}</span>
                    </button>

                    {/* Hotkey 3: Emergency Meds */}
                    <button
                        type="button"
                        onClick={() => setActiveActionMenu(prev => prev === 'meds' ? null : 'meds')}
                        className={`console-hud-key console-hud-key--meds ${activeActionMenu === 'meds' ? 'is-active' : ''}`}
                        title={t('btn_meds_title')}
                    >
                        <span className="console-hud-kbd">3</span>
                        <Heart className="w-5 h-5" />
                        <span className="console-hud-label">{t('btn_meds_label')}</span>
                    </button>

                    {/* Hotkey 4: Defibrillator */}
                    <button
                        type="button"
                        onClick={() => setActiveActionMenu(prev => prev === 'defib' ? null : 'defib')}
                        className={`console-hud-key console-hud-key--defib ${activeActionMenu === 'defib' ? 'is-active' : ''}`}
                        title={t('btn_defib_title')}
                    >
                        <span className="console-hud-kbd">4</span>
                        <Zap className="w-5 h-5" />
                        <span className="console-hud-label">{t('btn_defib_label')}</span>
                    </button>

                    {/* Hotkey 5: Stethoscope Auscultation — jumps to the 3D
                        Bedside room, which now owns physical exam / real
                        per-region auscultation (case-configured sounds) —
                        the old standalone 2D Examination room this used to
                        open is gone; the 3D room does it better. */}
                    <button
                        type="button"
                        onClick={() => onOpenExam?.()}
                        className="console-hud-key console-hud-key--ausc"
                        title={t('btn_ausc_title')}
                    >
                        <span className="console-hud-kbd">5</span>
                        <Stethoscope className="w-5 h-5" />
                        <span className="console-hud-label">{t('btn_ausc_label')}</span>
                    </button>

                    {/* Hotkey 6: Quick Labs */}
                    <button
                        type="button"
                        onClick={() => {
                            if (onOpenInvestigations) onOpenInvestigations();
                            else setActiveActionMenu(prev => prev === 'labs' ? null : 'labs');
                        }}
                        className={`console-hud-key console-hud-key--exams ${activeActionMenu === 'labs' ? 'is-active' : ''}`}
                        title={t('btn_exams_title')}
                    >
                        <span className="console-hud-kbd">6</span>
                        <FileText className="w-5 h-5" />
                        <span className="console-hud-label">{t('btn_exams_label')}</span>
                    </button>
                </div>
            </div>

            {/* --- ACTION POPUP MODALS --- */}
            {activeActionMenu && (
                <div className="fixed bottom-[186px] left-1/2 -translate-x-1/2 z-50 w-80 sm:w-96 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-white/20 p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                        <div className="flex items-center gap-2 text-white font-bold text-sm">
                            {activeActionMenu === 'airway' && <><Wind className="w-4 h-4 text-sky-400" /> {t('menu_airway')}</>}
                            {activeActionMenu === 'fluids' && <><Droplets className="w-4 h-4 text-blue-400" /> {t('menu_fluids')}</>}
                            {activeActionMenu === 'meds' && <><Heart className="w-4 h-4 text-rose-400" /> {t('menu_meds')}</>}
                            {activeActionMenu === 'defib' && <><Zap className="w-4 h-4 text-amber-400" /> {t('menu_defib')}</>}
                            {activeActionMenu === 'labs' && <><FileText className="w-4 h-4 text-purple-400" /> {t('menu_labs')}</>}
                        </div>
                        <button
                            type="button"
                            onClick={() => setActiveActionMenu(null)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* 1. Airway options */}
                    {activeActionMenu === 'airway' && (
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => { ClinicalAudio.playOxygenFlow(); handleQuickOrder('oxygen', 'Cânula Nasal de Oxigênio (1-6 L/min)', 'Inalatório', '3 L/min'); }}
                                className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-sky-500/20 border border-white/5 hover:border-sky-500/30 text-white text-xs flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-semibold text-sky-300">{t('airway_nasal_title')}</p>
                                    <p className="text-[10px] text-slate-400">{t('airway_nasal_desc')}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                            </button>
                            <button
                                type="button"
                                onClick={() => { ClinicalAudio.playOxygenFlow(); handleQuickOrder('oxygen', 'Máscara Não-Reinalante com Reservatório (10-15 L/min)', 'Inalatório', '15 L/min'); }}
                                className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-sky-500/20 border border-white/5 hover:border-sky-500/30 text-white text-xs flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-semibold text-sky-300">{t('airway_mask_title')}</p>
                                    <p className="text-[10px] text-slate-400">{t('airway_mask_desc')}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                            </button>
                            <button
                                type="button"
                                onClick={() => { ClinicalAudio.playOxygenFlow(); handleQuickOrder('oxygen', 'Intubação Orotraqueal + Ventilação Mecânica', 'Via Aérea', 'Tubo 8.0'); }}
                                className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/30 text-white text-xs flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-semibold text-rose-300">{t('airway_intubation_title')}</p>
                                    <p className="text-[10px] text-slate-400">{t('airway_intubation_desc')}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
                            </button>
                        </div>
                    )}

                    {/* 2. Fluids options */}
                    {activeActionMenu === 'fluids' && (
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => { ClinicalAudio.playFluidBolus(); handleQuickOrder('iv_fluid', 'Lactated Ringers 1000ml Bolus', 'IV', '1000 mL bolus rápido'); }}
                                className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/30 text-white text-xs flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-semibold text-blue-300">{t('fluids_ringer_title')}</p>
                                    <p className="text-[10px] text-slate-400">{t('fluids_ringer_desc')}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                            </button>
                            <button
                                type="button"
                                onClick={() => { ClinicalAudio.playFluidBolus(); handleQuickOrder('iv_fluid', 'Soro Fisiológico 0,9%', 'IV', '500 mL'); }}
                                className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/30 text-white text-xs flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-semibold text-blue-300">{t('fluids_saline_title')}</p>
                                    <p className="text-[10px] text-slate-400">{t('fluids_saline_desc')}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                            </button>
                            <button
                                type="button"
                                onClick={() => { ClinicalAudio.playFluidBolus(); handleQuickOrder('iv_fluid', 'Concentrado de Hemácias', 'IV', '2 bolsas (600 mL)'); }}
                                className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/30 text-white text-xs flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-semibold text-rose-300">{t('fluids_blood_title')}</p>
                                    <p className="text-[10px] text-slate-400">{t('fluids_blood_desc')}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
                            </button>
                        </div>
                    )}

                    {/* 3. Emergency Meds */}
                    {activeActionMenu === 'meds' && (
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => handleQuickOrder('medication', 'Morfina', 'IV', '4 mg')}
                                className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/20 border border-white/5 hover:border-emerald-500/30 text-white text-xs flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-semibold text-emerald-300">{t('meds_morphine_title')}</p>
                                    <p className="text-[10px] text-slate-400">{t('meds_morphine_desc')}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickOrder('medication', 'Nitroglicerina', 'SL', '5 mg')}
                                className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/5 hover:border-rose-500/30 text-white text-xs flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-semibold text-rose-300">{t('meds_nitro_title')}</p>
                                    <p className="text-[10px] text-slate-400">{t('meds_nitro_desc')}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickOrder('medication', 'Adrenalina (Epinefrina)', 'IV', '1 mg')}
                                className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-amber-500/20 border border-white/5 hover:border-amber-500/30 text-white text-xs flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-semibold text-amber-300">{t('meds_epi_title')}</p>
                                    <p className="text-[10px] text-slate-400">{t('meds_epi_desc')}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickOrder('medication', 'Paracetamol (Acetaminofeno)', 'IV', '1000 mg')}
                                className="w-full text-left p-2.5 rounded-xl bg-white/[0.04] hover:bg-sky-500/20 border border-white/5 hover:border-sky-500/30 text-white text-xs flex items-center justify-between group"
                            >
                                <div>
                                    <p className="font-semibold text-sky-300">{t('meds_acet_title')}</p>
                                    <p className="text-[10px] text-slate-400">{t('meds_acet_desc')}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                            </button>
                        </div>
                    )}

                    {/* 4. Defibrillator */}
                    {activeActionMenu === 'defib' && (
                        <div className="space-y-3 text-center py-2">
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                                <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                                <p className="font-bold">{t('defib_notice_title')}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{t('defib_notice_desc')}</p>
                            </div>

                            {defibState === 'idle' && (
                                <button
                                    type="button"
                                    onClick={handleChargeDefib}
                                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/40 transition-all uppercase tracking-wider"
                                >
                                    {t('defib_charge_btn')}
                                </button>
                            )}

                            {defibState === 'charging' && (
                                <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500 animate-pulse text-amber-300 text-xs font-bold">
                                    {t('defib_charging')}
                                </div>
                            )}

                            {defibState === 'charged' && (
                                <button
                                    type="button"
                                    onClick={handleDeliverShock}
                                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-base shadow-2xl shadow-rose-600/60 animate-bounce uppercase tracking-widest"
                                >
                                    {t('defib_shock_btn')}
                                </button>
                            )}
                        </div>
                    )}

                </div>
            )}
        </>
    );
}

export default TacticalClinicalHud;
