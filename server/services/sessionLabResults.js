// Freezes one rolled lab value per (session, investigation) pair — see
// server/services/labResultRandomizer.js for the sampling itself and
// migrations/0053_session_lab_results.sql for why this is a separate table
// from case_investigations rather than a column on it.
import dbAdapter from '../dbAdapter.js';
import { rollLabValue } from './labResultRandomizer.js';
import { nowIso } from '../shared/time.js';

const SELECT_SQL = `SELECT rolled_value, is_abnormal FROM session_lab_results WHERE session_id = ? AND investigation_id = ?`;

/**
 * Returns { rolled_value, is_abnormal } for (sessionId, lab.id), rolling and
 * freezing a new value on first read. `lab` needs
 * min_value/max_value/current_value/is_abnormal (a case_investigations row).
 */
export async function getOrCreateSessionLabResult(sessionId, lab, tenantId) {
    const existing = await dbAdapter.get(SELECT_SQL, [sessionId, lab.id]);
    if (existing) return existing;

    const rolledValue = rollLabValue(lab);
    const isAbnormal = lab.is_abnormal ? 1 : 0;
    try {
        await dbAdapter.run(
            `INSERT INTO session_lab_results (session_id, investigation_id, tenant_id, rolled_value, is_abnormal, rolled_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [sessionId, lab.id, tenantId, rolledValue, isAbnormal, nowIso()]
        );
    } catch (err) {
        // Lost a race with a concurrent read of the same (session, lab) —
        // the unique index rejected the insert, so someone else's roll won.
        // Fall through to reading it back instead of surfacing a 500 for a
        // race the app doesn't need to prevent.
    }

    const row = await dbAdapter.get(SELECT_SQL, [sessionId, lab.id]);
    return row || { rolled_value: rolledValue, is_abnormal: isAbnormal };
}

/**
 * Instructor live override: pin an exact value for this session, bypassing
 * rolling entirely — an explicit override must be shown verbatim, never
 * resampled. Upserts so re-editing the same lab in the same session updates
 * the pin instead of hitting the unique index.
 */
export async function pinSessionLabResult(sessionId, investigationId, tenantId, value) {
    await dbAdapter.run(
        `INSERT INTO session_lab_results (session_id, investigation_id, tenant_id, rolled_value, is_abnormal, rolled_at)
         VALUES (?, ?, ?, ?, 1, ?)
         ON CONFLICT (session_id, investigation_id) DO UPDATE SET
            rolled_value = excluded.rolled_value,
            is_abnormal = 1,
            rolled_at = excluded.rolled_at`,
        [sessionId, investigationId, tenantId, value, nowIso()]
    );
}
