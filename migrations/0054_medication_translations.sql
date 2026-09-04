-- 0054: Spanish (and future Portuguese) medication name/class translations.
--
-- `medications.generic_name`/`drug_class` are English/INN-style
-- (Epinephrine, Digoxin...) and drive both the admin catalogue table and the
-- student-facing search (MedicationManager.jsx / MedicationSearch.jsx). A
-- Spanish-language case's Tratamentos room showed these untranslated
-- regardless of case_language.
--
-- Additive only: `generic_name`/`drug_class` stay the English source of
-- truth admins already curate against; nullable `_es` columns are populated
-- incrementally (scripts/authoring), display falls back to English when a
-- translation is absent — never a blank name.
ALTER TABLE medications ADD COLUMN generic_name_es TEXT;
ALTER TABLE medications ADD COLUMN drug_class_es TEXT;
