pub mod models;
pub mod commands;
pub mod db;
pub mod engine;
pub mod ai;

use std::sync::{Arc, Mutex};
use tauri::Manager;
use db::DatabaseManager;
use ai::provider::{LlmConfig, LlmProvider};
use models::case::ClinicalCase;
use models::session::Session;

pub struct AppState {
    pub db: Arc<DatabaseManager>,
    pub ai_provider: Arc<LlmProvider>,
    pub active_session: Mutex<Option<(Session, ClinicalCase)>>,
    pub patient_pain: Mutex<f32>,
    pub patient_anxiety: Mutex<f32>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Auto-update: checks the GitHub Releases "latest" pointer (see
        // tauri.conf.json's plugins.updater.endpoints) and, when the app
        // relaunches after an install, tauri_plugin_process gives the
        // frontend `relaunch()` to restart into the new version cleanly.
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("./data"));
            let db_path = app_data_dir.join("osiris.db");
            
            let db = DatabaseManager::new(&db_path).expect("Falha ao inicializar banco de dados SQLite local");
            let ai_provider = LlmProvider::new(LlmConfig::default());

            app.manage(AppState {
                db: Arc::new(db),
                ai_provider: Arc::new(ai_provider),
                active_session: Mutex::new(None),
                patient_pain: Mutex::new(7.0),
                patient_anxiety: Mutex::new(8.0),
            });

            // WebKitGTK has no built-in permission-prompt UI (unlike Chrome/
            // Firefox) — with nothing connected to the `permission-request`
            // signal it silently DENIES every getUserMedia() call, so the
            // mic/STT feature (src/services/voiceService.js) reports "no
            // microphone" even on a machine with a real one. This is our own
            // bundled frontend, not third-party content, so auto-granting
            // media requests here is the desktop-app equivalent of Electron
            // apps auto-allowing getUserMedia for their own origin.
            #[cfg(target_os = "linux")]
            {
                if let Some(main_webview) = app.get_webview_window("main") {
                    let _ = main_webview.with_webview(|webview| {
                        use glib::Cast;
                        use webkit2gtk::{PermissionRequestExt, WebViewExt};
                        webview.inner().connect_permission_request(|_wv, request| {
                            if request
                                .downcast_ref::<webkit2gtk::UserMediaPermissionRequest>()
                                .is_some()
                            {
                                request.allow();
                                true
                            } else {
                                false
                            }
                        });
                    });
                }
            }

            log::info!("Lukas 1.0 desktop engine initialized successfully at {:?}", db_path);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_system_info,
            commands::get_supported_languages,
            commands::get_clinical_cases,
            commands::get_case_details,
            commands::export_case_json,
            commands::start_simulation_session,
            commands::tick_simulation_step,
            commands::apply_treatment_command,
            commands::perform_exam_command,
            commands::order_lab_command,
            commands::order_radiology_command,
            commands::conclude_simulation_session,
            commands::get_patient_neuro_affect,
            commands::update_patient_pain_affect,
            commands::send_chat_message,
        ])
        .run(tauri::generate_context!())
        .expect("Erro ao executar aplicativo Lukas Tauri");
}
