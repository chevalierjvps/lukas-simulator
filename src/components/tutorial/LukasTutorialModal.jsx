import React, { useState } from 'react';
import {
    Activity, BookOpen, CheckCircle, ChevronLeft, ChevronRight,
    FileText, FlaskConical, GraduationCap, HeartPulse, HelpCircle,
    Layers, MessageSquare, Microscope, Play, Scan, Sparkles,
    Stethoscope, Volume2, X, Zap
} from 'lucide-react';
import logoUrl from '../../assets/medicine-symbol.svg';

const TUTORIAL_STEPS = [
    {
        id: 'intro',
        title: 'Bem-vindo ao Lukas 1.0',
        subtitle: 'Simulador Clínico Avançado com Pacientes Virtuais de Alta Fidelidade',
        icon: Sparkles,
        badge: 'Guia Interativo',
        color: 'from-teal-500 to-emerald-600',
        content: (
            <div className="space-y-4 text-slate-200">
                <p className="text-base leading-relaxed">
                    O <strong>Lukas 1.0</strong> é uma plataforma moderna desenvolvida por <strong>Jvps</strong> para simulação médica hiper-realista e prática do raciocínio clínico em tempo real.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 shrink-0">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-white">Fisiologia em Tempo Real</h4>
                            <p className="text-xs text-slate-400 mt-0.5">Sinais vitais dinâmicos que respondem à gravidade da patologia e aos medicamentos administrados.</p>
                        </div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-white">Diálogo por Voz e Texto</h4>
                            <p className="text-xs text-slate-400 mt-0.5">Converse diretamente com o paciente em Português ou Espanhol com resposta por áudio e IA clínica.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'patient_room',
        title: '1. Sala do Paciente & Monitor',
        subtitle: 'Anamnese, Monitorização e Intervenções de Emergência',
        icon: Activity,
        badge: 'Sala Principal',
        color: 'from-rose-500 to-pink-600',
        content: (
            <div className="space-y-4 text-slate-200">
                <p className="text-sm leading-relaxed">
                    No leito do paciente você realiza o atendimento inicial e monitora a evolução contínua dos parâmetros hemodinâmicos.
                </p>
                <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center gap-3">
                        <HeartPulse className="w-5 h-5 text-rose-400 shrink-0" />
                        <div className="text-xs">
                            <strong className="text-white block">Monitor Multiparamétrico:</strong>
                            Onda de ECG fisiológica gerada (PQRST), Frequência Cardíaca, Pressão Arterial (PAM), SpO₂, Frequência Respiratória e Temperatura.
                        </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center gap-3">
                        <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                        <div className="text-xs">
                            <strong className="text-white block">Administração de Tratamentos:</strong>
                            Clique em "Tratamento" para prescrever Cristaloides, Epinefrina, Noradrenalina, Salbutamol, Oxigenoterapia e posicionamentos.
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'exam',
        title: '2. Exame Físico Estruturado',
        subtitle: 'Mapa Anatômico Interativo e Ausculta Real com Áudio',
        icon: Stethoscope,
        badge: 'Semiologia',
        color: 'from-emerald-500 to-teal-600',
        content: (
            <div className="space-y-4 text-slate-200">
                <p className="text-sm leading-relaxed">
                    Examine o paciente de forma anatômica e metódica através da silhueta corporal (visões anterior e posterior).
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs">
                        <span className="text-emerald-400 font-semibold block mb-0.5">👁️ Inspeção</span>
                        Avaliação de fácies, retrações, abaulamentos e alinhamento.
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs">
                        <span className="text-emerald-400 font-semibold block mb-0.5">✋ Palpação</span>
                        Ictus cordis, pulsos periféricos, abdome e pontos dolorosos.
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs">
                        <span className="text-emerald-400 font-semibold block mb-0.5">🥁 Percussão</span>
                        Som claro pulmonar atimpânico, macicez hepática e cardíaca.
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs">
                        <span className="text-emerald-400 font-semibold block mb-0.5">🎧 Ausculta</span>
                        Focos cardíacos (Aórtico, Mitral...) e pulmonares com áudio esteto real.
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'labs_rad',
        title: '3. Laboratório & Radiologia',
        subtitle: 'Catálogo de Exames, Laudos e Visualizador PACS / DICOM',
        icon: FlaskConical,
        badge: 'Diagnóstico',
        color: 'from-purple-500 to-indigo-600',
        content: (
            <div className="space-y-4 text-slate-200">
                <p className="text-sm leading-relaxed">
                    Solicite investigações diagnósticas complementares e acompanhe o tempo de resposta fisiológico da equipe do hospital.
                </p>
                <div className="space-y-2.5">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-start gap-3">
                        <FlaskConical className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                        <div className="text-xs">
                            <strong className="text-white block">Laboratório de Análises:</strong>
                            Hemograma, Gasometria Arterial, Troponina, D-Dímero, Eletrólitos e Função Renal com valores de referência por sexo biológico.
                        </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-start gap-3">
                        <Scan className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="text-xs">
                            <strong className="text-white block">Radiologia & PACS / DICOM:</strong>
                            Raio-X de Tórax, Tomografia Computadorizada, Ultrassonografia e ECG de 12 derivações com réguas e paquímetros de precisão.
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'debrief',
        title: '4. Consultor & Debriefing',
        subtitle: 'Discussão Clínica com Tutor de IA e Avaliação de Competências',
        icon: GraduationCap,
        badge: 'Avaliação',
        color: 'from-amber-500 to-orange-600',
        content: (
            <div className="space-y-4 text-slate-200">
                <p className="text-sm leading-relaxed">
                    Ao finalizar o atendimento, encerre a simulação para entrar na sessão de <strong>Debriefing Clínico</strong> com o preceptor de IA.
                </p>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 text-slate-300">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Feedback Personalizado Baseado nos Seus Atos
                    </div>
                    <p>
                        O preceptor analisa a linha do tempo do seu atendimento: quais hipóteses você formulou, tempo até início dos medicamentos corretos, exames solicitados e diagnóstico final atingido.
                    </p>
                </div>
            </div>
        )
    }
];

export default function LukasTutorialModal({ isOpen, onClose }) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    if (!isOpen) return null;

    const step = TUTORIAL_STEPS[currentStepIndex];
    const isFirst = currentStepIndex === 0;
    const isLast = currentStepIndex === TUTORIAL_STEPS.length - 1;
    const Icon = step.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
            <div className="relative w-full max-w-2xl bg-slate-900/95 border border-white/15 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden flex flex-col">
                {/* Header with gradient theme */}
                <div className={`p-6 bg-gradient-to-r ${step.color} text-white flex items-center justify-between shadow-lg relative`}>
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                            <Icon className="w-6 h-6 text-white drop-shadow" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/25 text-white/90 border border-white/20 inline-block mb-1">
                                {step.badge}
                            </span>
                            <h2 className="text-xl font-bold tracking-tight text-white">{step.title}</h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors cursor-pointer"
                        aria-label="Fechar tutorial"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 flex-1 min-h-[260px] flex flex-col justify-between bg-slate-950/40">
                    <div>
                        <p className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-2">
                            {step.subtitle}
                        </p>
                        {step.content}
                    </div>

                    {/* Progress indicators */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-800/80 mt-6">
                        <div className="flex items-center gap-1.5">
                            {TUTORIAL_STEPS.map((s, idx) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setCurrentStepIndex(idx)}
                                    aria-label={`Ir para etapa ${idx + 1}`}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        idx === currentStepIndex
                                            ? 'w-7 bg-teal-400'
                                            : 'w-2 bg-slate-700 hover:bg-slate-600'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Navigation controls */}
                        <div className="flex items-center gap-2">
                            {!isFirst && (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-slate-700"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Anterior
                                </button>
                            )}
                            {isLast ? (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(45,212,191,0.4)] cursor-pointer"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Começar Simulação
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStepIndex((i) => Math.min(TUTORIAL_STEPS.length - 1, i + 1))}
                                    className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all shadow-[0_4px_12px_rgba(45,212,191,0.3)] cursor-pointer"
                                >
                                    Próximo
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
