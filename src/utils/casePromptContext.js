import { formatRadiologyAsMarkdown } from '../data/aiPromptContext.js';
import { formatHistoryAsMarkdown } from '../data/historyGroups.js';

function clean(value) {
    if (value == null) return '';
    const text = String(value).trim();
    return text.length > 0 ? text : '';
}

function firstValue(obj, keys) {
    for (const key of keys) {
        const value = clean(obj?.[key]);
        if (value) return value;
    }
    return '';
}

function sameText(a, b) {
    return clean(a).toLowerCase() === clean(b).toLowerCase();
}

// Sprint 3: every `label` below is now { en, pt } instead of a bare string —
// this whole file is the second, larger source of the "English noise in a
// pt-BR prompt" problem ChatInterface.jsx's buildPatientSystemPrompt was
// audited for (its formatters call straight into this module). Every
// exported formatter here takes an optional `lang` ('en' default, so
// buildDiscussionCaseContext — which never passes one — is unaffected);
// buildPatientCaseDesignContext (the one buildPatientSystemPrompt actually
// calls) threads the case's real language through.
const STRUCTURED_FIELDS = [
    { key: 'chiefComplaint', label: { en: 'Chief Complaint', pt: 'Queixa Principal' }, aliases: ['chiefComplaint'], clinicalKey: 'chiefComplaint' },
    { key: 'hpi', label: { en: 'History of Present Illness', pt: 'História da Doença Atual' }, aliases: ['hpi', 'historyOfPresentIllness', 'present_illness'], clinicalKey: 'hpi' },
    { key: 'pmh', label: { en: 'Past Medical History', pt: 'Antecedentes Patológicos' }, aliases: ['pmh', 'pastMedicalHistory', 'pastMedical'], clinicalKey: 'pastMedical' },
    { key: 'psh', label: { en: 'Past Surgical History', pt: 'Antecedentes Cirúrgicos' }, aliases: ['psh', 'pastSurgicalHistory', 'pastSurgical'], clinicalKey: 'pastSurgical' },
    { key: 'medications', label: { en: 'Current Medications', pt: 'Medicações Atuais' }, aliases: ['medications'] },
    { key: 'allergies', label: { en: 'Allergies', pt: 'Alergias' }, aliases: ['allergies'], clinicalKey: 'allergies' },
    { key: 'socialHistory', label: { en: 'Social History', pt: 'História Social' }, aliases: ['socialHistory', 'social'], clinicalKey: 'social' },
    { key: 'familyHistory', label: { en: 'Family History', pt: 'História Familiar' }, aliases: ['familyHistory', 'family'], clinicalKey: 'family' },
    { key: 'ros', label: { en: 'Review of Systems', pt: 'Revisão de Sistemas' }, aliases: ['ros', 'reviewOfSystems'] },
    { key: 'additionalNotes', label: { en: 'Additional Notes for AI', pt: 'Notas Adicionais para a IA' }, aliases: ['additionalNotes', 'aiNotes'] },
];

// Resolve a case config's history to one flat object keyed by the canonical
// STRUCTURED_FIELDS keys (chiefComplaint, hpi, pmh, medications, allergies, …),
// regardless of which shape the case was authored/stored in:
//
//   - wizard cases write `structuredHistory` (with historical key aliases like
//     historyOfPresentIllness / pastMedicalHistory),
//   - seeded/imported cases carry only the canonical runtime mirror
//     `clinicalRecords.history` (keys hpi / pastMedical / …).
//
// structuredHistory wins, clinicalRecords.history fills the gaps — the same
// precedence the prompt builders in this file use. Only non-empty fields are
// present in the result. Shared with CaseSummaryModal (bug report 2.9.15 #16),
// which previously read keys nothing ever wrote and read structuredHistory only.
export function resolveCaseHistory(config = {}) {
    const structured = (config?.structuredHistory && typeof config.structuredHistory === 'object')
        ? config.structuredHistory : {};
    const clinicalHistory = (config?.clinicalRecords?.history && typeof config.clinicalRecords.history === 'object')
        ? config.clinicalRecords.history : {};
    const resolved = {};
    for (const field of STRUCTURED_FIELDS) {
        const value = firstValue(structured, field.aliases)
            || (field.clinicalKey ? clean(clinicalHistory[field.clinicalKey]) : '');
        if (value) resolved[field.key] = value;
    }
    return resolved;
}

// Allergies are authored in two places — the demographics tab and the
// structured-history tab. Historically only the structured-history value
// reached the prompt, so demographics-tab entries were silently dropped.
// Pass `demographics` here and structuredHistory wins, demographics fills in.
export function formatStructuredHistoryForPrompt(structuredHistory, { omitMirroredHistory = null, demographics = null, lang = 'en' } = {}) {
    const isPt = lang === 'pt';
    if (!structuredHistory || typeof structuredHistory !== 'object') {
        const fallbackAllergies = clean(demographics?.allergies);
        if (!fallbackAllergies) return '';
        return isPt ? `- Alergias: ${fallbackAllergies}` : `- Allergies: ${fallbackAllergies}`;
    }
    const lines = [];
    for (const field of STRUCTURED_FIELDS) {
        let value = firstValue(structuredHistory, field.aliases);
        if (field.key === 'allergies' && !value) {
            value = clean(demographics?.allergies);
        }
        if (!value) continue;
        if (omitMirroredHistory && field.clinicalKey && sameText(value, omitMirroredHistory[field.clinicalKey])) {
            continue;
        }
        lines.push(`- ${isPt ? field.label.pt : field.label.en}: ${value}`);
    }
    return lines.join('\n');
}

// Demographic fields the case editor lets authors fill in. The persona
// header emits one line per non-empty field — no `Unknown` placeholders
// so the model can't latch onto fake data.
const DEMOGRAPHIC_FIELDS = [
    { key: 'age',           label: { en: 'Age', pt: 'Idade' },                     format: { en: (v) => `${v} years old`, pt: (v) => `${v} anos` } },
    { key: 'gender',        label: { en: 'Gender', pt: 'Gênero' } },
    { key: 'dob',           label: { en: 'Date of birth', pt: 'Data de nascimento' } },
    { key: 'mrn',           label: { en: 'MRN', pt: 'Prontuário (MRN)' } },
    { key: 'weight',        label: { en: 'Weight', pt: 'Peso' } },
    { key: 'height',        label: { en: 'Height', pt: 'Altura' } },
    { key: 'bloodType',     label: { en: 'Blood type', pt: 'Tipo sanguíneo' } },
    { key: 'language',      label: { en: 'Preferred language', pt: 'Idioma preferido' } },
    { key: 'ethnicity',     label: { en: 'Ethnicity', pt: 'Etnia' } },
    { key: 'occupation',    label: { en: 'Occupation', pt: 'Ocupação' } },
    { key: 'maritalStatus', label: { en: 'Marital status', pt: 'Estado civil' } },
];

// Personality sliders the case editor saves under config.personality. Each
// entry maps a slider value to a short prose directive the model can act on.
// `defaultValue` marks the value emitted when the author hasn't touched the
// slider — those are dropped from the prompt so only intentional choices
// flow through and the prompt stays tight.
const PERSONALITY_FIELDS = [
    {
        key: 'communicationStyle',
        label: { en: 'Communication style', pt: 'Estilo de comunicação' },
        defaultValue: 'normal',
        directives: {
            en: {
                verbose: 'verbose — give detailed, sometimes rambling answers',
                brief: 'brief — keep answers short and to the point',
                tangential: 'tangential — drift off-topic before circling back',
                guarded: 'guarded — hesitate before sharing personal details',
            },
            pt: {
                verbose: 'prolixo — dá respostas detalhadas, às vezes divagando',
                brief: 'breve — respostas curtas e diretas',
                tangential: 'tangencial — foge do assunto antes de voltar ao ponto',
                guarded: 'reservado — hesita antes de compartilhar detalhes pessoais',
            },
        },
    },
    {
        key: 'emotionalState',
        label: { en: 'Emotional state', pt: 'Estado emocional' },
        defaultValue: 'neutral',
        directives: {
            en: {
                calm: 'calm — speak steadily and without urgency',
                anxious: 'anxious — show worry and tension in your words',
                fearful: 'fearful — sound scared about what is happening',
                angry: 'angry / frustrated — let irritation show through',
                sad: 'sad / tearful — sound low and on the edge of tears',
                stoic: 'stoic — minimise emotional expression even if hurting',
                distressed: 'distressed — words come out strained and breaking',
            },
            pt: {
                calm: 'calmo — fala de forma estável e sem urgência',
                anxious: 'ansioso — demonstra preocupação e tensão nas palavras',
                fearful: 'medroso — soa assustado com o que está acontecendo',
                angry: 'irritado/frustrado — deixa a irritação transparecer',
                sad: 'triste/choroso — soa abatido, à beira das lágrimas',
                stoic: 'estoico — minimiza a expressão emocional mesmo com dor',
                distressed: 'angustiado — fala de forma tensa e entrecortada',
            },
        },
    },
    {
        key: 'painTolerance',
        label: { en: 'Pain tolerance', pt: 'Tolerância à dor' },
        defaultValue: 'normal',
        directives: {
            en: {
                high: 'high — minimise how much pain you express',
                low: 'low — express discomfort readily when relevant',
                dramatic: 'dramatic — express pain intensely when clinically relevant',
            },
            pt: {
                high: 'alta — minimiza o quanto expressa a dor',
                low: 'baixa — expressa desconforto facilmente quando relevante',
                dramatic: 'dramática — expressa a dor intensamente quando clinicamente relevante',
            },
        },
    },
    {
        key: 'cooperativeness',
        label: { en: 'Cooperativeness', pt: 'Cooperação' },
        defaultValue: 'cooperative',
        directives: {
            en: {
                very_cooperative: 'very cooperative — answer fully and proactively',
                neutral: 'neutral — answer when asked but volunteer little',
                reluctant: 'reluctant — answer with hesitation, occasionally push back',
                uncooperative: 'uncooperative — resist questions, give partial answers',
            },
            pt: {
                very_cooperative: 'muito cooperativo — responde de forma completa e proativa',
                neutral: 'neutro — responde quando perguntado, mas oferece pouco espontaneamente',
                reluctant: 'relutante — responde com hesitação, ocasionalmente resiste',
                uncooperative: 'não cooperativo — resiste às perguntas, dá respostas parciais',
            },
        },
    },
    {
        key: 'healthLiteracy',
        label: { en: 'Health literacy', pt: 'Letramento em saúde' },
        defaultValue: 'average',
        directives: {
            en: {
                high: 'high — comfortable with medical terms (has medical background)',
                low: 'low — ask for plain-language explanations of medical terms',
            },
            pt: {
                high: 'alto — confortável com termos médicos (tem formação na área)',
                low: 'baixo — pede explicações em linguagem simples para termos médicos',
            },
        },
    },
];

// Build the persona-behaviour block. Emits one directive line per slider
// the author has set to a non-default value. Returns '' when every slider
// is at its default — no point telling the model "communication style:
// normal" twelve cases in a row.
export function formatPersonalityForPrompt(personality = {}, { lang = 'en' } = {}) {
    if (!personality || typeof personality !== 'object') return '';
    const isPt = lang === 'pt';
    const lines = [];
    for (const field of PERSONALITY_FIELDS) {
        const value = clean(personality[field.key]);
        if (!value || value === field.defaultValue) continue;
        const directive = field.directives[isPt ? 'pt' : 'en'][value];
        if (!directive) continue;
        lines.push(`- ${isPt ? field.label.pt : field.label.en}: ${directive}`);
    }
    return lines.join('\n');
}

// Build the persona-header demographics block. Emits one line per authored
// field; absent fields are omitted entirely (no fake defaults).
export function formatPersonaDemographicsForPrompt(demographics = {}, { lang = 'en' } = {}) {
    if (!demographics || typeof demographics !== 'object') return '';
    const isPt = lang === 'pt';
    const lines = [];
    const rawGender = clean(demographics.gender);
    const isMale = /^(male|masculino|homem|m)$/i.test(rawGender);
    const isFemale = /^(female|feminino|mulher|f)$/i.test(rawGender);

    for (const field of DEMOGRAPHIC_FIELDS) {
        const raw = demographics[field.key];
        const value = clean(raw);
        if (!value) continue;
        const label = isPt ? field.label.pt : field.label.en;
        if (field.key === 'gender') {
            if (isMale) {
                lines.push(`- ${label}: ${value} (HOMEM). Você é um paciente HOMEM. Responda SEMPRE no gênero masculino (ex: 'estou cansado', 'muito assustado', 'preocupado'). NUNCA use termos neutros como 'o(a) paciente' nem flexões femininas.`);
            } else if (isFemale) {
                lines.push(`- ${label}: ${value} (MULHER). Você é uma paciente MULHER. Responda SEMPRE no gênero feminino (ex: 'estou cansada', 'muito assustada', 'preocupada'). NUNCA use termos neutros como 'o(a) paciente' nem flexões masculinas.`);
            } else {
                lines.push(`- ${label}: ${value}`);
            }
            continue;
        }
        const format = field.format ? (isPt ? field.format.pt : field.format.en) : null;
        const display = format ? format(value) : value;
        lines.push(`- ${label}: ${display}`);
    }
    const allergies = clean(demographics.allergies);
    if (allergies) lines.push(isPt ? `- Alergias conhecidas: ${allergies}` : `- Known allergies: ${allergies}`);
    const ec = demographics.emergencyContact || {};
    const ecParts = [clean(ec.name), clean(ec.relationship), clean(ec.phone)].filter(Boolean);
    if (ecParts.length) lines.push(`${isPt ? '- Contato de emergência' : '- Emergency contact'}: ${ecParts.join(' · ')}`);
    return lines.join('\n');
}

export function formatCaseVitalsForPrompt(config = {}, { lang = 'en' } = {}) {
    const isPt = lang === 'pt';
    const v = config.initialVitals || config.initial_vitals || null;
    const legacy = !v && ['hr', 'spo2', 'rr', 'temp', 'sbp', 'dbp', 'etco2'].some(k => config[k] != null)
        ? {
            hr: config.hr,
            spo2: config.spo2,
            rr: config.rr,
            temp: config.temp,
            bpSys: config.sbp,
            bpDia: config.dbp,
            etco2: config.etco2,
        }
        : null;
    const vitals = v || legacy;
    if (!vitals || typeof vitals !== 'object') return '';

    const lines = [];
    if (vitals.hr != null) lines.push(isPt ? `- FC: ${vitals.hr} bpm` : `- HR: ${vitals.hr} bpm`);
    if (vitals.bpSys != null || vitals.bpDia != null) lines.push(`${isPt ? '- PA' : '- BP'}: ${vitals.bpSys ?? '?'}/${vitals.bpDia ?? '?'} mmHg`);
    if (vitals.spo2 != null) lines.push(`- SpO2: ${vitals.spo2}%`);
    if (vitals.rr != null) lines.push(isPt ? `- FR: ${vitals.rr}/min` : `- RR: ${vitals.rr}/min`);
    if (vitals.temp != null) lines.push(isPt ? `- Temperatura: ${vitals.temp} C` : `- Temperature: ${vitals.temp} C`);
    if (vitals.etco2 != null) lines.push(`- ETCO2: ${vitals.etco2} mmHg`);
    if (vitals.rhythm) lines.push(isPt ? `- Ritmo: ${vitals.rhythm}` : `- Rhythm: ${vitals.rhythm}`);
    if (vitals.conditions && typeof vitals.conditions === 'object') {
        const active = Object.entries(vitals.conditions)
            .filter(([, value]) => value !== false && value != null && value !== 0)
            .map(([key, value]) => value === true ? key : `${key}: ${value}`);
        if (active.length) lines.push(`${isPt ? '- Condições do ECG/monitor' : '- ECG/monitor conditions'}: ${active.join(', ')}`);
    }
    return lines.join('\n');
}

export function formatCaseRadiologyForPrompt(config = {}) {
    const studies = Array.isArray(config.radiology) ? config.radiology : [];
    if (!studies.length) return '';
    return formatRadiologyAsMarkdown(studies.map(study => ({
        type: study.modality || study.type,
        name: study.studyName || study.name,
        date: study.date,
        findings: study.findings,
        interpretation: study.interpretation,
    })));
}

export function formatPhysicalExamConfigForPrompt(config = {}, { lang = 'en' } = {}) {
    const isPt = lang === 'pt';
    const physical = config.physical_exam;
    if (!physical || typeof physical !== 'object') return '';
    const lines = [];
    for (const [region, exams] of Object.entries(physical)) {
        if (!exams || typeof exams !== 'object') continue;
        for (const [technique, finding] of Object.entries(exams)) {
            const text = clean(finding?.finding);
            if (!text) continue;
            const abnormal = finding.abnormal ? (isPt ? ' (alterado)' : ' (abnormal)') : '';
            lines.push(`- ${region} / ${technique}${abnormal}: ${text}`);
        }
    }
    return lines.join('\n');
}

export function formatConfiguredLabsForPrompt(config = {}) {
    const labs = config.investigations?.labs;
    if (!Array.isArray(labs) || labs.length === 0) return '';
    return labs.map(lab => {
        const value = lab.current_value != null ? ` = ${lab.current_value}${lab.unit ? ` ${lab.unit}` : ''}` : '';
        const flags = [
            lab.is_abnormal ? 'abnormal' : '',
            lab.turnaround_minutes != null ? `${lab.turnaround_minutes} min turnaround` : '',
        ].filter(Boolean);
        return `- ${lab.test_name || 'Lab test'}${value}${flags.length ? ` (${flags.join(', ')})` : ''}`;
    }).join('\n');
}

function formatClinicalRecords(config = {}, { respectAiAccess = true } = {}) {
    const records = config.clinicalRecords || {};
    const access = records.aiAccess || {};
    const allowed = (key, defaultValue) => !respectAiAccess || (access[key] ?? defaultValue);
    const sections = [];

    if (allowed('history', true)) {
        const history = formatHistoryAsMarkdown(records.history);
        if (history) sections.push(['Medical History', history]);
    }

    if (allowed('physicalExam', true) && records.physicalExam && typeof records.physicalExam === 'object') {
        const lines = Object.entries(records.physicalExam)
            .map(([key, value]) => clean(value) ? `- ${key}: ${clean(value)}` : '')
            .filter(Boolean)
            .join('\n');
        if (lines) sections.push(['Physical Examination', lines]);
    }

    if (allowed('medications', true) && Array.isArray(records.medications) && records.medications.length) {
        const meds = records.medications.map(m =>
            `- ${[m.name, m.dose, m.route, m.frequency].filter(Boolean).join(' ')}${m.indication ? ` (for ${m.indication})` : ''}`
        ).join('\n');
        if (meds) sections.push(['Current Medications', meds]);
    }

    // The Records → Radiology UI surface was removed (bug report 2.9.15 #6 —
    // no authoring path could populate it), but imported/hand-authored case
    // JSON with clinicalRecords.radiology is still honoured here for AI context.
    if (allowed('radiology', false) && Array.isArray(records.radiology) && records.radiology.length) {
        const radiology = formatRadiologyAsMarkdown(records.radiology);
        if (radiology) sections.push(['Radiology Studies', radiology]);
    }

    if (allowed('procedures', true) && Array.isArray(records.procedures) && records.procedures.length) {
        const procedures = records.procedures.map(p =>
            `- ${p.name || 'Procedure'}${p.date ? ` (${p.date})` : ''}: ${p.indication || 'No indication documented'}${p.findings ? ` - Findings: ${p.findings}` : ''}${p.complications ? ` - Complications: ${p.complications}` : ''}`
        ).join('\n');
        if (procedures) sections.push(['Procedures', procedures]);
    }

    if (allowed('notes', false) && Array.isArray(records.notes) && records.notes.length) {
        const notes = records.notes.map(n =>
            `- ${n.type || 'Note'}${n.title ? `: ${n.title}` : ''}${n.date ? ` (${n.date})` : ''}: ${n.content || 'No content'}`
        ).join('\n');
        if (notes) sections.push(['Clinical Notes', notes]);
    }

    return sections;
}

function formatLegacyClinicalRecords(config = {}, { lang = 'en' } = {}) {
    const isPt = lang === 'pt';
    const legacy = config.clinical_records;
    if (!legacy || typeof legacy !== 'object') return [];
    const sections = [];
    const historyLines = [
        clean(legacy.chief_complaint) && `${isPt ? '- Queixa Principal' : '- Chief Complaint'}: ${clean(legacy.chief_complaint)}`,
        clean(legacy.present_illness) && `${isPt ? '- Doença Atual' : '- Present Illness'}: ${clean(legacy.present_illness)}`,
        Array.isArray(legacy.risk_factors) && legacy.risk_factors.length && `${isPt ? '- Fatores de Risco' : '- Risk Factors'}: ${legacy.risk_factors.join('; ')}`,
    ].filter(Boolean).join('\n');
    if (historyLines) sections.push([isPt ? 'Histórico Clínico (legado)' : 'Legacy Clinical History', historyLines]);
    if (legacy.physical_exam && typeof legacy.physical_exam === 'object') {
        const exam = Object.entries(legacy.physical_exam)
            .filter(([, value]) => clean(value))
            .map(([key, value]) => `- ${key}: ${clean(value)}`)
            .join('\n');
        if (exam) sections.push([isPt ? 'Exame Físico (legado)' : 'Legacy Physical Examination', exam]);
    }
    if (Array.isArray(legacy.differential_diagnosis) && legacy.differential_diagnosis.length) {
        sections.push([isPt ? 'Diagnóstico Diferencial' : 'Differential Diagnosis', legacy.differential_diagnosis.map(x => `- ${x}`).join('\n')]);
    }
    if (Array.isArray(legacy.management_plan) && legacy.management_plan.length) {
        sections.push([isPt ? 'Plano de Conduta' : 'Management Plan', legacy.management_plan.map(x => `- ${x}`).join('\n')]);
    }
    return sections;
}

function caseSummary(activeCase = {}, { lang = 'en' } = {}) {
    const isPt = lang === 'pt';
    const cfg = activeCase.config || {};
    const demo = cfg.demographics || {};
    const parts = isPt ? [
        `Caso: ${activeCase.name || 'Sem nome'}`,
        cfg.patient_name ? `Paciente: ${cfg.patient_name}` : '',
        demo.age ? `Idade: ${demo.age}` : '',
        demo.gender ? `Gênero: ${demo.gender}` : '',
        demo.weight ? `Peso: ${demo.weight}` : '',
        demo.height ? `Altura: ${demo.height}` : '',
        activeCase.description ? `Descrição: ${activeCase.description}` : '',
    ] : [
        `Case: ${activeCase.name || 'Unnamed'}`,
        cfg.patient_name ? `Patient: ${cfg.patient_name}` : '',
        demo.age ? `Age: ${demo.age}` : '',
        demo.gender ? `Gender: ${demo.gender}` : '',
        demo.weight ? `Weight: ${demo.weight}` : '',
        demo.height ? `Height: ${demo.height}` : '',
        activeCase.description ? `Description: ${activeCase.description}` : '',
    ];
    return parts.filter(Boolean).join('\n');
}

export function buildPatientCaseDesignContext(activeCase, { lang = 'en' } = {}) {
    if (!activeCase) return '';
    const isPt = lang === 'pt';
    const cfg = activeCase.config || {};
    const sections = [[isPt ? 'Resumo do Caso' : 'Case Summary', caseSummary(activeCase, { lang })]];
    const mirroredHistory = cfg.clinicalRecords?.history || null;

    const structured = formatStructuredHistoryForPrompt(cfg.structuredHistory, {
        omitMirroredHistory: mirroredHistory,
        demographics: cfg.demographics,
        lang,
    });
    if (structured) sections.push([isPt ? 'História Estruturada do Paciente' : 'Structured Patient Story', structured]);

    const vitals = formatCaseVitalsForPrompt(cfg, { lang });
    if (vitals) sections.push([isPt ? 'Sinais Vitais Iniciais Configurados' : 'Configured Initial Vitals', vitals]);

    const physical = formatPhysicalExamConfigForPrompt(cfg, { lang });
    if (physical) sections.push([isPt ? 'Achados do Exame Físico Configurados' : 'Configured Physical Exam Findings', physical]);

    const legacySections = formatLegacyClinicalRecords(cfg, { lang })
        .filter(([title]) => !/Differential|Management|Diagnóstico Diferencial|Plano de Conduta/.test(title));
    sections.push(...legacySections);

    const body = sections
        .filter(([, content]) => clean(content))
        .map(([title, content]) => `### ${title}\n${content}`)
        .join('\n\n');

    return body
        ? (isPt
            ? `\n---\n## CONTEXTO DE DESENHO DO CASO (Oculto do aluno)\n${body}\n`
            : `\n---\n## CASE DESIGN CONTEXT (Hidden from learner)\n${body}\n`)
        : '';
}

export function buildDiscussionCaseContext(activeCase, contextFilter = 'full') {
    if (!activeCase || contextFilter === 'minimal') return '';
    const cfg = activeCase.config || {};
    const sections = [['Summary', caseSummary(activeCase)]];

    const structured = formatStructuredHistoryForPrompt(cfg.structuredHistory, { demographics: cfg.demographics });
    if (structured && ['history', 'full'].includes(contextFilter)) {
        sections.push(['Structured History', structured]);
    } else if (cfg.structuredHistory?.chiefComplaint) {
        sections.push(['Chief Complaint', cfg.structuredHistory.chiefComplaint]);
    }

    if (['history', 'full'].includes(contextFilter)) {
        sections.push(...formatClinicalRecords(cfg, { respectAiAccess: false }));
        sections.push(...formatLegacyClinicalRecords(cfg));
    }

    if (['vitals', 'full'].includes(contextFilter)) {
        const vitals = formatCaseVitalsForPrompt(cfg);
        if (vitals) sections.push(['Initial Vitals', vitals]);
    }

    if (contextFilter === 'full') {
        const physical = formatPhysicalExamConfigForPrompt(cfg);
        if (physical) sections.push(['Configured Physical Exam Findings', physical]);
        const radiology = formatCaseRadiologyForPrompt(cfg);
        if (radiology) sections.push(['Configured Radiology Results', radiology]);
        const labs = formatConfiguredLabsForPrompt(cfg);
        if (labs) sections.push(['Configured Investigation Results', labs]);

        const expectations = [
            clean(cfg.diagnosis || cfg.expected_diagnosis) && `- Expected diagnosis: ${clean(cfg.diagnosis || cfg.expected_diagnosis)}`,
            clean(cfg.treatment_plan) && `- Expected treatment plan: ${clean(cfg.treatment_plan)}`,
            Array.isArray(cfg.learning_objectives)
                ? `- Learning objectives: ${cfg.learning_objectives.join('; ')}`
                : clean(cfg.learning_objectives) && `- Learning objectives: ${clean(cfg.learning_objectives)}`,
        ].filter(Boolean).join('\n');
        if (expectations) sections.push(['Authoring Expectations', expectations]);
    }

    const body = sections
        .filter(([, content]) => clean(content))
        .map(([title, content]) => `### ${title}\n${content}`)
        .join('\n\n');

    return body
        ? `\n\n=== CASE CONTEXT ===\n${body}\n=== END CONTEXT ===\n`
            + `\nNote: the learner's actual orders, exam findings, lab results, and treatments performed in this session may differ from configured case expectations; ask the learner about what they did rather than assuming.\n`
        : '';
}
