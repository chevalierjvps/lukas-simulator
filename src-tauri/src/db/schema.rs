use rusqlite::{Connection, Result};
use crate::models::case::{ClinicalCase, CaseConfig, Demographics, Vitals, ClinicalRecords, Medication};
use crate::models::language::LanguageCode;

pub fn initialize_tables(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS cases (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            language TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            patient_name TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            description TEXT NOT NULL,
            chief_complaint TEXT NOT NULL,
            hpi TEXT NOT NULL,
            vitals_json TEXT NOT NULL,
            config_json TEXT NOT NULL,
            records_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            case_id TEXT NOT NULL,
            student_name TEXT NOT NULL,
            language TEXT NOT NULL,
            status TEXT NOT NULL,
            current_room TEXT NOT NULL,
            elapsed_seconds INTEGER NOT NULL,
            score INTEGER,
            vitals_json TEXT NOT NULL,
            treatments_json TEXT NOT NULL,
            exams_json TEXT NOT NULL,
            labs_json TEXT NOT NULL,
            radiology_json TEXT NOT NULL,
            started_at TEXT NOT NULL,
            ended_at TEXT,
            FOREIGN KEY (case_id) REFERENCES cases(id)
        );

        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            sender_name TEXT NOT NULL,
            recipient TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions(id)
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        "
    )?;

    seed_unisud_cases(conn)?;
    Ok(())
}

fn seed_unisud_cases(conn: &Connection) -> Result<()> {
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM cases", [], |row| row.get(0))?;
    if count > 0 {
        return Ok(());
    }

    let default_cases = vec![
        // 1. Lucas Silveira — Dengue com Sinais de Alarme (PT)
        ClinicalCase {
            id: "case-dengue-pt-01".to_string(),
            title: "Dengue com Sinais de Alarme e Extravasamento Plasmático".to_string(),
            language: LanguageCode::Pt,
            difficulty: "intermediate".to_string(),
            patient: Demographics {
                name: "Lucas Silveira".to_string(),
                age: 28,
                gender: "Masculino".to_string(),
                weight_kg: 74.0,
                height_cm: 178.0,
            },
            vitals: Vitals {
                heart_rate: 118,
                blood_pressure_sys: 92,
                blood_pressure_dia: 68,
                spo2: 97,
                respiratory_rate: 22,
                temperature: 38.6,
                ecg_rhythm: "Sinus Tachycardia".to_string(),
            },
            records: ClinicalRecords {
                chief_complaint: "Febre alta há 4 dias que cedeu hoje, mas agora sinto muita dor de barriga, vômitos e tontura ao levantar.".to_string(),
                history_of_present_illness: "Paciente relata início de febre alta súbita, cefaleia retro-orbitária e mialgia intensa há 4 dias. No D4 a febre cedeu, evoluindo com dor abdominal contínua, vômitos persistentes e pré-síncope postural.".to_string(),
                past_medical_history: vec!["Nega comorbidades prévias".to_string()],
                allergies: vec!["Sem alergias conhecidas".to_string()],
                medications: vec![Medication {
                    name: "Dipirona".to_string(),
                    dosage: "500mg VO 6/6h se febre".to_string(),
                    indication: "Febre / Mialgia".to_string(),
                }],
            },
            config: CaseConfig {
                allow_stt: true,
                allow_tts: true,
                vitals_deterioration_rate: 0.8,
                critical_actions: vec![
                    "Hidratação venosa rápida com Soro Fisiológico 0.9% ou Ringer Lactato (10 mL/kg/h)".to_string(),
                    "Solicitar Hemograma urgente com contagem de plaquetas e hematócrito".to_string(),
                    "Palpação abdominal para avaliar hepatomegalia dolorosa".to_string(),
                    "Prescrever antiemético intravenoso (Ondansetrona)".to_string(),
                    "Monitorização hemodinâmica contínua e débito urinário".to_string(),
                ],
            },
        },

        // 2. Carlos Eduardo Mendes — IAM com Supra de ST (PT)
        ClinicalCase {
            id: "case-stemi-pt-02".to_string(),
            title: "Infarto Agudo do Miocárdio com Supradesnivelamento de ST (IAMCSST)".to_string(),
            language: LanguageCode::Pt,
            difficulty: "advanced".to_string(),
            patient: Demographics {
                name: "Carlos Eduardo Mendes".to_string(),
                age: 56,
                gender: "Masculino".to_string(),
                weight_kg: 86.0,
                height_cm: 174.0,
            },
            vitals: Vitals {
                heart_rate: 104,
                blood_pressure_sys: 154,
                blood_pressure_dia: 96,
                spo2: 95,
                respiratory_rate: 20,
                temperature: 36.6,
                ecg_rhythm: "ST Elevation in V1-V4".to_string(),
            },
            records: ClinicalRecords {
                chief_complaint: "Dor no peito em aperto muito forte há 1 hora, espalhando pro braço esquerdo e queixo.".to_string(),
                history_of_present_illness: "Dor precordial retroesternal constritiva de forte intensidade (8/10), iniciada em repouso há 1h, associada a diaforese fria, náuseas e irradiação para membro superior esquerdo e mandíbula.".to_string(),
                past_medical_history: vec!["Hipertensão Arterial Sistêmica".to_string(), "Tabagismo 30 anos-maço".to_string()],
                allergies: vec!["Nega alergias".to_string()],
                medications: vec![Medication {
                    name: "Losartana".to_string(),
                    dosage: "50mg VO 1x/dia".to_string(),
                    indication: "HAS".to_string(),
                }],
            },
            config: CaseConfig {
                allow_stt: true,
                allow_tts: true,
                vitals_deterioration_rate: 1.2,
                critical_actions: vec![
                    "Realizar e interpretar ECG de 12 derivações em menos de 10 minutos".to_string(),
                    "Administrar Ácido Acetilsalicílico (AAS) 300mg mastigável".to_string(),
                    "Administrar dose de ataque de Clopidogrel (300-600mg) ou Ticagrelor (180mg)".to_string(),
                    "Encaminhar imediatamente para Cineangiocoronariografia / Cateterismo de urgência (ICP primária)".to_string(),
                    "Administrar Nitrato sublingual se PA sistólica > 100 mmHg e sem infarto de VD".to_string(),
                ],
            },
        },

        // 3. Juan Carlos Ramos — Cetoacidosis Diabética (ES)
        ClinicalCase {
            id: "case-dka-es-03".to_string(),
            title: "Cetoacidosis Diabética Severa con Respiración de Kussmaul".to_string(),
            language: LanguageCode::Es,
            difficulty: "advanced".to_string(),
            patient: Demographics {
                name: "Juan Carlos Ramos".to_string(),
                age: 22,
                gender: "Masculino".to_string(),
                weight_kg: 68.0,
                height_cm: 176.0,
            },
            vitals: Vitals {
                heart_rate: 126,
                blood_pressure_sys: 88,
                blood_pressure_dia: 54,
                spo2: 98,
                respiratory_rate: 32,
                temperature: 37.1,
                ecg_rhythm: "Sinus Tachycardia with Peaked T Waves".to_string(),
            },
            records: ClinicalRecords {
                chief_complaint: "Mucho dolor de panza, vómitos sin parar y me cuesta respirar hondo desde anoche.".to_string(),
                history_of_present_illness: "Paciente con DM1 diagnosticado hace 3 años. Presenta poliuria, polidipsia y astenia de 3 días de evolución, sumando náuseas, vómitos incoercibles, dolor abdominal difuso y taquipnea profunda de Kussmaul con aliento cetónico.".to_string(),
                past_medical_history: vec!["Diabetes Mellitus Tipo 1".to_string()],
                allergies: vec!["Sin alergias conocidas".to_string()],
                medications: vec![Medication {
                    name: "Insulina Glargina".to_string(),
                    dosage: "24 UI SC noche".to_string(),
                    indication: "DM1 (suspendida hace 2 días)".to_string(),
                }],
            },
            config: CaseConfig {
                allow_stt: true,
                allow_tts: true,
                vitals_deterioration_rate: 1.0,
                critical_actions: vec![
                    "Hidratación endovenosa agresiva con Suero Fisiológico 0.9% (1000 mL en la primera hora)".to_string(),
                    "Solicitar Glucemia capilar, Gasometría Arterial, Ionograma con Potasio sérico y Cetonas".to_string(),
                    "Iniciar infusión continua de Insulina Regular (0.1 UI/kg/h) tras confirmar K > 3.3 mEq/L".to_string(),
                    "Reposición preventiva de Cloruro de Potasio (KCl)".to_string(),
                ],
            },
        },
    ];

    for case in default_cases {
        let vitals_json = serde_json::to_string(&case.vitals).unwrap_or_default();
        let config_json = serde_json::to_string(&case.config).unwrap_or_default();
        let records_json = serde_json::to_string(&case.records).unwrap_or_default();
        let lang_str = case.language.code().to_string();

        conn.execute(
            "INSERT INTO cases (
                id, title, language, difficulty, patient_name, age, gender,
                description, chief_complaint, hpi, vitals_json, config_json, records_json, created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, datetime('now'))",
            (
                &case.id,
                &case.title,
                &lang_str,
                &case.difficulty,
                &case.patient.name,
                case.patient.age,
                &case.patient.gender,
                &case.title,
                &case.records.chief_complaint,
                &case.records.history_of_present_illness,
                &vitals_json,
                &config_json,
                &records_json,
            ),
        )?;
    }

    Ok(())
}
