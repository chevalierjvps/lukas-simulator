/**
 * Achados Normais de Exame Físico em Português (Brasil) para o Lukas 1.0
 * Padrão Semiologia Médica Baseada em Evidências
 */

export const PT_DEFAULT_FINDINGS = {
    general: {
        inspection: 'Paciente em bom estado geral, lúcido, orientado no tempo e espaço, cooperativo com o exame. Normocorado, anictérico, acianótico, afebril e hidratado. Sem sinais de desconforto respiratório (sem uso de musculatura acessória, sem batimento de asa de nariz ou tiragem intercostal). Fácies atípica e atitude ativa no leito. Sem estigmas de doenças crônicas.',
    },
    headNeck: {
        inspection: 'Crânio normocéfalo, sem abaulamentos, retrações ou cicatrizes. Face simétrica, sem desvios de rima bucal ou ptose palpebral. Escleras anictéricas, conjuntivas normocoradas e úmidas. Mucosa oral íntegra e úmida. Traqueia centrada e móvel à deglutição, sem desvios. Ausência de estase jugular a 45º.',
        palpation: 'Crânio e couro cabeludo sem pontos dolorosos ou nodulações. Artérias temporais palpáveis, com pulsos simétricos e sem espessamentos. Glândula tireoide de consistência fibroelástica, volume habitual, indolor e móvel com a deglutição. Cadeias linfonodais cervicais anteriores, posteriores, submandibulares e supraclaviculares não palpáveis. Pulsos carotídeos amplos, simétricos e sem frêmitos.',
        auscultation: 'Ausculta de artérias carótidas sem sopros bilateralmente. Ausência de sopro tireoidiano.',
        special: 'Pupilas isocóricas e fotorreagentes direta e consensualmente (PERRLA). Motilidade ocular extrínseca preservada, sem nistagmo ou diplopia. Reflexo hepatojugular ausente. Pressão venosa jugular estimada dentro dos limites normais (< 3 cm acima do ângulo esternal).'
    },
    head: {
        inspection: 'Normocéfalo, simétrico, sem deformidades ósseas, hematomas ou lesões cutâneas. Mímica facial preservada bilateralmente. Pavilhões auriculares sem alterações.',
        palpation: 'Indolor à palpação de pontos sinusais frontais e maxilares. Artérias temporais com pulsos amplos e indolores.',
        special: 'Reflexo fotomotor direto e consensual presente e simétrico bilateralmente. Ausência de dor à percussão de seios paranasais.'
    },
    neck: {
        inspection: 'Pescoço cilíndrico, simétrico, sem massas visíveis, cicatrizes ou aumento de volume da tireoide. Ausência de turgência jugular patológica.',
        palpation: 'Musculatura cervical sem contraturas ou dor à palpação. Mobilidade passiva e ativa preservadas. Tireoide não palpável ou palpável em limites normais. Ausência de linfonodomegalias supraclaviculares ou cervicais.',
        auscultation: 'Ausência de sopros carotídeos bilateralmente.',
        special: 'Mobilidade cervical livre em todos os eixos, sem rigidez de nuca (sinais de Brudzinski e Kernig negativos).'
    },
    chest: {
        inspection: 'Tórax simétrico, atípico, com expansibilidade preservada e simétrica bilateralmente. Frequência respiratória normal (14-16 irpm), padrão respiratório costo-abdominal eupneico. Ausência de tiragens, retrações ou abaulamentos. Ictus cordis não visível no repouso.',
        palpation: 'Expansibilidade torácica simétrica em ápices e bases pulmonares. Frêmito tóraco-vocal (FTV) preservado e distribuído de forma homogênea bilateralmente. Ictus cordis palpável no 5º espaço intercostal na linha hemiclavicular esquerda, com diâmetro de 1-2 polpas digitais, não sustentado. Ausência de frêmitos cardiovasculares ou dor à palpação de arcos costais.',
        percussion: 'Som claro atimpânico (ressonante) em todos os campos pulmonares bilateralmente. Macicez hepática fisiológica iniciando no 5º espaço intercostal direito na linha hemiclavicular. Macicez cardíaca presente na distribuição habitual. Ausência de macicez em bases (sem sinais de derrame pleural).',
        auscultation: 'Murmúrio vesicular fisiológico universalmente audível, sem ruídos adventícios (sem sibilos, estertores ou atritos pleurais). Ausculta cardíaca em 2 tempos com bulhas normofonéticas (B1 e B2), ritmo cardíaco regular, sem sopros, estalidos ou atrito pericárdico.'
    },
    chestAnterior: {
        inspection: 'Parede torácica anterior simétrica, sem deformidades de esterno (sem pectus excavatum ou carinatum). Respiração tranquila sem uso de musculatura acessória.',
        palpation: 'Frêmito tóraco-vocal preservado e simétrico. Ictus cordis localizado no 5º espaço intercostal esquerdo linha hemiclavicular, indolor à palpação da caixa torácica.',
        percussion: 'Som claro pulmonar preservado e simétrico em todos os campos anteriores. Transição normal de timpanismo para macicez hepática e cardíaca.',
        auscultation: 'Murmúrio vesicular presente e simétrico em todos os campos pulmonares anteriores. Bulhas cardíacas normofonéticas em 2 tempos, ritmo regular sem sopros.'
    },
    heart: {
        inspection: 'Região precordial sem abaulamentos ou pulsações ectópicas visíveis.',
        palpation: 'Ictus cordis palpável no 5º EIC na linha hemiclavicular esquerda (LHE), de extensão normal (1 a 2 cm de diâmetro), normodinâmico. Ausência de impulsão paraesternal esquerda ou frêmitos cardíacos palpáveis.',
        auscultation: 'Ritmo cardíaco regular em 2 tempos (RCR 2T), bulhas cardíacas B1 e B2 normofonéticas, sem sopros sistólicos ou diastólicos, sem cliques, estalidos ou atrito pericárdico audível nos focos aórtico, pulmonar, tricúspide e mitral.'
    },
    lungs: {
        inspection: 'Ritmo respiratório regular, frequência normal, padrão costoabdominal sem esforço respiratório visível.',
        palpation: 'Expansibilidade torácica preservada bilateralmente. Frêmito tóraco-vocal presente e simétrico em ambos os hemitórax.',
        percussion: 'Som claro atimpânico (ressonante) uniforme em ambos os pulmões, com mobilidade diafragmática normal.',
        auscultation: 'Murmúrio vesicular universalmente audível em todos os campos pulmonares, sem ruídos adventícios (ausência de sibilos, roncos, estertores crepitantes ou atrito pleural).'
    },
    posteriorLungs: {
        inspection: 'Dorso simétrico, alinhamento da coluna preservado, sem assimetria escapular ou lesões de pele.',
        palpation: 'Expansibilidade em bases e ápices posteriores simétrica. Frêmito tóraco-vocal normal e simétrico.',
        percussion: 'Som claro pulmonar em todos os campos posteriores bilateralmente. Excursão diafragmática simétrica de 4 a 6 cm.',
        auscultation: 'Murmúrio vesicular universalmente audível nas regiões supraescapulares, interescapulovertebrais e bases posteriores, sem ruídos adventícios.'
    },
    abdomen: {
        inspection: 'Abdome plano, simétrico, sem cicatrizes cirúrgicas, hérnias ou circulação colateral visível. Movimentos respiratórios abdominais preservados. Cicatriz umbilical intrusa e centrada.',
        auscultation: 'Ruídos hidroaéreos (RHA) presentes, normoativos em todos os quatro quadrantes (5 a 30 por minuto). Ausência de sopros sobre as artérias renais, aorta abdominal ou ilíacas.',
        percussion: 'Timpanismo fisiológico em todos os quadrantes abdominais. Espaço de Traube livre (timpânico). Hepatometria com diâmetro hepático de aproximadamente 10 cm na linha hemiclavicular direita. Ausência de macicez móvel ou semicírculos de Skoda (sem ascite).',
        palpation: 'Abdome flácido, indolor à palpação superficial e profunda em todos os quadrantes. Fígado e baço não palpáveis abaixo do rebordo costal. Ausência de massas, visceromegalias ou plastrões. Sinal de Blumberg negativo (descompressão brusca indolor). Sinal de Murphy negativo e sinal de Rovsing negativo.',
        special: 'Sinal do obturador e do psoas negativos. Piparote negativo. Ausência de defesa muscular involuntária ou contratura.'
    },
    back: {
        inspection: 'Dorso e coluna vertebral alinhados, sem desvios patológicos (sem escoliose, cifose acentuada ou hiperlordose). Pele íntegra sem lesões.',
        palpation: 'Processos espinhosos indolores à palpação e percussão. Musculatura paravertebral sem pontos de contratura ou dor miofascial.',
        percussion: 'Punho-percussão lombar (Sinal de Giordano) negativa bilateralmente.',
        special: 'Flexibilidade e amplitude de movimento da coluna lombar e torácica preservadas, sem irradiação de dor radicular (manobra de Lasègue negativa bilateralmente).'
    },
    backUpper: {
        inspection: 'Região dorsal superior simétrica, escápulas posicionadas no mesmo nível, sem deformidades.',
        palpation: 'Musculatura trapézio e romboides sem pontos-gatilho dolorosos. Mobilidade escapulotorácica livre.',
        percussion: 'Som claro pulmonar simétrico em campos posteriores superiores.',
        special: 'Sem dor à palpação dos arcos costais posteriores.'
    },
    backLower: {
        inspection: 'Região lombar simétrica, sem abaulamentos ou fístulas cutâneas.',
        palpation: 'Musculatura paravertebral lombar relaxada, indolor à palpação.',
        percussion: 'Sinal de Giordano (punho-percussão lombar) negativo bilateralmente.',
        special: 'Manobra de elevação da perna estendida (Lasègue) negativa bilateralmente.'
    },
    upperBack: {
        inspection: 'Região dorsal superior alinhada e simétrica.',
        palpation: 'Indolor à palpação paravertebral alta.',
        percussion: 'Som claro atimpânico simétrico.',
        special: 'Sem dor à movimentação dos ombros e escápulas.'
    },
    lowerBack: {
        inspection: 'Região lombar alinhada e simétrica.',
        palpation: 'Indolor à palpação paravertebral lombar.',
        percussion: 'Giordano negativo bilateralmente.',
        special: 'Amplitude de flexo-extensão lombar livre de dor.'
    },
    buttocks: {
        inspection: 'Região glútea simétrica, pele íntegra, sem hematomas, úlceras de pressão ou sinais flogísticos.',
        palpation: 'Sem pontos dolorosos sobre musculatura glútea ou articulações sacroilíacas. Temperatura local normal.',
        special: 'Manobras de estresse sacroilíaco (Patrick/FABERE e Gaenslen) negativas bilateralmente.'
    },
    buttockLeft: {
        inspection: 'Glúteo esquerdo com trofismo preservado e pele íntegra.',
        palpation: 'Indolor à palpação superficial e profunda.',
        special: 'Ausência de dor sacrilíaca à manobra provocativa.'
    },
    buttockRight: {
        inspection: 'Glúteo direito com trofismo preservado e pele íntegra.',
        palpation: 'Indolor à palpação superficial e profunda.',
        special: 'Ausência de dor sacrilíaca à manobra provocativa.'
    },
    upperArmLeft: {
        inspection: 'Braço esquerdo com trofismo muscular preservado, sem atrofias, hematomas ou assimetrias.',
        palpation: 'Indolor à palpação muscular e óssea. Pulso braquial palpável, rítmico e cheio.',
        special: 'Reflexo bicipital (C5/C6) normorreflexo (2+/4+) e simétrico. Força muscular 5/5 em flexão de cotovelo e abdução de ombro. Sensibilidade tátil e dolorosa preservada nos dermátomos C5-C6.'
    },
    upperArmRight: {
        inspection: 'Braço direito com trofismo muscular preservado, sem atrofias, hematomas ou assimetrias.',
        palpation: 'Indolor à palpação muscular e óssea. Pulso braquial palpável, rítmico e cheio.',
        special: 'Reflexo bicipital (C5/C6) normorreflexo (2+/4+) e simétrico. Força muscular 5/5 em flexão de cotovelo e abdução de ombro. Sensibilidade tátil e dolorosa preservada nos dermátomos C5-C6.'
    },
    forearmLeft: {
        inspection: 'Antebraço esquerdo sem deformidades, feridas ou edema.',
        palpation: 'Musculatura flexora e extensora normotônica e indolor.',
        special: 'Reflexos braquiorradial e tricipital normais (2+/4+). Sensibilidade preservada em C6-C7.'
    },
    forearmRight: {
        inspection: 'Antebraço direito sem deformidades, feridas ou edema.',
        palpation: 'Musculatura flexora e extensora normotônica e indolor.',
        special: 'Reflexos braquiorradial e tricipital normais (2+/4+). Sensibilidade preservada em C6-C7.'
    },
    handLeft: {
        inspection: 'Mão esquerda sem cianose, palidez, baqueteamento digital ou lesões ungueais. Enchimento capilar < 2 segundos.',
        palpation: 'Pulsos radial e ulnar palpáveis, amplos, simétricos e com ritmo regular. Articulações das mãos e punho sem edema ou calor.',
        special: 'Força de preensão palmar grau 5/5. Teste de Allen positivo (arco palmar pérvio com perfusão restabelecida em < 5 segundos). Sensibilidade nos dermátomos C7, C8 e T1 intacta.'
    },
    handRight: {
        inspection: 'Mão direita sem cianose, palidez, baqueteamento digital ou lesões ungueais. Enchimento capilar < 2 segundos.',
        palpation: 'Pulsos radial e ulnar palpáveis, amplos, simétricos e com ritmo regular. Articulações das mãos e punho sem edema ou calor.',
        special: 'Força de preensão palmar grau 5/5. Teste de Allen positivo (arco palmar pérvio com perfusão restabelecida em < 5 segundos). Sensibilidade nos dermátomos C7, C8 e T1 intacta.'
    },
    thighLeft: {
        inspection: 'Coxa esquerda simétrica, trofismo preservado, sem assimetria de circunferência ou sufusões hemorrágicas.',
        palpation: 'Pulso femoral palpável, amplo e sem sopros. Musculatura da coxa indolor e normotônica.',
        special: 'Reflexo patelar (L3/L4) 2+/4+ simétrico. Força de extensão e flexão de quadril/joelho grau 5/5.'
    },
    thighRight: {
        inspection: 'Coxa direita simétrica, trofismo preservado, sem assimetria de circunferência ou sufusões hemorrágicas.',
        palpation: 'Pulso femoral palpável, amplo e sem sopros. Musculatura da coxa indolor e normotônica.',
        special: 'Reflexo patelar (L3/L4) 2+/4+ simétrico. Força de extensão e flexão de quadril/joelho grau 5/5.'
    },
    lowerLegLeft: {
        inspection: 'Perna esquerda sem edema, varizes calibrosas, hiperpigmentação ocre ou sinais de trombose venosa.',
        palpation: 'Panturrilha livre, flácida e indolor à compressão (Sinal de Homans e Sinal da Bandeira negativos). Sem edema depressível (cacifo negativo 0/4+). Pulso poplíteo palpável.',
        special: 'Sensibilidade preservada nos dermátomos L4 e L5.'
    },
    lowerLegRight: {
        inspection: 'Perna direita sem edema, varizes calibrosas, hiperpigmentação ocre ou sinais de trombose venosa.',
        palpation: 'Panturrilha livre, flácida e indolor à compressão (Sinal de Homans e Sinal da Bandeira negativos). Sem edema depressível (cacifo negativo 0/4+). Pulso poplíteo palpável.',
        special: 'Sensibilidade preservada nos dermátomos L4 e L5.'
    },
    footLeft: {
        inspection: 'Pé esquerdo aquecido, unhas sem distrofias, sem lesões tróficas ou úlceras. Tempo de enchimento capilar < 2 segundos.',
        palpation: 'Pulsos pedioso e tibial posterior palpáveis, amplos e simétricos. Ausência de edema maleolar ou podálico.',
        special: 'Reflexo aquileu (S1) 2+/4+ simétrico. Reflexo cutâneo-plantar em flexão fisiológica bilateralmente (Sinal de Babinski ausente). Sensibilidade tátil e vibratória preservadas nos pés.'
    },
    footRight: {
        inspection: 'Pé direito aquecido, unhas sem distrofias, sem lesões tróficas ou úlceras. Tempo de enchimento capilar < 2 segundos.',
        palpation: 'Pulsos pedioso e tibial posterior palpáveis, amplos e simétricos. Ausência de edema maleolar ou podálico.',
        special: 'Reflexo aquileu (S1) 2+/4+ simétrico. Reflexo cutâneo-plantar em flexão fisiológica bilateralmente (Sinal de Babinski ausente). Sensibilidade tátil e vibratória preservadas nos pés.'
    },
    neurological: {
        inspection: 'Paciente vigil, atento, com discurso coerente e articulado. Postura e marcha normais, sem movimentos involuntários, tremores ou tiques.',
        special: 'Escala de Coma de Glasgow 15 (AO 4, RV 5, RM 6). Pares cranianos de I a XII sem déficits. Força muscular grau 5/5 global em membros superiores e inferiores. Tônus muscular normotônico. Reflexos miotáticos profundos 2+/4+ e simétricos. Sinal de Romberg negativo — mantém o equilíbrio com os pés juntos e olhos fechados por 30 segundos. Pronator drift (desvio pronador) negativo bilateralmente — sem queda ou pronação dos braços estendidos com olhos fechados. Sinal de Babinski ausente — reflexo cutâneo-plantar em flexão (normal) bilateralmente. Sinal de Hoffmann negativo bilateralmente. Sinal de Lhermitte negativo — flexão do pescoço sem sensação de choque elétrico irradiado. Sensibilidade tátil, térmica, dolorosa e proprioceptiva preservadas. Provas cerebelares índex-nariz e calcanhar-joelho normometria e eutaxia. Sinal de Kernig negativo bilateralmente e sinal de Brudzinski negativo — sem sinais de irritação meníngea (ausência de rigidez de nuca).'
    },
    pelvis: {
        inspection: 'Pelve simétrica, cristas ilíacas alinhadas, sem hematomas ou deformidades visíveis.',
        palpation: 'Indolor à palpação e compressão das asas ilíacas e sínfise púbica. Estabilidade pélvica preservada nos eixos anteroposterior e lateral.',
        special: 'Manobras de compressão e distração pélvica indolores e estáveis.'
    },
    genitalia: {
        inspection: 'Genitália externa com anatomia típica para a idade e sexo biológico, sem lesões ulceradas, verrucosas, corrimentos ou sinais flogísticos.',
        palpation: 'Região inguinal sem hérnias redutíveis ou encarceradas à manobra de Valsalva. Sem linfadenomegalias dolorosas.',
        special: 'Sem dor à palpação ou palpação do cordão espermático/grandes lábios.'
    }
};
