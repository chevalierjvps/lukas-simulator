/**
 * Hallazgos Normales de Exploración Física en Español para el Lukas 1.0
 * Estándar de Semiología Médica Basada en Evidencia (MRCP PACES)
 */

export const ES_DEFAULT_FINDINGS = {
    headNeck: {
        inspection: 'Cabeza normocefálica y sin signos de traumatismo. Cara simétrica, sin evidencia de parálisis facial. Sin ptosis, proptosis o xantelasma. Conjuntivas rosadas, escleras blancas sin ictericia. Sin palidez de mucosas. Tráquea centrada, sin desviaciones. Sin bocio, masas ni cicatrices visibles en el cuello. Presión venosa yugular no elevada, con onda de morfología normal.',
        palpation: 'Sin dolor a la palpación del cuero cabelludo ni masas. Arterias temporales no dolorosas y pulsátiles bilateralmente. Cuello flexible con rango de movimiento completo. Sin adenopatías cervicales, supraclaviculares ni axilares. Glándula tiroides no palpable y se moviliza normalmente con la deglución. Tráquea centrada y móvil. Pulsos carotídeos simétricos con carácter normal.',
        auscultation: 'Sin soplos carotídeos bilaterales. Sin soplo tiroideo.',
        special: 'Pupilas isocóricas y reactivas a la luz y la acomodación (PERRLA). Reflejos fotomotor directo y consensual conservados. Motilidad ocular extrínseca completa, sin nistagmo. Presión venosa yugular estimada en 3 cm por encima del ángulo esternal a 45°. Reflejo hepatoyugular negativo.'
    },
    chest: {
        inspection: 'Pared torácica simétrica sin deformidad visible. Sin cicatrices, trayectos fistulosos ni cambios cutáneos. Frecuencia respiratoria de 14 respiraciones por minuto, ritmo regular. Expansión torácica aparentemente simétrica bilateral. Sin uso de musculatura accesoria. Sin patrón respiratorio paradójico. Sin choque de la punta o pulsaciones precordiales visibles.',
        palpation: 'Expansión torácica simétrica bilateral, medida en 5 cm. Frémito táctil vocal simétrico en todas las zonas. Choque de la punta ubicado en el 5º espacio intercostal en línea medioclavicular, no desplazado y de carácter normal. Sin elevación paraesternal ni frémitos. Sin dolor a la palpación de la pared torácica.',
        percussion: 'Percusión resonante en todos los campos pulmonares bilateralmente. Matidez cardíaca presente en la distribución habitual. Matidez hepática que inicia en el 5º espacio intercostal en línea medioclavicular derecha.',
        auscultation: 'Murmullo vesicular audible en todos los campos pulmonares, sin ruidos agregados. Sin sibilancias, estertores ni frote pleural. Resonancia vocal normal y simétrica. Ruidos cardíacos S1 y S2 presentes y de intensidad normal. Sin ruidos agregados (S3, S4). Sin soplos, frotes ni galope. Ritmo cardíaco regular.'
    },
    upperArmLeft: {
        inspection: 'Sin atrofia muscular, fasciculaciones ni asimetría. Piel íntegra sin exantemas, hematomas ni marcas de venopunción. Sin edema ni deformidad. Volumen y simetría muscular normales comparados con el lado contralateral.',
        palpation: 'Sin dolor a la palpación. Tono y volumen muscular normales. Pulso braquial palpable y de carácter normal. Temperatura simétrica al lado contralateral. Sin adenopatías epitrocleares.',
        special: 'Reflejo bicipital (C5/C6) 2+/4+ y simétrico. Prueba de fuerza: abducción de hombro (C5) 5/5, flexión de codo (C5/C6) 5/5. Sensibilidad táctil y dolorosa conservada en dermatomas C5, C6.'
    },
    upperArmRight: {
        inspection: 'Sin atrofia muscular, fasciculaciones ni asimetría. Piel íntegra sin exantemas, hematomas ni marcas de venopunción. Sin edema ni deformidad. Volumen y simetría muscular normales comparados con el lado contralateral.',
        palpation: 'Sin dolor a la palpación. Tono y volumen muscular normales. Pulso braquial palpable y de carácter normal. Temperatura simétrica al lado contralateral. Sin adenopatías epitrocleares.',
        special: 'Reflejo bicipital (C5/C6) 2+/4+ y simétrico. Prueba de fuerza: abducción de hombro (C5) 5/5, flexión de codo (C5/C6) 5/5. Sensibilidad táctil y dolorosa conservada en dermatomas C5, C6.'
    },
    pelvis: {
        inspection: 'Sin masas, asimetrías ni cambios cutáneos visibles en las regiones inguinales bilateralmente. Sin eritema, edema o hernias visibles. Genitales de apariencia normal para la edad y sexo referidos (examen diferido si no está indicado).',
        palpation: 'Pulsos femorales 2+/4+ y simétricos, de carácter normal. Sin adenopatías inguinales. Sin soplos femorales a la auscultación. Sin dolor sobre la sínfisis púbica ni espinas ilíacas anterosuperiores. Canales inguinales íntegros, sin hernia palpable en reposo ni con maniobra de Valsalva.',
        special: 'Sin hernia inguinal demostrable en bipedestación con impulso a la tos. Rango de movilidad de cadera: flexión 120°, extensión 30°, abducción 45°, aducción 30°, rotación interna 40°, rotación externa 45° bilateralmente. Prueba de FABER (Patrick) negativa bilateral.'
    },
    lowerLegLeft: {
        inspection: 'Sin edema, eritema ni cambios de coloración cutánea. Sin varices, eccema venoso ni lipodermatoesclerosis. Piel íntegra sin ulceraciones. Sin atrofia muscular. Distribución pilosa normal.',
        palpation: 'Indolora en toda su extensión. Temperatura tibia y simétrica al lado contralateral. Pulso tibial posterior 2+/4+ palpable por detrás del maléolo medial. Sin edema con fóvea. Pantorrilla blanda e indolora. Sin cordón palpable ni tromboflebitis.',
        special: 'Sensibilidad conservada al tacto, al dolor y a la vibración. Reflejo aquíleo (S1/S2) 2+/4+ presente. Llenado capilar menor de 2 segundos. Prueba de Buerger negativa. Sin edema con fóvea hasta el sacro.'
    },
    lowerLegRight: {
        inspection: 'Sin edema, eritema ni cambios de coloración cutánea. Sin varices, eccema venoso ni lipodermatoesclerosis. Piel íntegra sin ulceraciones. Sin atrofia muscular. Distribución pilosa normal.',
        palpation: 'Indolora en toda su extensión. Temperatura tibia y simétrica al lado contralateral. Pulso tibial posterior 2+/4+ palpable por detrás del maléolo medial. Sin edema con fóvea. Pantorrilla blanda e indolora. Sin cordón palpable ni tromboflebitis.',
        special: 'Sensibilidad conservada al tacto, al dolor y a la vibración. Reflejo aquíleo (S1/S2) 2+/4+ presente. Llenado capilar menor de 2 segundos. Prueba de Buerger negativa. Sin edema con fóvea hasta el sacro.'
    },
    head: {
        inspection: 'Cabeza normocefálica y sin signos de traumatismo. Cara simétrica en reposo y con el movimiento. Sin evidencia de debilidad facial central ni periférica. Piel íntegra sin exantemas, lesiones ni pigmentación anormal. Sin xantelasma, arco senil ni rubor malar. Cejas presentes y simétricas. Sin ptosis, retraso ni retracción palpebral.',
        palpation: 'Cuero cabelludo indoloro, sin masas ni depresiones. Arterias temporales palpables, indoloras y pulsátiles bilateralmente, sin nodularidad ni engrosamiento. Senos frontal y maxilar indoloros a la palpación. Articulación temporomandibular con movimiento suave, sin chasquidos ni crepitación.',
        special: 'Pupilas isocóricas de 3 mm, redondas, reactivas a la luz (directa y consensual) y a la acomodación. Reflejo rojo presente bilateralmente. Fondo de ojo: papilas de bordes netos y color rosado, relación copa/disco 0,3, sin papiledema, hemorragias ni exudados. Pulsación venosa espontánea presente.'
    },
    eyes: {
        inspection: 'Ojos normoposicionados en las órbitas, sin proptosis ni enoftalmos. Conjuntivas rosadas, no inyectadas. Escleras blancas sin ictericia. Córneas transparentes. Sin xantelasma, arco senil ni ptosis. Párpados con cierre completo.',
        special: 'Agudeza visual: 6/6 en ambos ojos (con corrección). Campos visuales completos por confrontación, sin defectos. Pupilas isocóricas (3 mm), redondas y reactivas a la luz y a la acomodación (PERRLA). Motilidad ocular extrínseca completa en todas las direcciones, sin diplopía ni nistagmo. Cover test sin estrabismo. Fondo de ojo: reflejo rojo presente, papilas de aspecto sano y bordes netos, relación copa/disco 0,3, relación arteriovenosa normal 2:3, sin hemorragias, exudados ni patología macular.'
    },
    ears: {
        inspection: 'Pabellones auriculares normoconformados y simétricos. Sin lesiones cutáneas, tofos ni alteraciones. Conductos auditivos externos permeables, sin secreción, eritema ni edema.',
        palpation: 'Sin dolor trágico bilateral. Pabellones indoloros. Apófisis mastoides indoloras bilateralmente. Sin adenopatías preauriculares ni retroauriculares.',
        special: 'Otoscopia: conductos auditivos externos limpios, con cerumen normal. Membranas timpánicas íntegras, grisáceas y translúcidas, con cono de luz y martillo visibles. Sin perforación, retracción ni derrame. Prueba de voz susurrada: audible a 60 cm bilateralmente. Prueba de Rinne: conducción aérea mayor que ósea bilateralmente (positiva). Prueba de Weber: sonido lateraliza a la línea media (sin lateralización).'
    },
    nose: {
        inspection: 'Nariz externa centrada, sin desviación, deformidad ni edema. Dorso nasal íntegro. Fosas nasales permeables bilateralmente. Rinoscopia anterior: tabique nasal centrado, sin desviación ni perforación. Mucosa nasal rosada y húmeda, sin pólipos, secreción ni costras. Cornetes inferiores visualizados, sin hipertrofia.',
        palpation: 'Sin dolor sobre el dorso ni los huesos nasales. Senos frontal y maxilar indoloros a la palpación y percusión. Sin crepitación.'
    },
    mouth: {
        inspection: 'Labios rosados, húmedos, sin lesiones, cianosis ni queilitis angular. Mucosa oral rosada, húmeda e íntegra, sin ulceraciones, leucoplasia ni candidiasis. Piezas dentarias en buen estado (o edéntulo con prótesis bien adaptada). Encías rosadas, sin retracción, inflamación ni sangrado. Lengua centrada, rosada, húmeda, con papilación normal, sin fasciculaciones, atrofia ni desviación. Paladar se moviliza simétricamente. Úvula centrada y se eleva simétricamente con la fonación. Amígdalas presentes, no hipertróficas (grado 1), sin exudado. Faringe posterior no eritematosa, sin goteo posnasal.',
        special: 'Lengua protruye en la línea media con rango de movimiento completo (par XII íntegro). Reflejo nauseoso presente bilateralmente (pares IX, X íntegros). Paladar se eleva simétricamente con la fonación. Voz de calidad normal, sin ronquera ni tono nasal.'
    },
    neck: {
        inspection: 'Cuello simétrico, de contorno normal. Tráquea aparentemente centrada. Sin bocio, masas, cicatrices ni tumefacción visibles. Sin ingurgitación yugular visible a 45°. Sin pulsaciones carotídeas prominentes. Piel íntegra.',
        palpation: 'Tráquea palpable, centrada, móvil y sin tironeo traqueal. Cadenas ganglionares cervicales: examen sistemático de submentonianos, submandibulares, preauriculares, retroauriculares, occipitales, cervicales anteriores, cervicales posteriores y supraclaviculares sin adenopatías. Glándula tiroides no palpable en reposo ni con la deglución. Sin nódulos ni masas tiroideas. Pulsos carotídeos simétricos con ascenso normal.',
        auscultation: 'Sin soplos carotídeos bilaterales. Sin soplo tiroideo.',
        special: 'Presión venosa yugular de 3 cm por encima del ángulo esternal a 45° (normal). Morfología de onda yugular con ondas a y v normales. Reflejo hepatoyugular negativo. Tiroides se moviliza con la deglución pero no está aumentada de tamaño. Signo de Pemberton negativo.'
    },
    chestAnterior: {
        inspection: 'Frecuencia respiratoria de 14 respiraciones por minuto, ritmo regular. Patrón respiratorio normal, sin evidencia de dificultad respiratoria. Sin uso de musculatura accesoria (esternocleidomastoideo, escalenos, intercostales). Pared torácica simétrica, sin deformidades (pectus excavatum, pectus carinatum, tórax en tonel). Sin cicatrices quirúrgicas, trayectos fistulosos ni masas visibles. Expansión torácica aparentemente simétrica. Sin movimiento paradójico. Sin choque de la punta visible.',
        palpation: 'Tráquea centrada. Expansión torácica simétrica bilateral, medida en 5 cm a nivel de la línea mamilar. Frémito táctil vocal normal y simétrico en todas las zonas. Choque de la punta ubicado en el 5º espacio intercostal izquierdo en línea medioclavicular, no desplazado, de carácter y área normales. Sin elevación ventricular derecha. Sin frémitos palpables en ninguna área.',
        percussion: 'Percusión resonante en todos los campos pulmonares bilateralmente (comparando derecha con izquierda). Matidez hepática que inicia en el 6º espacio intercostal en línea medioclavicular derecha. Matidez cardíaca presente en la distribución habitual. Sin matidez pétrea que sugiera derrame.',
        auscultation: 'Ruidos respiratorios: murmullo vesicular audible en todos los campos pulmonares bilateralmente. Sin respiración bronquial. Resonancia vocal normal y simétrica. Sin ruidos agregados: sin sibilancias, estertores (finos o gruesos), frote pleural ni estridor. Ruidos cardíacos: S1 y S2 presentes con intensidad y desdoblamiento normales. Sin ruidos agregados (S3 o S4). Sin soplos en ninguna posición. Ritmo regular. Sin frote pericárdico.'
    },
    heart: {
        inspection: 'Precordio de forma normal, sin deformidad. Sin choque de la punta ni pulsaciones anormales visibles. Sin cicatrices quirúrgicas (esternotomía media, toracotomía lateral). Sin abultamiento por marcapasos o desfibrilador. Sin pulsaciones carotídeas ni ingurgitación yugular visibles.',
        palpation: 'Choque de la punta ubicado en el 5º espacio intercostal izquierdo en línea medioclavicular. Carácter no desplazado, no sostenido, no vigoroso, limitado a la yema de un dedo. Sin elevación paraesternal (hipertrofia ventricular derecha). Sin frémitos palpables en ninguna área (aórtica, pulmonar, tricuspídea, mitral). Sin P2 palpable. Pulso carotídeo de carácter normal, sin retraso.',
        auscultation: 'S1 de intensidad normal, mejor auscultado en el ápex. S2 de intensidad normal con desdoblamiento fisiológico normal en el borde esternal superior izquierdo. Sin ruidos agregados: sin S3 (galope ventricular), S4 (galope auricular), chasquido de apertura, clic de eyección ni chasquido pericárdico. Sin soplos audibles en ninguna área (aórtica, pulmonar, tricuspídea, mitral) con el paciente en decúbito supino, decúbito lateral izquierdo y sentado inclinado hacia adelante. Sin frote pericárdico. Ritmo cardíaco regular a 72 latidos por minuto. Bases pulmonares limpias a la auscultación posterior.'
    },
    abdomen: {
        inspection: 'Abdomen plano y simétrico, sin distensión visible. Ombligo centrado e invertido. Sin cicatrices quirúrgicas, estrías ni peristaltismo visible. Sin venas dilatadas (cabeza de medusa) ni lesiones cutáneas. Flancos no abombados. Sin hernias visibles en reposo ni con la tos. Sin masas ni pulsaciones visibles.',
        auscultation: 'Ruidos hidroaéreos presentes y de carácter normal (2 a 5 por minuto) en los cuatro cuadrantes. Sin ruidos hidroaéreos de tono alto ni metálicos. Sin soplos sobre la aorta (epigastrio), arterias renales (paraumbilical) ni arterias femorales.',
        percussion: 'Percusión timpánica en todo el abdomen. Sin matidez cambiante demostrable. Área hepática de 10 cm en línea medioclavicular derecha (borde superior en el 5º espacio intercostal, borde inferior en el reborde costal). Matidez esplénica presente en el hemitórax inferior izquierdo, sin extenderse anteriormente. Vejiga no percutible.',
        palpation: 'Abdomen blando e indoloro en las nueve regiones a la palpación superficial. Sin defensa ni rigidez. A la palpación profunda: borde hepático no palpable por debajo del reborde costal. Bazo no palpable. Ambos riñones no peloteables. Aorta palpable y no expansiva (menor de 3 cm). Sin masas palpables. Ganglios inguinales no aumentados de tamaño.',
        special: 'Signo de Murphy negativo (sin detención inspiratoria a la palpación del hipocondrio derecho). Signo de Rovsing negativo. Punto de McBurney indoloro. Sin rebote. Sin defensa voluntaria ni involuntaria. Signo del psoas negativo. Signo del obturador negativo. Orificios herniarios íntegros, sin impulso a la tos.'
    },
    upperLimbLeft: {
        inspection: 'Miembro superior izquierdo en posición normal, sin alteración postural. Sin atrofia muscular, fasciculaciones ni asimetría comparado con el lado derecho. Articulaciones sin edema ni deformidad. Piel íntegra sin exantemas, cambios ungueales (hipocratismo, coiloniquia, hemorragias en astilla) ni lesiones. Sin temblor en reposo ni con los brazos extendidos. Sin claudicación pronadora.',
        palpation: 'Temperatura tibia y simétrica al lado contralateral. Pulso radial 2+/4+, regular y de carácter normal. Pulso braquial palpable. Sin adenopatías epitrocleares. Articulaciones indoloras, sin sinovitis. Volumen y consistencia muscular normales.',
        special: 'Tono: normal en toda su extensión, sin espasticidad, rigidez ni hipotonía. Fuerza (escala MRC): abducción de hombro C5 (5/5), flexión de codo C5/C6 (5/5), extensión de codo C7 (5/5), extensión de muñeca C6/C7 (5/5), extensión de dedos C7 (5/5), flexión de dedos C8 (5/5), abducción de dedos T1 (5/5). Reflejos: bicipital C5/C6 (2+), estilorradial C5/C6 (2+), tricipital C7 (2+). Sensibilidad: tacto, dolor, vibración y propiocepción conservados en todos los dermatomas (C5-T1). Coordinación: prueba dedo-nariz precisa, sin temblor intencional ni dismetría.'
    },
    upperLimbRight: {
        inspection: 'Miembro superior derecho en posición normal, sin alteración postural. Sin atrofia muscular, fasciculaciones ni asimetría comparado con el lado izquierdo. Articulaciones sin edema ni deformidad. Piel íntegra sin exantemas, cambios ungueales (hipocratismo, coiloniquia, hemorragias en astilla) ni lesiones. Sin temblor en reposo ni con los brazos extendidos. Sin claudicación pronadora.',
        palpation: 'Temperatura tibia y simétrica al lado contralateral. Pulso radial 2+/4+, regular y de carácter normal. Pulso braquial palpable. Sin adenopatías epitrocleares. Articulaciones indoloras, sin sinovitis. Volumen y consistencia muscular normales.',
        special: 'Tono: normal en toda su extensión, sin espasticidad, rigidez ni hipotonía. Fuerza (escala MRC): abducción de hombro C5 (5/5), flexión de codo C5/C6 (5/5), extensión de codo C7 (5/5), extensión de muñeca C6/C7 (5/5), extensión de dedos C7 (5/5), flexión de dedos C8 (5/5), abducción de dedos T1 (5/5). Reflejos: bicipital C5/C6 (2+), estilorradial C5/C6 (2+), tricipital C7 (2+). Sensibilidad: tacto, dolor, vibración y propiocepción conservados en todos los dermatomas (C5-T1). Coordinación: prueba dedo-nariz precisa, sin temblor intencional ni dismetría.'
    },
    lowerLimbLeft: {
        inspection: 'Miembro inferior izquierdo con alineación normal, sin discrepancia de longitud. Sin atrofia de cuádriceps, isquiotibiales ni gemelos. Sin fasciculaciones. Piel íntegra, color y distribución pilosa normales. Sin varices, eccema venoso, lipodermatoesclerosis ni ulceración. Uñas normales, sin cambios micóticos. Articulaciones sin edema ni deformidad.',
        palpation: 'Temperatura tibia y simétrica al lado contralateral. Pulso femoral 2+/4+, fácilmente palpable. Pulso poplíteo 2+/4+ (puede requerir palpación profunda). Pulso pedio 2+/4+ en el dorso del pie. Pulso tibial posterior 2+/4+ por detrás del maléolo medial. Sin edema con fóvea hasta el sacro. Pantorrilla blanda e indolora. Sin cordón palpable ni varicosidades.',
        special: 'Tono: normal, sin espasticidad, rigidez, clonus ni hipotonía. Fuerza (escala MRC): flexión de cadera L1/L2 (5/5), extensión de cadera L5/S1 (5/5), extensión de rodilla L3/L4 (5/5), flexión de rodilla L5/S1 (5/5), dorsiflexión de tobillo L4/L5 (5/5), flexión plantar S1/S2 (5/5), extensión del hallux L5 (5/5). Reflejos: rotuliano L3/L4 (2+), aquíleo S1/S2 (2+), respuesta plantar flexora (hacia abajo). Sensibilidad: tacto, dolor, vibración (en hallux y maléolo medial) y propiocepción (hallux) conservados en todos los dermatomas (L2-S1). Coordinación: prueba talón-rodilla normal, sin dismetría.'
    },
    lowerLimbRight: {
        inspection: 'Miembro inferior derecho con alineación normal, sin discrepancia de longitud. Sin atrofia de cuádriceps, isquiotibiales ni gemelos. Sin fasciculaciones. Piel íntegra, color y distribución pilosa normales. Sin varices, eccema venoso, lipodermatoesclerosis ni ulceración. Uñas normales, sin cambios micóticos. Articulaciones sin edema ni deformidad.',
        palpation: 'Temperatura tibia y simétrica al lado contralateral. Pulso femoral 2+/4+, fácilmente palpable. Pulso poplíteo 2+/4+ (puede requerir palpación profunda). Pulso pedio 2+/4+ en el dorso del pie. Pulso tibial posterior 2+/4+ por detrás del maléolo medial. Sin edema con fóvea hasta el sacro. Pantorrilla blanda e indolora. Sin cordón palpable ni varicosidades.',
        special: 'Tono: normal, sin espasticidad, rigidez, clonus ni hipotonía. Fuerza (escala MRC): flexión de cadera L1/L2 (5/5), extensión de cadera L5/S1 (5/5), extensión de rodilla L3/L4 (5/5), flexión de rodilla L5/S1 (5/5), dorsiflexión de tobillo L4/L5 (5/5), flexión plantar S1/S2 (5/5), extensión del hallux L5 (5/5). Reflejos: rotuliano L3/L4 (2+), aquíleo S1/S2 (2+), respuesta plantar flexora (hacia abajo). Sensibilidad: tacto, dolor, vibración (en hallux y maléolo medial) y propiocepción (hallux) conservados en todos los dermatomas (L2-S1). Coordinación: prueba talón-rodilla normal, sin dismetría.'
    },
    shoulderLeft: {
        inspection: 'Contorno del hombro normal y simétrico. Sin atrofia de deltoides, supraespinoso o infraespinoso. Sin edema, eritema ni deformidad. Escápula apoyada plana contra la pared torácica, sin aleteo. Sin cicatrices.',
        palpation: 'Sin dolor sobre la articulación esternoclavicular, clavícula, articulación acromioclavicular, acromion o articulación glenohumeral. Sin dolor en el espacio subacromial ni en el surco bicipital. Articulación acromioclavicular estable. Sin crepitación.',
        special: 'Rango de movimiento activo: flexión anterior 180°, extensión 60°, abducción 180°, aducción 50°, rotación externa 90°, rotación interna (mano alcanza T6 en la espalda). Rango pasivo igual al activo. Arco doloroso negativo. Manguito rotador: supraespinoso (empty can) negativo, infraespinoso (rotación externa resistida) íntegro, subescapular (lift-off) negativo. Pruebas de pinzamiento de Neer y Hawkins negativas. Pruebas de aprehensión y reubicación negativas. Prueba de Speed negativa para tendinopatía del bíceps.'
    },
    shoulderRight: {
        inspection: 'Contorno del hombro normal y simétrico. Sin atrofia de deltoides, supraespinoso o infraespinoso. Sin edema, eritema ni deformidad. Escápula apoyada plana contra la pared torácica, sin aleteo. Sin cicatrices.',
        palpation: 'Sin dolor sobre la articulación esternoclavicular, clavícula, articulación acromioclavicular, acromion o articulación glenohumeral. Sin dolor en el espacio subacromial ni en el surco bicipital. Articulación acromioclavicular estable. Sin crepitación.',
        special: 'Rango de movimiento activo: flexión anterior 180°, extensión 60°, abducción 180°, aducción 50°, rotación externa 90°, rotación interna (mano alcanza T6 en la espalda). Rango pasivo igual al activo. Arco doloroso negativo. Manguito rotador: supraespinoso (empty can) negativo, infraespinoso (rotación externa resistida) íntegro, subescapular (lift-off) negativo. Pruebas de pinzamiento de Neer y Hawkins negativas. Pruebas de aprehensión y reubicación negativas. Prueba de Speed negativa para tendinopatía del bíceps.'
    },
    elbowLeft: {
        inspection: 'Ángulo de carga normal (valgo de 5-15°). Sin edema, eritema, nódulos ni deformidad. Sin cicatrices quirúrgicas. Bolsa olecraniana no distendida. Sin nódulos reumatoides. Piel íntegra.',
        palpation: 'Sin derrame (el triángulo entre epicóndilo lateral, cabeza radial y olécranon no está distendido). Sin dolor sobre el epicóndilo lateral (codo de tenista) ni el epicóndilo medial (codo de golfista). Olécranon indoloro. Cabeza radial palpable e indolora. Sin calor local. Codo estable a estrés en varo y valgo.',
        special: 'Rango de movimiento activo: flexión 150°, extensión 0° (completa), supinación 90°, pronación 90°. Rango pasivo igual al activo. Reflejo bicipital (C5/C6) 2+. Reflejo estilorradial (C6) 2+. Prueba de Cozen (extensión resistida de muñeca) negativa. Prueba del codo de golfista (flexión resistida de muñeca) negativa.'
    },
    elbowRight: {
        inspection: 'Ángulo de carga normal (valgo de 5-15°). Sin edema, eritema, nódulos ni deformidad. Sin cicatrices quirúrgicas. Bolsa olecraniana no distendida. Sin nódulos reumatoides. Piel íntegra.',
        palpation: 'Sin derrame (el triángulo entre epicóndilo lateral, cabeza radial y olécranon no está distendido). Sin dolor sobre el epicóndilo lateral (codo de tenista) ni el epicóndilo medial (codo de golfista). Olécranon indoloro. Cabeza radial palpable e indolora. Sin calor local. Codo estable a estrés en varo y valgo.',
        special: 'Rango de movimiento activo: flexión 150°, extensión 0° (completa), supinación 90°, pronación 90°. Rango pasivo igual al activo. Reflejo bicipital (C5/C6) 2+. Reflejo estilorradial (C6) 2+. Prueba de Cozen (extensión resistida de muñeca) negativa. Prueba del codo de golfista (flexión resistida de muñeca) negativa.'
    },
    forearmLeft: {
        inspection: 'Antebrazo de contorno normal, sin edema, deformidad ni atrofia. Volumen muscular de los compartimentos flexor y extensor de apariencia normal y simétrica. Piel íntegra sin exantemas, hematomas ni marcas de venopunción.',
        palpation: 'Indoloro en toda la extensión de los compartimentos flexor y extensor. Pulso radial 2+/4+ en la muñeca. Sin tensión compartimental. Turgencia cutánea normal.'
    },
    forearmRight: {
        inspection: 'Antebrazo de contorno normal, sin edema, deformidad ni atrofia. Volumen muscular de los compartimentos flexor y extensor de apariencia normal y simétrica. Piel íntegra sin exantemas, hematomas ni marcas de venopunción.',
        palpation: 'Indoloro en toda la extensión de los compartimentos flexor y extensor. Pulso radial 2+/4+ en la muñeca. Sin tensión compartimental. Turgencia cutánea normal.'
    },
    handLeft: {
        inspection: 'Manos en postura de reposo normal. Sin edema, deformidad ni atrofia de las eminencias tenar o hipotenar. Interóseos y lumbricales sin atrofia. Sin contractura de Dupuytren. Piel íntegra sin exantemas, úlceras ni esclerodactilia. Uñas normales, sin hipocratismo, coiloniquia, hemorragias en astilla ni infartos periungueales. Sin nódulos de Heberden ni Bouchard. Sin deformidad en cuello de cisne ni en ojal. Sin pulgar en Z ni desviación cubital.',
        palpation: 'Temperatura tibia. Pulso radial 2+/4+ y pulso cubital palpable. Todas las articulaciones MCF, IFP e IFD indoloras, sin sinovitis ni derrame. Sin dolor tenar ni hipotenar. Túnel carpiano (signo de Tinel) indoloro.',
        special: 'Fuerza de prensión 5/5 y simétrica. Pinza intacta. Motricidad fina normal (capaz de tomar objetos pequeños). Prueba de Allen muestra doble aporte arterial con llenado capilar rápido al liberar la arteria radial o cubital. Prueba de Phalen negativa. Signo de Tinel en túnel carpiano negativo. Prueba de Finkelstein para enfermedad de De Quervain negativa. Sensibilidad al tacto conservada en los territorios de los nervios mediano, cubital y radial.'
    },
    handRight: {
        inspection: 'Manos en postura de reposo normal. Sin edema, deformidad ni atrofia de las eminencias tenar o hipotenar. Interóseos y lumbricales sin atrofia. Sin contractura de Dupuytren. Piel íntegra sin exantemas, úlceras ni esclerodactilia. Uñas normales, sin hipocratismo, coiloniquia, hemorragias en astilla ni infartos periungueales. Sin nódulos de Heberden ni Bouchard. Sin deformidad en cuello de cisne ni en ojal. Sin pulgar en Z ni desviación cubital.',
        palpation: 'Temperatura tibia. Pulso radial 2+/4+ y pulso cubital palpable. Todas las articulaciones MCF, IFP e IFD indoloras, sin sinovitis ni derrame. Sin dolor tenar ni hipotenar. Túnel carpiano (signo de Tinel) indoloro.',
        special: 'Fuerza de prensión 5/5 y simétrica. Pinza intacta. Motricidad fina normal (capaz de tomar objetos pequeños). Prueba de Allen muestra doble aporte arterial con llenado capilar rápido al liberar la arteria radial o cubital. Prueba de Phalen negativa. Signo de Tinel en túnel carpiano negativo. Prueba de Finkelstein para enfermedad de De Quervain negativa. Sensibilidad al tacto conservada en los territorios de los nervios mediano, cubital y radial.'
    },
    groin: {
        inspection: 'Regiones inguinales simétricas, sin masas, abultamientos ni cambios cutáneos bilaterales. Sin eritema ni edema. Sin pulsaciones femorales visibles. Escroto de apariencia normal (en varones).',
        palpation: 'Pulsos femorales 2+/4+ y simétricos, de carácter normal. Sin soplos femorales a la auscultación. Sin adenopatías inguinales (grupos horizontal o vertical). Canales inguinales examinados con el paciente de pie: anillo externo admite la yema del dedo sin hernia palpable. Sin impulso a la tos.',
        special: 'Sin hernia inguinal indirecta: sin impulso en el anillo profundo (punto medio del ligamento inguinal) con la tos. Sin hernia inguinal directa: sin impulso a través de la pared posterior del canal inguinal con la tos. Sin hernia femoral: sin masa ni impulso inferior al ligamento inguinal. Examen escrotal sin alteraciones, testículos normales bilateralmente (si se realiza).'
    },
    thighLeft: {
        inspection: 'Muslo de contorno normal, sin atrofia de cuádriceps ni aductores. Sin edema, eritema ni cambios cutáneos. Circunferencia simétrica al lado contralateral. Sin fasciculaciones.',
        palpation: 'Cuádriceps e isquiotibiales indoloros, con volumen y tono normales. Pulso femoral 2+/4+. Sin masas ni adenopatías en la región inguinal.',
        special: 'Fuerza: flexión de cadera (iliopsoas L1/L2) 5/5, extensión de cadera (glúteo mayor L5/S1) 5/5, abducción de cadera (glúteo medio L4/L5) 5/5, aducción de cadera (aductores L2/L3) 5/5, extensión de rodilla (cuádriceps L3/L4) 5/5. Sensibilidad conservada al tacto y al dolor en dermatomas L2, L3.'
    },
    thighRight: {
        inspection: 'Muslo de contorno normal, sin atrofia de cuádriceps ni aductores. Sin edema, eritema ni cambios cutáneos. Circunferencia simétrica al lado contralateral. Sin fasciculaciones.',
        palpation: 'Cuádriceps e isquiotibiales indoloros, con volumen y tono normales. Pulso femoral 2+/4+. Sin masas ni adenopatías en la región inguinal.',
        special: 'Fuerza: flexión de cadera (iliopsoas L1/L2) 5/5, extensión de cadera (glúteo mayor L5/S1) 5/5, abducción de cadera (glúteo medio L4/L5) 5/5, aducción de cadera (aductores L2/L3) 5/5, extensión de rodilla (cuádriceps L3/L4) 5/5. Sensibilidad conservada al tacto y al dolor en dermatomas L2, L3.'
    },
    kneeLeft: {
        inspection: 'Alineación normal, sin deformidad en varo ni valgo. Sin edema, eritema ni derrame. Volumen del cuádriceps normal, sin atrofia. Rótula centrada. Sin cicatrices. Marcha normal.',
        palpation: 'Sin calor comparado con el lado contralateral. Sin dolor en la interlínea articular (medial o lateral). Rótula indolora, sin crepitación con el movimiento. Sin masa en el hueco poplíteo (quiste de Baker). Sin derrame: choque rotuliano negativo, signo de la ola negativo.',
        special: 'Rango de movimiento activo: flexión 140°, extensión 0° (completa). Rango pasivo igual al activo. Reflejo rotuliano (L3/L4) 2+ y simétrico. Pruebas ligamentosas: cajón anterior negativo (LCA), cajón posterior negativo (LCP), Lachman negativo (LCA), estrés en valgo negativo a 0° y 30° (LCM), estrés en varo negativo a 0° y 30° (LCL). Pruebas meniscales: McMurray negativa, Apley negativa. Patelofemoral: sin aprehensión, prueba de Clarke negativa.'
    },
    kneeRight: {
        inspection: 'Alineación normal, sin deformidad en varo ni valgo. Sin edema, eritema ni derrame. Volumen del cuádriceps normal, sin atrofia. Rótula centrada. Sin cicatrices. Marcha normal.',
        palpation: 'Sin calor comparado con el lado contralateral. Sin dolor en la interlínea articular (medial o lateral). Rótula indolora, sin crepitación con el movimiento. Sin masa en el hueco poplíteo (quiste de Baker). Sin derrame: choque rotuliano negativo, signo de la ola negativo.',
        special: 'Rango de movimiento activo: flexión 140°, extensión 0° (completa). Rango pasivo igual al activo. Reflejo rotuliano (L3/L4) 2+ y simétrico. Pruebas ligamentosas: cajón anterior negativo (LCA), cajón posterior negativo (LCP), Lachman negativo (LCA), estrés en valgo negativo a 0° y 30° (LCM), estrés en varo negativo a 0° y 30° (LCL). Pruebas meniscales: McMurray negativa, Apley negativa. Patelofemoral: sin aprehensión, prueba de Clarke negativa.'
    },
    ankleLeft: {
        inspection: 'Alineación normal del tobillo, sin edema, deformidad ni cambios cutáneos. Maléolos medial y lateral simétricos. Sin eritema ni derrame. Piel íntegra sin ulceración.',
        palpation: 'Sin dolor sobre el maléolo medial, maléolo lateral ni interlínea anterior. Pulso tibial posterior 2+/4+ por detrás del maléolo medial. Pulso pedio 2+/4+ en el dorso del pie. Tendón de Aquiles íntegro e indoloro. Sin calor.',
        special: 'Rango de movimiento activo: dorsiflexión 20°, flexión plantar 50°, inversión 30°, eversión 20°. Rango pasivo igual al activo. Tobillo estable: cajón anterior negativo (LPAA), inclinación talar negativa. Reflejo aquíleo (S1/S2) 2+. Prueba de Thompson negativa (Aquiles íntegro).'
    },
    ankleRight: {
        inspection: 'Alineación normal del tobillo, sin edema, deformidad ni cambios cutáneos. Maléolos medial y lateral simétricos. Sin eritema ni derrame. Piel íntegra sin ulceración.',
        palpation: 'Sin dolor sobre el maléolo medial, maléolo lateral ni interlínea anterior. Pulso tibial posterior 2+/4+ por detrás del maléolo medial. Pulso pedio 2+/4+ en el dorso del pie. Tendón de Aquiles íntegro e indoloro. Sin calor.',
        special: 'Rango de movimiento activo: dorsiflexión 20°, flexión plantar 50°, inversión 30°, eversión 20°. Rango pasivo igual al activo. Tobillo estable: cajón anterior negativo (LPAA), inclinación talar negativa. Reflejo aquíleo (S1/S2) 2+. Prueba de Thompson negativa (Aquiles íntegro).'
    },
    footLeft: {
        inspection: 'Pie normoalineado con arco longitudinal medial conservado. Sin pie plano ni cavo. Dedos rectos, sin dedos en garra, en martillo ni hallux valgus. Piel íntegra sin ulceración, callosidades ni fisuras. Uñas normales, sin onicomicosis ni encarnación. Sin maceración interdigital. Distribución pilosa normal.',
        palpation: 'Pulso pedio 2+/4+ en el dorso entre el 1º y 2º metatarsiano. Pulso tibial posterior 2+/4+ por detrás del maléolo medial. Pie tibio con llenado capilar menor de 2 segundos. Sin dolor sobre las cabezas metatarsianas, mediopié o fascia plantar. Sin dolor interdigital (neuroma de Morton).',
        special: 'Sensibilidad: monofilamento de 10 g positivo en todos los puntos estándar (hallux, cabezas del 1º, 3º y 5º metatarsianos, talón). Sensibilidad vibratoria conservada en hallux (diapasón de 128 Hz). Propiocepción conservada en hallux. Reflejo plantar flexor (hacia abajo). Prueba de Simmond negativa (Aquiles íntegro).'
    },
    footRight: {
        inspection: 'Pie normoalineado con arco longitudinal medial conservado. Sin pie plano ni cavo. Dedos rectos, sin dedos en garra, en martillo ni hallux valgus. Piel íntegra sin ulceración, callosidades ni fisuras. Uñas normales, sin onicomicosis ni encarnación. Sin maceración interdigital. Distribución pilosa normal.',
        palpation: 'Pulso pedio 2+/4+ en el dorso entre el 1º y 2º metatarsiano. Pulso tibial posterior 2+/4+ por detrás del maléolo medial. Pie tibio con llenado capilar menor de 2 segundos. Sin dolor sobre las cabezas metatarsianas, mediopié o fascia plantar. Sin dolor interdigital (neuroma de Morton).',
        special: 'Sensibilidad: monofilamento de 10 g positivo en todos los puntos estándar (hallux, cabezas del 1º, 3º y 5º metatarsianos, talón). Sensibilidad vibratoria conservada en hallux (diapasón de 128 Hz). Propiocepción conservada en hallux. Reflejo plantar flexor (hacia abajo). Prueba de Simmond negativa (Aquiles íntegro).'
    },
    backUpper: {
        inspection: 'Columna recta, sin escoliosis ni cifosis. Hombros nivelados. Escápulas simétricamente ubicadas, sin aleteo. Sin atrofia muscular. Piel íntegra sin exantemas, lesiones ni cicatrices.',
        palpation: 'Sin dolor sobre las apófisis espinosas cervicales o torácicas. Músculos paravertebrales indoloros y simétricos. Sin deformidad en escalón. Trapecio y romboides indoloros.',
        percussion: 'Percusión resonante sobre ambos campos pulmonares posteriormente. Sin matidez sugestiva de consolidación o derrame.',
        auscultation: 'Murmullo vesicular audible en ambos campos pulmonares posteriormente. Sin ruidos agregados: sin estertores, sibilancias ni frote pleural. Resonancia vocal normal y simétrica.'
    },
    upperBack: {
        inspection: 'Columna recta, sin escoliosis ni cifosis. Hombros nivelados. Escápulas simétricamente ubicadas, sin aleteo. Sin atrofia muscular. Piel íntegra sin exantemas, lesiones ni cicatrices.',
        palpation: 'Sin dolor sobre las apófisis espinosas cervicales o torácicas. Músculos paravertebrales indoloros y simétricos. Sin deformidad en escalón. Trapecio y romboides indoloros.',
        percussion: 'Percusión resonante sobre ambos campos pulmonares posteriormente. Sin matidez sugestiva de consolidación o derrame.',
        auscultation: 'Murmullo vesicular audible en ambos campos pulmonares posteriormente. Sin ruidos agregados: sin estertores, sibilancias ni frote pleural. Resonancia vocal normal y simétrica.'
    },
    backLower: {
        inspection: 'Lordosis lumbar fisiológica conservada. Sin escoliosis ni desviación. Músculos paravertebrales simétricos, sin atrofia ni espasmo. Piel íntegra sin mechón piloso, hoyuelo ni lipoma sobre la columna (disrafismo). Sin cicatrices.',
        palpation: 'Sin dolor sobre las apófisis espinosas lumbares (L1-L5) ni articulaciones sacroilíacas. Músculos paravertebrales indoloros, sin espasmo. Escotadura ciática indolora bilateralmente.',
        percussion: 'Puñopercusión lumbar (signo de Giordano) negativa bilateralmente. Percusión sobre la columna indolora.',
        special: 'Rango de movimiento espinal: flexión (yemas de los dedos alcanzan la mitad de la tibia), extensión 30°, flexión lateral 30° bilateralmente, rotación 45° bilateralmente. Prueba de Schober: expansión mayor de 5 cm (flexión lumbar normal). Elevación de pierna recta (Lasègue): negativa bilateralmente a 80°, sin dolor radicular. Lasègue cruzado negativo. Prueba de estiramiento femoral negativa. Pruebas de estrés sacroilíaco (FABER, Gaenslen) negativas.'
    },
    lowerBack: {
        inspection: 'Lordosis lumbar fisiológica conservada. Sin escoliosis ni desviación. Músculos paravertebrales simétricos, sin atrofia ni espasmo. Piel íntegra sin mechón piloso, hoyuelo ni lipoma sobre la columna (disrafismo). Sin cicatrices.',
        palpation: 'Sin dolor sobre las apófisis espinosas lumbares (L1-L5) ni articulaciones sacroilíacas. Músculos paravertebrales indoloros, sin espasmo. Escotadura ciática indolora bilateralmente.',
        percussion: 'Puñopercusión lumbar (signo de Giordano) negativa bilateralmente. Percusión sobre la columna indolora.',
        special: 'Rango de movimiento espinal: flexión (yemas de los dedos alcanzan la mitad de la tibia), extensión 30°, flexión lateral 30° bilateralmente, rotación 45° bilateralmente. Prueba de Schober: expansión mayor de 5 cm (flexión lumbar normal). Elevación de pierna recta (Lasègue): negativa bilateralmente a 80°, sin dolor radicular. Lasègue cruzado negativo. Prueba de estiramiento femoral negativa. Pruebas de estrés sacroilíaco (FABER, Gaenslen) negativas.'
    },
    scapulaLeft: {
        inspection: 'Escápula izquierda normoposicionada a nivel T2-T7, a 5 cm de la línea media. Sin aleteo en reposo ni con flexión anterior del brazo contra resistencia. Ritmo escapulohumeral normal. Sin atrofia de supraespinoso, infraespinoso ni serrato anterior.',
        palpation: 'Sin dolor sobre la espina escapular, borde medial ni ángulo inferior. Fosas supraespinosa e infraespinosa indoloras. Músculos romboides indoloros.',
        auscultation: 'Murmullo vesicular presente y simétrico en la base pulmonar izquierda. Sin ruidos agregados.'
    },
    scapulaRight: {
        inspection: 'Escápula derecha normoposicionada a nivel T2-T7, a 5 cm de la línea media. Sin aleteo en reposo ni con flexión anterior del brazo contra resistencia. Ritmo escapulohumeral normal. Sin atrofia de supraespinoso, infraespinoso ni serrato anterior.',
        palpation: 'Sin dolor sobre la espina escapular, borde medial ni ángulo inferior. Fosas supraespinosa e infraespinosa indoloras. Músculos romboides indoloros.',
        auscultation: 'Murmullo vesicular presente y simétrico en la base pulmonar derecha. Sin ruidos agregados.'
    },
    buttockLeft: {
        inspection: 'Contorno glúteo normal y simétrico. Sin atrofia ni asimetría muscular. Piel íntegra sin exantemas, trayectos fistulosos ni cicatrices. Pliegue interglúteo centrado.',
        palpation: 'Glúteo mayor, medio y menor indoloros. Trocánter mayor indoloro. Escotadura ciática indolora. Sin masas palpables.',
        special: 'Prueba del piriforme (FAIR) negativa, sin reproducción de síntomas ciáticos. Rotación interna de cadera en flexión no provoca dolor. Nervio ciático no irritable a la palpación de la escotadura ciática. Prueba de Trendelenburg negativa (pelvis se mantiene nivelada en apoyo monopodal).'
    },
    buttockRight: {
        inspection: 'Contorno glúteo normal y simétrico. Sin atrofia ni asimetría muscular. Piel íntegra sin exantemas, trayectos fistulosos ni cicatrices. Pliegue interglúteo centrado.',
        palpation: 'Glúteo mayor, medio y menor indoloros. Trocánter mayor indoloro. Escotadura ciática indolora. Sin masas palpables.',
        special: 'Prueba del piriforme (FAIR) negativa, sin reproducción de síntomas ciáticos. Rotación interna de cadera en flexión no provoca dolor. Nervio ciático no irritable a la palpación de la escotadura ciática. Prueba de Trendelenburg negativa (pelvis se mantiene nivelada en apoyo monopodal).'
    },
    buttocks: {
        inspection: 'Contorno glúteo normal y simétrico. Sin atrofia ni asimetría muscular. Piel íntegra sin exantemas, trayectos fistulosos ni cicatrices. Pliegue interglúteo centrado.',
        palpation: 'Glúteo mayor, medio y menor indoloros. Trocánter mayor indoloro. Escotadura ciática indolora. Sin masas palpables.',
        special: 'Prueba del piriforme (FAIR) negativa, sin reproducción de síntomas ciáticos. Rotación interna de cadera en flexión no provoca dolor. Nervio ciático no irritable a la palpación de la escotadura ciática. Prueba de Trendelenburg negativa (pelvis se mantiene nivelada en apoyo monopodal).'
    },
    sacrum: {
        inspection: 'Sacro centrado, de contorno normal. Piel íntegra sin úlceras por presión, trayectos fistulosos, hoyuelos ni mechones pilosos. Sin edema sacro.',
        palpation: 'Sacro indoloro a la palpación. Articulaciones sacroilíacas indoloras bilateralmente. Cóccix indoloro. Sin deformidad en escalón ni alteración ósea.',
        percussion: 'Percusión sobre el sacro indolora. Sin evidencia de edema sacro (fóvea).'
    },
    poplitealLeft: {
        inspection: 'Hueco poplíteo de contorno normal, sin edema ni masas visibles. Sin varices. Piel íntegra.',
        palpation: 'Pulso poplíteo 2+/4+ (palpable con presión profunda en el centro del hueco con la rodilla ligeramente flexionada). Sin aneurisma poplíteo (no expansivo). Sin quiste de Baker (sin masa fluctuante). Hueco poplíteo indoloro.',
        auscultation: 'Sin soplo sobre la arteria poplítea.',
        special: 'Pulso poplíteo 2+/4+ y simétrico, mejor palpado con la rodilla ligeramente flexionada y el paciente relajado. Sin aneurisma poplíteo (pulso no expansivo). Evaluación de quiste de Baker: sin masa fluctuante o tensa en el hueco poplíteo medial; sin signo de Foucher; el quiste no se hace más prominente con la extensión de la rodilla.'
    },
    poplitealRight: {
        inspection: 'Hueco poplíteo de contorno normal, sin edema ni masas visibles. Sin varices. Piel íntegra.',
        palpation: 'Pulso poplíteo 2+/4+ (palpable con presión profunda en el centro del hueco con la rodilla ligeramente flexionada). Sin aneurisma poplíteo (no expansivo). Sin quiste de Baker (sin masa fluctuante). Hueco poplíteo indoloro.',
        auscultation: 'Sin soplo sobre la arteria poplítea.',
        special: 'Pulso poplíteo 2+/4+ y simétrico, mejor palpado con la rodilla ligeramente flexionada y el paciente relajado. Sin aneurisma poplíteo (pulso no expansivo). Evaluación de quiste de Baker: sin masa fluctuante o tensa en el hueco poplíteo medial; sin signo de Foucher; el quiste no se hace más prominente con la extensión de la rodilla.'
    },
    calfLeft: {
        inspection: 'Pantorrilla de contorno normal y simétrica al lado contralateral (circunferencia igual dentro de 1 cm). Sin edema, eritema ni cambios de coloración. Sin varices ni tromboflebitis superficial. Piel íntegra sin ulceración.',
        palpation: 'Pantorrilla blanda, indolora y sin induración. Gastrocnemio y sóleo indoloros. Sin cordón palpable que sugiera tromboflebitis superficial. Temperatura simétrica al lado contralateral.',
        special: 'Signo de Homans: la dorsiflexión pasiva del tobillo no provoca dolor en la pantorrilla (nota: baja sensibilidad para TVP). Prueba de compresión de la pantorrilla indolora. Prueba de Thompson (Simmond): al comprimir la pantorrilla se produce flexión plantar del tobillo, indicando tendón de Aquiles íntegro.'
    },
    calfRight: {
        inspection: 'Pantorrilla de contorno normal y simétrica al lado contralateral (circunferencia igual dentro de 1 cm). Sin edema, eritema ni cambios de coloración. Sin varices ni tromboflebitis superficial. Piel íntegra sin ulceración.',
        palpation: 'Pantorrilla blanda, indolora y sin induración. Gastrocnemio y sóleo indoloros. Sin cordón palpable que sugiera tromboflebitis superficial. Temperatura simétrica al lado contralateral.',
        special: 'Signo de Homans: la dorsiflexión pasiva del tobillo no provoca dolor en la pantorrilla (nota: baja sensibilidad para TVP). Prueba de compresión de la pantorrilla indolora. Prueba de Thompson (Simmond): al comprimir la pantorrilla se produce flexión plantar del tobillo, indicando tendón de Aquiles íntegro.'
    },
    achillesLeft: {
        inspection: 'Tendón de Aquiles visible y de contorno normal. Sin edema, nodularidad (xantomas) ni brecha evidente. Alineación del talón normal (sin valgo ni varo).',
        palpation: 'Tendón de Aquiles palpable, íntegro e indoloro en toda su extensión desde la inserción calcánea hasta la unión musculotendinosa. Sin nódulos, engrosamiento ni crepitación. Bolsa retrocalcánea indolora.',
        special: 'Reflejo aquíleo (S1/S2) 2+ y simétrico. Prueba de Thompson (Simmond) negativa: al comprimir la pantorrilla se produce flexión plantar, confirmando la continuidad del tendón.'
    },
    achillesRight: {
        inspection: 'Tendón de Aquiles visible y de contorno normal. Sin edema, nodularidad (xantomas) ni brecha evidente. Alineación del talón normal (sin valgo ni varo).',
        palpation: 'Tendón de Aquiles palpable, íntegro e indoloro en toda su extensión desde la inserción calcánea hasta la unión musculotendinosa. Sin nódulos, engrosamiento ni crepitación. Bolsa retrocalcánea indolora.',
        special: 'Reflejo aquíleo (S1/S2) 2+ y simétrico. Prueba de Thompson (Simmond) negativa: al comprimir la pantorrilla se produce flexión plantar, confirmando la continuidad del tendón.'
    },
    heelLeft: {
        inspection: 'Talón normoalineado, sin deformidad en valgo ni varo. Piel íntegra sin ulceración, fisuras ni callosidades. Sin edema.',
        palpation: 'Calcáneo indoloro a la prueba de compresión. Inserción de la fascia plantar en la tuberosidad calcánea medial indolora. Talón posterior (inserción del Aquiles) indoloro. Sin nódulos subcutáneos.'
    },
    heelRight: {
        inspection: 'Talón normoalineado, sin deformidad en valgo ni varo. Piel íntegra sin ulceración, fisuras ni callosidades. Sin edema.',
        palpation: 'Calcáneo indoloro a la prueba de compresión. Inserción de la fascia plantar en la tuberosidad calcánea medial indolora. Talón posterior (inserción del Aquiles) indoloro. Sin nódulos subcutáneos.'
    },
    neurological: {
        mentalStatus: `Escala de Coma de Glasgow: 15/15 (O4 V5 M6) - Abre los ojos espontáneamente, respuesta verbal orientada, obedece órdenes.

Orientación: Alerta y completamente orientado en persona (conoce su nombre e identidad), lugar (conoce su ubicación actual), tiempo (conoce fecha, día, mes, año) y situación (comprende por qué está siendo examinado).

Atención: Deletrea "MUNDO" al revés correctamente (O-D-N-U-M). Serie de 7 realizada con precisión (100, 93, 86, 79, 72). Repetición de dígitos: 7 hacia adelante, 5 hacia atrás.

Habla y Lenguaje:
- Fluidez: Habla fluida, con ritmo, velocidad y prosodia normales
- Comprensión: Sigue órdenes simples y complejas apropiadamente
- Repetición: Repite con precisión "Ni peros ni condiciones"
- Denominación: Nombra objetos comunes (lapicera, reloj, anteojos) correctamente
- Lectura: Lee órdenes escritas con precisión
- Escritura: Escribe una oración gramaticalmente correcta

Memoria:
- Recuerdo inmediato: Registra 3/3 objetos (manzana, mesa, moneda)
- Memoria a corto plazo: Recuerda 3/3 objetos después de 5 minutos
- Memoria a largo plazo: Recuerda antecedentes médicos y eventos personales apropiadamente

Funciones Cognitivas Superiores:
- Praxis: Capaz de demostrar el uso de objetos comunes, sin apraxia
- Visuoespacial: Prueba del reloj normal (números correctamente ubicados, manecillas señalando las 11:10)
- Cálculo: Aritmética simple conservada
- Abstracción: Interpreta refranes apropiadamente`,

        cranialNerves: `PC I (Olfatorio): No evaluado formalmente (sin anosmia subjetiva referida).

PC II (Óptico):
- Agudeza visual: 6/6 en ojo derecho, 6/6 en ojo izquierdo (con corrección si la usa)
- Campos visuales: Completos por confrontación en los cuatro cuadrantes bilateralmente. Sin defectos, negligencia ni extinción a estimulación doble simultánea
- Pupilas: Isocóricas de 3 mm, redondas, regulares. Reflejo fotomotor directo enérgico bilateralmente. Reflejo consensual conservado. Sin defecto pupilar aferente relativo (pupila de Marcus Gunn)
- Reflejo de acomodación: Conservado con constricción pupilar y convergencia en visión cercana
- Fondo de ojo: Reflejo rojo presente. Papilas rosadas con bordes netos, relación copa/disco 0,3. Sin papiledema. Vasos con relación arteriola/vénula normal, sin cruces AV patológicos, hilo de plata ni hemorragias. Mácula normal

PC III, IV, VI (Oculomotor, Troclear, Abducens):
- Movimientos extraoculares: Rango completo en todas las direcciones de la mirada (arriba, abajo, izquierda, derecha y oblicuas)
- Sin nistagmo en mirada primaria ni en mirada lateral
- Sin diplopía referida en ninguna dirección
- Sin ptosis ni retraso palpebral
- Seguimiento suave y sacadas normales

PC V (Trigémino):
- Sensitivo: Sensibilidad táctil y dolorosa conservada y simétrica en las distribuciones V1 (frente), V2 (mejilla), V3 (mandíbula) bilateralmente
- Motor: Músculos masetero y temporal se contraen simétricamente al apretar la mandíbula. Apertura mandibular en línea media contra resistencia
- Reflejo corneal: Presente bilateralmente (evalúa V1 sensitivo y VII motor)
- Reflejo mandibular: Presente y no exagerado (1+)

PC VII (Facial):
- En reposo: Cara simétrica, sin caída facial, surcos nasolabiales simétricos
- Motor de cara superior: Frente se arruga simétricamente, cejas se elevan igual, cierra los ojos con fuerza contra resistencia bilateralmente
- Motor de cara inferior: Sonrisa simétrica, capaz de inflar mejillas, mostrar dientes y fruncir labios simétricamente
- Gusto: No evaluado formalmente (sin disgeusia subjetiva)

PC VIII (Vestibulococlear):
- Audición: Groseramente conservada bilateralmente al frote de dedos y voz susurrada a 60 cm
- Prueba de Rinne: Positiva bilateralmente (conducción aérea > conducción ósea = normal)
- Prueba de Weber: Lateraliza a la línea media (sin lateralización)
- Sin nistagmo, vértigo ni alteración del equilibrio

PC IX, X (Glosofaríngeo, Vago):
- Voz: Calidad normal, sin ronquera, disartria ni voz nasal
- Paladar: Úvula centrada en reposo. Paladar se eleva simétricamente con la fonación ("Aaah")
- Reflejo nauseoso: Presente bilateralmente (tocar faringe posterior → contracción)
- Deglución: Sin disfagia ni regurgitación nasal referida
- Tos: Fuerte y efectiva

PC XI (Accesorio):
- Esternocleidomastoideo: Fuerza 5/5 bilateral al girar la cabeza contra resistencia
- Trapecio: Fuerza 5/5 bilateral al encoger los hombros contra resistencia. Sin atrofia ni asimetría

PC XII (Hipogloso):
- En reposo: Lengua centrada en el piso de la boca, sin atrofia ni fasciculaciones
- Protrusión: Lengua protruye en línea media, sin desviación
- Movimiento: Rango completo de movimiento lateral y vertical
- Fuerza: Fuerza lingual normal contra la mejilla bilateralmente`,

        motor: `Inspección:
- Sin atrofia muscular ni asimetría de miembros
- Sin fasciculaciones en reposo ni a la percusión
- Sin movimientos anormales (temblor, corea, atetosis, distonía, mioclonías)

Tono - Miembros Superiores:
- Brazo derecho: Tono normal en hombro, codo y muñeca. Sin espasticidad (navaja), rigidez (rueda dentada o tubo de plomo) ni hipotonía
- Brazo izquierdo: Tono normal en hombro, codo y muñeca. Sin espasticidad, rigidez ni hipotonía

Tono - Miembros Inferiores:
- Pierna derecha: Tono normal en cadera, rodilla y tobillo. Sin espasticidad, rigidez ni hipotonía
- Pierna izquierda: Tono normal en cadera, rodilla y tobillo. Sin espasticidad, rigidez ni hipotonía

Fuerza (escala MRC 0-5) - Miembros Superiores:
Derecha | Izquierda
- Abducción de hombro (C5, deltoides): 5/5 | 5/5
- Aducción de hombro (C5-7, pectorales): 5/5 | 5/5
- Flexión de codo (C5/6, bíceps): 5/5 | 5/5
- Extensión de codo (C7/8, tríceps): 5/5 | 5/5
- Extensión de muñeca (C6/7, n. radial): 5/5 | 5/5
- Flexión de muñeca (C7/8, mediano/cubital): 5/5 | 5/5
- Extensión de dedos (C7, interóseo posterior): 5/5 | 5/5
- Flexión de dedos (C8, mediano/cubital): 5/5 | 5/5
- Abducción de dedos (T1, n. cubital): 5/5 | 5/5
- Abducción del pulgar (T1, n. mediano): 5/5 | 5/5

Fuerza (escala MRC 0-5) - Miembros Inferiores:
Derecha | Izquierda
- Flexión de cadera (L1/2, iliopsoas): 5/5 | 5/5
- Extensión de cadera (L5/S1, glúteo mayor): 5/5 | 5/5
- Abducción de cadera (L4/5, glúteo medio): 5/5 | 5/5
- Flexión de rodilla (L5/S1, isquiotibiales): 5/5 | 5/5
- Extensión de rodilla (L3/4, cuádriceps): 5/5 | 5/5
- Dorsiflexión de tobillo (L4/5, tibial anterior): 5/5 | 5/5
- Flexión plantar (S1/2, gastrocnemio): 5/5 | 5/5
- Extensión del hallux (L5, EHL): 5/5 | 5/5

Prueba de claudicación pronadora: Brazos extendidos con palmas hacia arriba durante 20 segundos - sin claudicación, pronación ni descenso de ninguno de los brazos. Ojos abiertos y cerrados, ambos negativos.`,

        sensory: `Tacto Superficial (algodón):
- Miembros superiores: Conservado en dermatomas C5 (brazo lateral), C6 (antebrazo lateral, pulgar), C7 (dedo medio), C8 (meñique, antebrazo medial), T1 (brazo medial) bilateralmente
- Miembros inferiores: Conservado en dermatomas L2 (muslo anterior), L3 (rodilla medial), L4 (pantorrilla medial), L5 (pantorrilla lateral, dorso del pie), S1 (borde lateral del pie, planta) bilateralmente
- Tronco: Conservado en todos los dermatomas torácicos T2-T12 bilateralmente

Dolor (discriminación agudo/romo):
- Miembros superiores: Conservado y simétrico en todos los dermatomas bilateralmente. Distingue agudo de romo
- Miembros inferiores: Conservado y simétrico en todos los dermatomas bilateralmente. Distingue agudo de romo
- Sin nivel sensitivo identificado

Temperatura: No evaluada formalmente (sensibilidad dolorosa conservada sugiere función espinotalámica intacta)

Sensibilidad Vibratoria (diapasón de 128 Hz):
- Miembros superiores: Conservada en articulaciones interfalángicas distales de los dedos índice bilateralmente
- Miembros inferiores: Conservada en articulación interfalángica del hallux, maléolo medial y tuberosidad tibial bilateralmente
- Sin reducción de la percepción vibratoria

Sentido de Posición Articular (Propiocepción):
- Miembros superiores: Detecta con precisión movimientos pequeños de la articulación interfalángica distal del dedo índice bilateralmente con ojos cerrados
- Miembros inferiores: Detecta con precisión movimientos pequeños de la articulación interfalángica del hallux bilateralmente con ojos cerrados

Prueba de Romberg: Negativa. El paciente permanece de pie con los pies juntos y ojos cerrados durante 30 segundos sin balanceo significativo ni pérdida del equilibrio.

Discriminación de Dos Puntos: Normal en las yemas de los dedos (< 5 mm)

Estereognosia: Identifica objetos comunes (moneda, llave, clip) al tacto con ojos cerrados

Grafestesia: Identifica correctamente números trazados en la palma`,

        reflexes: `Reflejos Osteotendinosos Profundos (graduados 0-4):
0 = Ausente, 1+ = Disminuido, 2+ = Normal, 3+ = Vivo, 4+ = Clonus

Reflejos de Miembros Superiores:
                        Derecha | Izquierda
- Bicipital (C5/6):        2+  |  2+
- Estilorradial (C6):      2+  |  2+
- Tricipital (C7):         2+  |  2+
- Flexores de dedos (C8):  2+  |  2+

Reflejos de Miembros Inferiores:
                        Derecha | Izquierda
- Rotuliano (L3/4):        2+  |  2+
- Aquíleo (S1/2):          2+  |  2+

Difusión refleja o aductores cruzados: Ausente

Signo de Hoffmann: Negativo bilateralmente (el chasquido de la falange distal del dedo medio no provoca flexión del pulgar/índice)

Respuesta Plantar (Babinski):
- Derecha: Flexora (hallux hacia abajo) - Normal
- Izquierda: Flexora (hallux hacia abajo) - Normal
- Sin abanico de los dedos

Clonus:
- Tobillo: Ausente bilateralmente (< 3 latidos con dorsiflexión rápida)
- Rotuliano: Ausente bilateralmente
- Sin clonus sostenido

Reflejos Superficiales:
- Reflejos abdominales (T7-T12): Presentes en los cuatro cuadrantes
- Reflejo cremastérico (L1/2): Presente bilateralmente (si es varón)

Reflejo Mandibular (PC V): Presente pero no exagerado (1+), compatible con función normal de neurona motora superior

Reflejos Primitivos: Ausentes (sin palmomentoniano, prensión, hociqueo ni glabelar)`,

        coordination: `Coordinación de Miembros Superiores:

Prueba Dedo-Nariz:
- Derecha: Realizada con suavidad y precisión. Sin temblor intencional, dismetría ni pasado del objetivo en pruebas repetidas
- Izquierda: Realizada con suavidad y precisión. Sin temblor intencional, dismetría ni pasado del objetivo en pruebas repetidas

Prueba Dedo-Nariz-Dedo:
- Derecha: Precisa, con trayectoria suave entre objetivos
- Izquierda: Precisa, con trayectoria suave entre objetivos

Movimientos Alternantes Rápidos (Disdiadococinesia):
- Derecha: Pronosupinación rápida del antebrazo suave y regular
- Izquierda: Pronosupinación rápida del antebrazo suave y regular
- Sin ritmo irregular ni descomposición del movimiento

Movimientos Finos de los Dedos:
- Golpeteo rápido de dedos y oposición secuencial de dedos realizados normalmente bilateralmente

Prueba de Rebote:
- Sin rebote excesivo al liberar súbitamente el brazo, sugiriendo función de freno cerebelar normal

Coordinación de Miembros Inferiores:

Prueba Talón-Rodilla:
- Derecha: Talón se ubica con precisión en la rodilla contralateral y desliza suavemente por la tibia hasta el tobillo sin desviación
- Izquierda: Talón se ubica con precisión en la rodilla contralateral y desliza suavemente por la tibia hasta el tobillo sin desviación

Prueba Dedo del Pie-Dedo del Examinador:
- Derecha: Localización precisa del dedo del examinador con el hallux
- Izquierda: Localización precisa del dedo del examinador con el hallux

Golpeteo Rápido del Pie:
- Ambos pies golpean el piso rápida y rítmicamente

Ataxia de Tronco: Ausente. El paciente permanece sentado sin apoyo, con tronco estable.

Marcha en Tándem: Ver sección de Marcha

Evaluación de Nistagmo: Sin nistagmo en mirada primaria ni en mirada lateral sostenida (excluyendo nistagmo fisiológico de fin de recorrido)`,

        gait: `Observación de la Marcha:
- Inicio: Normal, sin vacilación ni congelamiento
- Base: Ancho de apoyo normal (no ampliada)
- Paso: Longitud normal, igual bilateralmente
- Braceo: Presente y simétrico
- Postura: Erguida, sin postura encorvada ni inclinada
- Fluidez: Movimientos suaves y coordinados durante todo el ciclo de la marcha
- Giro: Realizado suavemente, sin pérdida del equilibrio ni pasos adicionales

Marcha sobre los Talones:
- Capaz de caminar sobre los talones 10 pasos manteniendo el equilibrio (evalúa dorsiflexores L4/5)

Marcha sobre las Puntas:
- Capaz de caminar sobre las puntas 10 pasos manteniendo el equilibrio (evalúa flexores plantares S1/2)

Marcha en Tándem (Talón-Punta):
- Camina en línea recta colocando el talón directamente delante de la punta del pie contrario durante 10 pasos sin inestabilidad significativa (evalúa función cerebelar de línea media)

Prueba de Romberg:
- Negativa. Permanece de pie con los pies juntos, brazos a los costados y ojos cerrados durante 30 segundos. Sin balanceo excesivo ni pérdida del equilibrio (evalúa propiocepción cuando se eliminan las aferencias vestibular y visual)

Prueba de Marcha de Unterberger/Fukuda:
- Marcha en el lugar con ojos cerrados durante 50 pasos. Sin rotación significativa (< 30 grados) ni desviación (evalúa función vestibular)

Apoyo Monopodal:
- Capaz de sostenerse sobre cada pierna de forma independiente durante > 5 segundos con los ojos abiertos

Evaluación Funcional:
- Capaz de levantarse de la silla sin usar los brazos
- Capaz de subir escaleras con patrón recíproco normal`,

        special: `Prueba de Romberg: NEGATIVA - mantiene el equilibrio con los pies juntos y ojos cerrados durante 30 segundos (sin balanceo significativo ni pérdida del equilibrio).

Claudicación pronadora: NEGATIVA - brazos extendidos, palmas hacia arriba, ojos cerrados durante 20-30 segundos, sin claudicación, pronación ni descenso de ninguno de los brazos.

Signo de Babinski: Respuestas plantares FLEXORAS (hacia abajo) bilateralmente - normal.

Signo de Hoffmann: NEGATIVO bilateralmente - el chasquido de la falange distal del dedo medio no produce flexión del pulgar ni del índice.

Signo de Lhermitte: NEGATIVO - la flexión del cuello no produce sensación de choque eléctrico que se irradie por la columna o los miembros.

Signo de Kernig: NEGATIVO bilateralmente - con la cadera flexionada a 90°, la rodilla se extiende completamente sin resistencia, dolor ni espasmo de isquiotibiales.

Signo de Brudzinski: NEGATIVO - la flexión pasiva del cuello no produce flexión involuntaria de caderas ni rodillas. Sin meningismo.`
    },
    general: {
        inspection: 'El paciente está alerta, despierto y orientado en persona, lugar, tiempo y situación. Aparenta la edad referida, bien nutrido, bien hidratado y sin signos de malestar agudo. Sentado cómodamente en la camilla/cama de exploración. Signos vitales estables. Sin signos evidentes de dificultad respiratoria (sin uso de musculatura accesoria, sin respiración con labios fruncidos, sin cianosis). Sin palidez, ictericia ni cianosis. Sin caquexia ni obesidad. Sin adenopatías visibles en regiones cervical, axilar o inguinal. Manos tibias, sin hipocratismo digital, coiloniquia, leuconiquia, hemorragias en astilla ni eritema palmar. Sin asterixis ni temblor. Estado de ánimo y afecto apropiados.'
    }
};
