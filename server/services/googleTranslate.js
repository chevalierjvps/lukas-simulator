/**
 * Google Cloud Translation v2
 * Translates medical texts between Portuguese, Spanish, and English
 */

import { fetchWithTimeout } from './fetchWithTimeout.js';

const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

export async function translateGoogleText({ text, targetLanguage = 'pt', sourceLanguage = null, apiKey }) {
    const key = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_API_KEY || apiKey;
    if (!key) {
        throw new Error('Google Translation requires an API key.');
    }

    const payload = {
        q: text,
        target: targetLanguage,
        format: 'text'
    };
    if (sourceLanguage) payload.source = sourceLanguage;

    const res = await fetchWithTimeout(`${GOOGLE_TRANSLATE_URL}?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeoutMs: 10000
    });

    if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(`Google Translate failed (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const translatedText = data.data?.translations?.[0]?.translatedText || text;

    return {
        translatedText,
        detectedSourceLanguage: data.data?.translations?.[0]?.detectedSourceLanguage || sourceLanguage,
        raw: data
    };
}
