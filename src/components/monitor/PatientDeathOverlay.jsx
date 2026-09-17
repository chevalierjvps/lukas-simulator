import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClinicalAudio } from '../../services/clinicalAudioSynthesizer';

// Death is a terminal GAME state, not a medical claim: real arrests are
// worked far longer than this sim's compressed clock allows. What this
// overlay marks is "sustained lethal rhythm, unresuscitated, case over" —
// distinct from the CRÍTICO banner, which the app previously left as the
// only ceiling state (a critical patient could stay critical and keep
// chatting forever). See PatientMonitor's ARREST_RHYTHMS/DEATH_THRESHOLD_S.
const REASON_KEY_BY_RHYTHM = {
   VFib: 'death_reason_vfib',
   Asystole: 'death_reason_asystole',
   PEA: 'death_reason_pea',
};

const DISPLAY_MS = 4200;

/**
 * Full-bleed overlay for the monitor panel: a single red flash, then a
 * fade to black with a flatlined trace showing through, the declaration,
 * and a one-line clinical reason. Calls `onDone` once, after DISPLAY_MS,
 * so the caller can freeze the case and route to the debrief.
 */
export default function PatientDeathOverlay({ rhythm, timeLabel, onDone }) {
   const { t } = useTranslation('monitor');
   const [phase, setPhase] = useState('flash'); // flash -> hold -> fade

   useEffect(() => {
      ClinicalAudio.playFlatlineTone(DISPLAY_MS / 1000);
      const toHold = setTimeout(() => setPhase('hold'), 220);
      const toFade = setTimeout(() => setPhase('fade'), DISPLAY_MS - 500);
      const toDone = setTimeout(() => onDone?.(), DISPLAY_MS);
      return () => {
         clearTimeout(toHold);
         clearTimeout(toFade);
         clearTimeout(toDone);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const reasonKey = REASON_KEY_BY_RHYTHM[rhythm] || 'death_reason_asystole';

   return (
      <div
         data-testid="patient-death-overlay"
         className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
         style={{
            background: phase === 'flash' ? 'rgba(220,38,38,0.55)' : 'rgba(0,0,0,0.86)',
            opacity: phase === 'fade' ? 0 : 1,
            transition: phase === 'flash'
               ? 'background 200ms ease-out'
               : 'opacity 500ms ease-in, background 600ms ease-in',
         }}
      >
         <div
            className="text-center px-8"
            style={{
               opacity: phase === 'flash' ? 0 : 1,
               transform: phase === 'flash' ? 'scale(0.97)' : 'scale(1)',
               transition: 'opacity 500ms ease-out 150ms, transform 500ms ease-out 150ms',
            }}
         >
            <div className="text-red-500 text-2xl md:text-3xl font-bold tracking-wide uppercase">
               {t('death_declared_title')}
            </div>
            <div className="mt-3 text-neutral-300 text-sm md:text-base">
               {t(reasonKey)}
            </div>
            {timeLabel && (
               <div className="mt-4 text-neutral-500 text-xs font-mono uppercase tracking-wide">
                  {t('death_time_of', { time: timeLabel })}
               </div>
            )}
         </div>
      </div>
   );
}
