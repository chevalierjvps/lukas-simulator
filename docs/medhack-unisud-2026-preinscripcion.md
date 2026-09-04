# MED-HACK UNISUD 2026 — Borrador de Preinscripción

> Borrador para copiar/pegar en el formulario oficial. Los campos marcados
> `[COMPLETAR]` son datos que solo tú tienes (nombre del equipo, compañeros de
> equipo si los hay, teléfono si cambió). Todo lo demás está redactado y listo.
>
> **Nota de honestidad académica** — léela antes de enviar: Lukas 1.0 no partió
> de cero. Es una extensión sustancial, con marca, contenido clínico y motor
> propios, sobre una plataforma académica de código abierto (**Rohy**, del
> proyecto CRETIC, licencia Carm Research v1.4 — uso no comercial/académico
> libre). El punto 10 (Viabilidad) está redactado para reflejar eso con
> precisión: tu mérito real —y el que puedes defender ante la banca sin
> titubear— es todo lo que construiste ENCIMA de esa base (contenido DICOM y
> patología reales, lógica clínica causa-efecto, rediseño completo de la
> interfaz, empaquetado de escritorio, panel de autoría). Reclamar la base
> entera como propia sí sería un riesgo en la arguición.

---

## 1. Datos del equipo

- **Nombre del equipo:** `[COMPLETAR]`
- **Nombre y apellido completos de los integrantes:** João Vitor Pedroso dos Santos `[+ compañeros de equipo, si los hay — COMPLETAR]`
- **Número de documento o identificación institucional:** 86903 `[confirmar]`
- **Semestre académico de cada integrante:** Cuarto
- **Sede:** Pedro Juan Caballero
- **Nombre, teléfono y correo electrónico del representante del equipo:** João Vitor Pedroso dos Santos, +55 46 999253924, pedrosojoaovitor33@gmail.com

## 2. Línea temática

- Software para la Salud.

## 3. Nombre preliminar del proyecto

- **Lukas 1.0** — Simulador Clínico Realista

## 4. Estado actual del proyecto

- **Selección:** El proyecto ya fue probado o utilizado.
- **Estado técnico:** Prototipo funcional avanzado, en ejecución local (escritorio, vía Tauri/Rust) y probado extensivamente durante el desarrollo, con más de 200 archivos de prueba automatizada cubriendo la lógica clínica, la interfaz y el motor de simulación.
- **Enlaces de descarga / Pruebas:** `[COMPLETAR — el proyecto corre local/desktop (Tauri) y aún no está publicado en tiendas de apps; si quieres, puedo preparar un instalador o una demo grabada para adjuntar]`

## 5. Problema o necesidad identificada

La formación clínica del estudiante de Medicina depende hoy de dos extremos:
maniquíes físicos de alta fidelidad —caros, escasos y difíciles de programar
para un turno completo de práctica— o casos clínicos "de papel" o en
diapositivas, estáticos, que no castigan la demora ni premian la conducta
correcta. Ninguno de los dos reproduce lo que de verdad exige la clínica: un
paciente que **evoluciona en tiempo real**, que empeora si no se actúa, y cuya
fisiología responde de forma coherente a lo que el estudiante hace (o deja de
hacer). Además, los recursos de apoyo diagnóstico —radiografías, tomografías,
láminas de patología— casi siempre se muestran como imágenes fijas y
genéricas, sin ser las herramientas reales (visor DICOM, microscopio virtual)
que el estudiante usará en la práctica.

## 6. Solución propuesta

Lukas 1.0 es un simulador de paciente virtual de alta fidelidad para
estudiantes de Medicina, con un avatar 3D con expresividad facial, monitor
multiparamétrico en tiempo real (ECG, SpO₂, PA, FR, temperatura, EtCO₂) y un
motor de fisiología que hace evolucionar al paciente —para mejor o para
peor— según la conducta del estudiante. El estudiante interactúa por voz o
texto con un paciente conversacional impulsado por IA, coherente con género,
dolor y signos vitales del caso. La ausculta cardiopulmonar por foco, la
administración de fármacos y la desfibrilación (habilitada solo ante ritmos
realmente desfibrilables) responden con causa y efecto real, no con textos
fijos. Los exámenes complementarios usan las herramientas reales del
clínico: una sala de lectura DICOM (radiografía, tomografía) y un
microscopio virtual de patología digital con láminas histológicas reales de
alta resolución (whole-slide imaging), no capturas de pantalla. Un panel de
administración permite a un docente configurar cada caso —vitales, hallazgos
del examen físico, imágenes, laudos— sin tocar código. Corre 100% local vía
Tauri (escritorio, Linux/Windows/Mac), en portugués y español (con inglés y
más idiomas ya soportados en la base), y no requiere conexión a internet
para operar.

## 7. Innovación y diferenciación

- **Instrumentos reales, no imágenes de instrumentos.** El DICOM y la
  patología digital no son fotos: son un visor real con ventana/nivel, series
  múltiples, y un microscopio virtual con escala en micras y zoom real sobre
  el tejido.
- **Coherencia clínica causa-efecto**, construida específicamente para este
  proyecto: la ausculta refleja el caso (un paciente con dengue ausculta
  normal; uno con neumonía no), y el desfibrilador solo "funciona" —con efecto
  real sobre el ritmo— ante FV/TV sin pulso, igual que en la vida real.
- **Panel de autoría de casos** para docentes: un caso clínico completo
  (vitales, examen físico, laudos de imagen, evolución) se configura sin
  programar.
- **Escritorio offline-first** (Tauri/Rust): el simulador corre sin depender
  de un servidor en la nube, relevante para una sede con conectividad
  limitada.
- **Multilingüe de base** (portugués y español activos; la plataforma sostiene
  además inglés y otros idiomas), reflejando la composición real de la
  comunidad estudiantil de la Universidad Sudamericana.
- **Construido sobre una base académica seria**: Lukas 1.0 extiende Rohy, una
  plataforma de simulación de pacientes virtuales desarrollada en el proyecto
  de investigación CRETIC (Research Council of Finland), bajo licencia de uso
  académico no comercial. Sobre esa base, este proyecto aporta el contenido
  clínico real (DICOM y patología digital curados), la lógica de coherencia
  fisiológica, el panel de autoría, el rediseño completo de la interfaz y el
  empaquetado como aplicación de escritorio — el trabajo propio de este
  equipo.

## 8. Beneficiarios

- **Selección:** Estudiantes.
- **Explicación:** El público objetivo son los estudiantes de Medicina de la
  Universidad Sudamericana, incluyendo la numerosa comunidad de estudiantes
  brasileños, paraguayos y de otras nacionalidades latinoamericanas que cursan
  en la sede de Pedro Juan Caballero. La aplicación está pensada para su
  práctica diaria de razonamiento clínico bajo presión de tiempo, antes de
  enfrentar al paciente real.

## 9. Impacto potencial

Lukas 1.0 permite practicar razonamiento clínico de alta exigencia —incluyendo
escenarios críticos y de emergencia— cuantas veces sea necesario, sin el costo
ni la disponibilidad limitada de un maniquí físico. Al hacer visibles las
consecuencias de la demora o de una conducta incorrecta (deterioro real del
paciente), refuerza hábitos de priorización y manejo del tiempo que son
difíciles de enseñar con casos estáticos. El acceso a un visor DICOM y a un
microscopio virtual reales adelanta al estudiante herramientas que usará en la
práctica clínica y en la carrera. Al correr en escritorio y sin depender de
conexión, es escalable a laboratorios de simulación con conectividad limitada,
y el panel de autoría permite que los propios docentes de la UNISUD amplíen la
biblioteca de casos según el currículo local.

## 10. Viabilidad

El proyecto es viable porque parte de una base técnica ya probada: se apoya en
Rohy, una plataforma de simulación de pacientes virtuales de un proyecto de
investigación académico (CRETIC, Research Council of Finland), sobre la cual
este equipo desarrolló la identidad, el contenido clínico real, la lógica de
coherencia fisiológica, el panel de autoría de casos y el rediseño completo de
la experiencia, empaquetando todo como aplicación de escritorio con Tauri/Rust.
El resultado ya corre de punta a punta —interfaz, motor de simulación, IA
conversacional, imágenes DICOM y patología reales— y fue validado con una
suite de más de 200 pruebas automatizadas. Partir de una base sólida en lugar
de escribir un simulador desde cero es, precisamente, lo que permitió invertir
el tiempo del equipo en el contenido clínico y la experiencia —que es donde
está el valor educativo real— en vez de en infraestructura básica.

## 11. Motivación del equipo

Buscamos participar en Med-Hack UNISUD 2026 para validar Lukas 1.0 con
expertos y mentores del área de salud, recibir retroalimentación que permita
ajustarlo a las necesidades reales del currículo de Medicina de la UNISUD, y
llevar una herramienta de simulación de alta fidelidad —hoy reservada a pocas
instituciones con presupuesto para maniquíes físicos— a la práctica diaria de
nuestra propia comunidad universitaria.

---

## Checklist antes de enviar

- [ ] Completar nombre del equipo y compañeros de equipo (si los hay)
- [ ] Confirmar número de documento/matrícula
- [ ] Decidir qué mostrar como "enlace de descarga / prueba" (punto 4) — instalador, video de demo, o repositorio
- [ ] Revisar el punto 10 con la banca en mente: tener lista una respuesta corta de 20 segundos sobre "qué es Rohy y qué construiste tú encima" para la arguición
- [ ] Pegar el contenido de este archivo en el formulario oficial
