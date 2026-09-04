-- 0053: per-session randomized lab results (Lukas 1.0 exam realism).
--
-- Every session playing the same case saw the exact same
-- `case_investigations.current_value` for a given lab — a student who
-- retakes "Dengue com Sinais de Alarme e Choque" always sees hematocrit
-- 58.0, never 61.2 or 55.4. `case_investigations` is the CASE's authored
-- template (shared across every session of that case), so it is the wrong
-- place to hold a per-attempt number.
--
-- This table is the per-session roll: one row per (session, lab), sampled
-- once from the template's authored value (min_value/max_value/current_value
-- as the normal range + clinical target) the first time a session's results
-- are read, then frozen — re-reading the same session never re-rolls.
-- `server/services/labResultRandomizer.js` is the sampler; the read path is
-- `GET /sessions/:id/lab-results` in orders-routes.js.
--
-- UNIQUE(session_id, investigation_id) is the freeze mechanism: a second
-- roll attempt for the same pair is an upsert-if-absent at the app layer,
-- never a fresh draw, so the panel a student is looking at never changes
-- under them mid-session.
--
-- `PUT /sessions/:id/labs/:labId` (instructor live override) also writes
-- here — an instructor's explicit value must be shown verbatim, not
-- resampled, so the override upserts a pinned row rather than touching the
-- shared case_investigations template.
--
-- Strictly additive: one new table, referenced by nothing pre-existing.

CREATE TABLE IF NOT EXISTS session_lab_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  investigation_id INTEGER NOT NULL REFERENCES case_investigations(id),
  tenant_id INTEGER NOT NULL,
  rolled_value REAL NOT NULL,
  is_abnormal INTEGER NOT NULL DEFAULT 0,
  rolled_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- The freeze check ("does a roll already exist for this pair?") and the
-- results-page read both key on (session_id, investigation_id); the unique
-- index serves both and enforces the one-roll-per-pair invariant at the DB
-- layer too, not just in the app-level get-or-create.
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_lab_results_pair
  ON session_lab_results(session_id, investigation_id);

CREATE INDEX IF NOT EXISTS idx_session_lab_results_tenant
  ON session_lab_results(tenant_id, session_id);
