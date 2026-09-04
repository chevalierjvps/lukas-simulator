import { describe, expect, it, vi } from 'vitest';
import { TreatmentEffectsEngine } from './TreatmentEffectsEngine';

describe('TreatmentEffectsEngine', () => {
  it('preserves treatment_type for summary grouping', () => {
    vi.setSystemTime(new Date('2026-05-06T12:00:00Z'));
    const engine = new TreatmentEffectsEngine();
    engine.setActiveTreatments([
      {
        id: 1,
        treatment_order_id: 11,
        treatment_name: 'Salbutamol',
        treatment_type: 'medication',
        started_at: '2026-05-06T11:55:00Z',
        onset_minutes: 1,
        peak_minutes: 2,
        duration_minutes: 20,
        peak_hr_effect: 8,
      },
      {
        id: 2,
        treatment_order_id: 12,
        treatment_name: 'Oxygen',
        treatment_type: 'oxygen',
        started_at: '2026-05-06T11:55:00Z',
        onset_minutes: 1,
        peak_minutes: 2,
        duration_minutes: 20,
        peak_spo2_effect: 5,
      },
    ]);

    const summary = engine.getSummary();

    expect(summary.count).toBe(2);
    expect(summary.byType).toMatchObject({
      medications: 1,
      oxygen: 1,
      iv_fluids: 0,
      nursing: 0,
    });

    vi.useRealTimers();
  });

  it('clamps effects when applying aggregate changes to vitals', () => {
    vi.setSystemTime(new Date('2026-05-06T12:00:00Z'));
    const engine = new TreatmentEffectsEngine();
    engine.setActiveTreatments([
      {
        id: 1,
        treatment_order_id: 11,
        treatment_name: 'High flow oxygen',
        treatment_type: 'oxygen',
        started_at: '2026-05-06T11:55:00Z',
        onset_minutes: 1,
        peak_minutes: 2,
        duration_minutes: 20,
        peak_spo2_effect: 80,
        peak_hr_effect: -300,
      },
    ]);

    expect(engine.applyEffectsToVitals({ hr: 90, spo2: 70 })).toMatchObject({
      hr: 20,
      spo2: 100,
    });

    vi.useRealTimers();
  });

  it('reduces pain and anxiety dynamically when analgesic medications are administered', () => {
    vi.setSystemTime(new Date('2026-05-06T12:00:00Z'));
    const engine = new TreatmentEffectsEngine();
    engine.setActiveTreatments([
      {
        id: 1,
        treatment_order_id: 101,
        treatment_name: 'Morfina',
        treatment_type: 'medication',
        started_at: '2026-05-06T11:55:00Z',
        onset_minutes: 2,
        peak_minutes: 5,
        duration_minutes: 180,
        peak_hr_effect: -10,
        peak_bp_sys_effect: -15,
        dose_multiplier: 1.0,
      },
    ]);

    const vitals = engine.applyEffectsToVitals({ hr: 110, bp_sys: 160, bp_dia: 95, pain: 9.0, anxiety: 8.0 });

    expect(vitals.pain).toBeLessThan(9.0);
    expect(vitals.pain).toBeCloseTo(4.0, 1);
    expect(vitals.anxiety).toBeLessThan(8.0);
    expect(vitals.hr).toBe(100);
    expect(vitals.bp_sys).toBe(145);

    vi.useRealTimers();
  });
});
