use tauri::State;
use crate::models::session::{ActiveTreatment, OrderedLab, OrderedRadiology, PerformedExam, Session, SessionSummary};
use crate::engine::simulation::SimulationEngine;
use crate::AppState;

#[tauri::command]
pub fn start_simulation_session(
    case_id: String,
    student_name: String,
    language: String,
    state: State<'_, AppState>,
) -> Result<Session, String> {
    let case = state.db.get_case_by_id(&case_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Caso clínico não encontrado".to_string())?;

    let session = SimulationEngine::create_session(&case, student_name, language);
    state.db.save_session(&session).map_err(|e| e.to_string())?;

    let mut active = state.active_session.lock().unwrap();
    *active = Some((session.clone(), case));

    Ok(session)
}

#[tauri::command]
pub fn tick_simulation_step(
    delta_seconds: u32,
    state: State<'_, AppState>,
) -> Result<Option<Session>, String> {
    let mut active = state.active_session.lock().unwrap();
    if let Some((ref mut session, ref case)) = *active {
        SimulationEngine::tick(session, case, delta_seconds);
        let _ = state.db.save_session(session);
        Ok(Some(session.clone()))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn apply_treatment_command(
    medication: String,
    dose: String,
    route: String,
    peak_seconds: Option<u32>,
    duration_seconds: Option<u32>,
    state: State<'_, AppState>,
) -> Result<ActiveTreatment, String> {
    let mut active = state.active_session.lock().unwrap();
    if let Some((ref mut session, _)) = *active {
        let peak = peak_seconds.unwrap_or(60);
        let duration = duration_seconds.unwrap_or(600);
        let tx = SimulationEngine::apply_treatment(session, medication, dose, route, peak, duration);
        let _ = state.db.save_session(session);
        Ok(tx)
    } else {
        Err("Nenhuma sessão de simulação ativa".to_string())
    }
}

#[tauri::command]
pub fn perform_exam_command(
    exam_type: String,
    region: String,
    findings: String,
    state: State<'_, AppState>,
) -> Result<PerformedExam, String> {
    let mut active = state.active_session.lock().unwrap();
    if let Some((ref mut session, _)) = *active {
        let exam = SimulationEngine::perform_exam(session, exam_type, region, findings);
        let _ = state.db.save_session(session);
        Ok(exam)
    } else {
        Err("Nenhuma sessão de simulação ativa".to_string())
    }
}

#[tauri::command]
pub fn order_lab_command(
    test_code: String,
    test_name: String,
    turnaround_seconds: Option<u32>,
    results_json: Option<String>,
    state: State<'_, AppState>,
) -> Result<OrderedLab, String> {
    let mut active = state.active_session.lock().unwrap();
    if let Some((ref mut session, _)) = *active {
        let turnaround = turnaround_seconds.unwrap_or(120);
        let lab = SimulationEngine::order_lab(session, test_code, test_name, turnaround, results_json);
        let _ = state.db.save_session(session);
        Ok(lab)
    } else {
        Err("Nenhuma sessão de simulação ativa".to_string())
    }
}

#[tauri::command]
pub fn order_radiology_command(
    modality: String,
    body_part: String,
    turnaround_seconds: Option<u32>,
    report: Option<String>,
    image_url: Option<String>,
    state: State<'_, AppState>,
) -> Result<OrderedRadiology, String> {
    let mut active = state.active_session.lock().unwrap();
    if let Some((ref mut session, _)) = *active {
        let turnaround = turnaround_seconds.unwrap_or(180);
        let rad = SimulationEngine::order_radiology(session, modality, body_part, turnaround, report, image_url);
        let _ = state.db.save_session(session);
        Ok(rad)
    } else {
        Err("Nenhuma sessão de simulação ativa".to_string())
    }
}

#[tauri::command]
pub fn conclude_simulation_session(
    state: State<'_, AppState>,
) -> Result<SessionSummary, String> {
    let mut active = state.active_session.lock().unwrap();
    if let Some((ref mut session, ref case)) = *active {
        let summary = SimulationEngine::finalize_session(session, case);
        let _ = state.db.save_session(session);
        Ok(summary)
    } else {
        Err("Nenhuma sessão de simulação ativa".to_string())
    }
}

#[tauri::command]
pub fn get_patient_neuro_affect(
    state: State<'_, AppState>,
) -> Result<crate::models::neuro_affect::NeuroAffectState, String> {
    let active = state.active_session.lock().unwrap();
    let pain = *state.patient_pain.lock().unwrap();
    let anxiety = *state.patient_anxiety.lock().unwrap();

    if let Some((ref session, _)) = *active {
        let neuro = crate::engine::neuro_autonomic::NeuroAutonomicEngine::compute_neuro_state(
            &session.vitals,
            &session.active_treatments,
            pain,
            anxiety,
        );
        Ok(neuro)
    } else {
        let dummy_vitals = crate::models::case::Vitals {
            heart_rate: 80,
            spo2: 98,
            respiratory_rate: 16,
            blood_pressure_sys: 120,
            blood_pressure_dia: 80,
            temperature: 36.8,
            ecg_rhythm: "Sinus Rhythm".to_string(),
        };
        let neuro = crate::engine::neuro_autonomic::NeuroAutonomicEngine::compute_neuro_state(
            &dummy_vitals,
            &[],
            0.0,
            0.0,
        );
        Ok(neuro)
    }
}

#[tauri::command]
pub fn update_patient_pain_affect(
    pain_delta: Option<f32>,
    anxiety_delta: Option<f32>,
    set_pain: Option<f32>,
    set_anxiety: Option<f32>,
    state: State<'_, AppState>,
) -> Result<crate::models::neuro_affect::NeuroAffectState, String> {
    {
        let mut p = state.patient_pain.lock().unwrap();
        if let Some(val) = set_pain {
            *p = val.clamp(0.0, 10.0);
        } else if let Some(delta) = pain_delta {
            *p = (*p + delta).clamp(0.0, 10.0);
        }

        let mut a = state.patient_anxiety.lock().unwrap();
        if let Some(val) = set_anxiety {
            *a = val.clamp(0.0, 10.0);
        } else if let Some(delta) = anxiety_delta {
            *a = (*a + delta).clamp(0.0, 10.0);
        }
    }

    get_patient_neuro_affect(state)
}

