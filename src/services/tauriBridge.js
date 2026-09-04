/**
 * Lukas 1.0 — Tauri v2 Native Bridge with Transparent Web Fallback
 * 
 * Provides unified API access for both Desktop (Tauri + Rust + SQLite)
 * and Web Browser (Express REST API) modes.
 */

let invoke = null;

async function initTauriApi() {
    if (typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__)) {
        try {
            const tauriCore = await import('@tauri-apps/api/core');
            invoke = tauriCore.invoke;
            return true;
        } catch (e) {
            console.warn('[Lukas Tauri] Running in hybrid mode without Tauri bindings:', e);
            return false;
        }
    }
    return false;
}

export const isTauri = () => typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);

export const tauriBridge = {
    /**
     * Get platform & engine diagnostic information
     */
    async getSystemInfo() {
        if (await initTauriApi() && invoke) {
            return invoke('get_system_info');
        }
        return {
            app_name: 'Lukas',
            version: '1.0.0',
            creator: 'Jvps',
            engine: 'Web Mode (Express REST API)',
            supported_locales: ['pt', 'es', 'en', 'it', 'de', 'fi', 'sv'],
        };
    },

    /**
     * Fetch supported multilingual configurations
     */
    async getSupportedLanguages() {
        if (await initTauriApi() && invoke) {
            return invoke('get_supported_languages');
        }
        return [
            { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷', stt: 'pt-BR' },
            { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', stt: 'es-ES' },
            { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', stt: 'en-US' },
        ];
    },

    /**
     * Fetch cases from local SQLite database or remote API
     */
    async getCases(language = null) {
        if (await initTauriApi() && invoke) {
            return invoke('get_clinical_cases', { language });
        }
        // Web fallback
        const res = await fetch(`/api/cases${language ? `?language=${language}` : ''}`);
        if (!res.ok) throw new Error('Falha ao carregar casos clínicos');
        return res.json();
    },

    /**
     * Initialize a new patient simulation session
     */
    async startSession(caseId, studentName = 'Estudante de Medicina', language = 'pt') {
        if (await initTauriApi() && invoke) {
            return invoke('start_simulation_session', {
                caseId,
                studentName,
                language,
            });
        }
        const res = await fetch('/api/simulation/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caseId, studentName, language }),
        });
        if (!res.ok) throw new Error('Falha ao iniciar sessão clínica');
        return res.json();
    },

    /**
     * Advance simulation clock and recalculate physiological vitals in Rust
     */
    async tickSimulation(deltaSeconds = 1) {
        if (await initTauriApi() && invoke) {
            return invoke('tick_simulation_step', { deltaSeconds });
        }
        return null;
    },

    /**
     * Administer a medication or intervention
     */
    async applyTreatment(medication, dose = '1 dose', route = 'IV', peakSeconds = 60, durationSeconds = 600) {
        if (await initTauriApi() && invoke) {
            return invoke('apply_treatment_command', {
                medication,
                dose,
                route,
                peakSeconds,
                durationSeconds,
            });
        }
        const res = await fetch('/api/simulation/treatment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ medication, dose, route }),
        });
        return res.json();
    },

    /**
     * Send dialogue message to patient or multidisciplinary team
     */
    async sendMessage(recipient, message) {
        if (await initTauriApi() && invoke) {
            return invoke('send_chat_message', { recipient, message });
        }
        const res = await fetch('/api/simulation/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient, message }),
        });
        return res.json();
    },

    /**
     * Conclude simulation and receive debrief performance summary
     */
    async concludeSession() {
        if (await initTauriApi() && invoke) {
            return invoke('conclude_simulation_session');
        }
        const res = await fetch('/api/simulation/end', { method: 'POST' });
        return res.json();
    },
};
