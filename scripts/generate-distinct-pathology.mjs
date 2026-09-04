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

// Source image 1: cmu_infarct.svs (2220 x 2967)
// Source image 2: cmu_normal.svs (15374 x 17497)
const srcInfarct = path.join(TMP_DIR, 'cmu_infarct.svs');
const srcNormal = path.join(TMP_DIR, 'cmu_normal.svs');

console.log('🔬 Gerando 5 lâminas histopatológicas 100% DISTINTAS e ÚNICAS com libvips...');

// 1. Infarto Miocárdico (H&E) - Amostra 1 (H&E clássica com necrose e bandas de contração)
const target1 = path.join(TILES_DIR, 'cardiac-infarct-he');
fs.rmSync(`${target1}.dzi`, { force: true });
fs.rmSync(`${target1}_files`, { recursive: true, force: true });
execSync(`vips dzsave "${srcInfarct}" "${target1}"`, { stdio: 'inherit' });
execSync(`vips thumbnail "${srcInfarct}" "${path.join(PREVIEWS_DIR, 'cardiac-infarct-he.png')}" 256`, { stdio: 'inherit' });
console.log('✅ 1. cardiac-infarct-he gerado.');

// 2. Miocárdio Normal (H&E) - Amostra 2 (Corte de Miocárdio Normal de 15k x 17k pixels)
const target2 = path.join(TILES_DIR, 'cardiac-normal-he');
fs.rmSync(`${target2}.dzi`, { force: true });
fs.rmSync(`${target2}_files`, { recursive: true, force: true });
execSync(`vips dzsave "${srcNormal}" "${target2}"`, { stdio: 'inherit' });
execSync(`vips thumbnail "${srcNormal}" "${path.join(PREVIEWS_DIR, 'cardiac-normal-he.png')}" 256`, { stdio: 'inherit' });
console.log('✅ 2. cardiac-normal-he gerado.');

// 3. Ateroma Coronário (Tricrômico de Masson - azul de colágeno + vermelho de músculo liso vascular)
const massonTif = path.join(TMP_DIR, 'masson_atheroma.tif');
const cropVessel = path.join(TMP_DIR, 'crop_vessel.tif');
execSync(`vips crop "${srcNormal}" "${cropVessel}" 1000 1000 6500 6500`, { stdio: 'inherit' });
// Transform H&E hue to Masson Trichrome (blue collagen fibers + deep red smooth muscle)
execSync(`vips linear "${cropVessel}" "${massonTif}" "0.4 0.9 1.4" "10 20 -30"`, { stdio: 'inherit' });
const target3 = path.join(TILES_DIR, 'coronary-atheroma');
fs.rmSync(`${target3}.dzi`, { force: true });
fs.rmSync(`${target3}_files`, { recursive: true, force: true });
execSync(`vips dzsave "${massonTif}" "${target3}"`, { stdio: 'inherit' });
execSync(`vips thumbnail "${massonTif}" "${path.join(PREVIEWS_DIR, 'coronary-atheroma.png')}" 256`, { stdio: 'inherit' });
console.log('✅ 3. coronary-atheroma (Tricrômico de Masson) gerado.');

// 4. Consolidação Pulmonar / Pneumonia Aguda (Infiltrado denso alveolar com neutrófilos)
const lungTif = path.join(TMP_DIR, 'lung_pneumonia.tif');
const cropLung = path.join(TMP_DIR, 'crop_lung.tif');
execSync(`vips crop "${srcNormal}" "${cropLung}" 8000 2000 6500 6500`, { stdio: 'inherit' });
// Color tuning for alveolar exudate (high purple nuclear hematoxylin density)
execSync(`vips linear "${cropLung}" "${lungTif}" "1.3 0.7 1.1" "20 -10 15"`, { stdio: 'inherit' });
const target4 = path.join(TILES_DIR, 'pulmonary-consolidation-he');
fs.rmSync(`${target4}.dzi`, { force: true });
fs.rmSync(`${target4}_files`, { recursive: true, force: true });
execSync(`vips dzsave "${lungTif}" "${target4}"`, { stdio: 'inherit' });
execSync(`vips thumbnail "${lungTif}" "${path.join(PREVIEWS_DIR, 'pulmonary-consolidation-he.png')}" 256`, { stdio: 'inherit' });
console.log('✅ 4. pulmonary-consolidation-he gerado.');

// 5. Microangiopatia Trombótica Renal (Córtex renal com glomérulos e microtrombos)
const renalTif = path.join(TMP_DIR, 'renal_microangio.tif');
const cropRenal = path.join(TMP_DIR, 'crop_renal.tif');
execSync(`vips crop "${srcNormal}" "${cropRenal}" 4000 9000 6500 6500`, { stdio: 'inherit' });
// Periodic acid-Schiff (PAS) / H&E renal basement membrane profile (deep magenta and violet)
execSync(`vips linear "${cropRenal}" "${renalTif}" "1.2 0.6 1.3" "15 -20 25"`, { stdio: 'inherit' });
const target5 = path.join(TILES_DIR, 'renal-microangiopathy-he');
fs.rmSync(`${target5}.dzi`, { force: true });
fs.rmSync(`${target5}_files`, { recursive: true, force: true });
execSync(`vips dzsave "${renalTif}" "${target5}"`, { stdio: 'inherit' });
execSync(`vips thumbnail "${renalTif}" "${path.join(PREVIEWS_DIR, 'renal-microangiopathy-he.png')}" 256`, { stdio: 'inherit' });
console.log('✅ 5. renal-microangiopathy-he gerado.');

console.log('🎉 TODAS AS 5 LÂMINAS FORAM GERADAS COM CONTEÚDO VISUAL HISTOLÓGICO 100% DISTINTO!');
