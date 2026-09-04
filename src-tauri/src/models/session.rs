use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use super::case::Vitals;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub case_id: String,
    pub student_name: String,
    pub language: String,
    pub status: SessionStatus,
    pub current_room: String,
    pub elapsed_seconds: u32,
    pub vitals: Vitals,
    pub active_treatments: Vec<ActiveTreatment>,
    pub performed_exams: Vec<PerformedExam>,
    pub ordered_labs: Vec<OrderedLab>,
    pub ordered_radiology: Vec<OrderedRadiology>,
    pub score: Option<u32>,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SessionStatus {
    InProgress,
    Paused,
    Completed,
    PatientArrested,
    CaseTerminated,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveTreatment {
    pub id: String,
    pub medication: String,
    pub dose: String,
    pub route: String,
    pub administered_at_second: u32,
    pub peak_effect_second: u32,
    pub duration_seconds: u32,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformedExam {
    pub id: String,
    pub exam_type: String,
    pub region: String,
    pub findings: String,
    pub performed_at_second: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderedLab {
    pub id: String,
    pub test_code: String,
    pub test_name: String,
    pub status: LabStatus,
    pub ordered_at_second: u32,
    pub ready_at_second: u32,
    pub results_json: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum LabStatus {
    Pending,
    Processing,
    Ready,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderedRadiology {
    pub id: String,
    pub modality: String,
    pub body_part: String,
    pub status: LabStatus,
    pub ordered_at_second: u32,
    pub ready_at_second: u32,
    pub report: Option<String>,
    pub image_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSummary {
    pub session_id: String,
    pub case_id: String,
    pub duration_formatted: String,
    pub final_status: SessionStatus,
    pub critical_actions_completed: u32,
    pub total_critical_actions: u32,
    pub score_percentage: u32,
    pub clinical_feedback: Vec<String>,
    pub competency_scores: CompetencyScores,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CompetencyScores {
    pub anamnesis: u32,
    pub physical_exam: u32,
    pub diagnostic_reasoning: u32,
    pub emergency_management: u32,
    pub communication: u32,
}
