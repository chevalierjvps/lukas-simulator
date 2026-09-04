/**
 * Google Cloud Speech-to-Text v1
 * Transcribes audio streams / buffers in real-time
 */

import { fetchWithTimeout } from './fetchWithTimeout.js';

const GOOGLE_STT_URL = 'https://speech.googleapis.com/v1/speech:recognize';

export async function transcribeGoogleAudio({ audioBase64, language = 'pt-BR', encoding = 'WEBM_OPUS', sampleRate = 48000, apiKey }) {
    const key = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_API_KEY || apiKey;
    if (!key) {
        throw new Error('Google Speech-to-Text requires an API key.');
    }

    const payload = {
        config: {
            encoding,
            sampleRateHertz: sampleRate,
            languageCode: language,
            enableAutomaticPunctuation: true,
            model: 'default'
        },
        audio: {
            content: audioBase64
        }
    };

    const res = await fetchWithTimeout(`${GOOGLE_STT_URL}?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeoutMs: 15000
    });

    if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Google STT failed (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const transcript = (data.results || [])
        .map(r => r.alternatives?.[0]?.transcript || '')
        .join(' ')
        .trim();

    return {
        transcript,
        confidence: data.results?.[0]?.alternatives?.[0]?.confidence ?? 1.0,
        raw: data
    };
}
