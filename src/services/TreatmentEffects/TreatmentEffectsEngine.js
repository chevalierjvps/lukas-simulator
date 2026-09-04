/**
 * TreatmentEffectsEngine
 *
 * Calculates real-time treatment effects using a pharmacokinetic model.
 * Supports onset, peak, and decay phases with dose-dependent effects.
 *
 * Effect Phases:
 * 1. Onset (0 → onset_minutes): Linear ramp from 0 to 1
 * 2. Peak (onset → peak_minutes): Sustained at 1.0
 * 3. Decline (peak → duration): Exponential decay
 *
 * Net Effect = Σ (base_effect × strength × dose_multiplier)
 */

class TreatmentEffectsEngine {
    constructor() {
        this.activeTreatments = [];
        this.lastUpdate = null;
    }

    /**
     * Update the list of active treatments
     * @param {Array} treatments - Array of active treatment objects from API
     */
    setActiveTreatments(treatments) {
        this.activeTreatments = treatments || [];
        this.lastUpdate = new Date();
    }

    /**
     * Calculate the current effect strength for a single treatment
     * @param {Object} treatment - Treatment object with timing and effect data
     * @returns {Object} - { phase, strength, effects }
     */
    calculateTreatmentEffect(treatment) {
        const now = new Date();
        const startedAt = new Date(treatment.started_at);
        const elapsedMinutes = (now - startedAt) / 60000;

        const onsetMinutes = treatment.onset_minutes || 5;
        const peakMinutes = treatment.peak_minutes || 15;
        const durationMinutes = treatment.duration_minutes || 60;
        const isContinuous = treatment.is_continuous || durationMinutes === -1;

        let phase = 'onset';
        let strength = 0;

        if (isContinuous) {
            // Continuous treatments maintain peak effect after onset
            if (elapsedMinutes >= peakMinutes) {
                phase = 'peak';
                strength = 1.0;
            } else if (elapsedMinutes >= onsetMinutes) {
                phase = 'peak';
                strength = 1.0;
            } else {
                phase = 'onset';
                strength = Math.min(1, elapsedMinutes / onsetMinutes);
            }
        } else {
            // Discrete treatments with onset → peak → decline → expired
            if (elapsedMinutes < onsetMinutes) {
                phase = 'onset';
                strength = elapsedMinutes / onsetMinutes;
            } else if (elapsedMinutes < peakMinutes) {
                phase = 'peak';
                strength = 1.0;
            } else if (elapsedMinutes < durationMinutes) {
                phase = 'decline';
                const declineProgress = (elapsedMinutes - peakMinutes) / (durationMinutes - peakMinutes);
                // Exponential decay: e^(-3x) gives ~5% at x=1
                strength = Math.exp(-3 * declineProgress);
            } else {
                phase = 'expired';
                strength = 0;
            }
        }

        // Clamp strength to [0, 1]
        strength = Math.max(0, Math.min(1, strength));

        // Calculate current effects based on strength and dose multiplier
        const doseMultiplier = treatment.dose_multiplier || 1.0;

        const medName = (treatment.treatment_item || treatment.treatment_name || '').toLowerCase();
        let defaultPainEffect = 0;
        let defaultAnxietyEffect = 0;

        if (medName.includes('morphine') || medName.includes('morfina') || medName.includes('fentanyl') || medName.includes('fentanil') || medName.includes('tramadol')) {
            defaultPainEffect = -5.0;
            defaultAnxietyEffect = -3.0;
        } else if (medName.includes('nitroglycerin') || medName.includes('nitroglicerina') || medName.includes('isordil') || medName.includes('monocordil')) {
            defaultPainEffect = -4.0;
            defaultAnxietyEffect = -2.0;
        } else if (medName.includes('dipirona') || medName.includes('paracetamol') || medName.includes('acetaminophen') || medName.includes('ketorolac') || medName.includes('cetoprofeno') || medName.includes('ibuprofen')) {
            defaultPainEffect = -2.5;
        } else if (medName.includes('midazolam') || medName.includes('diazepam') || medName.includes('lorazepam') || medName.includes('clonazepam')) {
            defaultAnxietyEffect = -5.0;
            defaultPainEffect = -1.0;
        } else if (treatment.treatment_type === 'oxygen') {
            defaultAnxietyEffect = -2.0;
        }

        const peakPainEffect = treatment.peak_pain_effect ?? defaultPainEffect;
        const peakAnxietyEffect = treatment.peak_anxiety_effect ?? defaultAnxietyEffect;

        return {
            id: treatment.id,
            treatment_order_id: treatment.treatment_order_id,
            treatment_name: treatment.treatment_item || treatment.treatment_name,
            treatment_type: treatment.treatment_type,
            phase,
            strength,
            elapsed_minutes: elapsedMinutes,
            is_continuous: isContinuous,
            effects: {
                hr: Math.round((treatment.peak_hr_effect || 0) * strength * doseMultiplier),
                bp_sys: Math.round((treatment.peak_bp_sys_effect || 0) * strength * doseMultiplier),
                bp_dia: Math.round((treatment.peak_bp_dia_effect || 0) * strength * doseMultiplier),
                rr: Math.round((treatment.peak_rr_effect || 0) * strength * doseMultiplier),
                spo2: Math.round((treatment.peak_spo2_effect || 0) * strength * doseMultiplier),
                temp: (treatment.peak_temp_effect || 0) * strength * doseMultiplier,
                pain: Math.round(peakPainEffect * strength * doseMultiplier * 10) / 10,
                anxiety: Math.round(peakAnxietyEffect * strength * doseMultiplier * 10) / 10
            }
        };
    }

    /**
     * Calculate aggregate effects from all active treatments
     * @returns {Object} - { treatments: [], aggregate: {hr, bp_sys, bp_dia, rr, spo2, temp, pain, anxiety} }
     */
    calculateAggregateEffects() {
        const treatments = this.activeTreatments.map(t => this.calculateTreatmentEffect(t));

        // Filter out expired treatments
        const activeOnly = treatments.filter(t => t.phase !== 'expired');

        // Sum up all effects
        const aggregate = activeOnly.reduce((acc, t) => {
            acc.hr += t.effects.hr;
            acc.bp_sys += t.effects.bp_sys;
            acc.bp_dia += t.effects.bp_dia;
            acc.rr += t.effects.rr;
            acc.spo2 += t.effects.spo2;
            acc.temp += t.effects.temp;
            acc.pain += t.effects.pain || 0;
            acc.anxiety += t.effects.anxiety || 0;
            return acc;
        }, {
            hr: 0,
            bp_sys: 0,
            bp_dia: 0,
            rr: 0,
            spo2: 0,
            temp: 0,
            pain: 0,
            anxiety: 0
        });

        return {
            treatments: activeOnly,
            aggregate,
            count: activeOnly.length
        };
    }

    /**
     * Apply treatment effects to base vitals
     * @param {Object} baseVitals - { hr, bp_sys, bp_dia, rr, spo2, temp, pain, anxiety }
     * @returns {Object} - Modified vitals with treatment effects applied
     */
    applyEffectsToVitals(baseVitals) {
        const { aggregate } = this.calculateAggregateEffects();

        const basePain = Number.isFinite(baseVitals.pain) ? baseVitals.pain : 8.0;
        const baseAnxiety = Number.isFinite(baseVitals.anxiety) ? baseVitals.anxiety : 7.0;

        const effectivePain = Math.max(0, Math.min(10, basePain + aggregate.pain));
        const effectiveAnxiety = Math.max(0, Math.min(10, baseAnxiety + aggregate.anxiety));

        // Dynamically update global neuro-affect values for the 3D Avatar
        if (typeof window !== 'undefined') {
            window.__LUKAS_PATIENT_PAIN = effectivePain;
            window.__LUKAS_PATIENT_ANXIETY = effectiveAnxiety;
        }

        return {
            hr: Math.max(20, Math.min(250, (baseVitals.hr || 0) + aggregate.hr)),
            bp_sys: Math.max(40, Math.min(300, (baseVitals.bp_sys || 0) + aggregate.bp_sys)),
            bp_dia: Math.max(20, Math.min(200, (baseVitals.bp_dia || 0) + aggregate.bp_dia)),
            rr: Math.max(4, Math.min(60, (baseVitals.rr || 0) + aggregate.rr)),
            spo2: Math.max(50, Math.min(100, (baseVitals.spo2 || 0) + aggregate.spo2)),
            temp: Math.max(30, Math.min(45, (baseVitals.temp || 0) + aggregate.temp)),
            pain: Math.round(effectivePain * 10) / 10,
            anxiety: Math.round(effectiveAnxiety * 10) / 10
        };
    }

    /**
     * Get a summary of treatment effects for display
     * @returns {Object} - Summary with counts and active effects
     */
    getSummary() {
        const { treatments, aggregate, count } = this.calculateAggregateEffects();

        // Group by treatment type
        const byType = {
            medications: treatments.filter(t => t.treatment_type === 'medication').length,
            iv_fluids: treatments.filter(t => t.treatment_type === 'iv_fluid').length,
            oxygen: treatments.filter(t => t.treatment_type === 'oxygen').length,
            nursing: treatments.filter(t => t.treatment_type === 'nursing').length
        };

        // Get treatments by phase
        const byPhase = {
            onset: treatments.filter(t => t.phase === 'onset').length,
            peak: treatments.filter(t => t.phase === 'peak').length,
            decline: treatments.filter(t => t.phase === 'decline').length
        };

        return {
            count,
            byType,
            byPhase,
            aggregate,
            treatments
        };
    }

    /**
     * Check if any treatment has significant effects
     * @param {number} threshold - Minimum absolute effect value to consider significant
     * @returns {boolean}
     */
    hasSignificantEffects(threshold = 5) {
        const { aggregate } = this.calculateAggregateEffects();
        return Math.abs(aggregate.hr) >= threshold ||
               Math.abs(aggregate.bp_sys) >= threshold ||
               Math.abs(aggregate.spo2) >= threshold ||
               Math.abs(aggregate.rr) >= threshold;
    }
}

// Singleton instance
const treatmentEffectsEngine = new TreatmentEffectsEngine();

export { TreatmentEffectsEngine };
export default treatmentEffectsEngine;
