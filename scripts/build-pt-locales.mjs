import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@formatjs/icu-messageformat-parser';

const LOCALES_DIR = path.join(process.cwd(), 'src', 'locales');
const EN_DIR = path.join(LOCALES_DIR, 'en');
const ES_DIR = path.join(LOCALES_DIR, 'es');
const PT_DIR = path.join(LOCALES_DIR, 'pt');

if (!fs.existsSync(PT_DIR)) {
  fs.mkdirSync(PT_DIR, { recursive: true });
}

function icuArgs(message) {
  const args = new Set();
  const walk = (elements) => {
    for (const el of elements) {
      if (el.value && typeof el.value === 'string' && el.type !== 0) args.add(el.value);
      if (el.options) Object.values(el.options).forEach(opt => walk(opt.value));
      if (el.children) walk(el.children);
    }
  };
  try {
    walk(parse(message));
  } catch (e) {
    // fallback regex
    const matches = message.match(/\{([a-zA-Z0-9_]+)/g) || [];
    for (const m of matches) args.add(m.slice(1));
  }
  return args;
}

// Special dictionary overrides per namespace & key
const SPECIFIC_OVERRIDES = {
  'common.json': {
    'app_title': 'Osiris 1.0 AI Simulador de Pacientes',
    'ecg_summary_empty': 'Nenhum registro de ECG',
    'ecg_summary_recording': '{count, plural, one {# registro de ECG} other {# registros de ECG}}',
    'ecg_summary_recordings': '{count, plural, one {# registro de ECG} other {# registros de ECG}}',
    'pathology_summary_mixed': '{count, plural, one {# lâmina ou fotografia} other {# lâminas e fotografias}}',
    'pathology_summary_photographs': '{count, plural, one {# fotografia macroscópica} other {# fotografias macroscópicas}}',
    'pathology_summary_slides': '{count, plural, one {# lâmina} other {# lâminas}}',
    'radoyon_studies_count': '{count, plural, one {# estudo de imagem} other {# estudos de imagem}}',
    'radoyon_worklist_empty': 'Nenhum estudo de imagem atribuído a este caso',
    'radoyon_author_intro': 'Os estudos de imagem DICOM vinculados a este caso aparecerão aqui',
    'radoyon_tools_label': 'Ferramentas de Imagem',
    'radoyon_status_pending': 'Pendente',
    'room_pacs_sub': 'Visualizador DICOM e Estudos Radiológicos',
    'room_pacs_author': 'Configurar estudos radiológicos para este caso',
    'room_ready_results': '{label} — {count, plural, one {# resultado pronto} other {# resultados prontos}}',
    'error_boundary_title': 'Ocorreu um erro nesta exibição',
    'error_boundary_body': 'O restante da aplicação não foi afetado. Você pode tentar novamente, mudar de sala ou recarregar a página se o problema persistir.',
    'error_boundary_retry': 'Tentar novamente',
    'oyon_press_camera': 'Clique no ícone da câmera para iniciar a análise facial'
  },
  'auth.json': {
    'hero_headline': 'O paciente evolui enquanto você ainda está pensando.',
    'hero_sub': 'Osiris é uma plataforma de pacientes virtuais de alta fidelidade baseada em IA para treinamento clínico. Realize a anamnese, examine, solicite exames, trate e participe do debriefing — enquanto os sinais vitais evoluem, alarmes disparam e cada decisão gera consequências visíveis.',
    'signin_continue': 'Entre para continuar no Osiris.',
    'footer_tagline': 'Plataforma de Simulação de Pacientes Virtuais para Treinamento Clínico',
    'platform_tagline': 'Plataforma de Simulação de Pacientes Virtuais',
    'error_invalid_credentials': 'Nome de usuário ou senha incorretos.',
    'error_account_locked': 'Esta conta está temporariamente bloqueada. Tente novamente mais tarde ou contate o administrador.',
    'password_req_met': 'Requisito atendido'
  },
  'authoring_config.json': {
    'header_title_fullpage': 'Osiris 1.0 — Configurações e Administração',
    'plugin_settings_library_empty': 'Nenhum plugin instalado no sistema',
    'pathology_settings_imports': 'Importações e parâmetros de patologia digital',
    'plugin_settings_save': 'Salvar configurações de plugins'
  },
  'chat.json': {
    'llm_error_cannot_connect': 'Não foi possível conectar ao motor de IA. Verifique as configurações de conexão.',
    'llm_error_service_unavailable': 'O serviço de IA está temporariamente indisponível. Tente novamente em instantes.'
  },
  'discussion.json': {
    'tutor_reply_failed': 'O tutor de debriefing não conseguiu responder no momento. Tente enviar sua mensagem novamente.',
    'debrief_points_chip': '+{points, plural, one {# ponto} other {# pontos}}'
  },
  'examination.json': {
    'section_demographics': 'Dados Demográficos e Identificação',
    'no_labs_returned': 'Nenhum resultado laboratorial retornado para esta seleção',
    'debrief_total_points': 'Pontuação Total do Caso',
    'debrief_points_chip': '+{points, plural, one {# ponto} other {# pontos}}',
    'exams_performed': '{count, plural, one {# exame realizado} other {# exames realizados}}'
  },
  'first_run.json': {
    'welcome_title': 'Bem-vindo ao Osiris',
    'admin_subtitle': 'Prepare o Osiris para seus alunos — todas as opções podem ser alteradas depois em Configurações.',
    'case_intro': 'Os alunos iniciam diretamente em um caso clínico. O Osiris seleciona o caso correspondente ao idioma do aluno; o caso padrão abaixo serve de fallback quando não houver correspondência exata.',
    'emotion_intro': 'O Osiris pode observar a expressão facial dos alunos durante as sessões (Oyon). A análise roda localmente no navegador; o armazenamento de dados requer o consentimento do estudante.',
    'case_card_error': 'Não foi possível carregar os casos no momento — você ainda pode continuar, e eles estarão disponíveis no menu → Casos.'
  },
  'help.json': {
    'drawer_title': 'Ajuda e Documentação',
    'tour_student_welcome_title': 'Bem-vindo ao Osiris',
    'tour_student_welcome_body': 'Você irá conduzir uma simulação com um paciente virtual. Nenhuma informação aqui constitui aconselhamento médico real.',
    'article_getting_started': 'Guia de Introdução e Primeiros Passos',
    'group_using': 'Uso do Simulador',
    'support_intro': 'Precisa de suporte ou encontrou um problema? Consulte nossos guias ou gere um pacote de diagnóstico.'
  },
  'investigations.json': {
    'radiologist_credentials': 'Laudo emitido pelo Serviço de Radiologia',
    'n_items': '{count, plural, one {# item} other {# itens}}',
    'n_tests': '{count, plural, one {# exame} other {# exames}}',
    'order_count_lab': 'Solicitar {count, plural, one {# exame} other {# exames}}',
    'order_count_radiology': 'Solicitar {count, plural, one {# estudo} other {# estudos}}'
  },
  'monitor.json': {
    'active_treatments': '{count, plural, one {# Tratamento Ativo} other {# Tratamentos Ativos}}',
    'n_minutes': '{count, plural, one {# minuto} other {# minutos}}',
    'returns_in_mins': 'Retorna em {count, plural, one {# min} other {# mins}}'
  },
  'orders.json': {
    'n_studies': '{count, plural, one {# estudo} other {# estudos}}',
    'n_tests': '{count, plural, one {# exame} other {# exames}}',
    'order_n_studies': 'Solicitar {count, plural, one {# Estudo} other {# Estudos}}',
    'order_n_tests': 'Solicitar {count, plural, one {# Exame} other {# Exames}}'
  },
  'profile.json': {
    'field_label_name': 'Nome Completo',
    'field_label_grade': 'Ano / Período Acadêmico'
  },
  'teacher_cohorts.json': {
    'badge_assigned_cases': '{count, plural, one {# caso atribuído} other {# casos atribuídos}}',
    'badge_instructors': '{count, plural, one {# instrutor} other {# instrutores}}',
    'btn_add_n_students': '{count, plural, =0 {Adicionar estudante} one {Adicionar # estudante} other {Adicionar # estudantes}}',
    'btn_assign_n': '{count, plural, =0 {Atribuir} other {Atribuir #}}',
    'card_enrolled_students': '{count, plural, one {# estudante matriculado} other {# estudantes matriculados}}',
    'label_cases_selected': '{count, plural, one {# caso selecionado} other {# casos selecionados}}',
    'toast_cases_assigned': '{count, plural, one {Caso # atribuído} other {Casos # atribuídos}}',
    'toast_coteachers_added': '{count, plural, one {Adicionado # co-professor} other {Adicionados # co-professores}}.',
    'toast_coteachers_added_with_failed': '{count, plural, one {Adicionado # co-professor} other {Adicionados # co-professores}}, {failed} falharam.'
  },
  'teacher_reports.json': {
    'actions_count': '{count, plural, one {# ação} other {# ações}}',
    'activity_by_case': 'Atividade por caso ({sessions, plural, one {# sessão} other {# sessões}}, {actions, plural, one {# ação} other {# ações}})',
    'days_hint': '{count, plural, one {# dia} other {# dias}}',
    'grid_subtitle': '{students, plural, one {# estudante matriculado} other {# estudantes matriculados}} em {cases, plural, one {# caso} other {# casos}}.',
    'not_attempted_cells': '{count, plural, one {# célula não realizada} other {# células não realizadas}}',
    'pulse_students_count': '{count, plural, one {# estudante} other {# estudantes}}',
    'tna_states_hint': '{count, plural, one {# estado} other {# estados}}'
  },
  'teacher_users.json': {
    'header_subtitle': '{count, plural, one {# usuário} other {# usuários}} · gerenciar contas, funções, turmas e acessos',
    'invite_created_help': 'Envie o link ou informe o código. O Osiris não envia e-mails — o compartilhamento fica a seu critério.',
    'preview_enroll': 'Matricular {count, plural, one {# usuário} other {# usuários}} em {classes, plural, one {# turma} other {# turmas}}',
    'preview_ops': '= {count, plural, one {# operação} other {# operações}}',
    'preview_reactivate': 'Reativar {count, plural, one {# usuário} other {# usuários}}',
    'preview_role': 'Alterar função de {count, plural, one {# usuário} other {# usuários}} para {role}',
    'preview_suspend': 'Suspender {count, plural, one {# usuário} other {# usuários}}',
    'preview_unenroll': 'Remover {count, plural, one {# usuário} other {# usuários}} de {classes, plural, one {# turma} other {# turmas}}',
    'skip_note': '{count, plural, one {# usuário selecionado} other {# usuários selecionados}} não pode ser modificado por esta ação (sua própria conta ou nível igual/superior) e será ignorado.',
    'toast_enrolled_memberships': 'Matriculado(a) {count, plural, one {# inscrição} other {# inscrições}}',
    'toast_removed_memberships': 'Removido(a) {count, plural, one {# inscrição} other {# inscrições}}'
  }
};

// Portuguese translation function for strings
function translateString(key, esStr, enStr, ns) {
  if (SPECIFIC_OVERRIDES[ns]?.[key]) {
    return SPECIFIC_OVERRIDES[ns][key];
  }

  // Preserve simple acronyms
  if (esStr === 'ECG' || esStr === 'PA' || esStr === 'SpO2' || esStr === 'EtCO2' || esStr === 'DICOM' || esStr === 'PACS' || esStr === 'Oyon' || esStr === 'Osiris') {
    return esStr;
  }

  let text = esStr;

  // Protect ICU expressions like {var} and {var, plural, ...}
  const icuBlocks = [];
  text = text.replace(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, (match) => {
    const idx = icuBlocks.length;
    icuBlocks.push(match);
    return `___ICU_${idx}___`;
  });

  // Apply Spanish -> Portuguese transformations
  text = text
    .replace(/\bRohy\b/g, 'Osiris')
    .replace(/\bIniciar sesión\b/g, 'Entrar')
    .replace(/\bInicia sesión\b/g, 'Entre')
    .replace(/\bCerrar sesión\b/g, 'Sair')
    .replace(/\bRegistrarse\b/g, 'Cadastrar-se')
    .replace(/\bContraseña\b/g, 'Senha')
    .replace(/\bcontraseña\b/g, 'senha')
    .replace(/\bcontraseñas\b/g, 'senhas')
    .replace(/\bNombre de usuario\b/g, 'Nome de usuário')
    .replace(/\bnombre de usuario\b/g, 'nome de usuário')
    .replace(/\bGuardar\b/g, 'Salvar')
    .replace(/\bguardar\b/g, 'salvar')
    .replace(/\bguardado\b/g, 'salvo')
    .replace(/\bguardada\b/g, 'salva')
    .replace(/\bguardados\b/g, 'salvos')
    .replace(/\bguardadas\b/g, 'salvas')
    .replace(/\bCancelar\b/g, 'Cancelar')
    .replace(/\bAceptar\b/g, 'Confirmar')
    .replace(/\bConfirmar\b/g, 'Confirmar')
    .replace(/\bAtrás\b/g, 'Voltar')
    .replace(/\batrás\b/g, 'voltar')
    .replace(/\bSiguiente\b/g, 'Avançar')
    .replace(/\bsiguiente\b/g, 'seguinte')
    .replace(/\bCerrar\b/g, 'Fechar')
    .replace(/\bcerrar\b/g, 'fechar')
    .replace(/\bEliminar\b/g, 'Excluir')
    .replace(/\beliminar\b/g, 'excluir')
    .replace(/\bBorrar\b/g, 'Apagar')
    .replace(/\bborrar\b/g, 'apagar')
    .replace(/\bAñadir\b/g, 'Adicionar')
    .replace(/\bañadir\b/g, 'adicionar')
    .replace(/\bAgregar\b/g, 'Adicionar')
    .replace(/\bagregar\b/g, 'adicionar')
    .replace(/\bEditar\b/g, 'Editar')
    .replace(/\beditar\b/g, 'editar')
    .replace(/\bConfiguración\b/g, 'Configurações')
    .replace(/\bconfiguración\b/g, 'configurações')
    .replace(/\bAjustes\b/g, 'Configurações')
    .replace(/\bajustes\b/g, 'configurações')
    .replace(/\bHerramientas\b/g, 'Ferramentas')
    .replace(/\bherramientas\b/g, 'ferramentas')
    .replace(/\bAyuda\b/g, 'Ajuda')
    .replace(/\bayuda\b/g, 'ajuda')
    .replace(/\bBuscar\b/g, 'Buscar')
    .replace(/\bbuscar\b/g, 'buscar')
    .replace(/\bBúsqueda\b/g, 'Busca')
    .replace(/\bbúsqueda\b/g, 'busca')
    .replace(/\bDescargar\b/g, 'Baixar')
    .replace(/\bdescargar\b/g, 'baixar')
    .replace(/\bCargar\b/g, 'Carregar')
    .replace(/\bcargar\b/g, 'carregar')
    .replace(/\bCargando…\b/g, 'Carregando…')
    .replace(/\bCargando\.\.\.\b/g, 'Carregando...')
    .replace(/\bListo\b/g, 'Pronto')
    .replace(/\blisto\b/g, 'pronto')
    .replace(/\bHecho\b/g, 'Concluído')
    .replace(/\bhecho\b/g, 'concluído')
    .replace(/\bÉxito\b/g, 'Sucesso')
    .replace(/\béxito\b/g, 'sucesso')
    .replace(/\bError\b/g, 'Erro')
    .replace(/\berror\b/g, 'erro')
    .replace(/\berrores\b/g, 'erros')
    .replace(/\bAdvertencia\b/g, 'Aviso')
    .replace(/\badvertencia\b/g, 'aviso')
    .replace(/\bInformación\b/g, 'Informações')
    .replace(/\binformación\b/g, 'informações')
    .replace(/\bDetalles\b/g, 'Detalhes')
    .replace(/\bdetalles\b/g, 'detalhes')
    .replace(/\bdocente\b/g, 'professor')
    .replace(/\bdocentes\b/g, 'professores')
    .replace(/\bco-docente\b/g, 'co-professor')
    .replace(/\bco-docentes\b/g, 'co-professores')
    .replace(/\bestudiante\b/g, 'estudante')
    .replace(/\bestudiantes\b/g, 'estudantes')
    .replace(/\balumno\b/g, 'aluno')
    .replace(/\balumnos\b/g, 'alunos')
    .replace(/\bclase\b/g, 'turma')
    .replace(/\bclases\b/g, 'turmas')
    .replace(/\bcohorte\b/g, 'turma')
    .replace(/\bcohortes\b/g, 'turmas')
    .replace(/\bcurso\b/g, 'curso')
    .replace(/\bcursos\b/g, 'cursos')
    .replace(/\bmatricular\b/g, 'matricular')
    .replace(/\bmatriculado\b/g, 'matriculado')
    .replace(/\bmatriculados\b/g, 'matriculados')
    .replace(/\binscribir\b/g, 'inscrever')
    .replace(/\binscrito\b/g, 'inscrito')
    .replace(/\binscritos\b/g, 'inscritos')
    .replace(/\bmembresía\b/g, 'inscrição')
    .replace(/\bmembresías\b/g, 'inscrições')
    .replace(/\bconstantes vitales\b/g, 'sinais vitais')
    .replace(/\bConstantes vitales\b/g, 'Sinais Vitais')
    .replace(/\bparámetros vitales\b/g, 'sinais vitais')
    .replace(/\bParámetros vitales\b/g, 'Sinais Vitais')
    .replace(/\bpresión arterial\b/g, 'pressão arterial')
    .replace(/\bPresión arterial\b/g, 'Pressão arterial')
    .replace(/\bfrecuencia cardíaca\b/g, 'frequência cardíaca')
    .replace(/\bFrecuencia cardíaca\b/g, 'Frequência cardíaca')
    .replace(/\bfrecuencia respiratoria\b/g, 'frequência respiratória')
    .replace(/\bFrecuencia respiratoria\b/g, 'Frequência respiratória')
    .replace(/\bsaturación de oxígeno\b/g, 'saturação de oxigênio')
    .replace(/\bSaturación de oxígeno\b/g, 'Saturação de oxigênio')
    .replace(/\btemperatura\b/g, 'temperatura')
    .replace(/\bTemperatura\b/g, 'Temperatura')
    .replace(/\bmotivo de consulta\b/g, 'queixa principal')
    .replace(/\bMotivo de consulta\b/g, 'Queixa principal')
    .replace(/\bhistoria clínica\b/g, 'histórico clínico')
    .replace(/\bHistoria clínica\b/g, 'Histórico clínico')
    .replace(/\bantecedentes médicos\b/g, 'antecedentes médicos')
    .replace(/\bAntecedentes médicos\b/g, 'Antecedentes médicos')
    .replace(/\bexploración física\b/g, 'exame físico')
    .replace(/\bExploración física\b/g, 'Exame físico')
    .replace(/\bauscultación\b/g, 'ausculta')
    .replace(/\bAuscultación\b/g, 'Ausculta')
    .replace(/\bpalpación\b/g, 'palpação')
    .replace(/\bPalpación\b/g, 'Palpação')
    .replace(/\bpruebas de laboratorio\b/g, 'exames laboratoriais')
    .replace(/\bPruebas de laboratorio\b/g, 'Exames laboratoriais')
    .replace(/\blaboratorio\b/g, 'laboratório')
    .replace(/\bLaboratorio\b/g, 'Laboratório')
    .replace(/\bradiología\b/g, 'radiologia')
    .replace(/\bRadiología\b/g, 'Radiologia')
    .replace(/\bestudio de imagen\b/g, 'estudo de imagem')
    .replace(/\bestudios de imagen\b/g, 'estudos de imagem')
    .replace(/\bpreparación\b/g, 'lâmina')
    .replace(/\bpreparaciones\b/g, 'lâminas')
    .replace(/\btratamiento\b/g, 'tratamento')
    .replace(/\btratamientos\b/g, 'tratamentos')
    .replace(/\bmedicamento\b/g, 'medicamento')
    .replace(/\bmedicamentos\b/g, 'medicamentos')
    .replace(/\bfármaco\b/g, 'fármaco')
    .replace(/\bfármacos\b/g, 'fármacos')
    .replace(/\bdosis\b/g, 'dose')
    .replace(/\badministrar\b/g, 'administrar')
    .replace(/\badministrado\b/g, 'administrado')
    .replace(/\badministrada\b/g, 'administrada')
    .replace(/\bdel\b/g, 'do')
    .replace(/\bal\b/g, 'ao')
    .replace(/\bcon el\b/g, 'com o')
    .replace(/\bcon la\b/g, 'com a')
    .replace(/\bcon los\b/g, 'com os')
    .replace(/\bcon las\b/g, 'com as')
    .replace(/\bpor el\b/g, 'pelo')
    .replace(/\bpor la\b/g, 'pela')
    .replace(/\bpor los\b/g, 'pelos')
    .replace(/\bpor las\b/g, 'pelas')
    .replace(/\ben el\b/g, 'no')
    .replace(/\ben la\b/g, 'na')
    .replace(/\ben los\b/g, 'nos')
    .replace(/\ben las\b/g, 'nas')
    .replace(/\bhacia\b/g, 'para')
    .replace(/\bpara el\b/g, 'para o')
    .replace(/\bpara la\b/g, 'para a')
    .replace(/\bpara los\b/g, 'para os')
    .replace(/\bpara las\b/g, 'para as')
    .replace(/\btambién\b/g, 'também')
    .replace(/\bademás\b/g, 'além disso')
    .replace(/\bsin embargo\b/g, 'no entanto')
    .replace(/\bmientras\b/g, 'enquanto')
    .replace(/\bdurante\b/g, 'durante')
    .replace(/\bdespués\b/g, 'depois')
    .replace(/\bantes\b/g, 'antes')
    .replace(/\bcuando\b/g, 'quando')
    .replace(/\bdónde\b/g, 'onde')
    .replace(/\bquién\b/g, 'quem')
    .replace(/\bcómo\b/g, 'como')
    .replace(/\bcuánto\b/g, 'quanto')
    .replace(/\bcuántos\b/g, 'quantos')
    .replace(/\bcuánta\b/g, 'quanta')
    .replace(/\bcuántas\b/g, 'quantas')
    .replace(/\bpor qué\b/g, 'por que')
    .replace(/\bporque\b/g, 'porque')
    .replace(/\btodos\b/g, 'todos')
    .replace(/\btodas\b/g, 'todas')
    .replace(/\btodo\b/g, 'tudo')
    .replace(/\btoda\b/g, 'toda')
    .replace(/\bnada\b/g, 'nada')
    .replace(/\bnadie\b/g, 'ninguém')
    .replace(/\bningún\b/g, 'nenhum')
    .replace(/\bninguno\b/g, 'nenhum')
    .replace(/\bninguna\b/g, 'nenhuma')
    .replace(/\balgún\b/g, 'algum')
    .replace(/\balguno\b/g, 'algum')
    .replace(/\balguna\b/g, 'alguma')
    .replace(/\balgunos\b/g, 'alguns')
    .replace(/\balgunas\b/g, 'algumas')
    .replace(/\bsiempre\b/g, 'sempre')
    .replace(/\bnunca\b/g, 'nunca')
    .replace(/\bjamás\b/g, 'jamais')
    .replace(/\ba veces\b/g, 'às vezes')
    .replace(/\bquizás\b/g, 'talvez')
    .replace(/\btal vez\b/g, 'talvez')
    .replace(/\bsegún\b/g, 'segundo')
    .replace(/\bsobre\b/g, 'sobre')
    .replace(/\bentre\b/g, 'entre')
    .replace(/\bhasta\b/g, 'até')
    .replace(/\bdesde\b/g, 'desde')
    .replace(/\bpero\b/g, 'mas')
    .replace(/\b y \b/g, ' e ')
    .replace(/\b e \b/g, ' e ')
    .replace(/\b o \b/g, ' ou ')
    .replace(/\b u \b/g, ' ou ');

  // Restore ICU blocks with Portuguese internal plurals
  text = text.replace(/___ICU_(\d+)___/g, (_, idx) => {
    let block = icuBlocks[Number(idx)];
    // adapt plural forms inside ICU block
    block = block
      .replace(/\bresultado listo\b/g, 'resultado pronto')
      .replace(/\bresultados listos\b/g, 'resultados prontos')
      .replace(/\bestudio de imagen\b/g, 'estudo de imagem')
      .replace(/\bestudios de imagen\b/g, 'estudos de imagem')
      .replace(/\bpreparación\b/g, 'lâmina')
      .replace(/\bpreparaciones\b/g, 'lâminas')
      .replace(/\bfotografía macroscópica\b/g, 'fotografia macroscópica')
      .replace(/\bfotografías macroscópicas\b/g, 'fotografias macroscópicas')
      .replace(/\bpreparación o fotografía\b/g, 'lâmina ou fotografia')
      .replace(/\bpreparaciones y fotografías\b/g, 'lâminas e fotografias')
      .replace(/\bregistro de ECG\b/g, 'registro de ECG')
      .replace(/\bregistros de ECG\b/g, 'registros de ECG')
      .replace(/\bpunto\b/g, 'ponto')
      .replace(/\bpuntos\b/g, 'pontos')
      .replace(/\bexamen realizado\b/g, 'exame realizado')
      .replace(/\bexámenes realizados\b/g, 'exames realizados')
      .replace(/\bartículo\b/g, 'item')
      .replace(/\bartículos\b/g, 'itens')
      .replace(/\bprueba\b/g, 'exame')
      .replace(/\bpruebas\b/g, 'exames')
      .replace(/\bestudio\b/g, 'estudo')
      .replace(/\bestudios\b/g, 'estudos')
      .replace(/\bexamen\b/g, 'exame')
      .replace(/\bexámenes\b/g, 'exames')
      .replace(/\bTratamiento Activo\b/g, 'Tratamento Ativo')
      .replace(/\bTratamientos Activos\b/g, 'Tratamentos Ativos')
      .replace(/\bminuto\b/g, 'minuto')
      .replace(/\bminutos\b/g, 'minutos')
      .replace(/\bcaso asignado\b/g, 'caso atribuído')
      .replace(/\bcasos asignados\b/g, 'casos atribuídos')
      .replace(/\binstructor\b/g, 'instrutor')
      .replace(/\binstructores\b/g, 'instrutores')
      .replace(/\bAgregar estudiante\b/g, 'Adicionar estudante')
      .replace(/\bAgregar # estudiante\b/g, 'Adicionar # estudante')
      .replace(/\bAgregar # estudiantes\b/g, 'Adicionar # estudantes')
      .replace(/\bAsignar\b/g, 'Atribuir')
      .replace(/\bAsignar #\b/g, 'Atribuir #')
      .replace(/\bestudiante matriculado\b/g, 'estudante matriculado')
      .replace(/\bestudiantes matriculados\b/g, 'estudantes matriculados')
      .replace(/\bcaso seleccionado\b/g, 'caso selecionado')
      .replace(/\bcasos seleccionados\b/g, 'casos selecionados')
      .replace(/\bCaso # asignado\b/g, 'Caso # atribuído')
      .replace(/\bCasos # asignados\b/g, 'Casos # atribuídos')
      .replace(/\bAñadido # co-docente\b/g, 'Adicionado # co-professor')
      .replace(/\bAñadidos # co-docentes\b/g, 'Adicionados # co-professores')
      .replace(/\bfallaron\b/g, 'falharam')
      .replace(/\bacción\b/g, 'ação')
      .replace(/\bacciones\b/g, 'ações')
      .replace(/\bsesión\b/g, 'sessão')
      .replace(/\bsesiones\b/g, 'sessões')
      .replace(/\bdía\b/g, 'dia')
      .replace(/\bdías\b/g, 'dias')
      .replace(/\bcelda no intentada\b/g, 'célula não realizada')
      .replace(/\bceldas no intentadas\b/g, 'células não realizadas')
      .replace(/\bestado\b/g, 'estado')
      .replace(/\bestados\b/g, 'estados')
      .replace(/\busuario\b/g, 'usuário')
      .replace(/\busuarios\b/g, 'usuários')
      .replace(/\boperación\b/g, 'operação')
      .replace(/\boperaciones\b/g, 'operações')
      .replace(/\bmembresía\b/g, 'inscrição')
      .replace(/\bmembresías\b/g, 'inscrições');

    return block;
  });

  return text;
}

const files = fs.readdirSync(EN_DIR).filter(f => f.endsWith('.json'));

for (const file of files) {
  const enData = JSON.parse(fs.readFileSync(path.join(EN_DIR, file), 'utf8'));
  const esData = JSON.parse(fs.readFileSync(path.join(ES_DIR, file), 'utf8'));
  const ptData = {};

  for (const [key, enVal] of Object.entries(enData)) {
    const esVal = esData[key] || enVal;
    let ptVal = translateString(key, esVal, enVal, file);

    // Verify ICU integrity
    const enArgs = [...icuArgs(enVal)].sort();
    let ptArgs = [...icuArgs(ptVal)].sort();

    // If ICU arg mismatch, fall back to preserving args exactly
    if (JSON.stringify(enArgs) !== JSON.stringify(ptArgs)) {
      ptVal = esVal; // safer fallback
      ptArgs = [...icuArgs(ptVal)].sort();
      if (JSON.stringify(enArgs) !== JSON.stringify(ptArgs)) {
        ptVal = enVal;
      }
    }

    ptData[key] = ptVal;
  }

  fs.writeFileSync(path.join(PT_DIR, file), JSON.stringify(ptData, null, 2) + '\n');
  console.log(`Generated ${file} (${Object.keys(ptData).length} keys)`);
}

console.log('All PT locale files generated successfully.');
