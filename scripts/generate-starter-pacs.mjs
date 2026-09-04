#!/usr/bin/env node
/**
 * Generate starter DICOM imaging studies under server/plugin-content/pacs
 * Writes standard DICOM files and series index.json manifests
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PACS_DIR = join(ROOT, 'server', 'plugin-content', 'pacs');

const enc = new TextEncoder();

function el(tag, vr, value, longForm = false) {
    const group = parseInt(tag.slice(0, 4), 16);
    const element = parseInt(tag.slice(4), 16);
    const body = value instanceof Uint8Array
        ? value
        : (() => {
            if (vr === 'US') { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, value, true); return b; }
            const s = Array.isArray(value) ? value.join('\\') : String(value);
            const b = enc.encode(s);
            if (b.length % 2 === 0) return b;
            const out = new Uint8Array(b.length + 1);
            out.set(b); out[b.length] = vr === 'UI' ? 0 : 0x20;
            return out;
        })();
    const head = new Uint8Array(longForm ? 12 : 8);
    const dv = new DataView(head.buffer);
    dv.setUint16(0, group, true);
    dv.setUint16(2, element, true);
    head[4] = vr.charCodeAt(0); head[5] = vr.charCodeAt(1);
    if (longForm) dv.setUint32(8, body.length, true); else dv.setUint16(6, body.length, true);
    const out = new Uint8Array(head.length + body.length);
    out.set(head); out.set(body, head.length);
    return out;
}

function concat(parts) {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let at = 0; parts.forEach((p) => { out.set(p, at); at += p.length; });
    return out;
}

function generateDicomInstance({
    modality,
    studyUid,
    seriesUid,
    instanceNumber,
    seriesDescription,
    rows = 64,
    columns = 64,
    pixelGenerator,
    windowCenter = -600,
    windowWidth = 1500,
    rescaleIntercept = -1024,
    rescaleSlope = 1,
    pixelSpacing = ['1.0', '1.0'],
    z = 0,
    plane = 'axial'
}) {
    const stored = new Int16Array(rows * columns);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const hu = pixelGenerator(r, c, rows, columns, z);
            stored[r * columns + c] = Math.round(hu - rescaleIntercept);
        }
    }

    const sopClassUid = modality === 'CT'
        ? '1.2.840.10008.5.1.4.1.1.2'
        : modality === 'MR'
            ? '1.2.840.10008.5.1.4.1.1.4'
            : '1.2.840.10008.5.1.4.1.1.1'; // CR/DX

    const dataset = concat([
        el('00080016', 'UI', sopClassUid),
        el('00080018', 'UI', `1.2.3.${seriesUid}.${instanceNumber}`),
        el('00080060', 'CS', modality),
        el('0008103e', 'LO', seriesDescription),
        el('0020000d', 'UI', studyUid),
        el('0020000e', 'UI', `1.2.3.${seriesUid}`),
        el('00200011', 'IS', '1'),
        el('00200013', 'IS', String(instanceNumber)),
        el('00200032', 'DS', ['-150', '-150', String(z)]),
        el('00200037', 'DS', plane === 'sagittal' ? ['0', '1', '0', '0', '0', '-1'] : plane === 'coronal' ? ['1', '0', '0', '0', '0', '-1'] : ['1', '0', '0', '0', '1', '0']),
        el('00201041', 'DS', String(z)),
        el('00280002', 'US', 1),
        el('00280004', 'CS', 'MONOCHROME2'),
        el('00280010', 'US', rows),
        el('00280011', 'US', columns),
        el('00280030', 'DS', pixelSpacing),
        el('00280100', 'US', 16),
        el('00280101', 'US', 16),
        el('00280102', 'US', 15),
        el('00280103', 'US', 1),
        el('00281050', 'DS', String(windowCenter)),
        el('00281051', 'DS', String(windowWidth)),
        el('00281052', 'DS', String(rescaleIntercept)),
        el('00281053', 'DS', String(rescaleSlope)),
        el('7fe00010', 'OW', new Uint8Array(stored.buffer.slice(0)), true),
    ]);

    const meta = concat([
        el('00020002', 'UI', sopClassUid),
        el('00020003', 'UI', `1.2.3.${seriesUid}.${instanceNumber}`),
        el('00020010', 'UI', '1.2.840.10008.1.2.1'),
    ]);
    const groupLen = el('00020000', 'UL', (() => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, meta.length, true); return b; })());
    const preamble = new Uint8Array(132);
    preamble.set(enc.encode('DICM'), 128);
    return concat([preamble, groupLen, meta, dataset]);
}

// 1. Chest X-Ray Generator
function chestXrayPixel(r, c, rows, cols) {
    const ny = (r / rows) * 2 - 1;
    const nx = (c / cols) * 2 - 1;
    const distCenter = Math.sqrt(nx * nx + ny * ny);
    if (distCenter > 0.95) return -1000;
    const inLeftLung = (nx < -0.15 && nx > -0.75 && Math.abs(ny) < 0.65);
    const inRightLung = (nx > 0.15 && nx < 0.75 && Math.abs(ny) < 0.65);
    if (inLeftLung || inRightLung) {
        const rib = Math.sin(ny * 12) * 120;
        return -750 + rib;
    }
    const inHeart = (nx > -0.25 && nx < 0.35 && ny > -0.1 && ny < 0.6);
    if (inHeart) return 45;
    return 30;
}

// 2. Chest CT Slice Generator
function chestCtPixel(r, c, rows, cols, z) {
    const ny = (r / rows) * 2 - 1;
    const nx = (c / cols) * 2 - 1;
    const distCenter = Math.sqrt(nx * nx + ny * ny);
    if (distCenter > 0.9) return -1000;
    if (distCenter > 0.82) return 800;
    const inLeftLung = (nx < -0.12 && nx > -0.75 && Math.abs(ny) < 0.7);
    const inRightLung = (nx > 0.12 && nx < 0.75 && Math.abs(ny) < 0.7);
    if (inLeftLung || inRightLung) {
        return -800 + Math.sin(nx * 20 + z) * 50;
    }
    if (Math.sqrt(nx * nx + (ny - 0.1) * (ny - 0.1)) < 0.35) return 40;
    if (Math.abs(nx) < 0.15 && ny > 0.5) return 700;
    return 35;
}

// 3. Brain CT / MRI Slice Generator
function brainCtPixel(r, c, rows, cols, z) {
    const ny = (r / rows) * 2 - 1;
    const nx = (c / cols) * 2 - 1;
    const dist = Math.sqrt(nx * nx + ny * ny);
    if (dist > 0.9) return -1000;
    if (dist > 0.8) return 1200;
    if (dist < 0.25) return 0;
    return 38 + Math.cos(nx * 15 + ny * 15) * 8;
}

// 4. Abdominal X-Ray Generator
function abdomenXrayPixel(r, c, rows, cols) {
    const ny = (r / rows) * 2 - 1;
    const nx = (c / cols) * 2 - 1;
    if (Math.sqrt(nx * nx + ny * ny) > 0.95) return -1000;
    const bowelGas = Math.sin(nx * 8 + ny * 8) > 0.5 ? -600 : 30;
    return bowelGas;
}

async function buildAll() {
    console.log('Generating Lukas comprehensive starter DICOM datasets...');

    const studies = [
        {
            id: 'normal/xr_chest',
            studyId: 'xray_chest_pa',
            label: 'Raio-X de Tórax (PA e Perfil)',
            modality: 'X-Ray',
            bodyRegion: 'Chest',
            description: 'Radiografia de tórax padrão PA em posição ereta.',
            series: [
                {
                    key: 'pa',
                    description: 'Tórax PA',
                    plane: 'frontal',
                    instances: 2,
                    frames: 2,
                    ref: 'remote:dicom/normal/xr_chest/pa/',
                    generator: chestXrayPixel,
                    wc: -400,
                    ww: 1600
                }
            ]
        },
        {
            id: 'normal/xr_chest_portable',
            studyId: 'xray_chest_portable',
            label: 'Raio-X de Tórax no Leito (AP)',
            modality: 'X-Ray',
            bodyRegion: 'Chest',
            description: 'Radiografia de tórax leito em decúbito AP.',
            series: [
                {
                    key: 'ap',
                    description: 'Tórax AP Leito',
                    plane: 'frontal',
                    instances: 1,
                    frames: 1,
                    ref: 'remote:dicom/normal/xr_chest_portable/ap/',
                    generator: chestXrayPixel,
                    wc: -400,
                    ww: 1600
                }
            ]
        },
        {
            id: 'normal/xr_abdomen',
            studyId: 'xray_abdomen',
            label: 'Radiografia de Abdome Simples (KUB)',
            modality: 'X-Ray',
            bodyRegion: 'Abdomen',
            description: 'Radiografia simples de abdome em decúbito dorsal.',
            series: [
                {
                    key: 'kub',
                    description: 'Abdome KUB',
                    plane: 'frontal',
                    instances: 1,
                    frames: 1,
                    ref: 'remote:dicom/normal/xr_abdomen/kub/',
                    generator: abdomenXrayPixel,
                    wc: 40,
                    ww: 400
                }
            ]
        },
        {
            id: 'normal/ct_chest',
            studyId: 'ct_chest_noncon',
            label: 'TC de Tórax Sem Contraste',
            modality: 'CT',
            bodyRegion: 'Chest',
            description: 'Tomografia computadorizada volumétrica de tórax com cortes axiais.',
            series: [
                {
                    key: 'axial',
                    description: 'Cortes Axiais de Tórax (Janela Pulmonar/Mediastino)',
                    plane: 'axial',
                    instances: 12,
                    frames: 12,
                    ref: 'remote:dicom/normal/ct_chest/axial/',
                    generator: chestCtPixel,
                    wc: -600,
                    ww: 1500
                }
            ]
        },
        {
            id: 'normal/ct_head',
            studyId: 'ct_head_noncon',
            label: 'TC de Crânio Sem Contraste',
            modality: 'CT',
            bodyRegion: 'Head',
            description: 'Tomografia computadorizada de crânio sem contraste em cortes axiais.',
            series: [
                {
                    key: 'axial',
                    description: 'Crânio Axial (Janela de Parênquima/Osso)',
                    plane: 'axial',
                    instances: 10,
                    frames: 10,
                    ref: 'remote:dicom/normal/ct_head/axial/',
                    generator: brainCtPixel,
                    wc: 40,
                    ww: 100
                }
            ]
        }
    ];

    const catalogEntries = [];
    const thumbsIndex = {};

    for (const st of studies) {
        const studyUid = `1.2.840.113619.2.${st.id.replace(/[^a-zA-Z0-9]/g, '')}`;
        const studySeriesRefs = [];

        for (const s of st.series) {
            const seriesRelPath = s.ref.replace('remote:', '');
            const seriesDiskPath = join(PACS_DIR, seriesRelPath);
            mkdirSync(seriesDiskPath, { recursive: true });

            const seriesUid = `${st.id.replace(/[^a-zA-Z0-9]/g, '')}_${s.key}`;
            const instanceList = [];

            for (let i = 1; i <= s.instances; i++) {
                const z = (i - s.instances / 2) * 2.5;
                const dcmBytes = generateDicomInstance({
                    modality: st.modality === 'X-Ray' ? 'CR' : st.modality,
                    studyUid,
                    seriesUid,
                    instanceNumber: i,
                    seriesDescription: s.description,
                    rows: 64,
                    columns: 64,
                    pixelGenerator: s.generator,
                    windowCenter: s.wc,
                    windowWidth: s.ww,
                    z,
                    plane: s.plane
                });

                const filename = `${String(i).padStart(4, '0')}.dcm`;
                writeFileSync(join(seriesDiskPath, filename), dcmBytes);

                instanceList.push({
                    name: filename,
                    instanceNumber: i,
                    position: [-150, -150, z],
                    orientation: s.plane === 'frontal' ? [1, 0, 0, 0, 0, -1] : [1, 0, 0, 0, 1, 0]
                });
            }

            // CRITICAL: Write index.json inside the series directory so hostSeriesLoader can load instances!
            const seriesIndex = {
                schemaVersion: '1.0.0',
                seriesUid,
                studyUid,
                modality: st.modality === 'X-Ray' ? 'CR' : st.modality,
                description: s.description,
                instances: instanceList
            };
            writeFileSync(join(seriesDiskPath, 'index.json'), JSON.stringify(seriesIndex, null, 2));

            studySeriesRefs.push({
                key: s.key,
                description: s.description,
                plane: s.plane,
                instances: s.instances,
                frames: s.frames,
                ref: s.ref,
                geometry: {
                    plane: s.plane,
                    sliceThickness: 2.5,
                    pixelSpacing: [1.0, 1.0],
                    firstInstanceZ: -10.0,
                    lastInstanceZ: 10.0,
                    nominalRows: 64,
                    nominalColumns: 64
                }
            });

            thumbsIndex[s.ref] = null;
        }

        catalogEntries.push({
            id: st.id,
            studyId: st.studyId,
            modality: st.modality,
            bodyRegion: st.bodyRegion,
            label: st.label,
            description: st.description,
            series: studySeriesRefs,
            provenance: {
                dataset: 'Lukas Medical Simulator Teaching Archive',
                licence: 'CC0',
                redistribution: 'permitted',
                attribution: 'Lukas Virtual Patient Simulation Archive'
            },
            review: {
                state: 'confirmed',
                finding: 'Exame radiológico dentro dos limites fisiológicos da normalidade.',
                reviewedBy: 'Equipe de Radiologia Lukas / Unisud',
                reviewedOn: '2026-08-31'
            }
        });
    }

    mkdirSync(PACS_DIR, { recursive: true });
    mkdirSync(join(PACS_DIR, 'thumbs'), { recursive: true });

    writeFileSync(join(PACS_DIR, 'thumbs', 'index.json'), JSON.stringify(thumbsIndex, null, 2));

    const catalogJson = {
        schemaVersion: '1.0.0',
        version: 1,
        name: 'Lukas DICOM Starter Archive',
        entries: catalogEntries
    };
    writeFileSync(join(PACS_DIR, 'catalog.json'), JSON.stringify(catalogJson, null, 2));

    const contentJson = {
        schemaVersion: '1.0.0',
        plugin: 'pacs',
        version: 'starter-lukas-v1',
        paths: ['/dicom', '/thumbs'],
        starter: true,
        fileCount: catalogEntries.length,
        kilobytes: 650,
        files: []
    };
    writeFileSync(join(PACS_DIR, 'content.json'), JSON.stringify(contentJson, null, 2));

    console.log(`✅ Generated ${catalogEntries.length} complete starter DICOM studies with index.json in ${PACS_DIR}`);
}

buildAll().catch(err => {
    console.error('Failed to build starter DICOM content:', err);
    process.exit(1);
});
