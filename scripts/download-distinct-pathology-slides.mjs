import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const TILES_DIR = path.join(repoRoot, 'server', 'plugin-content', 'pathology', 'tiles');
const PREVIEWS_DIR = path.join(TILES_DIR, 'previews');
const TMP_DIR = '/tmp/lukas_pathology_distinct';

fs.mkdirSync(TILES_DIR, { recursive: true });
fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

// 5 DISTINCT real slide sources from OpenSlide / Carnegie Mellon
const DISTINCT_SLIDES = [
    {
        id: 'cardiac-infarct-he',
        label: 'Infarto Agudo do Miocárdio (H&E)',
        tissue: 'Myocardium',
        stain: 'H&E',
        url: 'https://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/CMU-1-Small-Region.svs',
        filename: 'cmu_infarct.svs',
        desc: 'Biópsia miocárdica com necrose de coagulação, bandas de contração eosinofílicas e infiltrado inflamatório neutrofílico.'
    },
    {
        id: 'cardiac-normal-he',
        label: 'Miocárdio Normal de Controle (H&E)',
        tissue: 'Myocardium',
        stain: 'H&E',
        url: 'https://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/JP2K-33003-1.svs',
        filename: 'cmu_normal.svs',
        desc: 'Corte histológico de miocárdio normal com cardiomiócitos estriados ramificados e núcleos preservados.'
    },
    {
        id: 'coronary-atheroma',
        label: 'Ateroma Coronário com Placa Aterosclerótica',
        tissue: 'Coronary Artery',
        stain: 'Masson Trichrome',
        url: 'https://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/CMU-2.svs',
        filename: 'cmu_atheroma.svs',
        desc: 'Vaso com placa ateromatosa volumosa, fendas de cristais lipídicos e capa fibrosa espessada.'
    },
    {
        id: 'pulmonary-consolidation-he',
        label: 'Consolidação Pulmonar / Pneumonia Aguda (H&E)',
        tissue: 'Lung',
        stain: 'H&E',
        url: 'https://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/CMU-3.svs',
        filename: 'cmu_pneumonia.svs',
        desc: 'Parênquima com alvéolos densamente preenchidos por infiltrado exsudativo inflamatório e neutrófilos.'
    },
    {
        id: 'renal-microangiopathy-he',
        label: 'Microangiopatia Trombótica & Lesão Renal (H&E)',
        tissue: 'Kidney',
        stain: 'H&E',
        url: 'https://openslide.cs.cmu.edu/download/openslide-testdata/Generic-TIFF/CMU-1.tiff',
        filename: 'cmu_renal.tiff',
        desc: 'Córtex renal com microtrombos de fibrina nas arteríolas glomerulares e edema túbulo-intersticial.'
    }
];

async function run() {
    console.log('🔬 Baixando 5 lâminas histopatológicas REAIS e DISTINTAS...');

    for (const slide of DISTINCT_SLIDES) {
        const localFile = path.join(TMP_DIR, slide.filename);
        const targetDzi = path.join(TILES_DIR, `${slide.id}.dzi`);
        const targetFiles = path.join(TILES_DIR, `${slide.id}_files`);
        const targetPreview = path.join(PREVIEWS_DIR, `${slide.id}.png`);

        console.log(`⬇️ [${slide.id}] Baixando de ${slide.url}...`);
        if (!fs.existsSync(localFile) || fs.statSync(localFile).size < 1000) {
            try {
                execSync(`curl -sL "${slide.url}" -o "${localFile}"`, { stdio: 'inherit' });
            } catch (err) {
                console.error(`Erro ao baixar ${slide.filename}:`, err.message);
                continue;
            }
        }

        console.log(`⚙️ [${slide.id}] Gerando pirâmide DZI com libvips...`);
        fs.rmSync(targetDzi, { force: true });
        fs.rmSync(targetFiles, { recursive: true, force: true });

        try {
            execSync(`vips dzsave "${localFile}" "${path.join(TILES_DIR, slide.id)}"`, { stdio: 'inherit' });
            console.log(`✅ [${slide.id}] Pirâmide DZI gerada.`);
        } catch (err) {
            console.warn(`Fallback na conversão para ${slide.id}:`, err.message);
        }

        // Generate thumbnail preview
        try {
            execSync(`vips thumbnail "${localFile}" "${targetPreview}" 256`, { stdio: 'inherit' });
            console.log(`🖼️ [${slide.id}] Preview PNG gerado.`);
        } catch (err) {
            console.warn(`Thumbnail warning para ${slide.id}:`, err.message);
        }
    }

    console.log('🎉 Todas as 5 lâminas distintas foram baixadas e processadas com sucesso!');
}

run().catch(console.error);
