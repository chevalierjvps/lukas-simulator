use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FacialBlendshapes {
    pub brow_down: f32,
    pub eye_squint: f32,
    pub mouth_press: f32,
    pub jaw_clench: f32,
    pub pallor_intensity: f32,
    pub cyanosis_intensity: f32,
    pub eyelid_droop: f32,
    pub sweating_glaze: f32,
}

impl Default for FacialBlendshapes {
    fn default() -> Self {
        Self {
            brow_down: 0.0,
            eye_squint: 0.0,
            mouth_press: 0.0,
            jaw_clench: 0.0,
            pallor_intensity: 0.0,
            cyanosis_intensity: 0.0,
            eyelid_droop: 0.0,
            sweating_glaze: 0.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlasgowComaScale {
    pub eye_opening: u8,   // 1 to 4
    pub verbal_response: u8, // 1 to 5
    pub motor_response: u8,  // 1 to 6
    pub total: u8,           // 3 to 15
}

impl Default for GlasgowComaScale {
    fn default() -> Self {
        Self {
            eye_opening: 4,
            verbal_response: 5,
            motor_response: 6,
            total: 15,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NeuroAffectState {
    pub pain_score: f32,                 // 0.0 to 10.0
    pub anxiety_score: f32,              // 0.0 to 10.0
    pub sympathetic_tone: f32,           // 0.0 to 1.0 (Adrenergic overdrive)
    pub parasympathetic_tone: f32,       // 0.0 to 1.0 (Vagal balance)
    pub glasgow: GlasgowComaScale,
    pub consciousness_level: String,     // alert, anxious, confused, stupor, coma
    pub can_speak: bool,
    pub cerebral_perfusion_pressure: f32,
    pub hrv_rmssd_ms: f32,               // Heart rate variability in ms
    pub blendshapes: FacialBlendshapes,
}

impl Default for NeuroAffectState {
    fn default() -> Self {
        Self {
            pain_score: 7.0,
            anxiety_score: 8.0,
            sympathetic_tone: 0.85,
            parasympathetic_tone: 0.15,
            glasgow: GlasgowComaScale::default(),
            consciousness_level: "anxious".to_string(),
            can_speak: true,
            cerebral_perfusion_pressure: 85.0,
            hrv_rmssd_ms: 22.0,
            blendshapes: FacialBlendshapes {
                brow_down: 0.7,
                eye_squint: 0.6,
                mouth_press: 0.5,
                jaw_clench: 0.6,
                pallor_intensity: 0.3,
                cyanosis_intensity: 0.0,
                eyelid_droop: 0.0,
                sweating_glaze: 0.8,
            },
        }
    }
}
