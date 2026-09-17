// Idempotent boot seed: Spanish-language sibling of seedStemiCourse.js.
//
// The Basic course already gets the Portuguese STEMI lesson/survey; this adds
// the same clinical content again in Spanish, attached to the same cohort, so
// a student can pick either. Kept as a SEPARATE lesson/survey (guarded by its
// own title) rather than a language field on `lessons` — the schema has none,
// and duplicating this small seeder is far cheaper than adding a language
// column + migrating every reader of lesson_sections. Mirrors Lukas' own
// dual-language identity (see server/seedStemiCourse.js's Portuguese content
// and server/seedLanguageCases.js's per-language cases) — MedHack UNISUD's own
// pre-registration form is written in Spanish, and Pedro Juan Caballero's
// student body is Brazilian/Paraguayan, so both languages are live audiences.
//
// Runs on every boot but is a no-op once the lesson exists (guarded by
// title), same contract as the Portuguese seeder.
import dbAdapter from './dbAdapter.js';
import { logger } from './logger.js';

const log = logger('seed-stemi-es');

const LESSON_TITLE = 'IAMCEST: Reconocimiento y Manejo';
const SURVEY_TITLE = 'Razonamiento Clínico en el IAMCEST';

// Encode a JSON string so it is safe inside a single-quoted HTML attribute
// (TipTap reads <lecture-mcq data-questions='…'> back out of the DOM).
function attr(json) {
    return json
        .replace(/&/g, '&amp;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

const INTRO_HTML = `
<h2>¿Qué es un IAMCEST?</h2>
<p>El infarto agudo de miocardio con elevación del segmento ST (IAMCEST) es una
lesión miocárdica aguda causada por la oclusión trombótica completa de una
arteria coronaria. La oclusión produce isquemia transmural, que es lo que
genera la elevación característica del segmento ST en el ECG de superficie.
Es un diagnóstico <strong>tiempo-dependiente</strong>: el miocardio se infarta
progresivamente desde el momento de la oclusión — por eso "tiempo es músculo".</p>

<h2>Reconociéndolo en el ECG</h2>
<p>El diagnóstico es electrocardiográfico. Busque nueva elevación del segmento
ST en el punto J en dos derivaciones contiguas:</p>
<ul>
  <li>&ge; 1 mm en las derivaciones de miembros y en la mayoría de las precordiales;</li>
  <li>&ge; 2 mm (hombres &ge; 40 años), &ge; 2,5 mm (hombres &lt; 40 años), o &ge; 1,5 mm (mujeres) en V2&ndash;V3;</li>
  <li>el infradesnivel recíproco del ST refuerza una oclusión verdadera, y no un simulador de IAM.</li>
</ul>
<p>Territorios: inferior (II, III, aVF), anteroseptal (V1&ndash;V4), lateral
(I, aVL, V5&ndash;V6). El bloqueo de rama izquierda nuevo con cuadro clínico
compatible, y el IAM posterior (R alta + infradesnivel del ST en V1&ndash;V3),
son importantes "equivalentes de IAMCEST."</p>

<h2>Manejo inmediato</h2>
<p>La intervención más importante es la <strong>reperfusión precoz</strong>. La
intervención coronaria percutánea primaria (ICP primaria) es preferida cuando
puede realizarse dentro del plazo recomendado por las guías (primer contacto
médico hasta el dispositivo &le; 120 min); de lo contrario, administre
fibrinólisis y traslade al paciente. Junto a la reperfusión: aspirina (AAS),
un segundo antiagregante plaquetario, anticoagulación y analgesia, con
oxígeno solo si hay hipoxemia.</p>

<p class="rohy-lesson-note"><em>Responda las preguntas a continuación y luego
reflexione en la encuesta de razonamiento clínico.</em></p>
`.trim();

// 10 MCQs — a mix of basic knowledge and "problems in STEMI" (pitfalls,
// complications, decision-making). Each: question, options[], correctIndex,
// explanation. Kept identical in structure/order to the Portuguese seeder.
const MCQ_QUESTIONS = [
    {
        question: '¿Cuál es la fisiopatología subyacente del IAMCEST?',
        options: [
            'Oclusión trombótica completa de una arteria coronaria',
            'Trombo coronario parcial, no oclusivo',
            'Vasoespasmo coronario sin trombo',
            'Isquemia por desbalance de demanda causada por taquicardia',
        ],
        correctIndex: 0,
        explanation: 'El IAMCEST resulta de la oclusión completa, generalmente trombótica, de una arteria coronaria, causando isquemia transmural. La oclusión parcial suele producir IAMSEST/angina inestable.',
    },
    {
        question: '¿En cuántas derivaciones debe estar presente la elevación del ST para cumplir los criterios de IAMCEST?',
        options: ['En una sola derivación aislada', 'En dos derivaciones contiguas', 'En cualquiera tres derivaciones', 'En todas las derivaciones de un territorio'],
        correctIndex: 1,
        explanation: 'El criterio es nueva elevación del ST en el punto J en al menos dos derivaciones anatómicamente contiguas.',
    },
    {
        question: '¿Un IAMCEST de pared inferior se identifica mejor en qué derivaciones?',
        options: ['V1 a V4', 'I, aVL, V5, V6', 'II, III, aVF', 'aVR y V1'],
        correctIndex: 2,
        explanation: 'Las derivaciones II, III y aVF observan la pared inferior, generalmente irrigada por la arteria coronaria derecha.',
    },
    {
        question: '¿Cuál es la estrategia de reperfusión preferida cuando puede realizarse a tiempo?',
        options: ['Fibrinólisis', 'ICP primaria (angioplastia primaria)', 'Doble antiagregación plaquetaria aislada', 'Angiografía electiva en 72 horas'],
        correctIndex: 1,
        explanation: 'La ICP primaria es preferida cuando el tiempo entre el primer contacto médico y el dispositivo está dentro del límite recomendado por las guías (alrededor de 120 minutos); de lo contrario, administre fibrinólisis y traslade al paciente.',
    },
    {
        question: 'En un paciente con IAMCEST de pared inferior, ¿por qué debe obtener un ECG de derivaciones derechas?',
        options: [
            'Para excluir una embolia pulmonar',
            'Para detectar infarto de ventrículo derecho',
            'Para confirmar fibrilación auricular',
            'Para medir el intervalo QT',
        ],
        correctIndex: 1,
        explanation: 'El IAMCEST de pared inferior puede comprometer el ventrículo derecho (elevación del ST en V4R). El infarto de VD es dependiente de precarga, por lo que los nitratos pueden causar hipotensión peligrosa.',
    },
    {
        question: '¿Qué fármaco está relativamente contraindicado ante la sospecha de infarto de ventrículo derecho?',
        options: ['Aspirina (AAS)', 'Nitroglicerina', 'Heparina', 'Morfina'],
        correctIndex: 1,
        explanation: 'El infarto de VD es dependiente de precarga; los nitratos reducen la precarga y pueden precipitar hipotensión profunda.',
    },
    {
        question: 'Un bloqueo de rama izquierda nuevo con cuadro clínico isquémico debe tratarse como:',
        options: [
            'Un hallazgo benigno que no requiere conducta',
            'Un equivalente de IAMCEST que exige evaluación urgente de reperfusión',
            'Un motivo para no administrar aspirina',
            'Una indicación de fibrinólisis inmediata independientemente del acceso a la ICP',
        ],
        correctIndex: 1,
        explanation: 'Un BRI nuevo o presuntamente nuevo con cuadro clínico compatible se trata como equivalente de IAMCEST y motiva evaluación urgente de reperfusión.',
    },
    {
        question: '¿Qué patrón electrocardiográfico sugiere un IAMCEST de pared posterior?',
        options: [
            'Elevación del ST en V1 a V3',
            'Ondas R altas e infradesnivel del ST en V1 a V3',
            'Elevación difusa y cóncava del ST con infradesnivel del PR',
            'Ondas Q profundas solo en aVR',
        ],
        correctIndex: 1,
        explanation: 'El infarto posterior se refleja en la pared anterior como ondas R altas e infradesnivel horizontal del ST en V1 a V3; las derivaciones posteriores (V7 a V9) lo confirman.',
    },
    {
        question: 'Una complicación mecánica frecuente en los días posteriores a un IAMCEST es:',
        options: [
            'Disección de aorta',
            'Rotura de músculo papilar que causa insuficiencia mitral aguda',
            'Fibrosis pulmonar',
            'Pericarditis constrictiva',
        ],
        correctIndex: 1,
        explanation: 'La rotura de músculo papilar, la rotura del septo interventricular y la rotura de pared libre son complicaciones mecánicas temidas, típicamente en los primeros días tras el infarto.',
    },
    {
        question: '¿Cuál es el uso más apropiado del oxígeno en un IAMCEST agudo?',
        options: [
            'Oxígeno en alto flujo para todo paciente',
            'Solo cuando el paciente está hipoxémico (ej.: SpO2 por debajo de 90%)',
            'Nunca — el oxígeno es perjudicial en el IAMCEST',
            'Solo si el paciente refiere falta de aire',
        ],
        correctIndex: 1,
        explanation: 'La oxigenoterapia suplementaria de rutina en pacientes no hipoxémicos no aporta beneficio y puede causar daño; administre oxígeno solo en caso de hipoxemia.',
    },
];

const SURVEY_QUESTIONS = [
    {
        questionText: 'Describa brevemente su razonamiento para los primeros 10 minutos en el manejo de un paciente con dolor torácico y elevación del ST.',
        questionType: 'free_text',
        options: null,
        isRequired: true,
    },
    {
        questionText: '¿Qué tan seguro se siente para interpretar un ECG de 12 derivaciones en busca de IAMCEST?',
        questionType: 'single_choice',
        options: ['Nada seguro', 'Algo seguro', 'Seguro', 'Muy seguro'],
        isRequired: true,
    },
    {
        questionText: '¿Qué factores considera al elegir entre ICP primaria y fibrinólisis?',
        questionType: 'multiple_choice',
        options: ['Tiempo desde el inicio de los síntomas', 'Tiempo estimado hasta la ICP', 'Riesgo de sangrado', 'Disponibilidad de hemodinamia'],
        isRequired: false,
    },
];

// Seed ONE "Basic course" cohort (idempotent: guarded by the lesson title).
async function seedCohort(cohort) {
    const existing = await dbAdapter.get(
        `SELECT id FROM lessons WHERE cohort_id = ? AND title = ? AND deleted_at IS NULL`,
        [cohort.id, LESSON_TITLE]
    );
    if (existing) return; // already seeded

    await dbAdapter.transaction(async () => {
        // Lesson (published).
        const { lastID: lessonId } = await dbAdapter.run(
            `INSERT INTO lessons
               (cohort_id, tenant_id, title, description, content_type, order_index, is_published, is_free)
             VALUES (?,?,?,?,?,?,1,1)`,
            [cohort.id, cohort.tenant_id, LESSON_TITLE,
             'Reconozca el infarto con elevación del ST en el ECG, actúe correctamente y razone sobre las trampas clínicas.',
             'text', 1]
        );

        // Section 1 — overview text.
        await dbAdapter.run(
            `INSERT INTO lesson_sections (lesson_id, title, type, content, order_index)
             VALUES (?,?,?,?,?)`,
            [lessonId, 'Visión General', 'text', INTRO_HTML, 0]
        );

        // Section 2 — the 10-question MCQ block (a single lecture-mcq stepper).
        const mcqHtml = `<lecture-mcq data-questions='${attr(JSON.stringify(MCQ_QUESTIONS))}'></lecture-mcq>`;
        await dbAdapter.run(
            `INSERT INTO lesson_sections (lesson_id, title, type, content, order_index)
             VALUES (?,?,?,?,?)`,
            [lessonId, 'Ponga a prueba sus conocimientos', 'text', mcqHtml, 1]
        );

        // Survey (published) + questions + attach to the course.
        const { lastID: surveyId } = await dbAdapter.run(
            `INSERT INTO surveys (tenant_id, title, description, created_by_id, is_published, is_anonymous)
             VALUES (?,?,?,?,1,0)`,
            [cohort.tenant_id, SURVEY_TITLE,
             'Una breve reflexión sobre cómo razona usted ante un IAM agudo con elevación del ST.',
             cohort.owner_user_id]
        );
        for (let i = 0; i < SURVEY_QUESTIONS.length; i++) {
            const q = SURVEY_QUESTIONS[i];
            await dbAdapter.run(
                `INSERT INTO survey_questions
                   (survey_id, question_text, question_type, options, is_required, order_index)
                 VALUES (?,?,?,?,?,?)`,
                [surveyId, q.questionText, q.questionType,
                 q.options ? JSON.stringify(q.options) : null, q.isRequired ? 1 : 0, i]
            );
        }
        // order_index 1 — sits after the Portuguese survey (order_index 0)
        // seeded by seedStemiCourse.js for the same cohort.
        await dbAdapter.run(
            `INSERT INTO cohort_surveys (cohort_id, survey_id, order_index) VALUES (?,?,1)`,
            [cohort.id, surveyId]
        );
    });

    log.info('seeded STEMI course content (es)', { cohort_id: cohort.id });
}

// Same fan-out as seedStemiCourse.js: every tenant's live default course
// ("is_default = 1"), each idempotently. ensureBasicCourses()/
// ensureBasicCourseCaseLink() are NOT repeated here — they are the Portuguese
// seeder's responsibility (both run every boot, in sequence, from db.js) and
// are themselves idempotent, so calling them twice would be redundant, not
// wrong, but there is no need to.
export async function seedStemiCourseEs() {
    try {
        const cohorts = await dbAdapter.all(
            `SELECT id, tenant_id, owner_user_id FROM cohorts
              WHERE is_default = 1 AND deleted_at IS NULL
              ORDER BY id ASC`
        );
        for (const cohort of cohorts) {
            await seedCohort(cohort);
        }
    } catch (err) {
        // Non-fatal: a seed failure must never stop the server booting.
        log.warn('STEMI course seed (es) failed', { error: err.message });
    }
}

export default seedStemiCourseEs;
