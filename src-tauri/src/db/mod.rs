pub mod schema;

use rusqlite::{Connection, Result};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use crate::models::case::{ClinicalCase, CaseConfig, Demographics, Vitals, ClinicalRecords};
use crate::models::language::LanguageCode;
use crate::models::session::Session;
use crate::models::chat::ChatMessage;

pub struct DatabaseManager {
    conn: Mutex<Connection>,
    db_path: PathBuf,
}

impl DatabaseManager {
    /// Open SQLite database at the specified path and run migrations / initial seeds
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self> {
        let db_path = path.as_ref().to_path_buf();
        if let Some(parent) = db_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let conn = Connection::open(&db_path)?;
        schema::initialize_tables(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
            db_path,
        })
    }

    /// Retrieve the database file path
    pub fn get_path(&self) -> &Path {
        &self.db_path
    }

    /// Fetch all clinical cases with optional language filter
    pub fn get_cases(&self, lang_filter: Option<String>) -> Result<Vec<ClinicalCase>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, language, difficulty, patient_name, age, gender,
                    vitals_json, config_json, records_json
             FROM cases ORDER BY rowid ASC"
        )?;

        let case_iter = stmt.query_map([], |row| {
            let id: String = row.get(0)?;
            let title: String = row.get(1)?;
            let lang_str: String = row.get(2)?;
            let difficulty: String = row.get(3)?;
            let patient_name: String = row.get(4)?;
            let age: u32 = row.get(5)?;
            let gender: String = row.get(6)?;
            let vitals_str: String = row.get(7)?;
            let config_str: String = row.get(8)?;
            let records_str: String = row.get(9)?;

            let language = LanguageCode::from_code(&lang_str).unwrap_or(LanguageCode::Pt);
            let vitals: Vitals = serde_json::from_str(&vitals_str).unwrap_or_else(|_| Vitals {
                heart_rate: 80,
                blood_pressure_sys: 120,
                blood_pressure_dia: 80,
                spo2: 98,
                respiratory_rate: 16,
                temperature: 36.5,
                ecg_rhythm: "Normal Sinus Rhythm".to_string(),
            });

            let config: CaseConfig = serde_json::from_str(&config_str).unwrap_or_else(|_| CaseConfig {
                allow_stt: true,
                allow_tts: true,
                vitals_deterioration_rate: 0.5,
                critical_actions: vec![],
            });

            let records: ClinicalRecords = serde_json::from_str(&records_str).unwrap_or_else(|_| ClinicalRecords {
                chief_complaint: "".to_string(),
                history_of_present_illness: "".to_string(),
                past_medical_history: vec![],
                allergies: vec![],
                medications: vec![],
            });

            Ok(ClinicalCase {
                id,
                title,
                language,
                difficulty,
                patient: Demographics {
                    name: patient_name,
                    age,
                    gender,
                    weight_kg: 70.0,
                    height_cm: 170.0,
                },
                vitals,
                records,
                config,
            })
        })?;

        let mut cases = Vec::new();
        for case in case_iter {
            let c = case?;
            if let Some(ref l) = lang_filter {
                if c.language.code() != l {
                    continue;
                }
            }
            cases.push(c);
        }

        Ok(cases)
    }

    /// Retrieve a clinical case by its unique ID
    pub fn get_case_by_id(&self, id: &str) -> Result<Option<ClinicalCase>> {
        let cases = self.get_cases(None)?;
        Ok(cases.into_iter().find(|c| c.id == id))
    }

    /// Save or update a session
    pub fn save_session(&self, session: &Session) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let vitals_json = serde_json::to_string(&session.vitals).unwrap_or_default();
        let treatments_json = serde_json::to_string(&session.active_treatments).unwrap_or_default();
        let exams_json = serde_json::to_string(&session.performed_exams).unwrap_or_default();
        let labs_json = serde_json::to_string(&session.ordered_labs).unwrap_or_default();
        let rad_json = serde_json::to_string(&session.ordered_radiology).unwrap_or_default();
        let status_str = serde_json::to_string(&session.status).unwrap_or_default().trim_matches('"').to_string();
        let started_at_str = session.started_at.to_rfc3339();
        let ended_at_str = session.ended_at.map(|t| t.to_rfc3339());

        conn.execute(
            "INSERT OR REPLACE INTO sessions (
                id, case_id, student_name, language, status, current_room,
                elapsed_seconds, score, vitals_json, treatments_json, exams_json,
                labs_json, radiology_json, started_at, ended_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            (
                &session.id,
                &session.case_id,
                &session.student_name,
                &session.language,
                &status_str,
                &session.current_room,
                session.elapsed_seconds,
                session.score,
                &vitals_json,
                &treatments_json,
                &exams_json,
                &labs_json,
                &rad_json,
                &started_at_str,
                &ended_at_str,
            ),
        )?;

        Ok(())
    }

    /// Save a chat message to history
    pub fn save_message(&self, msg: &ChatMessage) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let role_str = serde_json::to_string(&msg.role).unwrap_or_default().trim_matches('"').to_string();
        let ts_str = msg.timestamp.to_rfc3339();

        conn.execute(
            "INSERT INTO messages (id, session_id, role, sender_name, recipient, content, timestamp)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            (
                &msg.id,
                &msg.session_id,
                &role_str,
                &msg.sender_name,
                &msg.recipient,
                &msg.content,
                &ts_str,
            ),
        )?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sqlite_in_memory_initialization_and_seeding() {
        let temp_dir = tempfile::tempdir().unwrap();
        let db_path = temp_dir.path().join("test_osiris.db");
        let db = DatabaseManager::new(&db_path).expect("Failed to create test DB");

        // Verify default bilingual cases are seeded
        let cases = db.get_cases(None).expect("Failed to query cases");
        assert!(cases.len() >= 3);

        // Check Portuguese case
        let pt_cases = db.get_cases(Some("pt".to_string())).unwrap();
        assert!(pt_cases.iter().any(|c| c.id == "case-dengue-pt-01"));
        assert!(pt_cases.iter().any(|c| c.id == "case-stemi-pt-02"));

        // Check Spanish case
        let es_cases = db.get_cases(Some("es".to_string())).unwrap();
        assert!(es_cases.iter().any(|c| c.id == "case-dka-es-03"));
    }
}
