import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../server/database.sqlite');

const db = new Database(dbPath);

const SLIDES = [
    {
        id: 'slide-1',
        label: 'Miocárdio Infartado (H&E)',
        dzi: 'remote:tiles/cardiac-infarct-he.dzi',
        stain: 'H&E',
        tissue: 'Myocardium',
        nativeObjective: 40,
        nativeMpp: 0.25,
        downsample: 1,
        slideWidthPx: 2220,
        slideHeightPx: 2967
    },
    {
        id: 'slide-2',
        label: 'Miocárdio Normal de Controle (H&E)',
        dzi: 'remote:tiles/cardiac-normal-he.dzi',
        stain: 'H&E',
        tissue: 'Myocardium',
        nativeObjective: 40,
        nativeMpp: 0.25,
        downsample: 1,
        slideWidthPx: 15374,
        slideHeightPx: 17497
    },
    {
        id: 'slide-3',
        label: 'Placa Aterosclerótica Coronária (Tricrômico de Masson)',
        dzi: 'remote:tiles/coronary-atheroma.dzi',
        stain: 'Masson Trichrome',
        tissue: 'Coronary Artery',
        nativeObjective: 40,
        nativeMpp: 0.25,
        downsample: 1,
        slideWidthPx: 6500,
        slideHeightPx: 6500
    },
    {
        id: 'slide-4',
        label: 'Consolidação Pulmonar / Pneumonia Aguda (H&E)',
        dzi: 'remote:tiles/pulmonary-consolidation-he.dzi',
        stain: 'H&E',
        tissue: 'Lung',
        nativeObjective: 40,
        nativeMpp: 0.25,
        downsample: 1,
        slideWidthPx: 6500,
        slideHeightPx: 6500
    },
    {
        id: 'slide-5',
        label: 'Microangiopatia Trombótica & Lesão Renal (H&E)',
        dzi: 'remote:tiles/renal-microangiopathy-he.dzi',
        stain: 'H&E',
        tissue: 'Kidney',
        nativeObjective: 40,
        nativeMpp: 0.25,
        downsample: 1,
        slideWidthPx: 6500,
        slideHeightPx: 6500
    }
];

console.log('🔄 Atualizando todos os casos com as 5 lâminas calibradas...');
const rows = db.prepare('SELECT id, config FROM cases').all();

for (const row of rows) {
    let config = {};
    try {
        config = JSON.parse(row.config || '{}');
    } catch {
        config = {};
    }
    config.pathology = {
        title: 'Estudos Histopatológicos e Biópsias',
        slides: SLIDES
    };
    db.prepare('UPDATE cases SET config = ? WHERE id = ?').run(JSON.stringify(config), row.id);
}

// Clear past temporary simulation sessions so the learner starts completely fresh
try {
    db.prepare('DELETE FROM sessions').run();
    db.prepare('DELETE FROM session_events').run();
    console.log('🧹 Sessões anteriores limpas com sucesso.');
} catch (e) {
    console.warn('Nota sobre sessions:', e.message);
}

console.log('🎉 Banco de dados atualizado e limpo com sucesso!');
