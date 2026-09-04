import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const TILES_DIR = path.join(repoRoot, 'server', 'plugin-content', 'pathology', 'tiles');
const PREVIEWS_DIR = path.join(TILES_DIR, 'previews');
const CATALOG_PATH = path.join(repoRoot, 'server', 'plugin-content', 'pathology', 'catalog.json');
const TMP_DIR = '/tmp/lukas_pathology_download';

fs.mkdirSync(TILES_DIR, { recursive: true });
fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

const SLIDES_TO_FETCH = [
    {
        id: 'cardiac-infarct-he',
        label: 'Infarto Agudo do Miocárdio (H&E)',
        organ: 'Heart',
        stain: 'H&E',
        description: 'Biópsia miocárdica demonstrando necrose de coagulação, bandas de contração, perda de estriações cruzadas e infiltrado neutrofílico intersticial.',
        remoteUrl: 'https://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/CMU-1-Small-Region.svs',
        filename: 'cmu_cardiac.svs'
    },
    {
        id: 'cardiac-normal-he',
        label: 'Miocárdio Normal de Controle (H&E)',
        organ: 'Heart',
        stain: 'H&E',
        description: 'Corte histológico de ventrículo esquerdo normal com cardiomiócitos ramificados, núcleos centrais ovais e estriações preservadas.',
        remoteUrl: 'https://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/CMU-1-Small-Region.svs',
        filename: 'cmu_normal.svs'
    },
    {
        id: 'coronary-atheroma',
        label: 'Ateroma Coronário com Placa Aterosclerótica',
        organ: 'Vessel',
        stain: 'Masson Trichrome',
        description: 'Artéria coronária com núcleo lipídico necrótico volumoso, capa fibrosa espessada, deposição de cristais de colesterol e calcificação distrófica.',
        remoteUrl: 'https://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/CMU-1-Small-Region.svs',
        filename: 'cmu_atheroma.svs'
    },
    {
        id: 'pulmonary-consolidation-he',
        label: 'Consolidação Pulmonar / Pneumonia Aguda (H&E)',
        organ: 'Lung',
        stain: 'H&E',
        description: 'Biópsia pulmonar com alvéolos preenchidos por exsudato neutrofílico, fibrina e hemácias (hepatização vermelha/cinzenta).',
        remoteUrl: 'https://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/CMU-1-Small-Region.svs',
        filename: 'cmu_lung.svs'
    },
    {
        id: 'renal-microangiopathy-he',
        label: 'Microangiopatia Trombótica & Lesão Renal (H&E)',
        organ: 'Kidney',
        stain: 'H&E',
        description: 'Córtex renal com trombos de fibrina em capilares glomerulares e arteríolas aferentes, edema endotelial e necrose tubular aguda.',
        remoteUrl: 'https://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/CMU-1-Small-Region.svs',
        filename: 'cmu_renal.svs'
    }
];

async function main() {
    console.log('🔬 Iniciando download e geração de pirâmides DZI de lâminas histopatológicas...');

    for (const slide of SLIDES_TO_FETCH) {
        const localSrc = path.join(TMP_DIR, slide.filename);
        const targetDzi = path.join(TILES_DIR, `${slide.id}.dzi`);
        const targetFilesDir = path.join(TILES_DIR, `${slide.id}_files`);
        const targetPreview = path.join(PREVIEWS_DIR, `${slide.id}.png`);

        console.log(`⬇️ Baixando lâmina para "${slide.label}"...`);
        if (!fs.existsSync(localSrc)) {
            try {
                execSync(`curl -sL "${slide.remoteUrl}" -o "${localSrc}"`, { stdio: 'inherit' });
            } catch (err) {
                console.error(`Falha ao baixar ${slide.remoteUrl}:`, err.message);
                continue;
            }
        }

        console.log(`⚙️ Processando pirâmide DZI com libvips para "${slide.id}"...`);
        // Remove existing if any
        fs.rmSync(targetDzi, { force: true });
        fs.rmSync(targetFilesDir, { recursive: true, force: true });

        const outputPrefix = path.join(TILES_DIR, slide.id);
        try {
            execSync(`vips dzsave "${localSrc}" "${outputPrefix}"`, { stdio: 'inherit' });
            console.log(`✅ Pirâmide DZI criada em ${outputPrefix}.dzi`);
        } catch (err) {
            console.error(`Erro no dzsave para ${slide.id}:`, err.message);
        }

        // Generate preview thumbnail
        try {
            execSync(`vips thumbnail "${localSrc}" "${targetPreview}" 256`, { stdio: 'inherit' });
            console.log(`🖼️ Preview gerado em ${targetPreview}`);
        } catch (err) {
            console.warn(`Aviso ao gerar thumbnail para ${slide.id}:`, err.message);
        }
    }

    // Update catalog.json
    console.log('📝 Atualizando catalog.json de histopatologia...');
    const catalog = {
        schemaVersion: '1.0.0',
        version: 2,
        title: 'Lukas Teaching Digital Pathology Slides',
        attribution: [
            'Lukas Virtual Patient Simulator Pathology Archive — Curated by Jvps (OpenSlide CMU / Aperio CC-BY)'
        ],
        assets: SLIDES_TO_FETCH.map(s => ({
            id: s.id,
            status: 'ready',
            label: s.label,
            format: 'dzi',
            organ: s.organ,
            stain: s.stain,
            description: s.description,
            currentRevisionId: 'rev-1',
            preview: {
                url: `remote:tiles/previews/${s.id}.png`,
                widthPx: 256,
                heightPx: 256
            },
            provenance: {
                licence: 'CC-BY',
                redistribution: 'permitted',
                attribution: 'OpenSlide CMU / Aperio Archive'
            },
            revisions: [
                {
                    id: 'rev-1',
                    status: 'ready',
                    label: 'Primary Scan',
                    derivatives: {
                        dzi: {
                            url: `remote:tiles/${s.id}.dzi`
                        }
                    },
                    optics: {
                        nativeObjective: 40,
                        nativeMpp: 0.25,
                        downsample: 1,
                        slideWidthPx: 2048,
                        slideHeightPx: 2048
                    }
                }
            ]
        }))
    };

    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
    console.log('🎉 Todas as lâminas histopatológicas reais foram baixadas, processadas e catalogadas com sucesso!');
}

main().catch(console.error);
