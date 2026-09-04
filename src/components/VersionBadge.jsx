import React from 'react';
import pkg from '../../package.json';
import logoUrl from '../assets/medicine-symbol.svg';

// "Lukas <version>" wordmark with Bastão de Esculápio (Símbolo da Medicina) logo.
// Mounted inline inside the PatientMonitor header next to the session timer.

const LABEL = `Lukas ${pkg.version}`;

export default function VersionBadge() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none select-none inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/15 text-2xl font-bold tracking-tight text-teal-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.3)]"
            style={{ textShadow: '0 2px 10px rgba(45,212,191,0.3)' }}
        >
            <img src={logoUrl} alt="Símbolo da Medicina (Esculápio)" className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
            <span className="bg-gradient-to-r from-teal-200 to-teal-400 bg-clip-text text-transparent">{LABEL}</span>
        </div>
    );
}
