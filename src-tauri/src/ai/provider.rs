use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmConfig {
    pub endpoint_url: String,
    pub model_name: String,
    pub api_key: Option<String>,
    pub temperature: f32,
}

impl Default for LlmConfig {
    fn default() -> Self {
        Self {
            endpoint_url: "http://localhost:11434".to_string(), // Default Ollama local endpoint
            model_name: "llama3.2".to_string(),
            api_key: None,
            temperature: 0.7,
        }
    }
}

pub struct LlmProvider {
    client: Client,
    config: LlmConfig,
}

impl LlmProvider {
    pub fn new(config: LlmConfig) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .unwrap_or_default();

        Self { client, config }
    }

    /// Generate assistant completion from system prompt and user input
    pub async fn generate_reply(&self, system_prompt: &str, user_message: &str) -> Result<String, String> {
        let is_ollama = self.config.endpoint_url.contains(":11434");

        if is_ollama {
            self.call_ollama(system_prompt, user_message).await
        } else {
            self.call_openai_compatible(system_prompt, user_message).await
        }
    }

    async fn call_ollama(&self, system_prompt: &str, user_message: &str) -> Result<String, String> {
        let url = format!("{}/api/generate", self.config.endpoint_url.trim_end_matches('/'));
        let body = serde_json::json!({
            "model": self.config.model_name,
            "system": system_prompt,
            "prompt": user_message,
            "stream": false,
            "options": {
                "temperature": self.config.temperature
            }
        });

        let response = self.client.post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Falha de conexão com Ollama local: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Erro retornado pelo Ollama (status {})", response.status()));
        }

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Falha ao ler resposta do Ollama: {}", e))?;

        let reply = json.get("response")
            .and_then(|v| v.as_str())
            .unwrap_or("Não foi possível gerar resposta.")
            .to_string();

        Ok(reply)
    }

    async fn call_openai_compatible(&self, system_prompt: &str, user_message: &str) -> Result<String, String> {
        let url = format!("{}/v1/chat/completions", self.config.endpoint_url.trim_end_matches('/'));
        let mut req = self.client.post(&url);

        if let Some(ref key) = self.config.api_key {
            req = req.bearer_auth(key);
        }

        let body = serde_json::json!({
            "model": self.config.model_name,
            "messages": [
                { "role": "system", "content": system_prompt },
                { "role": "user", "content": user_message }
            ],
            "temperature": self.config.temperature
        });

        let response = req.json(&body).send().await
            .map_err(|e| format!("Falha de conexão com endpoint de IA: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Erro no endpoint de IA (status {})", response.status()));
        }

        let json: serde_json::Value = response.json().await
            .map_err(|e| format!("Falha ao ler JSON da IA: {}", e))?;

        let reply = json.get("choices")
            .and_then(|c| c.get(0))
            .and_then(|c0| c0.get("message"))
            .and_then(|m| m.get("content"))
            .and_then(|c| c.as_str())
            .unwrap_or("...")
            .to_string();

        Ok(reply)
    }
}
