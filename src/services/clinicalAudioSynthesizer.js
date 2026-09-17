/**
 * Clinical Audio Synthesizer for Lukas 1.0 (by Jvps)
 * High-fidelity real-time Web Audio API sound generator:
 * - S1 / S2 Heart sounds with variable heart rate and murmurs
 * - Vesicular breath sounds with wheezing and fine crackles
 * - Defibrillator capacitor charging tone and shock discharge
 * - Multiparameter monitor pitch-variable pulse oximeter beeps
 */

let audioCtx = null;

function getAudioContext() {
    if (!audioCtx && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Sprint 5: the manikin's auscultation points have real anatomical L/R
// positions (AuscultationPanel.jsx) — "foco estéreo ativo" means a point on
// the left chest/lung should audibly come from the left. `pan` is -1 (hard
// left) .. 0 (center) .. 1 (hard right). Centered/omitted pan skips the
// extra node entirely — every pre-Sprint-5 caller keeps working unchanged.
function outputNode(ctx, pan) {
    if (!pan || typeof ctx.createStereoPanner !== 'function') return ctx.destination;
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    panner.connect(ctx.destination);
    return panner;
}

export const ClinicalAudio = {
    /**
     * Play a monitor pulse beep with pitch modulated by SpO2 (higher pitch = higher SpO2)
     */
    playMonitorBeep(spo2 = 98) {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            // SpO2 100% -> ~880 Hz (A5), SpO2 70% -> ~440 Hz (A4)
            const clampedSpo2 = Math.max(50, Math.min(100, spo2));
            const freq = 400 + (clampedSpo2 - 50) * 10;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.09);
        } catch { /* AudioContext muted or blocked */ }
    },

    /**
     * Play cardiac auscultation lub-dub (S1 and S2), looped for a few
     * cycles at the cadence `rate` (bpm) implies — so a click on a
     * tachycardic patient audibly sounds fast and a bradycardic one
     * audibly sounds slow, not a single fixed-timing beat regardless of
     * the monitor's actual HR. `beats` defaults to 4 cycles, enough to
     * establish tempo without the auscultation point feeling stuck in a
     * loop.
     */
    playHeartSound({ rate = 75, type = 'normal', beats = 4, pan = 0 } = {}) {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const out = outputNode(ctx, pan);

            const bpm = Math.max(20, Math.min(250, rate || 75));
            const cycleSec = 60 / bpm;
            const s1s2GapSec = Math.min(0.28, cycleSec * 0.35);

            for (let beat = 0; beat < beats; beat++) {
                const now = ctx.currentTime + beat * cycleSec;

                // S1 (Lub - lower frequency, slightly longer ~100-140ms)
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'triangle';
                osc1.frequency.setValueAtTime(65, now);
                osc1.frequency.exponentialRampToValueAtTime(45, now + 0.12);

                gain1.gain.setValueAtTime(0.3, now);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

                osc1.connect(gain1);
                gain1.connect(out);
                osc1.start(now);
                osc1.stop(now + 0.13);

                // S2 (Dub - higher frequency, sharper ~80ms), spaced off S1
                // by systole's share of the cycle (narrows as HR rises).
                const s2Time = now + s1s2GapSec;
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(95, s2Time);
                osc2.frequency.exponentialRampToValueAtTime(60, s2Time + 0.09);

                gain2.gain.setValueAtTime(0.25, s2Time);
                gain2.gain.exponentialRampToValueAtTime(0.001, s2Time + 0.09);

                osc2.connect(gain2);
                gain2.connect(out);
                osc2.start(s2Time);
                osc2.stop(s2Time + 0.1);

                // Systolic murmur if requested — recurs every beat, filling
                // the S1-S2 gap (a simplification; real murmurs have grade
                // and timing nuance beyond what a teaching synth needs).
                if (type === 'murmur') {
                    const bufferSize = ctx.sampleRate * 0.18;
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const data = buffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = (Math.random() * 2 - 1) * 0.15 * Math.sin(Math.PI * (i / bufferSize));
                    }
                    const noise = ctx.createBufferSource();
                    noise.buffer = buffer;

                    const filter = ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.value = 400;
                    filter.Q.value = 2.0;

                    noise.connect(filter);
                    filter.connect(out);
                    noise.start(now + 0.1);
                }
            }
        } catch { /* AudioContext muted */ }
    },

    /**
     * Play lung sound (vesicular, wheezing, or crackles)
     */
    playLungSound(type = 'vesicular', { pan = 0 } = {}) {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const out = outputNode(ctx, pan);

            const now = ctx.currentTime;
            const duration = 2.0; // Inhalation + exhalation
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            // A pleural effusion (or any process muffling that side) doesn't
            // add a sound — it quiets the normal one. Same vesicular
            // envelope, a fraction of the amplitude, so it reads as "there
            // but faint" rather than silence (which a learner would more
            // plausibly read as "no signal" than as a finding).
            const amplitude = type === 'diminished' ? 0.06 : 0.2;

            for (let i = 0; i < bufferSize; i++) {
                const t = i / ctx.sampleRate;
                const breathEnvelope = Math.sin(Math.PI * (t / duration));
                let noise = (Math.random() * 2 - 1) * breathEnvelope * amplitude;

                if (type === 'wheeze') {
                    // High-pitched continuous wheeze during expiration
                    if (t > duration * 0.45) {
                        noise += Math.sin(2 * Math.PI * 480 * t) * 0.15 * breathEnvelope;
                    }
                } else if (type === 'crackles') {
                    // Explosive fine crackles during late inspiration
                    if (t > duration * 0.25 && t < duration * 0.55 && Math.random() < 0.08) {
                        noise += (Math.random() * 2 - 1) * 0.4;
                    }
                }
                data[i] = noise;
            }

            const source = ctx.createBufferSource();
            source.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = type === 'wheeze' ? 800 : 450;

            source.connect(filter);
            filter.connect(out);
            source.start(now);
        } catch { /* AudioContext muted */ }
    },

    /**
     * Play a subtle continuous gas-flow hiss — feedback for applying O2
     * (nasal cannula / non-rebreather / intubation quick-orders, hotkey 1).
     * Filtered noise with a soft attack/release so it reads as breathable
     * air, not a hard alarm-style tone.
     */
    playOxygenFlow() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const duration = 0.9;
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1800;
            filter.Q.value = 0.7;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.06, now + 0.15);
            gain.gain.setValueAtTime(0.06, now + duration - 0.3);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + duration);
        } catch { /* AudioContext muted */ }
    },

    /**
     * Play a brief IV-bolus "whoosh" — feedback for a crystalloid/blood
     * bolus quick-order (hotkey 2). A short band-limited noise sweep,
     * distinct in timbre from the O2 hiss (lower, shorter, no sustain).
     */
    playFluidBolus() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const duration = 0.5;
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const t = i / ctx.sampleRate;
                data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * (t / duration));
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(200, now);
            filter.frequency.exponentialRampToValueAtTime(700, now + duration);
            filter.Q.value = 1.2;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + duration);
        } catch { /* AudioContext muted */ }
    },

    /**
     * Play defibrillator capacitor charge sound — an ascending sine ramp
     * 200Hz -> 1200Hz over the charge window, per spec (Sprint 5).
     */
    playDefibrillatorCharge() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 2.5);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0.18, now + 2.3);
            gain.gain.setValueAtTime(0.2, now + 2.5);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 2.8);
        } catch { /* AudioContext muted */ }
    },

    /**
     * Play defibrillator shock discharge (heavy thump & click)
     */
    playDefibrillatorShock() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

            gain.gain.setValueAtTime(0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.4);
        } catch { /* AudioContext muted */ }
    },

    /**
     * Play the sustained monotone a bedside monitor emits on flatline —
     * a continuous ~840Hz tone, held for `durationSec` then released.
     */
    playFlatlineTone(durationSec = 4) {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(840, now);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
            gain.gain.setValueAtTime(0.25, now + durationSec - 0.2);
            gain.gain.linearRampToValueAtTime(0, now + durationSec);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + durationSec);
        } catch { /* AudioContext muted */ }
    }
};

export default ClinicalAudio;
