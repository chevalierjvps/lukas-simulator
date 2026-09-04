import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { LANGUAGES } from '../../i18n/languages';
import logoUrl from '../../assets/medicine-symbol.svg';
const logoWhiteUrl = logoUrl;
import {
    Globe,
    HeartPulse,
    MessagesSquare,
    FlaskConical,
    ScanFace,
    Network,
} from 'lucide-react';

// The feature story on the brand panel. These are the platform's documented
// claims (docs/product/index.md), not marketing invented for this screen — if
// a claim changes there, change it here.
const FEATURES = [
    { key: 'patient', icon: HeartPulse },
    { key: 'team', icon: MessagesSquare },
    { key: 'labs', icon: FlaskConical },
    { key: 'affect', icon: ScanFace },
    { key: 'analytics', icon: Network },
];

/**
 * The logged-out shell: brand + feature panel on the left, whatever card the
 * caller passes (login, register, pending-approval…) on the right, and the
 * attribution footer under the card.
 *
 * Owned by AuthGate — LoginPage and RegisterPage stay pure cards with no idea
 * this panel exists, so they remain testable without the layout and reusable
 * inside it.
 */
export default function AuthLayout({ children }) {
    const { t } = useTranslation('auth');
    const { uiLanguage, setUiLanguage } = useLanguage();

    return (
        <div className="min-h-screen bg-slate-950 flex relative overflow-hidden selection:bg-teal-500 selection:text-white">
            {/* Ambient Apple Glow Orbs */}
            <div aria-hidden="true" className="osiris-orb-1 pointer-events-none absolute -top-32 -left-32 w-[42rem] h-[42rem] rounded-full bg-teal-500/15 blur-[120px]" />
            <div aria-hidden="true" className="osiris-orb-2 pointer-events-none absolute -bottom-40 right-1/4 w-[38rem] h-[38rem] rounded-full bg-cyan-600/15 blur-[140px]" />
            <div aria-hidden="true" className="pointer-events-none absolute top-1/3 right-10 w-[28rem] h-[28rem] rounded-full bg-indigo-600/10 blur-[100px]" />

            {/* Brand panel — hidden on small screens */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden flex-col justify-between p-12 lg:p-16 z-10">
                <div className="relative flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 p-2 shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.25)]">
                        <img src={logoWhiteUrl} alt="Símbolo da Medicina (Esculápio)" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(94,234,212,0.4)]" />
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
                        Lukas 1.0
                    </span>
                    <span className="ml-1 px-3 py-0.5 rounded-full border border-teal-400/30 bg-teal-500/10 text-[11px] font-semibold uppercase tracking-widest text-teal-200 backdrop-blur-md shadow-sm">
                        {t('brand_badge')}
                    </span>
                </div>

                <div className="relative max-w-xl my-auto py-8">
                    <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight text-white tracking-tight mb-5">
                        {t('hero_headline')}
                    </h1>
                    <p className="text-base text-slate-300 leading-relaxed mb-10 font-normal">
                        {t('hero_sub')}
                    </p>

                    <ul className="space-y-4">
                        {FEATURES.map(({ key, icon: Icon }) => (
                            <li key={key} className="flex items-start gap-4 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] backdrop-blur-md transition-all duration-200 group">
                                <div className="w-10 h-10 shrink-0 rounded-xl bg-teal-500/15 border border-teal-400/25 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                                    <Icon className="w-5 h-5 text-teal-300 drop-shadow-[0_0_6px_rgba(45,212,191,0.5)]" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white tracking-tight">
                                        {t(`feature_${key}_title`)}
                                    </p>
                                    <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                                        {t(`feature_${key}_desc`)}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-xs text-slate-500 font-medium">
                    {t('brand_baseline')}
                </p>
            </div>

            {/* Card column */}
            <div className="flex-1 flex flex-col min-h-screen relative z-10">
                {/* Language selector */}
                <div className="flex justify-end p-6">
                    <div className="relative">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-300/80 pointer-events-none" />
                        <select
                            value={uiLanguage}
                            onChange={(e) => setUiLanguage(e.target.value)}
                            aria-label={t('language', { defaultValue: 'Language' })}
                            className="appearance-none osiris-glass-pill pl-10 pr-9 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-teal-400/50 cursor-pointer shadow-lg"
                        >
                            {Object.entries(LANGUAGES).map(([code, lang]) => (
                                <option key={code} value={code} className="bg-slate-900 text-white">
                                    {lang.flag} {lang.native === lang.name ? lang.native : `${lang.native} (${lang.name})`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center px-6 py-8">
                    <div className="w-full max-w-md">
                        {/* Compact brand header for small screens */}
                        <div className="lg:hidden text-center mb-8 flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 p-2.5 mb-3 shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
                                <img src={logoUrl} alt="Símbolo da Medicina (Esculápio)" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Lukas 1.0</h1>
                            <p className="text-sm text-slate-400 font-medium">{t('platform_tagline')}</p>
                        </div>

                        {children}
                    </div>
                </div>

                {/* Attribution footer */}
                <footer className="px-6 pb-6 text-center text-xs text-slate-500 space-y-0.5 font-medium">
                    <p className="text-slate-400">Lukas 1.0 — {t('platform_tagline')}</p>
                    <p className="text-slate-600">Simulação Médica Hiper-Realista · Criado por Jvps</p>
                </footer>
            </div>
        </div>
    );
}
