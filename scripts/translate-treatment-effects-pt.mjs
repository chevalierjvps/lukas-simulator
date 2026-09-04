import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { seedTreatmentEffects } from './seed-treatment-effects.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const DATA_PATH = path.join(repoRoot, 'server', 'data', 'treatment_effects.json');
const DB_PATH = path.join(repoRoot, 'server', 'database.sqlite');

const PT_TRANSLATIONS = {
    // Vasoactive & Resuscitation
    "Epinephrine": { name: "Adrenalina (Epinefrina)", desc: "Simpaticomimético / Vasopressor - Aumenta FC, contratilidade miocárdica e PAM; broncodilatador potente." },
    "Norepinephrine": { name: "Noradrenalina", desc: "Vasopressor potente alfa-1 e beta-1 - Droga de primeira escolha no choque séptico e vasodilatador." },
    "Dopamine": { name: "Dopamina", desc: "Inotrópico e vasopressor dose-dependente (efeitos dopaminérgicos, beta-1 e alfa-1)." },
    "Dobutamine": { name: "Dobutamina", desc: "Inotrópico positivo sintético beta-1 seletivo - Aumenta débito cardíaco com redução discreta de RVS no choque cardiogênico." },
    "Vasopressin": { name: "Vasopressina", desc: "Hormônio antidiurético / Vasoconstritor V1 - Droga de segunda linha no choque refratário a noradrenalina." },
    "Phenylephrine": { name: "Fenilefrina", desc: "Agonista alfa-1 adrenérgico puro - Aumenta RVS e PAM sem efeito cronotrópico direto." },
    "Milrinone": { name: "Milrinona", desc: "Inodilatador inibidor da PDE-3 - Aumenta contratilidade e promove vasodilatação pulmonar e sistêmica." },
    "Isoproterenol": { name: "Isoproterenol (Isoprenalina)", desc: "Agonista beta-1 e beta-2 puro - Cronotrópico e inotrópico potente para bradicardias refratárias." },

    // Antiarrhythmics & Antihypertensives
    "Atropine": { name: "Atropina", desc: "Anticolinérgico / Parassimpatolítico - Aumenta FC no nó sinusal e condução AV; antídoto em intoxicação por organofosforados." },
    "Adenosine": { name: "Adenosina", desc: "Antiarrítmico de ação ultra-rápida - Bloqueio transitório do nó AV para reversão de TPSV." },
    "Amiodarone": { name: "Amiodarona", desc: "Antiarrítmico Classe III com ações múltiplas - Controle de taquiarritmias ventriculares e supraventriculares." },
    "Lidocaine": { name: "Lidocaína", desc: "Antiarrítmico Classe IB e anestésico local - Supressão de arritmias ventriculares (TV/FV)." },
    "Procainamide": { name: "Procainamida", desc: "Antiarrítmico Classe IA - Prolonga potencial de ação e condução cardíaca." },
    "Diltiazem": { name: "Diltiazem", desc: "Bloqueador dos canais de cálcio não-di-hidropiridínico - Controle de resposta ventricular em FA/Flutter." },
    "Verapamil": { name: "Verapamil", desc: "Bloqueador de canal de cálcio de ação nodal - Reversão e controle de taquiarritmias supraventriculares." },
    "Digoxin": { name: "Digoxina", desc: "Glicosídeo cardíaco inibidor da Na+/K+ ATPase - Aumenta contratilidade e reduz condução no nó AV." },
    "Metoprolol": { name: "Metoprolol", desc: "Betabloqueador seletivo beta-1 - Reduz FC, pressão arterial e consumo miocárdico de O₂." },
    "Esmolol": { name: "Esmolol", desc: "Betabloqueador de ação ultra-curta - Titulação rápida em emergências aórticas e hipertensivas." },
    "Labetalol": { name: "Labetalol", desc: "Bloqueador alfa-1 e beta não-seletivo - Primeira linha em emergências hipertensivas, dissecção de aorta e pré-eclâmpsia." },
    "Carvedilol": { name: "Carvedilol", desc: "Betabloqueador não-seletivo com ação vasodilatadora alfa-1." },
    "Propranolol": { name: "Propranolol", desc: "Betabloqueador não-seletivo clássico - Tratamento de tempestade tireotóxica e profilaxia de varizes esofágicas." },
    "Atenolol": { name: "Atenolol", desc: "Betabloqueador cardiosseletivo beta-1 de ação prolongada." },
    "Bisoprolol": { name: "Bisoprolol", desc: "Betabloqueador seletivo beta-1 para insuficiência cardíaca e hipertensão." },
    "Sotalol": { name: "Sotalol", desc: "Antiarrítmico Classe III com propriedades betabloqueadoras não-seletivas." },
    "Flecainide": { name: "Flecainida", desc: "Antiarrítmico Classe IC para cardioversão química de fibrilação atrial em coração estruturalmente normal." },
    "Propafenone": { name: "Propafenona", desc: "Antiarrítmico Classe IC com discreta ação betabloqueadora - Reversão de FA em paciente sem cardiopatia." },
    "Nitroglycerin": { name: "Nitroglicerina", desc: "Vasodilatador venoso e coronariano predominante - Alívio da dor anginosa e redução de pré-carga no EAP." },
    "Sodium Nitroprusside": { name: "Nitroprussiato de Sódio", desc: "Vasodilatador arterial e venoso potente - Redução imediata de pós-carga em crises hipertensivas graves." },
    "Hydralazine": { name: "Hidralazina", desc: "Vasodilatador arteriolar direto - Tratamento de emergências hipertensivas na gestação (pré-eclâmpsia/eclâmpsia)." },
    "Nicardipine": { name: "Nicardipina", desc: "Bloqueador de canal de cálcio di-hidropiridínico intravenoso para controle pressórico em AVC e hemorragia subaracnóidea." },
    "Clevidipine": { name: "Clevidipina", desc: "Bloqueador de canal de cálcio de ação ultra-curta metabolizado por esterases plasmáticas." },
    "Clonidine": { name: "Clonidina", desc: "Agonista alfa-2 adrenérgico central - Redução do tônus simpático em urgências hipertensivas e abstinência." },
    "Enalaprilat": { name: "Enalaprilato", desc: "Inibidor da ECA intravenoso para controle de hipertensão aguda." },
    "Captopril": { name: "Captopril", desc: "Inibidor da ECA de ação rápida por via oral/sublingual." },
    "Losartan": { name: "Losartana Potássica", desc: "Bloqueador do receptor de angiotensina II (BRA)." },
    "Amlodipine": { name: "Anlodipino", desc: "Bloqueador de canal de cálcio di-hidropiridínico oral." },

    // Analgesics, Sedatives & Anesthetics
    "Morphine": { name: "Morfina", desc: "Opioide analgésico potente - Alívio de dor aguda severa e redução de pré-carga no edema agudo de pulmão." },
    "Fentanyl": { name: "Fentanil", desc: "Opioide sintético de alta potência e ação rápida - Analgesia em intubação, sedação e dor intensa." },
    "Hydromorphone": { name: "Hidromorfona", desc: "Opioide analgésico semissintético potente para dor refratária." },
    "Tramadol": { name: "Tramadol", desc: "Opioide fraco com inibição de recaptação de serotonina/noradrenalina - Analgesia moderada a grave." },
    "Ketamine": { name: "Cetamina (Ketamina)", desc: "Anestésico dissociativo antagonista NMDA - Sedoanalgesia preservando drive respiratório e tônus hemodinâmico." },
    "Ketorolac": { name: "Cetotolaco (Trometamol)", desc: "Anti-inflamatório não esteroidal injetável potente - Analgesia em cólica nefrética e dor aguda." },
    "Dipyrone": { name: "Dipirona Monoidratada", desc: "Analgésico e antipirético de primeira linha - Alívio de dores moderadas e febre." },
    "Paracetamol": { name: "Paracetamol", desc: "Analgésico e antipirético seguro - Controle de dor leve/moderada e temperatura corporal." },
    "Acetaminophen": { name: "Paracetamol (Acetaminofeno)", desc: "Analgésico e antipirético de uso oral e intravenoso." },
    "Ibuprofen": { name: "Ibuprofeno", desc: "Anti-inflamatório não esteroidal - Ação analgésica, antipirética e anti-inflamatória." },
    "Ketoprofen": { name: "Cetoprofeno", desc: "AINE injetável e oral - Controle de inflamação e dor musculoesquelética aguda." },
    "Midazolam": { name: "Midazolam", desc: "Benzodiazepínico de ação curta - Sedação, anxiólise, amnésia e controle de crises convulsivas." },
    "Diazepam": { name: "Diazepam", desc: "Benzodiazepínico clássico - Primeira linha no status epilepticus e abstinência alcoólica." },
    "Lorazepam": { name: "Lorazepam", desc: "Benzodiazepínico com ação anticonvulsivante prolongada no SNC." },
    "Clonazepam": { name: "Clonazepam", desc: "Benzodiazepínico de ação intermediária para controle de ansiedade aguda e pânico." },
    "Propofol": { name: "Propofol", desc: "Agente hipnótico intravenoso de indução e manutenção anestésica / sedação em UTI." },
    "Etomidate": { name: "Etomidato", desc: "Hipnótico de indução para sequência rápida de intubação com alta estabilidade hemodinâmica." },
    "Dexmedetomidine": { name: "Dexmedetomidina (Precedex)", desc: "Agonista alfa-2 seletivo - Sedação consciente e analgesia sem depressão respiratória." },
    "Thiopental": { name: "Tiopental Sódico", desc: "Barbitúrico de indução rápida e proteção cerebral no status epilepticus refratário." },
    "Succinylcholine": { name: "Succinilcolina", desc: "Bloqueador neuromuscular despolarizante de início ultra-rápido para intubação de sequência rápida." },
    "Rocuronium": { name: "Rocurônio", desc: "Bloqueador neuromuscular não-despolarizante para intubação e paralisia muscular em ventilação mecânica." },
    "Cisatracurium": { name: "Cisatracúrio", desc: "Bloqueador neuromuscular não-despolarizante com eliminação de Hofmann (independente de função renal/hepática)." },
    "Vecuronium": { name: "Vecurônio", desc: "Bloqueador neuromuscular não-despolarizante de ação intermediária." },
    "Pancuronium": { name: "Pancurônio", desc: "Bloqueador neuromuscular não-despolarizante de longa duração." },
    "Sugammadex": { name: "Sugamadex", desc: "Agente de reversão específica e imediata de bloqueio neuromuscular induzido por rocurônio." },
    "Neostigmine": { name: "Neostigmina", desc: "Inibidor da acetilcolinesterase para reversão de bloqueio neuromuscular competitivo." },
    "Naloxone": { name: "Naloxona", desc: "Antagonista opioide puro - Reversão imediata de depressão respiratória por overdose de opioides." },
    "Flumazenil": { name: "Flumazenil", desc: "Antagonista competitivo de receptores de benzodiazepínicos." },

    // Steroids, Respiratory & Electrolytes
    "Hydrocortisone": { name: "Hidrocortisona", desc: "Glicocorticoide de reposição - Choque séptico refratário e insuficiência adrenal aguda." },
    "Methylprednisolone": { name: "Metilprednisolona", desc: "Corticoide anti-inflamatório e imunossupressor potente para exacerbação grave de asma/DPOC." },
    "Dexamethasone": { name: "Dexametasona", desc: "Glicocorticoide de longa duração com potente ação anti-inflamatória e antiedema cerebral." },
    "Prednisone": { name: "Prednisona", desc: "Glicocorticoide oral para continuidade de tratamento inflamatório." },
    "Salbutamol": { name: "Salbutamol (Aerolin)", desc: "Broncodilatador beta-2 agonista de curta duração - Alívio do broncoespasmo agudo em asma/DPOC." },
    "Ipratropium": { name: "Brometo de Ipratrópio (Atrovent)", desc: "Anticolinérgico inalatório - Broncodilatação sinérgica em crise asmática e DPOC." },
    "Magnesium Sulfate": { name: "Sulfato de Magnésio", desc: "Estabilizador de membrana e broncodilatador - Tratamento de Torsades de Pointes, crise de asma grave e eclampsia." },
    "Calcium Gluconate": { name: "Gluconato de Cálcio 10%", desc: "Estabilizador de membrana miocárdica na hipercalemia grave e hipocalcemia." },
    "Calcium Chloride": { name: "Cloreto de Cálcio 10%", desc: "Fonte concentrada de cálcio para ressuscitação em choque e hiperpotassemia." },
    "Sodium Bicarbonate": { name: "Bicarbonato de Sódio 8,4%", desc: "Alcalinizante sistêmico e urinário - Tratamento de acidose metabólica grave e intoxicação por tricíclicos." },
    "Potassium Chloride": { name: "Cloreto de Potássio (KCl 10% / 19,1%)", desc: "Reposição hidroeletrolítica de potássio na hipocalemia sintomática." },
    "Hypertonic Saline 3%": { name: "Solução Salina Hipertônica 3%", desc: "Tratamento de emergência para hiponatremia sintomática grave e hipertensão intracraniana." },
    "Furosemide": { name: "Furosemida", desc: "Diurético de alça potente - Redução volêmica rápida no edema agudo de pulmão e sobrecarga hídrica." },
    "Spironolactone": { name: "Espironolactona", desc: "Antagonista da aldosterona / diurético poupador de potássio." },
    "Hydrochlorothiazide": { name: "Hidroclorotiazida", desc: "Diurético tiazídico para controle da hipertensão arterial." },
    "Mannitol": { name: "Manitol 20%", desc: "Diurético osmótico para redução imediata da pressão intracraniana no edema cerebral agudo." },
    "Tranexamic Acid": { name: "Ácido Tranexâmico", desc: "Antifibrinolítico - Redução de mortalidade no choque hemorrágico traumático e hemorragia pós-parto." },
    "Aspirin": { name: "Ácido Acetilsalicílico (AAS)", desc: "Antiagregante plaquetário inibidor de COX-1 - Obrigatório na Síndrome Coronariana Aguda (dose 162-300mg mastigado)." },
    "Clopidogrel": { name: "Clopidogrel", desc: "Antiagregante plaquetário inibidor do receptor P2Y12 - Dupla antiagregação na SCA." },
    "Ticagrelor": { name: "Ticagrelor", desc: "Inibidor reversível do receptor P2Y12 de início rápido e maior potência na SCA." },
    "Enoxaparin": { name: "Enoxaparina", desc: "Heparina de baixo peso molecular - Anticoagulação plena em SCA, TEP e TVP." },
    "Unfractionated Heparin": { name: "Heparina Não Fracionada (HNF)", desc: "Anticoagulante intravenoso ajustável por TTPa para angioplastia e pacientes renais." },

    // Antiemetics, Gastro & Antipsychotics
    "Ondansetron": { name: "Ondansetrona", desc: "Antagonista do receptor 5-HT3 de serotonina - Antiemético de alta eficácia para náuseas e vômitos refratários." },
    "Metoclopramide": { name: "Metoclopramida (Plasil)", desc: "Antagonista dopaminérgico pró-cinético e antiemético." },
    "Dimenhydrinate": { name: "Dimenidrinato (Dramin)", desc: "Anti-histamínico H1 antiemético com efeito sedativo para náuseas e vertigens." },
    "Promethazine": { name: "Prometazina (Fenergan)", desc: "Anti-histamínico fenotiazínico sedativo para reações anafiláticas e agitação." },
    "Haloperidol": { name: "Haloperidol", desc: "Antipsicótico típico de alta potência - Controle de agitação psicomotora aguda e delirium hiperativo." },
    "Olanzapine": { name: "Olanzapina", desc: "Antipsicótico atípico para controle comportamental e esquizofrenia." },
    "Quetiapine": { name: "Quetiapina", desc: "Antipsicótico atípico com efeito sedativo e estabilizador de humor." },
    "Omeprazole": { name: "Omeprazol", desc: "Inibidor da bomba de prótons (IBP) - Profilaxia de úlcera de estresse e tratamento de HDA." },
    "Pantoprazole": { name: "Pantoprazol", desc: "Inibidor da bomba de prótons intravenoso em infusão contínua para hemorragia digestiva alta." },
    "Ranitidine": { name: "Ranitidina", desc: "Antagonista dos receptores H2 de histamina para redução da acidez gástrica." },
    "Octreotide": { name: "Octreotida", desc: "Análogo sintético da somatostatina - Redução do fluxo esplâncnico no sangramento por varizes esofágicas." },
    "Terlipressin": { name: "Terlipressina", desc: "Vasoconstritor esplâncnico análogo da vasopressina - Tratamento de hemorragia varicosa e síndrome hepatorrenal." },
    "Insulin Regular": { name: "Insulina Regular Humana", desc: "Insulina de ação rápida para manejo de cetoacidose diabética, EHH e hipercalemia." },
    "Insulin": { name: "Insulina Regular Humana", desc: "Insulina rápida para controle glicêmico agudo e correção de hiperglicemia." },
    "Glucagon": { name: "Glucagon", desc: "Hormônio hiperglicemiante e inotrópico independente de beta-receptores - Antídoto no choque por betabloqueador." },

    // Antimicrobials
    "Ceftriaxone": { name: "Ceftriaxona", desc: "Cefalosporina de 3ª geração - Tratamento empírico de sepse, pneumonia comunitária, meningite bacteriana e ITU." },
    "Cefotaxime": { name: "Cefotaxima", desc: "Cefalosporina de 3ª geração para infecções graves do SNC e sepse neonatal." },
    "Cefepime": { name: "Cefepima", desc: "Cefalosporina de 4ª geração com ampla cobertura para bacilos Gram-negativos incluindo Pseudomonas aeruginosa." },
    "Ceftazidime": { name: "Ceftazidima", desc: "Cefalosporina de 3ª geração antipseudomonas." },
    "Cefazolin": { name: "Cefazolina", desc: "Cefalosporina de 1ª geração de escolha para profilaxia cirúrgica e infecções estafilocócicas sensíveis." },
    "Meropenem": { name: "Meropenem", desc: "Carbapenêmico de amplo espectro - Terapia de choque séptico hospitalar e bactérias multirresistentes." },
    "Imipenem": { name: "Imipenem / Cilastatina", desc: "Carbapenêmico bactericida potente de amplo espectro para infecções graves polimicrobianas." },
    "Vancomycin": { name: "Vancomicina", desc: "Glicopeptídeo bactericida - Cobertura de Staphylococcus aureus resistente à meticilina (MRSA) e Enterococcus." },
    "Piperacillin/Tazobactam": { name: "Piperacilina + Tazobactam (Tazocin)", desc: "Penicilina antipseudomonas associada a inibidor de beta-lactamase para sepse intra-abdominal e nosocomial." },
    "Ampicillin": { name: "Ampicilina", desc: "Aminopenicilina ativa contra Listeria monocytogenes e Enterococcus faecalis." },
    "Ampicillin/Sulbactam": { name: "Ampicilina + Sulbactam (Unasyn)", desc: "Aminopenicilina com inibidor de beta-lactamase para infecções de vias aéreas e partes moles." },
    "Amoxicillin/Clavulanate": { name: "Amoxicilina + Clavulanato", desc: "Antibiótico oral/injetável para sinusite bacteriana, pneumonia e mordeduras." },
    "Azithromycin": { name: "Azitromicina", desc: "Macrolídeo com cobertura para patógenos atípicos (Mycoplasma, Legionella, Chlamydia) e efeito imunomodulador." },
    "Clarithromycin": { name: "Claritromicina", desc: "Macrolídeo para infecções respiratórias e erradicação de H. pylori." },
    "Ciprofloxacin": { name: "Ciprofloxacino", desc: "Fluoroquinolona com excelente atividade contra bacilos Gram-negativos e infecções urinárias/abdominais." },
    "Levofloxacin": { name: "Levofloxacino", desc: "Quinolona respiratória ativa contra Streptococcus pneumoniae e germes atípicos." },
    "Moxifloxacin": { name: "Moxifloxacino", desc: "Quinolona respiratória com cobertura estendida para anaeróbios." },
    "Gentamicin": { name: "Gentamicina", desc: "Aminoglicosídeo bactericida concentração-dependente para sinergia em endocardite e infecções graves por Gram-negativos." },
    "Amikacin": { name: "Amicacina", desc: "Aminoglicosídeo de reserva para infecções resistentes por Pseudomonas e micobactérias." },
    "Doxycycline": { name: "Doxiciclina", desc: "Tetraciclina de escolha para rickettsioses, febre maculosa, leptospirose e pneumonia atípica." },
    "Metronidazole": { name: "Metronidazol", desc: "Antimicrobiano e antiparasitário com excelente atividade contra bactérias anaeróbias estritas (Bacteroides fragilis)." },
    "Clindamycin": { name: "Clindamicina", desc: "Lincosamida com cobertura anti-anaeróbia e inibição da síntese de toxinas bacterianas no choque tóxico." },
    "Linezolid": { name: "Linezolida", desc: "Oxazolidinona para tratamento de infecções graves por MRSA e VRE (Enterococo resistente à vancomicina)." },
    "Daptomycin": { name: "Daptomicina", desc: "Lipopeptídeo cíclico para bacteremia e endocardite por Gram-positivos resistentes." },
    "Polymyxin B": { name: "Polimixina B", desc: "Polipeptídeo bactericida de último recurso contra bacilos Gram-negativos pan-resistentes (KPC, Pseudomonas, Acinetobacter)." },
    "Fluconazole": { name: "Fluconazol", desc: "Antifúngico triazólico de escolha para candidíase invasiva e meningite criptocócica." },
    "Voriconazole": { name: "Voriconazol", desc: "Antifúngico triazólico de primeira linha para aspergilose pulmonar invasiva." },
    "Amphotericin B": { name: "Anfotericina B Lipossomal", desc: "Antifúngico poliénico de amplo espectro para micoses sistêmicas graves e leishmaniose visceral." },
    "Acyclovir": { name: "Aciclovir", desc: "Antiviral análogo de nucleosídeo - Tratamento de encefalite herpética e infecções graves por HSV/VZV." },
    "Oseltamivir": { name: "Oseltamivir (Tamiflu)", desc: "Inibidor da neuraminidase para tratamento precoce de Síndrome Respiratória Aguda Grave por Influenza." },

    // Fluids
    "Normal Saline": { name: "Soro Fisiológico 0,9%", desc: "Solução cristaloide isotônica para expansão volêmica e reposição hidroeletrolítica." },
    "Saline 0.9%": { name: "Soro Fisiológico 0,9%", desc: "Solução cristaloide isotônica padrão." },
    "Lactated Ringer's": { name: "Ringer Lactato", desc: "Cristaloide balanceado de escolha para ressuscitação volêmica no trauma e sepse." },
    "Ringer's Lactate": { name: "Ringer Lactato", desc: "Cristaloide balanceado isotônico com menor risco de acidose hiperclorêmica." },
    "Packed Red Blood Cells": { name: "Concentrado de Hemácias", desc: "Hemocomponente para restauração imediata da capacidade de transporte de oxigênio no choque hemorrágico (Hb < 7 g/dL)." },
    "Fresh Frozen Plasma": { name: "Plasma Fresco Congelado", desc: "Reposição de fatores de coagulação na coagulopatia do trauma e sangramentos maciços." },
    "Platelets": { name: "Concentrado de Plaquetas", desc: "Controle de hemorragias em trombocitopenia grave ou disfunção plaquetária." },
    "Cryoprecipitate": { name: "Crioprecipitado", desc: "Reposição concentrada de fibrinogênio no sangramento com hipofibrinogenemia." },
    "Albumin 5%": { name: "Albumina Humana 5%", desc: "Coloide natural para ressuscitação e manutenção de pressão oncótica." },
    "Albumin 20%": { name: "Albumina Humana 20%", desc: "Solução hiperoncótica para mobilização de fluidos no terceiro espaço e cirrose descompensada." },
    "Dextrose 5%": { name: "Soro Glicosado 5%", desc: "Solução hipotônica de água livre para hidratação e correção de desidratação hipernatrêmica." },
    "Dextrose 50%": { name: "Glicose Hipertônica 50%", desc: "Correção imediata de hipoglicemia sintomática com risco neurológico." },

    // Oxygen
    "Nasal Cannula": { name: "Cânula Nasal de Oxigênio (1-6 L/min)", desc: "Oxigenoterapia de baixo fluxo para hipoxemia leve (FiO₂ estimada: 24-44%)." },
    "Low flow nasal cannula": { name: "Cânula Nasal de Baixo Fluxo (O₂)", desc: "Suporte inicial de oxigênio para pacientes com saturação limítrofe." },
    "Simple Face Mask": { name: "Máscara Facial Simples de O₂", desc: "Oxigenoterapia de médio fluxo (6-10 L/min, FiO₂ 40-60%)." },
    "Venturi Mask": { name: "Máscara de Venturi", desc: "Oxigenoterapia com FiO₂ controlada e precisa (24% a 50%) para pacientes com DPOC retentores de CO₂." },
    "Non-Rebreather Mask": { name: "Máscara Não-Reinalante com Reservatório (10-15 L/min)", desc: "Alto fluxo de O₂ fornecendo FiO₂ de até 90-100% em hipoxemia grave e choque." },
    "High flow nasal cannula": { name: "Cânula Nasal de Alto Fluxo (CNAF)", desc: "Suporte oxigenatório aquecido e umidificado com fluxo de até 60 L/min e PEEP dinâmica." },
    "CPAP": { name: "CPAP (Pressão Positiva Contínua nas Vias Aéreas)", desc: "Ventilação não invasiva para edema agudo de pulmão cardiogênico e atelectasias." },
    "BiPAP": { name: "BiPAP / VNI de Dois Níveis de Pressão", desc: "Ventilação não invasiva de escolha na exacerbação de DPOC com acidose hipercápnica." },
    "Endotracheal Intubation": { name: "Intubação Orotraqueal + Ventilação Mecânica", desc: "Garantia definitiva de via aérea pérvia e controle ventilatório total na insuficiência respiratória grave ou coma." },
    "Bag-Valve-Mask": { name: "Ventilação com Bolsa-Válvula-Máscara (AMBU) com O₂ a 100%", desc: "Ventilação manual de emergência para paciente em apneia ou parada cardiorrespiratória." },

    // Nursing & Emergency Procedures
    "Defibrillation": { name: "Desfibrilação Elétrica Não-Sincronizada", desc: "Choque elétrico imediato (200J bifásico) para ritmos chocáveis em PCR (Fibrilação Ventricular / TV sem Pulso)." },
    "Synchronized Cardioversion": { name: "Cardioversão Elétrica Sincronizada", desc: "Choque sincronizado com a onda R para taquiarritmias instáveis (com pulso)." },
    "Transcutaneous Pacing": { name: "Marcapasso Transcutâneo de Emergência", desc: "Estimulação elétrica cardíaca externa temporária para bradicardias sintomáticas e instáveis." },
    "CPR": { name: "Reanimação Cardiopulmonar (RCP de Alta Qualidade)", desc: "Compressões torácicas contínuas (100-120/min, 5-6cm) e ventilações de resgate (30:2) conforme protocolo ACLS." },
    "Chest Needle Decompression": { name: "Descompressão Torácica por Agulha", desc: "Alívio imediato no 2º espaço intercostal na linha hemiclavicular ou 5º EIC linha axilar média para Pneumotórax Hipertensivo." },
    "Chest Tube Thoracostomy": { name: "Drenagem Torácica em Selo d'Água", desc: "Drenagem pleural tubular no 5º EIC anterior à linha axilar média para pneumotórax e hemotórax." },
    "Tourniquet": { name: "Aplicação de Torniquete Tático", desc: "Oclusão arterial mecânica proximal para contenção de hemorragia exanguinante em extremidades (Protocolo XABCDE / ATLS)." },
    "Wound Packing": { name: "Empacotamento de Ferida com Gaze Hemostática", desc: "Preenchimento profundo de ferimento juncional com compressão direta sustentada por 3 minutos." },
    "Pelvic Binder": { name: "Imobilização Pélvica com Cinta / Lençol", desc: "Estabilização e fechamento mecânico de fratura de bacia em livro aberto para controle de sangramento retroperitoneal." },
    "Cervical Collar": { name: "Colar Cervical e Prancha Rígida", desc: "Restrição de movimento da coluna cervical no paciente vítima de trauma." },
    "Gastric Tube": { name: "Sonda Nasogástrica / Orogástrica", desc: "Descompressão gástrica para alívio de distensão abdominal e prevenção de broncoaspiração." },
    "Urinary Catheter": { name: "Cateterismo Vesical de Demora (Sonda Foley)", desc: "Monitorização horária rigorosa de débito urinário (alvo > 0,5 mL/kg/h) em choque e sepse." },
    "Warm Blankets": { name: "Manta Térmica / Aquecimento Ativo", desc: "Prevenção e tratamento da hipotermia para combater a tríade letal no choque hemorrágico." }
};

async function main() {
    console.log('🔄 Executando tradução universal do catálogo de tratamentos para Português...');

    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const data = JSON.parse(raw);
    const rows = data.rows || data;

    let count = 0;
    for (const row of rows) {
        const orig = row.treatment_name;
        if (PT_TRANSLATIONS[orig]) {
            row.treatment_name = PT_TRANSLATIONS[orig].name;
            row.description = PT_TRANSLATIONS[orig].desc;
            count++;
        } else {
            const key = Object.keys(PT_TRANSLATIONS).find(k => orig.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(orig.toLowerCase()));
            if (key) {
                row.treatment_name = PT_TRANSLATIONS[key].name;
                row.description = PT_TRANSLATIONS[key].desc;
                count++;
            }
        }
    }

    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ ${count}/${rows.length} tratamentos foram traduzidos.`);

    const db = new sqlite3.Database(DB_PATH);
    await seedTreatmentEffects(db, { dataPath: DATA_PATH, log: console.log });
    db.close();
    console.log('🎉 Banco de dados de tratamentos atualizado com sucesso!');
}

main().catch(console.error);
