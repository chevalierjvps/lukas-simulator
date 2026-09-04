import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const LAB_PATH = path.join(ROOT, 'server', 'data', 'lab_database.json');
const CARDIAC_LAB_PATH = path.join(ROOT, 'server', 'data', 'lab_cardiac_tests.txt');
const RAD_PATH = path.join(ROOT, 'server', 'data', 'radiology_database.json');

// --- 1. Translate Lab Database ---
const LAB_TRANSLATIONS = {
    // Groups
    'Hematology (CBC)': 'Hematologia (Hemograma)',
    'Hematology (Differential)': 'Hematologia (Leucograma / Diferencial)',
    'Basic Metabolic Panel': 'Painel Metabólico Básico (Eletrólitos e Renal)',
    'Renal Function': 'Função Renal',
    'Liver Function': 'Função Hepática (Hepatograma)',
    'Coagulation': 'Coagulograma',
    'Thyroid Function': 'Função Tireoidiana',
    'Blood Gases': 'Gasometria Arterial e Venosa',
    'Cardiac Markers': 'Marcadores de Necrose Miocárdica',
    'Cardiology Crisis': 'Crise Cardiológica & Coronariana',
    'Inflammatory Markers': 'Provas de Atividade Inflamatória',
    'Iron Studies': 'Perfil de Ferro e Cinética',
    'Vitamins': 'Vitaminas e Coenzimas',
    'Lipid Panel': 'Perfil Lipídico Completo',
    'Diabetes': 'Glicemia e Marcadores Diabéticos',
    'Metabolic': 'Marcadores Metabólicos e Ácido Úrico',
    'Urinalysis': 'Urina Tipo 1 (EAS) e Sedimento',
    'Pancreatic': 'Enzimas Pancreáticas',
    'Adrenal Function': 'Função Adrenal e Cortisol',
    'Reproductive Hormones': 'Hormônios Reprodutivos',
    'Tumor Markers': 'Marcadores Tumorais',
    'Parathyroid': 'Paratireoide e Metabolismo Ósseo',
    'Immunoglobulins': 'Imunoglobulinas e Sorologia',
    'Autoimmune': 'Autoimunidade e Reumatologia',
    'Cardiovascular Risk': 'Risco Cardiovascular',
    'Trace Elements': 'Oligoelementos e Minerais',
    'Toxicology': 'Toxicologia e Triagem',
    'Drug Levels': 'Monitorização Terapêutica de Drogas',
    'Cerebrospinal Fluid': 'Líquido Cefalorraquidiano (Líquor)',
    'Body Fluids': 'Líquidos Cavitários',
    'Pituitary': 'Eixo Hipofisário',
    'Hemolysis Markers': 'Marcadores de Hemólise',
    'Thrombophilia': 'Pesquisa de Trombofilias',

    // Test Names
    'Hemoglobin': 'Hemoglobina',
    'Hematocrit': 'Hematócrito',
    'Red Blood Cell Count (RBC)': 'Hemácias (Eritrócitos)',
    'White Blood Cell Count (WBC)': 'Leucócitos Totais',
    'Platelet Count': 'Plaquetas',
    'Mean Corpuscular Volume (MCV)': 'Volume Corpuscular Médio (VCM)',
    'Mean Corpuscular Hemoglobin (MCH)': 'Hemoglobina Corpuscular Média (HCM)',
    'Mean Corpuscular Hemoglobin Concentration (MCHC)': 'Concentração de Hemoglobina Corpuscular Média (CHCM)',
    'Red Cell Distribution Width (RDW)': 'RDW (Índice de Anisocitose)',
    'Neutrophils': 'Neutrófilos Segmentados',
    'Lymphocytes': 'Linfócitos',
    'Monocytes': 'Monócitos',
    'Eosinophils': 'Eosinófilos',
    'Basophils': 'Basófilos',
    'Band Neutrophils': 'Bastonetes (Neutrófilos Imaturos)',
    'Sodium, serum': 'Sódio Sérico (Na+)',
    'Potassium, serum': 'Potássio Sérico (K+)',
    'Chloride, serum': 'Cloreto Sérico (Cl-)',
    'Bicarbonate (CO2), serum': 'Bicarbonato Sérico (HCO3-)',
    'Blood Urea Nitrogen (BUN)': 'Ureia Sérica',
    'Creatinine, serum': 'Creatinina Sérica',
    'Glucose, fasting': 'Glicemia de Jejum',
    'Glucose, random': 'Glicemia Aleatória',
    'Calcium, total': 'Cálcio Total Sérico',
    'Calcium, ionized': 'Cálcio Iônico',
    'Magnesium, serum': 'Magnésio Sérico',
    'Phosphate (Phosphorus), serum': 'Fósforo Sérico',
    'Total Protein': 'Proteínas Totais',
    'Albumin, serum': 'Albumina Sérica',
    'Globulin, serum': 'Globulina Sérica',
    'Bilirubin, total': 'Bilirrubina Total',
    'Bilirubin, direct (conjugated)': 'Bilirrubina Direta (Conjugada)',
    'Bilirubin, indirect (unconjugated)': 'Bilirrubina Indireta (Não Conjugada)',
    'Aspartate Aminotransferase (AST/SGOT)': 'TGO / AST (Aspartato Aminotransferase)',
    'Alanine Aminotransferase (ALT/SGPT)': 'TGP / ALT (Alanina Aminotransferase)',
    'Alkaline Phosphatase (ALP)': 'Fosfatase Alcalina (FA)',
    'Gamma-Glutamyl Transferase (GGT)': 'Gama-Glutamil Transferase (GGT)',
    'Prothrombin Time (PT)': 'Tempo de Protrombina (TP)',
    'International Normalized Ratio (INR)': 'INR (RNI)',
    'Activated Partial Thromboplastin Time (aPTT)': 'TTPA (Tempo de Tromboplastina Parcial Ativada)',
    'Fibrinogen': 'Fibrinogênio',
    'D-Dimer': 'D-Dímero',
    'Thyroid-Stimulating Hormone (TSH)': 'TSH (Hormônio Tireoestimulante)',
    'Free Thyroxine (Free T4)': 'T4 Livre (Tiroxina Livre)',
    'Free Triiodothyronine (Free T3)': 'T3 Livre',
    'Total T4': 'T4 Total',
    'Total T3': 'T3 Total',
    'pH, arterial blood': 'pH Gasometria Arterial',
    'pCO2, arterial blood': 'pCO2 Arterial',
    'pO2, arterial blood': 'pO2 Arterial',
    'HCO3, arterial blood': 'Bicarbonato (HCO3) Gasometria',
    'Base Excess, arterial blood': 'Base Excess (BE) Gasometria',
    'Oxygen Saturation (SaO2), arterial': 'Saturação Arterial de Oxigênio (SaO2)',
    'Lactate (Lactic Acid), plasma': 'Lactato Sérico Arterial/Venoso',
    'Troponin I, cardiac': 'Troponina I Cardíaca',
    'Troponin T, cardiac': 'Troponina T Cardíaca',
    'High-Sensitivity Troponin I': 'Troponina I Ultrassensível (hs-cTnI)',
    'High-Sensitivity Troponin T': 'Troponina T Ultrassensível (hs-cTnT)',
    'Creatine Kinase-MB (CK-MB)': 'CK-MB Massa',
    'Creatine Kinase (CK), Total': 'CK Total (Creatinoquinase)',
    'Myoglobin, serum': 'Mioglobina Sérica',
    'BNP (B-type Natriuretic Peptide)': 'BNP (Peptídeo Natriurético Tipo B)',
    'NT-proBNP': 'NT-proBNP',
    'C-Reactive Protein (CRP), high-sensitivity': 'Proteína C-Reativa Ultrassensível (PCR-us)',
    'C-Reactive Protein (CRP), standard': 'Proteína C-Reativa (PCR)',
    'Erythrocyte Sedimentation Rate (ESR)': 'VHS (Velocidade de Hemossedimentação)',
    'Procalcitonin': 'Procalcitonina',
    'Ferritin, serum': 'Ferritina Sérica',
    'Iron, total serum': 'Ferro Sérico',
    'Total Iron-Binding Capacity (TIBC)': 'Capacidade Total de Ligação do Ferro (TIBC)',
    'Transferrin Saturation': 'Saturação de Transferrina',
    'Vitamin B12 (Cobalamin)': 'Vitamina B12',
    'Folate (Folic Acid), serum': 'Ácido Fólico (Folato)',
    'Vitamin D (25-Hydroxyvitamin D)': 'Vitamina D (25-OH Vitamina D)',
    'Total Cholesterol': 'Colesterol Total',
    'HDL Cholesterol': 'Colesterol HDL (Bom)',
    'LDL Cholesterol (calculated)': 'Colesterol LDL (Calculado)',
    'Triglycerides': 'Triglicerídeos',
    'HbA1c (Glycated Hemoglobin)': 'Hemoglobina Glicada (HbA1c)',
    'Uric Acid, serum': 'Ácido Úrico Sérico',
    'Amylase, serum': 'Amilase Sérica',
    'Lipase, serum': 'Lipase Sérica'
};

if (fs.existsSync(LAB_PATH)) {
    const rawLabs = JSON.parse(fs.readFileSync(LAB_PATH, 'utf8'));
    const updatedLabs = rawLabs.map(item => {
        const ptName = LAB_TRANSLATIONS[item.test_name] || item.test_name;
        const ptGroup = LAB_TRANSLATIONS[item.group] || item.group;
        let ptCategory = item.category;
        if (item.category === 'Male') ptCategory = 'Masculino';
        else if (item.category === 'Female') ptCategory = 'Feminino';
        else if (item.category === 'General') ptCategory = 'Geral';
        else if (item.category === 'Adult') ptCategory = 'Adulto';

        return {
            ...item,
            test_name: ptName,
            original_test_name: item.test_name,
            group: ptGroup,
            category: ptCategory
        };
    });
    fs.writeFileSync(LAB_PATH, JSON.stringify(updatedLabs, null, 2), 'utf8');
    console.log(`Updated ${updatedLabs.length} lab tests in lab_database.json with Portuguese translations`);
}

if (fs.existsSync(CARDIAC_LAB_PATH)) {
    const rawCardiac = JSON.parse(fs.readFileSync(CARDIAC_LAB_PATH, 'utf8'));
    const updatedCardiac = rawCardiac.map(item => {
        const ptName = LAB_TRANSLATIONS[item.test_name] || item.test_name;
        const ptGroup = LAB_TRANSLATIONS[item.group] || item.group;
        let ptCategory = item.category;
        if (item.category === 'Male') ptCategory = 'Masculino';
        else if (item.category === 'Female') ptCategory = 'Feminino';
        else if (item.category === 'General') ptCategory = 'Geral';

        return {
            ...item,
            test_name: ptName,
            original_test_name: item.test_name,
            group: ptGroup,
            category: ptCategory
        };
    });
    fs.writeFileSync(CARDIAC_LAB_PATH, JSON.stringify(updatedCardiac, null, 2), 'utf8');
    console.log(`Updated ${updatedCardiac.length} cardiac lab tests in lab_cardiac_tests.txt with Portuguese translations`);
}

// --- 2. Translate Radiology Database ---
const RAD_STUDY_TRANSLATIONS = {
    'xray_chest_pa': {
        name: 'Raio-X de Tórax (PA e Perfil)',
        modality: 'Radiografia',
        body_region: 'Tórax',
        indications: ['Pneumonia', 'Insuficiência cardíaca', 'Nódulo/Massa pulmonar', 'Fratura de costela', 'Derrame pleural'],
        normal_findings: 'Campos pleuropulmonares transparentes, sem consolidações focais, derrame pleural ou pneumotórax. Área cardíaca de dimensões normais. Mediastino centrado de contornos anatômicos normais. Estruturas ósseas íntegras. Seios costofrênicos e cardiofrênicos livres.',
        normal_interpretation: '1. Radiografia de tórax dentro dos limites da normalidade.\n2. Índice cardiotorácico preservado.\n3. Ausência de infiltrados ou congestão.'
    },
    'xray_chest_portable': {
        name: 'Raio-X de Tórax no Leito (AP Portátil)',
        modality: 'Radiografia',
        body_region: 'Tórax',
        indications: ['Monitorização em UTI', 'Controle pós-intubação / TOT', 'Posicionamento de Cateter Venoso Central', 'Desconforto agudo no leito'],
        normal_findings: 'Radiografia de tórax no leito em incidência AP demonstrando parênquima pulmonar sem consolidações grosseiras. Silhueta cardíaca com magnificação habitual pelo método AP. Ausência de pneumotórax. Dispositivos invasivos bem posicionados.',
        normal_interpretation: '1. Sem alterações pleuropulmonares agudas evidenciáveis no leito.\n2. Dispositivos invasivos em topografia adequada (quando presentes).'
    },
    'xray_abdomen': {
        name: 'Radiografia Simples de Abdome (KUB)',
        modality: 'Radiografia',
        body_region: 'Abdome',
        indications: ['Abdome agudo obstrutivo', 'Cálculo renal radiopaco', 'Constipação fecal', 'Corpo estranho'],
        normal_findings: 'Distribuição habitual dos gases gastrointestinais, sem níveis hidroaéreos patológicos ou dilatações de alças intestinais. Ausência de pneumoperitônio (ar livre subdiafragmático). Sombras das lojas renais e dos músculos psoas com contornos preservados. Ausência de calcificações anormais.',
        normal_interpretation: '1. Padrão gasoso fisiológico sem sinais de obstrução intestinal mecânica.\n2. Ausência de pneumoperitônio ou cálculos radiopacos.'
    },
    'ct_head_noncon': {
        name: 'Tomografia Computadorizada de Crânio (Sem Contraste)',
        modality: 'Tomografia Computadorizada',
        body_region: 'Crânio / Encéfalo',
        indications: ['Suspeita de AVC agudo (isquêmico vs hemorrágico)', 'Traumatismo cranioencefálico (TCE)', 'Cefaleia súbita intensa (Thunderclap)', 'Rebaixamento de consciência'],
        normal_findings: 'Parênquima encefálico com coeficientes de atenuação normais, com adequada diferenciação entre as substâncias branca e cinzenta. Ausência de hemorragias intra ou extra-axiais agudas. Sistema ventricular simétrico e de dimensões normais para a faixa etária. Linha média centrada, sem desvios ou herniações. Cisternas da base e sulcos corticais preservados. Calota craniana íntegra.',
        normal_interpretation: '1. Ausência de hemorragia intracraniana aguda ou efeito de massa expansivo.\n2. Ausência de sinais precoces de infarto territorial extenso (ASPECTS 10/10).'
    },
    'ct_chest_con': {
        name: 'Tomografia de Tórax com Contraste Venoso',
        modality: 'Tomografia Computadorizada',
        body_region: 'Tórax',
        indications: ['Empiema pleural', 'Massa mediastinal', 'Estadiamento oncológico', 'Infecção pulmonar complicada'],
        normal_findings: 'Parênquima pulmonar sem consolidações, massas ou áreas de atenuação em vidro fosco. Mediastino anatômico sem linfonodomegalias patológicas. Grandes vasos torácicos pérvios com opacificação homogênea pelo meio de contraste. Ausência de derrame pleural ou pericárdico.',
        normal_interpretation: '1. Exame tomográfico do tórax com contraste dentro dos limites anatômicos habituais.'
    },
    'cta_chest': {
        name: 'Angiotomografia de Tórax (Protocolo TEP / Tromboembolismo)',
        modality: 'Tomografia Computadorizada',
        body_region: 'Tórax / Vascular',
        indications: ['Suspeita clínica de Tromboembolismo Pulmonar (TEP)', 'Dor torácica pleurítica súbita', 'Hipoxemia inexplicada', 'Dispneia súbita com D-Dímero elevado'],
        normal_findings: 'Excelente opacificação contrastada do tronco da artéria pulmonar e dos ramos principais direito e esquerdo, bem como dos ramos lobares, segmentares e subsegmentares. Ausência de falhas de enchimento vasculares endoluminais. Relação ventrículo direito/ventrículo esquerdo (VD/VE) normal (< 0.9), sem sinais de sobrecarga ventricular direita. Parênquima pulmonar sem infartos.',
        normal_interpretation: '1. Ausência de sinais tomográficos de tromboembolismo pulmonar agudo.\n2. Ausência de sinais de cor pulmonale agudo.'
    },
    'echo_tte': {
        name: 'Ecocardiograma Transtorácico (ECO TT)',
        modality: 'Ultrassonografia / Cardiologia',
        body_region: 'Tórax / Coração',
        indications: ['Insuficiência cardíaca', 'Avaliação de síncope ou dor torácica', 'Pesquisa de valvopatias', 'Infarto agudo do miocárdio'],
        normal_findings: 'Ventrículo esquerdo com dimensões cavitárias e espessura parietal normais. Fração de ejeção do ventrículo esquerdo (FEVE) preservada estimada em 64% (método de Simpson biplanar). Contratilidade segmentar e global preservada, sem discinesias ou acinesias. Valvas cardíacas aórtica, mitral, tricúspide e pulmonar com abertura e fechamento normais, sem refluxos ou estênoses significativas. Átrio esquerdo e cavidades direitas normais. Pericárdio livre de derrame.',
        normal_interpretation: '1. Função sistólica global e segmentar do VE preservada (FEVE 64%).\n2. Ausência de alterações valvares hemodinamicamente relevantes.\n3. Pericárdio sem derrame.'
    },
    'ccta': {
        name: 'Angiotomografia de Artérias Coronárias (Angio-TC Coronária)',
        modality: 'Cardiologia / TC',
        body_region: 'Tórax / Coronárias',
        indications: ['Estratificação de dor torácica aguda em sala de emergência', 'Suspeita de doença arterial coronariana', 'Score de cálcio e anatomia coronariana'],
        normal_findings: 'Origem anatômica e trajeto habitual das artérias coronárias. Tronco da coronária esquerda (TCE), artéria descendente anterior (DA), artéria circunflexa (CX) e artéria coronária direita (CD) pérvias, com lúmen regular e ausência de placas ateroscleróticas estenosantes significativas (< 25% de estenose luminal). Escore de Cálcio de Agatston: 0.',
        normal_interpretation: '1. Artérias coronárias pérvias sem evidência de estenose obstrutiva significativa (CAD-RADS 0).\n2. Escore de cálcio Agatston = 0 (baixo risco cardiovascular).'
    },
    'us_fast': {
        name: 'POCUS FAST / E-FAST (Trauma e Emergência)',
        modality: 'Ultrassonografia',
        body_region: 'Abdome e Tórax',
        indications: ['Trauma abdominal contuso/penetrante', 'Choque hipovolêmico de origem indeterminada', 'Instabilidade hemodinâmica na sala vermelha'],
        normal_findings: 'Janela hepatorrenal (Espaço de Morrison): sem lâmina líquida anecoica livre. Janela esplenorrenal: sem líquido livre intraperitoneal. Janela suprapúbica / retrovesical: ausência de líquido livre na pelve. Janela subxifoide pericárdica: sem derrame pericárdico ou tamponamento cardíaco. Janelas pleurais anteriores: presença de deslizamento pleural (lung sliding) e linhas A bilaterais, descartando pneumotórax.',
        normal_interpretation: '1. Protocolo E-FAST negativo para líquido livre intra-abdominal ou pélvico.\n2. Ausência de hemopericárdio ou tamponamento cardíaco.\n3. Ausência de pneumotórax bilateral.'
    },
    'cardiac_cath': {
        name: 'Cineangiocoronariografia (Cateterismo Cardíaco)',
        modality: 'Hemodinâmica / Intervencionista',
        body_region: 'Coração / Coronárias',
        indications: ['Síndrome Coronariana Aguda (SCA / IAM com e sem supra de ST)', 'Angina refratária', 'Estratificação invasiva de alto risco'],
        normal_findings: 'Acesso vascular femoral/radial com introdutor posicionado. Ventriculografia esquerda revelando cavidade de dimensões normais e função contrátil preservada. Coronária esquerda: TCE sem lesões; artéria DA e ramos diagonais sem estenoses; artéria CX e marginais sem obstruções. Coronária direita dominante, com fluxo coronário TIMI 3 preservado em todas as artérias.',
        normal_interpretation: '1. Árvore coronária isenta de lesões ateromatosas obstrutivas (ausência de DAC obstrutiva).\n2. Fluxo coronário distal TIMI 3 mantido.'
    }
};

if (fs.existsSync(RAD_PATH)) {
    const rawRad = JSON.parse(fs.readFileSync(RAD_PATH, 'utf8'));
    const updatedStudies = (rawRad.studies || []).map(study => {
        const trans = RAD_STUDY_TRANSLATIONS[study.id];
        if (trans) {
            return {
                ...study,
                name: trans.name,
                modality: trans.modality,
                body_region: trans.body_region,
                common_indications: trans.indications,
                normal_findings: trans.normal_findings,
                normal_interpretation: trans.normal_interpretation
            };
        }
        return study;
    });
    fs.writeFileSync(RAD_PATH, JSON.stringify({ ...rawRad, studies: updatedStudies }, null, 2), 'utf8');
    console.log(`Updated ${updatedStudies.length} radiology studies in radiology_database.json with Portuguese translations`);
}
