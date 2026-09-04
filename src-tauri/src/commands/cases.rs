use tauri::State;
use crate::models::case::ClinicalCase;
use crate::AppState;

#[tauri::command]
pub fn get_clinical_cases(
    language: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<ClinicalCase>, String> {
    state.db.get_cases(language).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_case_details(
    case_id: String,
    state: State<'_, AppState>,
) -> Result<Option<ClinicalCase>, String> {
    state.db.get_case_by_id(&case_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_case_json(
    case_id: String,
    export_path: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let case = state.db.get_case_by_id(&case_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Caso clínico não encontrado".to_string())?;

    let json = serde_json::to_string_pretty(&case).map_err(|e| e.to_string())?;
    std::fs::write(&export_path, json).map_err(|e| e.to_string())?;

    Ok(true)
}
