use tauri::State;
use crate::models::chat::{ChatMessage, ChatResponse, ChatRole};
use crate::ai::prompt::PromptBuilder;
use crate::AppState;
use chrono::Utc;
use uuid::Uuid;

#[tauri::command]
pub async fn send_chat_message(
    recipient: String,
    message: String,
    state: State<'_, AppState>,
) -> Result<ChatResponse, String> {
    let (session_id, system_prompt, patient_name) = {
        let active = state.active_session.lock().unwrap();
        if let Some((ref session, ref case)) = *active {
            let prompt = match recipient.as_str() {
                "nurse" => PromptBuilder::build_nurse_prompt(case),
                _ => PromptBuilder::build_patient_prompt(case),
            };
            (session.id.clone(), prompt, case.patient.name.clone())
        } else {
            return Err("Nenhuma sessão de simulação ativa".to_string());
        }
    };

    // 1. Record user message
    let user_msg = ChatMessage {
        id: Uuid::new_v4().to_string(),
        session_id: session_id.clone(),
        role: ChatRole::User,
        sender_name: "Estudante Unisud".to_string(),
        recipient: recipient.clone(),
        content: message.clone(),
        timestamp: Utc::now(),
    };
    let _ = state.db.save_message(&user_msg);

    // 2. Generate response via LLM provider
    let reply_text = state.ai_provider
        .generate_reply(&system_prompt, &message)
        .await
        .unwrap_or_else(|e| {
            format!("(Voz ofegante): Sinto muita dor e fraqueza... [IA Local Offline: {}]", e)
        });

    let assistant_msg = ChatMessage {
        id: Uuid::new_v4().to_string(),
        session_id,
        role: if recipient == "nurse" { ChatRole::Nurse } else { ChatRole::Patient },
        sender_name: if recipient == "nurse" { "Enf. Mariana".to_string() } else { patient_name },
        recipient: "user".to_string(),
        content: reply_text.clone(),
        timestamp: Utc::now(),
    };
    let _ = state.db.save_message(&assistant_msg);

    Ok(ChatResponse {
        message_id: assistant_msg.id,
        reply: reply_text,
        emotional_state: Some("anxious".to_string()),
        suggested_actions: vec![],
    })
}
