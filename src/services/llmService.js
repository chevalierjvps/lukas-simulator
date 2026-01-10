/**
 * Service to handle LLM communication and Backend persistence.
 */

// Default Configuration - LM Studio is the default
const DEFAULT_CONFIG = {
    provider: 'lmstudio',
    baseUrl: 'http://localhost:1234/v1',
    apiKey: '',
    model: 'local-model'
};

const BACKEND_URL = '/api';

// Load saved config from localStorage on module init
const loadSavedConfig = () => {
    try {
        const saved = localStorage.getItem('rohy_llm_defaults');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.provider) {
                return { ...DEFAULT_CONFIG, ...parsed };
            }
        }
    } catch (e) {
        console.warn('Failed to load saved LLM config:', e);
    }
    return { ...DEFAULT_CONFIG };
};

export const LLMService = {

    config: loadSavedConfig(),

    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('[LLMService] Config updated:', this.config);
    },

    /**
     * Get authentication headers
     */
    getAuthHeaders() {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    /**
     * Start a new Session for a Case
     */
    async startSession(caseId, studentName = 'Student', monitorSettings = {}) {
        try {
            const res = await fetch(`${BACKEND_URL}/sessions`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ 
                    case_id: caseId, 
                    student_name: studentName,
                    llm_settings: {
                        provider: this.config.provider,
                        model: this.config.model,
                        baseUrl: this.config.baseUrl
                    },
                    monitor_settings: monitorSettings
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to start session');
            }
            return data.id; // Session ID
        } catch (err) {
            console.error('Failed to start session', err);
            return null;
        }
    },

    /**
     * End a session
     */
    async endSession(sessionId) {
        try {
            const res = await fetch(`${BACKEND_URL}/sessions/${sessionId}/end`, {
                method: 'PUT',
                headers: this.getAuthHeaders()
            });
            if (!res.ok) {
                throw new Error('Failed to end session');
            }
            return await res.json();
        } catch (err) {
            console.error('Failed to end session', err);
            return null;
        }
    },

    /**
     * Send Message to LLM and Log to Backend
     */
    async sendMessage(sessionId, messages, systemPrompt) {
        console.log('[LLMService] Sending message with config:', {
            provider: this.config.provider,
            baseUrl: this.config.baseUrl,
            model: this.config.model
        });

        // 1. Log User Message
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'user') {
            await this.logInteraction(sessionId, 'user', lastMsg.content);
        }

        // 2. Prepare Payload for LLM
        // If we want the system prompt to be dynamic based on the case, we inject it here.
        const conversation = [
            { role: 'system', content: systemPrompt || 'You are a patient.' },
            ...messages
        ];

        try {
            // 3. Call LLM (Via Backend Proxy to avoid CORS)
            const headers = { 'Content-Type': 'application/json' };
            const isLocal = this.config.provider === 'lmstudio' || this.config.provider === 'ollama';

            if (!isLocal || (this.config.apiKey && this.config.apiKey.trim() !== '')) {
                headers['Authorization'] = `Bearer ${this.config.apiKey}`;
            }

            // Route request through our Node.js server to bypass browser CORS restrictions
            const response = await fetch(`${BACKEND_URL}/proxy/llm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUrl: `${this.config.baseUrl}/chat/completions`,
                    headers: headers,
                    body: {
                        model: this.config.model || 'local-model',
                        messages: conversation,
                        stream: false
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`LLM API Error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            const aiContent = data.choices?.[0]?.message?.content || '...';

            // 4. Log Assistant Response
            await this.logInteraction(sessionId, 'assistant', aiContent);

            return aiContent;

        } catch (err) {
            console.error('LLM Error', err);
            return "Error: Could not connect to AI patient. Please check settings.";
        }
    },

    async logInteraction(sessionId, role, content) {
        if (!sessionId) return;
        try {
            await fetch(`${BACKEND_URL}/interactions`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ session_id: sessionId, role, content })
            });
        } catch (e) {
            console.error('Logging failed', e);
        }
    }
};
