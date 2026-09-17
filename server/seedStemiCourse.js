// Idempotent boot seed: fill the tenant "Basic course" (the automatic default
// class that already holds the default STEMI case) with real STEMI teaching
// content — one published lesson (overview text + a 10-question MCQ block) and
// a clinical-reasoning survey attached to the course.
//
// Runs on every boot but is a no-op once the lesson exists (guarded by title),
// so existing installs get the content without a destructive migration and
// fresh installs get it right after the 0031 default-course backfill.
import dbAdapter from './dbAdapter.js';
import { logger } from './logger.js';
import { DEFAULT_COURSE_NAME } from './shared/defaultCourse.js';

const log = logger('seed-stemi');

const LESSON_TITLE = 'IAMCSST: Reconhecimento e Manejo';
const SURVEY_TITLE = 'Raciocínio Clínico no IAMCSST';

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
<h2>O que é um IAMCSST?</h2>
<p>O infarto agudo do miocárdio com supradesnivelamento do segmento ST (IAMCSST) é
uma lesão miocárdica aguda causada pela oclusão trombótica completa de uma artéria
coronária. A oclusão produz isquemia transmural, que é o que gera o supradesnivelamento
característico do segmento ST no ECG de superfície. É um diagnóstico <strong>tempo-dependente</strong>:
o miocárdio infarta progressivamente a partir do momento da oclusão — por isso
"tempo é músculo".</p>

<h2>Reconhecendo no ECG</h2>
<p>O diagnóstico é eletrocardiográfico. Procure novo supradesnivelamento do segmento
ST no ponto J em duas derivações contíguas:</p>
<ul>
  <li>&ge; 1 mm nas derivações dos membros e na maioria das precordiais;</li>
  <li>&ge; 2 mm (homens &ge; 40 anos), &ge; 2,5 mm (homens &lt; 40 anos), ou &ge; 1,5 mm (mulheres) em V2&ndash;V3;</li>
  <li>infradesnivelamento recíproco do ST reforça uma oclusão verdadeira, e não um simulador de IAM.</li>
</ul>
<p>Territórios: inferior (II, III, aVF), anterosseptal (V1&ndash;V4), lateral
(I, aVL, V5&ndash;V6). Bloqueio de ramo esquerdo novo com quadro clínico compatível,
e o IAM posterior (R alto + infra de ST em V1&ndash;V3), são importantes "equivalentes de IAMCSST."</p>

<h2>Conduta imediata</h2>
<p>A intervenção mais importante é a <strong>reperfusão precoce</strong>. A
angioplastia coronária primária (ICP primária) é preferida quando pode ser
realizada dentro do prazo recomendado pelas diretrizes (primeiro contato médico
até o dispositivo &le; 120 min); caso contrário, administre fibrinólise e transfira
o paciente. Junto à reperfusão: aspirina (AAS), um segundo antiagregante
plaquetário, anticoagulação e analgesia, com oxigênio apenas se houver hipoxemia.</p>

<p class="rohy-lesson-note"><em>Responda às perguntas abaixo e depois reflita na
pesquisa de raciocínio clínico.</em></p>
`.trim();

// 10 MCQs — a mix of basic knowledge and "problems in STEMI" (pitfalls,
// complications, decision-making). Each: question, options[], correctIndex,
// explanation. Apostrophes are avoided so the attribute stays clean.
const MCQ_QUESTIONS = [
    {
        question: 'Qual é a fisiopatologia subjacente do IAMCSST?',
        options: [
            'Oclusão trombótica completa de uma artéria coronária',
            'Trombo coronário parcial, não oclusivo',
            'Vasoespasmo coronário sem trombo',
            'Isquemia por desbalanço de demanda causada por taquicardia',
        ],
        correctIndex: 0,
        explanation: 'O IAMCSST resulta de oclusão completa, geralmente trombótica, de uma artéria coronária, causando isquemia transmural. A oclusão parcial costuma produzir IAMSSST/angina instável.',
    },
    {
        question: 'O supradesnivelamento do ST precisa estar presente em quantas derivações para preencher os critérios de IAMCSST?',
        options: ['Em uma única derivação isolada', 'Em duas derivações contíguas', 'Em quaisquer três derivações', 'Em todas as derivações de um território'],
        correctIndex: 1,
        explanation: 'O critério é novo supradesnivelamento do ST no ponto J em pelo menos duas derivações anatomicamente contíguas.',
    },
    {
        question: 'Um IAMCSST de parede inferior é mais bem identificado em quais derivações?',
        options: ['V1 a V4', 'I, aVL, V5, V6', 'II, III, aVF', 'aVR e V1'],
        correctIndex: 2,
        explanation: 'As derivações II, III e aVF observam a parede inferior, geralmente irrigada pela artéria coronária direita.',
    },
    {
        question: 'Qual é a estratégia de reperfusão preferida quando pode ser realizada dentro do prazo?',
        options: ['Fibrinólise', 'ICP primária (angioplastia primária)', 'Dupla antiagregação plaquetária isolada', 'Angiografia eletiva em 72 horas'],
        correctIndex: 1,
        explanation: 'A ICP primária é preferida quando o tempo entre o primeiro contato médico e o dispositivo está dentro do limite recomendado pelas diretrizes (cerca de 120 minutos); caso contrário, administre fibrinólise e transfira o paciente.',
    },
    {
        question: 'Em um paciente com IAMCSST de parede inferior, por que você deve obter um ECG de derivações direitas?',
        options: [
            'Para excluir embolia pulmonar',
            'Para detectar infarto de ventrículo direito',
            'Para confirmar fibrilação atrial',
            'Para medir o intervalo QT',
        ],
        correctIndex: 1,
        explanation: 'O IAMCSST de parede inferior pode envolver o ventrículo direito (supra de ST em V4R). O infarto de VD é dependente de pré-carga, portanto os nitratos podem causar hipotensão perigosa.',
    },
    {
        question: 'Qual medicamento é relativamente contraindicado na suspeita de infarto de ventrículo direito?',
        options: ['Aspirina (AAS)', 'Nitroglicerina', 'Heparina', 'Morfina'],
        correctIndex: 1,
        explanation: 'O infarto de VD é dependente de pré-carga; os nitratos reduzem a pré-carga e podem precipitar hipotensão profunda.',
    },
    {
        question: 'Um novo bloqueio de ramo esquerdo com quadro clínico isquêmico deve ser tratado como:',
        options: [
            'Um achado benigno que não exige conduta',
            'Um equivalente de IAMCSST que exige avaliação urgente de reperfusão',
            'Um motivo para não administrar aspirina',
            'Uma indicação de fibrinólise imediata independentemente do acesso à ICP',
        ],
        correctIndex: 1,
        explanation: 'Um BRE novo ou presumivelmente novo com quadro clínico compatível é tratado como equivalente de IAMCSST e motiva avaliação urgente de reperfusão.',
    },
    {
        question: 'Qual padrão eletrocardiográfico sugere IAMCSST de parede posterior?',
        options: [
            'Supradesnivelamento do ST em V1 a V3',
            'Ondas R altas e infradesnivelamento do ST em V1 a V3',
            'Supradesnivelamento difuso e côncavo do ST com infra de PR',
            'Ondas Q profundas apenas em aVR',
        ],
        correctIndex: 1,
        explanation: 'O infarto posterior se reflete na parede anterior como ondas R altas e infradesnivelamento horizontal do ST em V1 a V3; as derivações posteriores (V7 a V9) confirmam o achado.',
    },
    {
        question: 'Uma complicação mecânica comum nos dias seguintes a um IAMCSST é:',
        options: [
            'Dissecção de aorta',
            'Ruptura de músculo papilar causando insuficiência mitral aguda',
            'Fibrose pulmonar',
            'Pericardite constritiva',
        ],
        correctIndex: 1,
        explanation: 'Ruptura de músculo papilar, ruptura do septo interventricular e ruptura de parede livre são complicações mecânicas temidas, tipicamente nos primeiros dias após o infarto.',
    },
    {
        question: 'Qual é o uso mais apropriado de oxigênio em um IAMCSST agudo?',
        options: [
            'Oxigênio em alto fluxo para todo paciente',
            'Apenas quando o paciente está hipoxêmico (ex.: SpO2 abaixo de 90%)',
            'Nunca — oxigênio é prejudicial no IAMCSST',
            'Apenas se o paciente relatar falta de ar',
        ],
        correctIndex: 1,
        explanation: 'A oxigenoterapia suplementar de rotina em pacientes não hipoxêmicos não traz benefício e pode causar dano; administre oxigênio apenas em caso de hipoxemia.',
    },
];

const SURVEY_QUESTIONS = [
    {
        questionText: 'Descreva brevemente seu raciocínio para os primeiros 10 minutos no manejo de um paciente com dor torácica e supradesnivelamento do ST.',
        questionType: 'free_text',
        options: null,
        isRequired: true,
    },
    {
        questionText: 'Qual é o seu grau de confiança para interpretar um ECG de 12 derivações em busca de IAMCSST?',
        questionType: 'single_choice',
        options: ['Nada confiante', 'Pouco confiante', 'Confiante', 'Muito confiante'],
        isRequired: true,
    },
    {
        questionText: 'Quais fatores você considera ao escolher entre ICP primária e fibrinólise?',
        questionType: 'multiple_choice',
        options: ['Tempo desde o início dos sintomas', 'Tempo estimado até a ICP', 'Risco de sangramento', 'Disponibilidade de hemodinâmica'],
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
             'Reconheça o infarto com supradesnivelamento do ST no ECG, aja de forma correta e raciocine sobre as armadilhas clínicas.',
             'text', 0]
        );

        // Section 1 — overview text.
        await dbAdapter.run(
            `INSERT INTO lesson_sections (lesson_id, title, type, content, order_index)
             VALUES (?,?,?,?,?)`,
            [lessonId, 'Visão Geral', 'text', INTRO_HTML, 0]
        );

        // Section 2 — the 10-question MCQ block (a single lecture-mcq stepper).
        const mcqHtml = `<lecture-mcq data-questions='${attr(JSON.stringify(MCQ_QUESTIONS))}'></lecture-mcq>`;
        await dbAdapter.run(
            `INSERT INTO lesson_sections (lesson_id, title, type, content, order_index)
             VALUES (?,?,?,?,?)`,
            [lessonId, 'Teste seus conhecimentos', 'text', mcqHtml, 1]
        );

        // Survey (published) + questions + attach to the course.
        const { lastID: surveyId } = await dbAdapter.run(
            `INSERT INTO surveys (tenant_id, title, description, created_by_id, is_published, is_anonymous)
             VALUES (?,?,?,?,1,0)`,
            [cohort.tenant_id, SURVEY_TITLE,
             'Uma breve reflexão sobre como você raciocina diante de um IAM agudo com supra de ST.',
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
        await dbAdapter.run(
            `INSERT INTO cohort_surveys (cohort_id, survey_id, order_index) VALUES (?,?,0)`,
            [cohort.id, surveyId]
        );
    });

    log.info('seeded STEMI course content', { cohort_id: cohort.id });
}

// Ensure every tenant with a staff user has a live default course (0031's
// backfill re-run at boot). On a FRESH install migrations run against an
// empty DB — 0031 sees no users and creates nothing — and only afterwards do
// the boot seeders insert the default users + cases. Without this step a
// fresh install would never get its default class. Same owner-selection rule
// as 0031 (lowest-id admin, else educator); auto_enroll = 1 so the login
// hook (ensureAutoEnrollMemberships) enrols everyone. Idempotent via the
// NOT EXISTS guard; memberships come from the login hook, not from here.
//
// The default course is identified by `cohorts.is_default = 1` (0044), NOT by
// its name. The seeded name is the English literal 'Basic course' — display
// only, so an admin may rename/localise it. The guard used to match the name,
// which meant a renamed default was invisible here and every boot after the
// rename minted a second "Basic course".
export async function ensureBasicCourses() {
    const { changes } = await dbAdapter.run(
        `INSERT INTO cohorts (name, owner_user_id, tenant_id, description, auto_enroll, is_default)
         SELECT ?,
                (SELECT u.id FROM users u
                  WHERE u.tenant_id = t.tenant_id AND u.deleted_at IS NULL
                    AND u.role IN ('admin', 'educator')
                  ORDER BY (u.role = 'admin') DESC, u.id ASC LIMIT 1),
                t.tenant_id,
                'Default class — every user is enrolled and receives the default case.',
                1,
                1
           FROM (SELECT DISTINCT tenant_id FROM users WHERE deleted_at IS NULL) t
          WHERE EXISTS (SELECT 1 FROM users u
                         WHERE u.tenant_id = t.tenant_id AND u.deleted_at IS NULL
                           AND u.role IN ('admin', 'educator'))
            AND NOT EXISTS (SELECT 1 FROM cohorts c
                             WHERE c.tenant_id = t.tenant_id
                               AND c.is_default = 1
                               AND c.deleted_at IS NULL)`,
        [DEFAULT_COURSE_NAME]
    );
    if (changes) log.info('created default course cohorts', { created: changes });
}

// Course layout (idempotent, per tenant with a live Basic course):
// the tenant's DEFAULT case (cases.is_default = 1) is linked to the single
// default "Basic course" that every user is auto-enrolled in. The seeded
// language cases are added alongside it by server/seedLanguageCases.js, so the
// one default course carries the default case PLUS one case per language —
// students pick the language they want by picking the case (each is flagged by
// its own immutable case language). Teachers may add or remove further cases;
// their assignments to any cohort are never touched here. (Earlier revisions
// stripped every non-default case out of the Basic course to keep it to a
// single case — that repair is intentionally gone: the default course now
// holds many cases.)
async function ensureBasicCourseCaseLink() {
    const basicCourses = await dbAdapter.all(
        `SELECT id, tenant_id, owner_user_id FROM cohorts
          WHERE is_default = 1 AND deleted_at IS NULL
          ORDER BY id ASC`
    );
    for (const basic of basicCourses) {
        // Revive-or-insert the default-case link into the Basic course.
        await dbAdapter.run(
            `INSERT INTO cohort_cases (cohort_id, case_id)
             SELECT ?, c.id FROM cases c
              WHERE c.tenant_id = ? AND c.is_default = 1 AND c.deleted_at IS NULL
                AND NOT EXISTS (
                    SELECT 1 FROM cohort_cases cc
                     WHERE cc.cohort_id = ? AND cc.case_id = c.id AND cc.deleted_at IS NULL)`,
            [basic.id, basic.tenant_id, basic.id]
        );
    }
}

export async function seedStemiCourse() {
    try {
        await ensureBasicCourses();
        // Seed EVERY tenant's default class (multi-tenant installs have one
        // "Basic course" per tenant), each idempotently.
        const cohorts = await dbAdapter.all(
            `SELECT id, tenant_id, owner_user_id FROM cohorts
              WHERE is_default = 1 AND deleted_at IS NULL
              ORDER BY id ASC`
        );
        for (const cohort of cohorts) {
            await seedCohort(cohort);
        }
        await ensureBasicCourseCaseLink();
    } catch (err) {
        // Non-fatal: a seed failure must never stop the server booting.
        log.warn('STEMI course seed failed', { error: err.message });
    }
}

export default seedStemiCourse;
