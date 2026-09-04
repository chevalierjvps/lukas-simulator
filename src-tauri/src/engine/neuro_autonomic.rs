use crate::models::case::Vitals;
use crate::models::neuro_affect::{FacialBlendshapes, GlasgowComaScale, NeuroAffectState};
use crate::models::session::ActiveTreatment;

pub struct NeuroAutonomicEngine;

impl NeuroAutonomicEngine {
    /// Compute the real-time neurological, autonomic, and emotional state
    pub fn compute_neuro_state(
        vitals: &Vitals,
        active_treatments: &[ActiveTreatment],
        current_pain: f32,
        current_anxiety: f32,
    ) -> NeuroAffectState {
        let mut pain = current_pain;
        let mut anxiety = current_anxiety;

        // 1. Pharmacodynamic Analgesia & Sedation Effects
        for tx in active_treatments.iter().filter(|t| t.is_active) {
            let med = tx.medication.to_lowercase();
            
            // Opioids (Morphine, Fentanyl)
            if med.contains("morphine") || med.contains("morfina") || med.contains("fentanyl") || med.contains("fentanil") {
                pain = (pain - 4.5).max(0.0);
                anxiety = (anxiety - 3.5).max(0.0);
            }
            // NSAIDs / Simple analgesics (Dipirona, Paracetamol, Cetoprofeno)
            if med.contains("dipirona") || med.contains("paracetamol") || med.contains("ketoprofen") || med.contains("cetoprofeno") {
                pain = (pain - 2.0).max(0.0);
            }
            // Benzodiazepines / Anxiolytics (Midazolam, Diazepam)
            if med.contains("midazolam") || med.contains("diazepam") {
                anxiety = (anxiety - 5.0).max(0.0);
            }
        }

        // 2. Compute Mean Arterial Pressure (MAP) and Cerebral Perfusion Pressure (CPP)
        let map = ((2 * vitals.blood_pressure_dia + vitals.blood_pressure_sys) as f32) / 3.0;
        let icp_estimated = 12.0; // Normal intracranial pressure ~10-15 mmHg
        let cpp = (map - icp_estimated).max(0.0);

        // 3. Autonomic Tone (Sympathetic vs Parasympathetic balance)
        let sympathetic_pain_contribution = (pain / 10.0) * 0.45;
        let sympathetic_anxiety_contribution = (anxiety / 10.0) * 0.35;
        let hypoxia_sympathetic_drive = if vitals.spo2 < 90 {
            ((90.0 - vitals.spo2 as f32) / 20.0).clamp(0.0, 0.3)
        } else {
            0.0
        };

        let sympathetic_tone = (0.2 + sympathetic_pain_contribution + sympathetic_anxiety_contribution + hypoxia_sympathetic_drive).clamp(0.05, 1.0);
        let parasympathetic_tone = (1.0 - sympathetic_tone).clamp(0.0, 1.0);

        // 4. Heart Rate Variability (RMSSD in ms) - decreases under high stress / sympathetic overdrive
        let hrv_rmssd = (55.0 * parasympathetic_tone + 10.0).clamp(8.0, 85.0);

        // 5. Glasgow Coma Scale (GCS) & Consciousness Progression
        let mut gcs = GlasgowComaScale::default();
        let consciousness_level: String;
        let can_speak: bool;

        if cpp < 40.0 || vitals.spo2 < 70 {
            // Severe cerebral hypoperfusion / profound hypoxia -> Comatose
            gcs.eye_opening = 1;
            gcs.verbal_response = 1;
            gcs.motor_response = 2; // Decerebrate / flaccid
            gcs.total = gcs.eye_opening + gcs.verbal_response + gcs.motor_response;
            consciousness_level = "comatose".to_string();
            can_speak = false;
        } else if cpp < 52.0 || vitals.spo2 < 82 {
            // Stupor / Obtundation
            gcs.eye_opening = 2;
            gcs.verbal_response = 2; // Incomprehensible sounds
            gcs.motor_response = 4; // Withdrawal to pain
            gcs.total = gcs.eye_opening + gcs.verbal_response + gcs.motor_response;
            consciousness_level = "stupor".to_string();
            can_speak = false;
        } else if cpp < 62.0 || vitals.spo2 < 89 {
            // Confusion / Somnolence
            gcs.eye_opening = 3;
            gcs.verbal_response = 4; // Confused conversation
            gcs.motor_response = 5; // Localizes pain
            gcs.total = gcs.eye_opening + gcs.verbal_response + gcs.motor_response;
            consciousness_level = "confused".to_string();
            can_speak = true;
        } else if anxiety > 6.0 || pain > 6.0 {
            consciousness_level = "anxious".to_string();
            can_speak = true;
        } else {
            consciousness_level = "alert".to_string();
            can_speak = true;
        }

        // 6. Facial Morph Target / Blendshapes Computation
        let brow_down = (pain / 10.0 * 0.85 + anxiety / 10.0 * 0.15).clamp(0.0, 1.0);
        let eye_squint = (pain / 10.0 * 0.75).clamp(0.0, 1.0);
        let mouth_press = (pain / 10.0 * 0.6).clamp(0.0, 1.0);
        let jaw_clench = (pain / 10.0 * 0.7).clamp(0.0, 1.0);

        // Shock Pallor & Cyanosis
        let pallor = if map < 65.0 {
            ((65.0 - map) / 35.0).clamp(0.0, 1.0)
        } else {
            0.1
        };

        let cyanosis = if vitals.spo2 < 88 {
            ((88.0 - vitals.spo2 as f32) / 25.0).clamp(0.0, 1.0)
        } else {
            0.0
        };

        let eyelid_droop = if gcs.eye_opening < 4 {
            ((4 - gcs.eye_opening) as f32 / 3.0).clamp(0.0, 1.0)
        } else {
            0.0
        };

        let sweating_glaze = (sympathetic_tone * 0.9).clamp(0.1, 1.0);

        let blendshapes = FacialBlendshapes {
            brow_down,
            eye_squint,
            mouth_press,
            jaw_clench,
            pallor_intensity: pallor,
            cyanosis_intensity: cyanosis,
            eyelid_droop,
            sweating_glaze,
        };

        NeuroAffectState {
            pain_score: pain,
            anxiety_score: anxiety,
            sympathetic_tone,
            parasympathetic_tone,
            glasgow: gcs,
            consciousness_level,
            can_speak,
            cerebral_perfusion_pressure: cpp,
            hrv_rmssd_ms: hrv_rmssd,
            blendshapes,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pain_sympathetic_overdrive() {
        let vitals = Vitals {
            heart_rate: 110,
            blood_pressure_sys: 155,
            blood_pressure_dia: 95,
            spo2: 96,
            respiratory_rate: 22,
            temperature: 37.0,
            ecg_rhythm: "Sinus Tachycardia".to_string(),
        };

        let state = NeuroAutonomicEngine::compute_neuro_state(&vitals, &[], 9.0, 8.0);
        assert!(state.sympathetic_tone > 0.75);
        assert!(state.blendshapes.brow_down > 0.6);
        assert!(state.can_speak);
        assert_eq!(state.consciousness_level, "anxious");
    }

    #[test]
    fn test_profound_hypoperfusion_coma() {
        let vitals = Vitals {
            heart_rate: 42,
            blood_pressure_sys: 45,
            blood_pressure_dia: 25,
            spo2: 65,
            respiratory_rate: 6,
            temperature: 35.5,
            ecg_rhythm: "Sinus Bradycardia".to_string(),
        };

        let state = NeuroAutonomicEngine::compute_neuro_state(&vitals, &[], 5.0, 5.0);
        assert_eq!(state.consciousness_level, "comatose");
        assert!(!state.can_speak);
        assert!(state.glasgow.total <= 6);
        assert!(state.blendshapes.eyelid_droop > 0.8);
    }
}
