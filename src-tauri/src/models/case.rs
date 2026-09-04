use serde::{Deserialize, Serialize};
use super::language::LanguageCode;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vitals {
    pub heart_rate: u32,
    pub spo2: u32,
    pub respiratory_rate: u32,
    pub blood_pressure_sys: u32,
    pub blood_pressure_dia: u32,
    pub temperature: f32,
    pub ecg_rhythm: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Demographics {
    pub name: String,
    pub age: u32,
    pub gender: String,
    pub weight_kg: f32,
    pub height_cm: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Medication {
    pub name: String,
    pub dosage: String,
    pub indication: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClinicalRecords {
    pub chief_complaint: String,
    pub history_of_present_illness: String,
    pub past_medical_history: Vec<String>,
    pub allergies: Vec<String>,
    pub medications: Vec<Medication>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaseConfig {
    pub allow_stt: bool,
    pub allow_tts: bool,
    pub vitals_deterioration_rate: f32,
    pub critical_actions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClinicalCase {
    pub id: String,
    pub title: String,
    pub language: LanguageCode,
    pub difficulty: String,
    pub patient: Demographics,
    pub vitals: Vitals,
    pub records: ClinicalRecords,
    pub config: CaseConfig,
}
