// Deterministic clinical-interpretation lookup for abnormal lab results —
// the "database used to generate interpretations" from the realism plan.
// A rules/lookup table instead of a second LLM "reader" agent: cheap, fast,
// and can't hallucinate a wrong clinical conclusion into a teaching tool.
// Grounds the patient LLM's prompt in what a result MEANS, not just the raw
// number — see src/components/chat/ChatInterface.jsx's buildPatientSystemPrompt.
//
// Keyed by a normalized (lowercase, accent-stripped) test name so pt-BR
// entries with diacritics ("Hematócrito") match without duplicating keys.
function normalizeKey(name) {
    return String(name || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim();
}

const INTERPRETATIONS_PT = {
    'hematocrit': { high: 'hemoconcentração por extravasamento plasmático', low: 'possível sangramento ou anemia' },
    'hematocrito': { high: 'hemoconcentração por extravasamento plasmático', low: 'possível sangramento ou anemia' },
    'plaquetas': { low: 'trombocitopenia — risco aumentado de sangramento' },
    'platelet count': { low: 'trombocitopenia — risco aumentado de sangramento' },
    'leucocitos totais': { low: 'leucopenia', high: 'leucocitose, sugestivo de infecção/inflamação' },
    'white blood cell count (wbc)': { low: 'leucopenia', high: 'leucocitose, sugestivo de infecção/inflamação' },
    'ast (sgot)': { high: 'lesão hepatocelular' },
    'alt (sgpt)': { high: 'lesão hepatocelular' },
    'albumina serica': { low: 'hipoalbuminemia, possível extravasamento plasmático ou desnutrição' },
};

const INTERPRETATIONS_EN = {
    'hematocrit': { high: 'hemoconcentration from plasma leakage', low: 'possible bleeding or anemia' },
    'platelet count': { low: 'thrombocytopenia — increased bleeding risk' },
    'plaquetas': { low: 'thrombocytopenia — increased bleeding risk' },
    'white blood cell count (wbc)': { low: 'leukopenia', high: 'leukocytosis, suggestive of infection/inflammation' },
    'ast (sgot)': { high: 'hepatocellular injury' },
    'alt (sgpt)': { high: 'hepatocellular injury' },
    'albumin': { low: 'hypoalbuminemia, possible plasma leakage or malnutrition' },
};

/**
 * `lab` needs `test_name` and `status` ('low' | 'high' | 'normal', as
 * returned by GET /sessions/:id/lab-results). Returns a short clinical
 * blurb for an abnormal result, or null (nothing in the table, or normal).
 */
export function interpretLab(lab, lang = 'pt') {
    if (!lab || (lab.status !== 'low' && lab.status !== 'high')) return null;
    const table = lang === 'pt' ? INTERPRETATIONS_PT : INTERPRETATIONS_EN;
    const entry = table[normalizeKey(lab.test_name)];
    if (!entry) return null;
    return entry[lab.status] || null;
}
