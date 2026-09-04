use crate::models::case::Vitals;
use crate::models::session::ActiveTreatment;
use rand::Rng;

pub struct VitalsEngine;

impl VitalsEngine {
    /// Calculate Mean Arterial Pressure (MAP)
    pub fn calculate_map(sbp: u32, dbp: u32) -> f32 {
        ((2 * dbp + sbp) as f32) / 3.0
    }

    /// Calculate Shock Index (HR / SBP)
    pub fn calculate_shock_index(hr: u32, sbp: u32) -> f32 {
        if sbp == 0 {
            return 99.0;
        }
        (hr as f32) / (sbp as f32)
    }

    /// Calculate dynamic vitals step based on baseline, active treatments, and elapsed time
    pub fn compute_vitals_tick(
        baseline: &Vitals,
        current: &Vitals,
        active_treatments: &[ActiveTreatment],
        elapsed_seconds: u32,
        deterioration_rate_per_min: f32,
    ) -> Vitals {
        let mut rng = rand::thread_rng();

        // 1. Calculate natural pathological trend (e.g. progressive shock or stable)
        let elapsed_minutes = (elapsed_seconds as f32) / 60.0;
        let mut hr_delta: f32 = deterioration_rate_per_min * elapsed_minutes * 1.5;
        let mut sbp_delta: f32 = -deterioration_rate_per_min * elapsed_minutes * 2.0;
        let mut dbp_delta: f32 = -deterioration_rate_per_min * elapsed_minutes * 1.2;
        let mut spo2_delta: f32 = -deterioration_rate_per_min * elapsed_minutes * 0.5;
        let mut rr_delta: f32 = deterioration_rate_per_min * elapsed_minutes * 0.8;

        // 2. Apply Pharmacological / Intervention Effects
        for tx in active_treatments.iter().filter(|t| t.is_active) {
            let treatment_elapsed = elapsed_seconds.saturating_sub(tx.administered_at_second);
            if treatment_elapsed > tx.duration_seconds {
                continue;
            }

            // Curve factor from 0.0 (onset) to 1.0 (peak) to 0.0 (elimination)
            let factor = if treatment_elapsed < tx.peak_effect_second {
                (treatment_elapsed as f32) / (tx.peak_effect_second as f32).max(1.0)
            } else {
                let remaining = tx.duration_seconds.saturating_sub(treatment_elapsed);
                let decay_span = tx.duration_seconds.saturating_sub(tx.peak_effect_second).max(1);
                (remaining as f32) / (decay_span as f32)
            };

            let med_lower = tx.medication.to_lowercase();

            // Crystalloid fluid resuscitation (e.g. Saline, Ringer's Lactate)
            if med_lower.contains("saline") || med_lower.contains("ringer") || med_lower.contains("soro") || med_lower.contains("cristaloide") {
                sbp_delta += 20.0 * factor;
                dbp_delta += 12.0 * factor;
                hr_delta -= 18.0 * factor;
                rr_delta -= 4.0 * factor;
            }

            // Epinephrine / Adrenalina (Anaphylaxis, Severe Shock, Arrest)
            if med_lower.contains("epinephrine") || med_lower.contains("adrenalina") {
                sbp_delta += 35.0 * factor;
                dbp_delta += 15.0 * factor;
                hr_delta += 15.0 * factor;
                spo2_delta += 8.0 * factor;
                rr_delta -= 6.0 * factor;
            }

            // Norepinephrine / Noradrenalina (Vasopressor for septic / distributive shock)
            if med_lower.contains("norepinephrine") || med_lower.contains("noradrenalina") {
                sbp_delta += 30.0 * factor;
                dbp_delta += 20.0 * factor;
                hr_delta -= 5.0 * factor;
            }

            // Oxygen Therapy / Oxigênio / Cânula / Máscara
            if med_lower.contains("oxygen") || med_lower.contains("oxigenio") || med_lower.contains("o2") || med_lower.contains("oxigênio") {
                spo2_delta += 10.0 * factor;
                rr_delta -= 4.0 * factor;
            }

            // Bronchodilators (Salbutamol, Fenoterol, Albuterol)
            if med_lower.contains("salbutamol") || med_lower.contains("albuterol") || med_lower.contains("fenoterol") {
                spo2_delta += 6.0 * factor;
                rr_delta -= 5.0 * factor;
                hr_delta += 8.0 * factor; // Mild beta-2 reflex tachycardia
            }

            // Nitroglycerin / Nitrato (STEMI / Angina / Acute Pulmonary Edema)
            if med_lower.contains("nitroglycerin") || med_lower.contains("nitrato") || med_lower.contains("isordil") {
                sbp_delta -= 15.0 * factor;
                dbp_delta -= 10.0 * factor;
                hr_delta += 4.0 * factor;
            }

            // Antiarrhythmics (Amiodarone)
            if med_lower.contains("amiodarone") || med_lower.contains("amiodarona") {
                hr_delta -= 25.0 * factor;
            }
        }

        // 3. Add physiological micro-jitter / noise (±1-2 bpm / mmHg)
        let noise_hr: i32 = rng.gen_range(-1..=1);
        let noise_bp: i32 = rng.gen_range(-1..=1);
        let noise_spo2: f32 = rng.gen_range(-0.3..=0.3);

        let final_hr = ((baseline.heart_rate as f32 + hr_delta).round() as i32 + noise_hr).clamp(20, 220) as u32;
        let final_sbp = ((baseline.blood_pressure_sys as f32 + sbp_delta).round() as i32 + noise_bp).clamp(30, 260) as u32;
        let final_dbp = ((baseline.blood_pressure_dia as f32 + dbp_delta).round() as i32 + noise_bp).clamp(15, 160) as u32;
        let final_spo2 = (baseline.spo2 as f32 + spo2_delta + noise_spo2).clamp(40.0, 100.0) as u32;
        let final_rr = ((baseline.respiratory_rate as f32 + rr_delta).round() as i32).clamp(4, 60) as u32;

        Vitals {
            heart_rate: final_hr,
            blood_pressure_sys: final_sbp,
            blood_pressure_dia: final_dbp,
            spo2: final_spo2,
            respiratory_rate: final_rr,
            temperature: baseline.temperature,
            ecg_rhythm: if final_hr > 150 {
                "Sinus Tachycardia".to_string()
            } else if final_hr < 50 {
                "Sinus Bradycardia".to_string()
            } else {
                current.ecg_rhythm.clone()
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_map() {
        let map = VitalsEngine::calculate_map(120, 80);
        assert!((map - 93.33).abs() < 0.1);

        let shock_map = VitalsEngine::calculate_map(90, 60);
        assert!((shock_map - 70.0).abs() < 0.1);
    }

    #[test]
    fn test_calculate_shock_index() {
        // Normal: HR 80 / SBP 120 = 0.67 (< 0.7 normal)
        let si_normal = VitalsEngine::calculate_shock_index(80, 120);
        assert!((si_normal - 0.67).abs() < 0.05);

        // Impending shock: HR 120 / SBP 90 = 1.33 (> 0.9 shock)
        let si_shock = VitalsEngine::calculate_shock_index(120, 90);
        assert!(si_shock > 1.0);
    }

    #[test]
    fn test_fluid_resuscitation_response() {
        let baseline = Vitals {
            heart_rate: 120,
            blood_pressure_sys: 85,
            blood_pressure_dia: 55,
            spo2: 96,
            respiratory_rate: 24,
            temperature: 38.5,
            ecg_rhythm: "Sinus Tachycardia".to_string(),
        };

        let active_tx = vec![ActiveTreatment {
            id: "tx-1".to_string(),
            medication: "Soro Fisiológico 0.9% 1000mL".to_string(),
            dose: "1000mL".to_string(),
            route: "IV".to_string(),
            administered_at_second: 0,
            peak_effect_second: 120,
            duration_seconds: 600,
            is_active: true,
        }];

        // At peak effect (120s), SBP should increase and HR should decrease
        let updated = VitalsEngine::compute_vitals_tick(&baseline, &baseline, &active_tx, 120, 0.0);
        assert!(updated.blood_pressure_sys >= baseline.blood_pressure_sys + 15);
        assert!(updated.heart_rate <= baseline.heart_rate - 10);
    }
}
