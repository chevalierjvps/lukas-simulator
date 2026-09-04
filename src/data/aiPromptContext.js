// AI prompt context formatters.
//
// These helpers shape clinical-record data into markdown blocks that get
// concatenated into the patient AI's system prompt by ChatInterface.
// Keeping each formatter pure (input → string, no side effects) makes them
// trivially testable and lets the same shape be reused by other AI surfaces
// (e.g. discussant, debriefer) without re-implementing the formatting.
//
// Empty inputs return an empty string. Callers are responsible for skipping
// the surrounding "## SECTION" wrapper when the formatter returns "".

// ---------- Radiology ----------
// Each study: { type, name, date, findings, interpretation, imageUrl }
// We never feed imageUrl to the LLM — it's a binary asset, not text context.
export function formatRadiologyAsMarkdown(studies) {
    if (!Array.isArray(studies) || studies.length === 0) return '';
    return studies.map(s => {
        const head = [s.type || 'Imaging study', s.name, s.date]
            .filter(Boolean)
            .join(' · ');
        const body = [
            s.findings && `Findings: ${s.findings.trim()}`,
            s.interpretation && `Interpretation: ${s.interpretation.trim()}`,
        ].filter(Boolean).join('\n  ');
        return body ? `- ${head}\n  ${body}` : `- ${head}`;
    }).join('\n');
}

// ---------- Vitals ----------
// Live vitals from PatientRecord.current_state.vitals. The model uses these
// to answer "how do you feel" / "what's your heart rate" with the actual
// monitor reading instead of guessing. Null/undefined slots are skipped so
// a partially-populated vital set still produces useful context.
const VITAL_LABELS = [
    { key: 'hr',      label: 'Heart rate',       unit: 'bpm' },
    { key: 'rr',      label: 'Respiratory rate', unit: '/min' },
    { key: 'spo2',    label: 'SpO₂',             unit: '%' },
    { key: 'temp',    label: 'Temperature',      unit: '°C' },
    { key: 'pain',    label: 'Pain',             unit: '/10' },
    { key: 'anxiety', label: 'Anxiety',          unit: '/10' },
];

export function formatVitalsAsMarkdown(vitals, { lang = 'en' } = {}) {
    if (!vitals || typeof vitals !== 'object') return '';
    const isPt = lang === 'pt';
    const lines = [];
    // BP gets special formatting (sys/dia from two fields).
    if (Number.isFinite(vitals.bp_sys) && Number.isFinite(vitals.bp_dia)) {
        lines.push(isPt ? `- Pressão Arterial: ${vitals.bp_sys}/${vitals.bp_dia} mmHg` : `- Blood pressure: ${vitals.bp_sys}/${vitals.bp_dia} mmHg`);
    }
    const labels = isPt ? [
        { key: 'hr', label: 'Frequência Cardíaca', unit: 'bpm' },
        { key: 'rr', label: 'Frequência Respiratória', unit: '/min' },
        { key: 'spo2', label: 'Saturação de Oxigênio (SpO₂)', unit: '%' },
        { key: 'temp', label: 'Temperatura Corporal', unit: '°C' },
        { key: 'pain', label: 'Nível de Dor Atual (Escala 0 a 10)', unit: '/10' },
        { key: 'anxiety', label: 'Nível de Ansiedade Atual (Escala 0 a 10)', unit: '/10' },
    ] : VITAL_LABELS;

    for (const v of labels) {
        const value = vitals[v.key];
        if (value == null || !Number.isFinite(value)) continue;
        lines.push(`- ${v.label}: ${value}${v.unit ? ` ${v.unit}` : ''}`);
    }
    return lines.join('\n');
}

// ---------- ECG / rhythm ----------
// Sprint 3: PatientMonitor now rides the same PatientRecord.vitals channel
// to publish `rhythm` / `st_elevation_mm` / `t_wave_inverted` every tick, so
// the patient persona can be told what the monitor is CURRENTLY showing —
// not just the case's static config.ecg/config.rhythm authored value, which
// goes stale the moment a scenario progresses the rhythm or an admin
// overrides it mid-session.
//
// Rhythm ids are the server/shared/rhythms.js vocabulary (RHYTHM_IDS) —
// short English tokens, not prose. They are deliberately NOT looked up
// through i18next here: as of 2026-09, src/locales/pt/monitor.json carries
// Spanish strings for most of its rhythm_* keys (a translation-pipeline
// bug, unrelated to this sprint — flagged separately), and this prompt
// feeds an LLM, not a rendered UI, so a small local label map keeps it
// correct regardless of that locale file's state.
export const RHYTHM_LABELS_PT = {
    NSR: 'Ritmo sinusal normal',
    'Sinus Tachycardia': 'Taquicardia sinusal',
    'Sinus Bradycardia': 'Bradicardia sinusal',
    AFib: 'Fibrilação atrial',
    'Atrial Flutter': 'Flutter atrial',
    SVT: 'Taquicardia supraventricular (TSV)',
    VTach: 'Taquicardia ventricular',
    VFib: 'Fibrilação ventricular',
    Asystole: 'Assistolia',
    PEA: 'Atividade elétrica sem pulso (AESP)',
};
const RHYTHM_LABELS_EN = {
    NSR: 'Normal sinus rhythm',
    'Sinus Tachycardia': 'Sinus tachycardia',
    'Sinus Bradycardia': 'Sinus bradycardia',
    AFib: 'Atrial fibrillation',
    'Atrial Flutter': 'Atrial flutter',
    SVT: 'Supraventricular tachycardia (SVT)',
    VTach: 'Ventricular tachycardia',
    VFib: 'Ventricular fibrillation',
    Asystole: 'Asystole',
    PEA: 'Pulseless electrical activity (PEA)',
};

export function formatEcgAsMarkdown({ rhythm, stElevationMm, tWaveInverted, staticFinding } = {}, { lang = 'en' } = {}) {
    const isPt = lang === 'pt';
    const rhythmLabel = rhythm ? ((isPt ? RHYTHM_LABELS_PT : RHYTHM_LABELS_EN)[rhythm] || rhythm) : null;
    const lines = [];
    if (rhythmLabel) {
        lines.push(isPt ? `- Ritmo atual no monitor: ${rhythmLabel}` : `- Current monitor rhythm: ${rhythmLabel}`);
    }
    if (Number.isFinite(stElevationMm) && stElevationMm >= 1) {
        lines.push(isPt
            ? `- Supradesnível do segmento ST: ${stElevationMm.toFixed(1)} mm`
            : `- ST-segment elevation: ${stElevationMm.toFixed(1)} mm`);
    }
    if (tWaveInverted) {
        lines.push(isPt ? '- Inversão de onda T presente' : '- T-wave inversion present');
    }
    // No live reading yet (chat opened before the monitor published a tick)
    // — fall back to whatever the case was authored with, so the very first
    // message still has ECG grounding instead of none at all.
    if (lines.length === 0 && staticFinding) {
        lines.push(isPt ? `- Traçado/laudo do caso: ${staticFinding}` : `- Case ECG finding: ${staticFinding}`);
    }
    return lines.join('\n');
}

// ---------- Recent session activity ----------
// Closes the feedback loop so the AI knows what the student has already done.
// Without this, the AI treats every turn as fresh and would happily repeat
// answers the student already heard or fail to acknowledge prior actions.
//
// We summarise (not dump) — the events array can grow large; we cap at the
// last `limit` events to bound prompt size, and we stringify each event with
// its verb-specific shape (the PatientRecord verbs OBTAINED, EXAMINED,
// ELICITED, NOTED, ORDERED, ADMINISTERED, CHANGED, EXPRESSED).

const VERB_RENDERERS = {
    OBTAINED:     (e) => `obtained history (${e.category || 'unspecified'})${e.content ? `: ${truncate(e.content, 80)}` : ''}`,
    EXAMINED:     (e) => `examined ${e.region || 'patient'}${e.technique ? ` via ${e.technique}` : ''}`,
    ELICITED:     (e) => `elicited ${e.test_name || e.category || 'finding'}${e.value ? ` = ${e.value}${e.unit ? ` ${e.unit}` : ''}` : ''}`,
    NOTED:        (e) => `noted ${e.trigger || 'event'}${e.action ? ` (${e.action})` : ''}`,
    ORDERED:      (e) => `ordered ${e.category || 'item'}${e.item ? `: ${e.item}` : ''}`,
    ADMINISTERED: (e) => `administered ${e.item || e.category || 'treatment'}${e.dose ? ` ${e.dose}` : ''}${e.route ? ` ${e.route}` : ''}`,
    CHANGED:      (e) => `${e.parameter || 'parameter'} changed${e.value != null ? ` to ${e.value}${e.unit ? ` ${e.unit}` : ''}` : ''}`,
    EXPRESSED:    (e) => `patient expressed ${e.type || 'something'}${e.content ? `: ${truncate(e.content, 80)}` : ''}`,
};

function truncate(s, n) {
    const str = String(s);
    return str.length > n ? `${str.slice(0, n - 1)}…` : str;
}

export function formatRecentActivityAsMarkdown(events, limit = 10) {
    if (!Array.isArray(events) || events.length === 0) return '';
    const recent = events.slice(-limit);
    return recent.map(e => {
        const renderer = VERB_RENDERERS[e.verb];
        const summary = renderer ? renderer(e) : `${e.verb || 'event'}`;
        const time = Number.isFinite(e.time) ? `t+${e.time}m` : '—';
        return `- [${time}] ${summary}`;
    }).join('\n');
}
