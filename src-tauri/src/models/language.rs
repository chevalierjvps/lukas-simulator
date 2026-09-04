use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LanguageCode {
    En,
    Pt,
    Es,
    It,
    De,
    Fi,
    Sv,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanguageInfo {
    pub code: LanguageCode,
    pub name: &'static str,
    pub native: &'static str,
    pub flag: &'static str,
    pub stt: &'static str,
    pub stt_label: &'static str,
    pub llm_directive: &'static str,
    pub dir: &'static str,
}

impl LanguageCode {
    pub fn info(&self) -> LanguageInfo {
        match self {
            LanguageCode::En => LanguageInfo {
                code: LanguageCode::En,
                name: "English",
                native: "English",
                flag: "🇬🇧",
                stt: "en-US",
                stt_label: "English (US)",
                llm_directive: "Always respond in English, regardless of the language the student writes in.",
                dir: "ltr",
            },
            LanguageCode::Pt => LanguageInfo {
                code: LanguageCode::Pt,
                name: "Portuguese",
                native: "Português",
                flag: "🇧🇷",
                stt: "pt-BR",
                stt_label: "Português (Brasil)",
                llm_directive: "Always respond in Portuguese (português do Brasil), regardless of the language the student writes in. Responda sempre em português brasileiro de forma natural.",
                dir: "ltr",
            },
            LanguageCode::Es => LanguageInfo {
                code: LanguageCode::Es,
                name: "Spanish",
                native: "Español",
                flag: "🇪🇸",
                stt: "es-ES",
                stt_label: "Español",
                llm_directive: "Always respond in Spanish (español), regardless of the language the student writes in. Responde siempre en español.",
                dir: "ltr",
            },
            LanguageCode::It => LanguageInfo {
                code: LanguageCode::It,
                name: "Italian",
                native: "Italiano",
                flag: "🇮🇹",
                stt: "it-IT",
                stt_label: "Italian",
                llm_directive: "Always respond in Italian (italiano), regardless of the language the student writes in. Rispondi sempre in italiano.",
                dir: "ltr",
            },
            LanguageCode::De => LanguageInfo {
                code: LanguageCode::De,
                name: "German",
                native: "Deutsch",
                flag: "🇩🇪",
                stt: "de-DE",
                stt_label: "German",
                llm_directive: "Always respond in German (Deutsch), regardless of the language the student writes in. Antworte immer auf Deutsch.",
                dir: "ltr",
            },
            LanguageCode::Fi => LanguageInfo {
                code: LanguageCode::Fi,
                name: "Finnish",
                native: "Suomi",
                flag: "🇫🇮",
                stt: "fi-FI",
                stt_label: "Finnish",
                llm_directive: "Always respond in Finnish (suomi), regardless of the language the student writes in. Vastaa aina suomeksi.",
                dir: "ltr",
            },
            LanguageCode::Sv => LanguageInfo {
                code: LanguageCode::Sv,
                name: "Swedish",
                native: "Svenska",
                flag: "🇸🇪",
                stt: "sv-SE",
                stt_label: "Swedish",
                llm_directive: "Always respond in Swedish (svenska), regardless of the language the student writes in. Svara alltid på svenska.",
                dir: "ltr",
            },
        }
    }

    pub fn code(&self) -> &'static str {
        match self {
            LanguageCode::En => "en",
            LanguageCode::Pt => "pt",
            LanguageCode::Es => "es",
            LanguageCode::It => "it",
            LanguageCode::De => "de",
            LanguageCode::Fi => "fi",
            LanguageCode::Sv => "sv",
        }
    }

    pub fn from_code(code: &str) -> Option<Self> {
        match code.to_lowercase().as_str() {
            "en" | "en-us" | "en-gb" => Some(LanguageCode::En),
            "pt" | "pt-br" | "pt-pt" => Some(LanguageCode::Pt),
            "es" | "es-es" | "es-py" | "es-ar" | "es-mx" => Some(LanguageCode::Es),
            "it" | "it-it" => Some(LanguageCode::It),
            "de" | "de-de" => Some(LanguageCode::De),
            "fi" | "fi-fi" => Some(LanguageCode::Fi),
            "sv" | "sv-se" => Some(LanguageCode::Sv),
            _ => None,
        }
    }
}
