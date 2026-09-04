use crate::models::case::ClinicalCase;
use crate::models::session::{ActiveTreatment, LabStatus, OrderedLab, OrderedRadiology, PerformedExam, Session, SessionStatus, SessionSummary, CompetencyScores};
use super::vitals::VitalsEngine;
use chrono::Utc;
use uuid::Uuid;

pub struct SimulationEngine;

impl SimulationEngine {
    /// Initialize a new simulation session for a given clinical case
    pub fn create_session(case: &ClinicalCase, student_name: String, language: String) -> Session {
        Session {
            id: Uuid::new_v4().to_string(),
            case_id: case.id.clone(),
            student_name,
            language,
            status: SessionStatus::InProgress,
            current_room: "patient".to_string(),
            elapsed_seconds: 0,
            vitals: case.vitals.clone(),
            active_treatments: Vec::new(),
            performed_exams: Vec::new(),
            ordered_labs: Vec::new(),
            ordered_radiology: Vec::new(),
            score: None,
            started_at: Utc::now(),
            ended_at: None,
        }
    }

    /// Advance simulation clock by `delta_seconds` and compute updated vitals, labs, and events
    pub fn tick(session: &mut Session, case: &ClinicalCase, delta_seconds: u32) {
        if session.status != SessionStatus::InProgress {
            return;
        }

        session.elapsed_seconds += delta_seconds;

        // 1. Compute dynamic vitals
        let deterioration_rate = case.config.vitals_deterioration_rate;
        session.vitals = VitalsEngine::compute_vitals_tick(
            &case.vitals,
            &session.vitals,
            &session.active_treatments,
            session.elapsed_seconds,
            deterioration_rate,
        );

        // 2. Check for cardiac arrest or critical decompensation
        if session.vitals.heart_rate < 30 || session.vitals.blood_pressure_sys < 45 || session.vitals.spo2 < 55 {
            session.status = SessionStatus::PatientArrested;
            session.vitals.ecg_rhythm = "Ventricular Fibrillation".to_string();
        }

        // 3. Update pending laboratory test statuses
        for lab in session.ordered_labs.iter_mut() {
            if lab.status == LabStatus::Pending && session.elapsed_seconds >= lab.ready_at_second {
                lab.status = LabStatus::Ready;
            }
        }

        // 4. Update pending radiology statuses
        for rad in session.ordered_radiology.iter_mut() {
            if rad.status == LabStatus::Pending && session.elapsed_seconds >= rad.ready_at_second {
                rad.status = LabStatus::Ready;
            }
        }
    }

    /// Administer a medication or clinical intervention
    pub fn apply_treatment(
        session: &mut Session,
        medication: String,
        dose: String,
        route: String,
        peak_seconds: u32,
        duration_seconds: u32,
    ) -> ActiveTreatment {
        let treatment = ActiveTreatment {
            id: Uuid::new_v4().to_string(),
            medication,
            dose,
            route,
            administered_at_second: session.elapsed_seconds,
            peak_effect_second: peak_seconds,
            duration_seconds,
            is_active: true,
        };

        session.active_treatments.push(treatment.clone());
        treatment
    }

    /// Record a physical examination findings
    pub fn perform_exam(
        session: &mut Session,
        exam_type: String,
        region: String,
        findings: String,
    ) -> PerformedExam {
        let exam = PerformedExam {
            id: Uuid::new_v4().to_string(),
            exam_type,
            region,
            findings,
            performed_at_second: session.elapsed_seconds,
        };

        session.performed_exams.push(exam.clone());
        exam
    }

    /// Order a laboratory test panel
    pub fn order_lab(
        session: &mut Session,
        test_code: String,
        test_name: String,
        turnaround_seconds: u32,
        results_json: Option<String>,
    ) -> OrderedLab {
        let lab = OrderedLab {
            id: Uuid::new_v4().to_string(),
            test_code,
            test_name,
            status: LabStatus::Pending,
            ordered_at_second: session.elapsed_seconds,
            ready_at_second: session.elapsed_seconds + turnaround_seconds,
            results_json,
        };

        session.ordered_labs.push(lab.clone());
        lab
    }

    /// Order an imaging study
    pub fn order_radiology(
        session: &mut Session,
        modality: String,
        body_part: String,
        turnaround_seconds: u32,
        report: Option<String>,
        image_url: Option<String>,
    ) -> OrderedRadiology {
        let rad = OrderedRadiology {
            id: Uuid::new_v4().to_string(),
            modality,
            body_part,
            status: LabStatus::Pending,
            ordered_at_second: session.elapsed_seconds,
            ready_at_second: session.elapsed_seconds + turnaround_seconds,
            report,
            image_url,
        };

        session.ordered_radiology.push(rad.clone());
        rad
    }

    /// Conclude session and calculate student debrief and performance score
    pub fn finalize_session(session: &mut Session, case: &ClinicalCase) -> SessionSummary {
        session.status = SessionStatus::Completed;
        session.ended_at = Some(Utc::now());

        let total_actions = case.config.critical_actions.len() as u32;
        let mut completed_actions = 0;
        let mut feedback = Vec::new();

        // Evaluate performed actions against case critical actions
        for action in &case.config.critical_actions {
            let action_lower = action.to_lowercase();
            let mut matched = false;

            // Check treatments
            for tx in &session.active_treatments {
                if action_lower.contains(&tx.medication.to_lowercase()) {
                    matched = true;
                    break;
                }
            }

            // Check exams
            if !matched {
                for exam in &session.performed_exams {
                    if action_lower.contains(&exam.region.to_lowercase()) || action_lower.contains(&exam.exam_type.to_lowercase()) {
                        matched = true;
                        break;
                    }
                }
            }

            // Check labs
            if !matched {
                for lab in &session.ordered_labs {
                    if action_lower.contains(&lab.test_code.to_lowercase()) || action_lower.contains(&lab.test_name.to_lowercase()) {
                        matched = true;
                        break;
                    }
                }
            }

            if matched {
                completed_actions += 1;
                feedback.push(format!("✓ Executado com sucesso: {}", action));
            } else {
                feedback.push(format!("✗ Ação recomendada omitida: {}", action));
            }
        }

        let score_pct = if total_actions > 0 {
            (completed_actions * 100) / total_actions
        } else {
            85
        };

        session.score = Some(score_pct);

        let mins = session.elapsed_seconds / 60;
        let secs = session.elapsed_seconds % 60;
        let duration_formatted = format!("{:02}:{:02}", mins, secs);

        SessionSummary {
            session_id: session.id.clone(),
            case_id: session.case_id.clone(),
            duration_formatted,
            final_status: session.status.clone(),
            critical_actions_completed: completed_actions,
            total_critical_actions: total_actions,
            score_percentage: score_pct,
            clinical_feedback: feedback,
            competency_scores: CompetencyScores {
                anamnesis: 88,
                physical_exam: if !session.performed_exams.is_empty() { 90 } else { 40 },
                diagnostic_reasoning: score_pct,
                emergency_management: if !session.active_treatments.is_empty() { 92 } else { 50 },
                communication: 85,
            },
        }
    }
}
