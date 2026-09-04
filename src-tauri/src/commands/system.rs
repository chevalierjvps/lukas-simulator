use crate::models::{LanguageCode, LanguageInfo};

#[tauri::command]
pub fn get_system_info() -> serde_json::Value {
    serde_json::json!({
        "app_name": "Lukas",
        "version": "1.0.0",
        "institution": "Unisud — Universidad del Sud",
        "engine": "Rust + Tauri v2",
        "supported_locales": ["pt", "es", "en", "it", "de", "fi", "sv"]
    })
}

#[tauri::command]
pub fn get_supported_languages() -> Vec<LanguageInfo> {
    vec![
        LanguageCode::Pt.info(),
        LanguageCode::Es.info(),
        LanguageCode::En.info(),
        LanguageCode::It.info(),
        LanguageCode::De.info(),
        LanguageCode::Fi.info(),
        LanguageCode::Sv.info(),
    ]
}
