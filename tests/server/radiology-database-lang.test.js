// Regression lock: the Reference Library's radiology tab (ReferenceLibraryRoom
// > RadiologyLibraryTab) shows "Hallazgos normales" / "Interpretación" headers
// (Spanish, hardcoded) over whatever GET /radiology-database returned — and
// that endpoint, built for the (always-English) case-authoring tool, never
// localized anything. A Spanish-UI student opening "Pelvis X-Ray" saw a
// Spanish header over an English report. `/radiology-database` now
// localizes when a caller opts in with `?lang=`; the case designer, which
// never sends it, is unaffected — this pins both halves.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import sqlite3 from 'sqlite3';
import { startTestServer } from '../utils/startTestServer.js';

function openDb(dbPath) {
    const sqlite = sqlite3.verbose();
    return new Promise((resolve, reject) => {
        const db = new sqlite.Database(dbPath, (err) => err ? reject(err) : resolve(db));
    });
}
function dbRun(db, sql, params = []) {
    return new Promise((resolve, reject) =>
        db.run(sql, params, function done(err) { err ? reject(err) : resolve(this); })
    );
}
function dbClose(db) {
    return new Promise((resolve) => db.close(() => resolve()));
}

async function loginAs(server, username, password) {
    const r = await fetch(`${server.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!r.ok) throw new Error(`login failed: ${r.status} ${await r.text()}`);
    return (await r.json()).token;
}

describe('GET /radiology-database language opt-in', () => {
    let server;
    let token;

    beforeAll(async () => {
        server = await startTestServer();
        const db = await openDb(server.dbPath);
        const hash = await bcrypt.hash('correctpass', 4);
        await dbRun(db,
            `INSERT INTO users (id, username, name, password_hash, email, role, status, tenant_id)
             VALUES (321, 'lib_user', 'Lib User', ?, 'lib@example.com', 'student', 'active', 1)`,
            [hash]
        );
        await dbClose(db);
        token = await loginAs(server, 'lib_user', 'correctpass');
    }, 90_000);

    afterAll(async () => { await server?.close(); });

    const auth = () => ({ authorization: `Bearer ${token}` });
    const findStudy = (studies, id) => studies.find((s) => s.id === id);

    it('without lang: the case-authoring tool keeps getting the raw English source of truth', async () => {
        const res = await fetch(`${server.baseUrl}/api/radiology-database`, { headers: auth() });
        expect(res.status).toBe(200);
        const body = await res.json();
        const pelvis = findStudy(body.studies, 'xray_pelvis');
        expect(pelvis.name).toBe('Pelvis X-Ray');
        expect(pelvis.normal_findings).toMatch(/^The pelvis is intact/);
    });

    it('with lang=es: the Reference Library gets the Spanish study localized, not the raw English one', async () => {
        const res = await fetch(`${server.baseUrl}/api/radiology-database?lang=es`, { headers: auth() });
        expect(res.status).toBe(200);
        const body = await res.json();
        const pelvis = findStudy(body.studies, 'xray_pelvis');
        expect(pelvis.name).toBe('Radiografía de Pelvis');
        expect(pelvis.normal_findings).toMatch(/^La pelvis está íntegra/);
        expect(pelvis.normal_interpretation).toMatch(/Sin fractura pélvica/);
    });

    it('with lang=es: a study with no _es translation yet still falls back to English rather than a blank field', async () => {
        const res = await fetch(`${server.baseUrl}/api/radiology-database?lang=es`, { headers: auth() });
        const body = await res.json();
        // Any study lacking name_es in the source data proves the fallback;
        // pick one deterministically rather than hardcoding a specific id
        // that a future translation pass could legitimately close out.
        const rawRes = await fetch(`${server.baseUrl}/api/radiology-database`, { headers: auth() });
        const rawBody = await rawRes.json();
        const untranslated = rawBody.studies.find((s) => !s.name_es);
        if (!untranslated) return; // every study now translated — nothing to pin
        const localized = findStudy(body.studies, untranslated.id);
        expect(localized.name).toBe(untranslated.name);
        expect(localized.name).not.toBe('');
    });
});
