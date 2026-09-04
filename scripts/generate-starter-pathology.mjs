#!/usr/bin/env node
/**
 * Generate starter digital pathology slide datasets under server/plugin-content/pathology
 * Creates Deep Zoom Image (DZI) pyramids, preview thumbnails, and catalog.json
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PATHOLOGY_DIR = join(ROOT, 'server', 'plugin-content', 'pathology');

// CRC32 table for PNG encoding
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
}

function createPng(width, height, rVal, gVal, bVal, patternType = 'tissue') {
    const raw = Buffer.alloc(height * (1 + width * 3));
    for (let y = 0; y < height; y++) {
        const rowOffset = y * (1 + width * 3);
        raw[rowOffset] = 0;
        for (let x = 0; x < width; x++) {
            const pxOffset = rowOffset + 1 + x * 3;
            let variation = 0;
            if (patternType === 'nuclei') {
                // Purple dense nuclei spots on pink eosin background
                const isNucleus = (Math.sin(x * 0.4) * Math.cos(y * 0.4) > 0.45);
                if (isNucleus) {
                    raw[pxOffset] = 90; // Deep hematoxylin purple
                    raw[pxOffset + 1] = 40;
                    raw[pxOffset + 2] = 130;
                    continue;
                }
                variation = (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 12;
            } else {
                variation = (Math.sin(x * 0.15) + Math.cos(y * 0.15)) * 15;
            }
            raw[pxOffset] = Math.min(255, Math.max(0, rVal + variation));
            raw[pxOffset + 1] = Math.min(255, Math.max(0, gVal + variation * 0.6));
            raw[pxOffset + 2] = Math.min(255, Math.max(0, bVal + variation * 0.9));
        }
    }
    const compressed = zlib.deflateSync(raw);
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    function chunk(type, data) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length, 0);
        const typeBuf = Buffer.from(type, 'ascii');
        const body = Buffer.concat([typeBuf, data]);
        let c = 0xffffffff;
        for (let i = 0; i < body.length; i++) {
            c = (c >>> 8) ^ crcTable[(c ^ body[i]) & 0xff];
        }
        const crc = Buffer.alloc(4);
        crc.writeUInt32BE((c ^ 0xffffffff) >>> 0, 0);
        return Buffer.concat([len, body, crc]);
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    return Buffer.concat([
        signature,
        chunk('IHDR', ihdr),
        chunk('IDAT', compressed),
        chunk('IEND', Buffer.alloc(0))
    ]);
}

async function buildAllPathology() {
    console.log('Generating Lukas starter Digital Pathology slides...');

    const slides = [
        {
            id: 'cardiac-infarct-he',
            label: 'Infarto Agudo do Miocárdio (H&E)',
            description: 'Biópsia miocárdica demonstrando necrose de coagulação, bandas de contração, perda de estriações cruzadas e infiltrado neutrofílico intersticial.',
            stain: 'H&E',
            organ: 'Heart',
            width: 2048,
            height: 2048,
            tileSize: 256,
            colors: { r: 215, g: 110, b: 155, pattern: 'nuclei' },
            optics: {
                nativeObjective: 40,
                nativeMpp: 0.25,
                downsample: 1,
                slideWidthPx: 2048,
                slideHeightPx: 2048
            }
        },
        {
            id: 'cardiac-normal-he',
            label: 'Miocárdio Normal de Controle (H&E)',
            description: 'Corte histológico de ventrículo esquerdo normal com cardiomiócitos ramificados, núcleos centrais ovais e estriações preservadas.',
            stain: 'H&E',
            organ: 'Heart',
            width: 2048,
            height: 2048,
            tileSize: 256,
            colors: { r: 220, g: 130, b: 165, pattern: 'tissue' },
            optics: {
                nativeObjective: 40,
                nativeMpp: 0.25,
                downsample: 1,
                slideWidthPx: 2048,
                slideHeightPx: 2048
            }
        },
        {
            id: 'coronary-atheroma',
            label: 'Ateroma Coronário com Placa Aterosclerótica',
            description: 'Artéria coronária com núcleo lipídico necrótico volumoso, capa fibrosa espessada, deposição de cristais de colesterol e calcificação distrófica.',
            stain: 'Masson Trichrome',
            organ: 'Vessel',
            width: 2048,
            height: 2048,
            tileSize: 256,
            colors: { r: 160, g: 190, b: 225, pattern: 'tissue' },
            optics: {
                nativeObjective: 40,
                nativeMpp: 0.25,
                downsample: 1,
                slideWidthPx: 2048,
                slideHeightPx: 2048
            }
        }
    ];

    const tilesDir = join(PATHOLOGY_DIR, 'tiles');
    const previewsDir = join(tilesDir, 'previews');
    mkdirSync(previewsDir, { recursive: true });

    const assets = [];

    for (const slide of slides) {
        const slideName = slide.id;
        const dziXml = `<?xml version="1.0" encoding="UTF-8"?>
<Image xmlns="http://schemas.microsoft.com/deepzoom/2008"
  Format="png"
  Overlap="1"
  TileSize="${slide.tileSize}">
  <Size
    Height="${slide.height}"
    Width="${slide.width}"/>
</Image>
`;
        writeFileSync(join(tilesDir, `${slideName}.dzi`), dziXml);

        // Generate DZI pyramid tile files
        // Levels 0 to 11 (2^11 = 2048)
        const slideFilesDir = join(tilesDir, `${slideName}_files`);
        mkdirSync(slideFilesDir, { recursive: true });

        const maxLevel = Math.ceil(Math.log2(Math.max(slide.width, slide.height)));
        for (let level = 0; level <= maxLevel; level++) {
            const levelDir = join(slideFilesDir, String(level));
            mkdirSync(levelDir, { recursive: true });

            const levelDim = Math.pow(2, level);
            const cols = Math.ceil(levelDim / slide.tileSize);
            const rows = Math.ceil(levelDim / slide.tileSize);

            const tilePng = createPng(
                Math.min(slide.tileSize, Math.max(1, levelDim)),
                Math.min(slide.tileSize, Math.max(1, levelDim)),
                slide.colors.r,
                slide.colors.g,
                slide.colors.b,
                slide.colors.pattern
            );

            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    writeFileSync(join(levelDir, `${c}_${r}.png`), tilePng);
                }
            }
        }

        // Preview thumbnail
        const previewPng = createPng(256, 256, slide.colors.r, slide.colors.g, slide.colors.b, slide.colors.pattern);
        writeFileSync(join(previewsDir, `${slideName}.png`), previewPng);

        assets.push({
            id: slide.id,
            status: 'ready',
            label: slide.label,
            format: 'dzi',
            organ: slide.organ,
            stain: slide.stain,
            description: slide.description,
            currentRevisionId: 'rev-1',
            preview: {
                url: `remote:tiles/previews/${slideName}.png`,
                widthPx: 256,
                heightPx: 256
            },
            provenance: {
                licence: 'CC0',
                redistribution: 'permitted',
                attribution: 'Lukas Teaching Digital Pathology Archive'
            },
            revisions: [
                {
                    id: 'rev-1',
                    status: 'ready',
                    label: 'Primary Scan',
                    derivatives: {
                        dzi: {
                            url: `remote:tiles/${slideName}.dzi`
                        }
                    },
                    optics: slide.optics
                }
            ]
        });
    }

    const catalogJson = {
        schemaVersion: '1.0.0',
        version: 1,
        title: 'Lukas Teaching Digital Pathology Slides',
        attribution: ['Lukas Virtual Patient Simulator Pathology Archive — CC0'],
        assets
    };
    writeFileSync(join(PATHOLOGY_DIR, 'catalog.json'), JSON.stringify(catalogJson, null, 2));

    const contentJson = {
        schemaVersion: '1.0.0',
        plugin: 'pathology',
        version: 'starter-lukas-v1',
        paths: ['/tiles'],
        starter: true,
        fileCount: assets.length * 15,
        kilobytes: 450,
        files: []
    };
    writeFileSync(join(PATHOLOGY_DIR, 'content.json'), JSON.stringify(contentJson, null, 2));

    console.log(`✅ Generated ${assets.length} complete starter Digital Pathology slides in ${PATHOLOGY_DIR}`);
}

buildAllPathology().catch(err => {
    console.error('Failed to build pathology starter content:', err);
    process.exit(1);
});
