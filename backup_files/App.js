import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Activity, Wind, Thermometer, Bell, Settings, Play, Pause, AlertCircle, Menu, X, Monitor, User } from 'lucide-react';

/**
 * ADVANCED ECG GENERATION UTILITIES
 * Based on a simplified McSharry driven cardiovascular system model (Sum of Gaussians)
 */

// Gaussian function: a * exp( - (t - b)^2 / (2 * c^2) )
const gaussian = (t, a, b, c) => a * Math.exp(-Math.pow(t - b, 2) / (2 * Math.pow(c, 2)));

// Standard P-QRS-T parameters (approximate) relative to a beat duration of 1.0
// [Amplitude, Center (time), Width]
const BASE_WAVES = {
  P:  { a: 0.15,  b: 0.20, c: 0.04 }, // Atrial depolarization
  Q:  { a: -0.15, b: 0.35, c: 0.02 }, // Septal depolarization
  R:  { a: 1.0,   b: 0.38, c: 0.03 }, // Ventricular depolarization
  S:  { a: -0.25, b: 0.42, c: 0.03 }, // Late ventricular depolarization
  T:  { a: 0.3,   b: 0.70, c: 0.08 }, // Ventricular repolarization
};

const GenerateECGRaw = (phase, options = {}) => {
  let y = 0;
  const {
    stElev = 0,     // ST Elevation/Depression (-1.0 to 1.0)
    tInv = 0,       // T-Wave Inversion (0 or 1)
    wideQRS = 0,    // Wide QRS multiplier (1.0 = normal, 2.0 = wide)
    noise = 0,
  } = options;

  // 1. P Wave (absent in AFib/VFib)
  if (!options.hideP) {
    y += gaussian(phase, BASE_WAVES.P.a, BASE_WAVES.P.b, BASE_WAVES.P.c);
  } else if (options.afibNoise) {
    // F-waves for AFib (high freq low amp)
    y += Math.sin(phase * 50) * 0.05;
  }

  // 2. QRS Complex
  // Widen QRS by scaling the width param 'c'
  const qrsWidth = wideQRS > 0 ? 2.5 : 1.0;
  
  if (options.isPVC) {
    // PVC: No P wave, Wide weird QRS, Large T wave opposite direction
    // Modeled as a large wide sine-like bump followed by a dip
    y += gaussian(phase, 0.8, 0.4, 0.12); // Broad R
    y -= gaussian(phase, 0.4, 0.7, 0.15); // Deep T-like repolarization
  } else if (!options.isVfib) {
    // Normal QRS
    y += gaussian(phase, BASE_WAVES.Q.a, BASE_WAVES.Q.b, BASE_WAVES.Q.c * qrsWidth);
    y += gaussian(phase, BASE_WAVES.R.a, BASE_WAVES.R.b, BASE_WAVES.R.c * qrsWidth);
    y += gaussian(phase, BASE_WAVES.S.a, BASE_WAVES.S.b, BASE_WAVES.S.c * qrsWidth);
  }

  // 3. T Wave & ST Segment
  if (!options.isPVC && !options.isVfib) {
    const stOffset = stElev * 0.2; // Scaling factor
    
    // ST Segment Elevation is modeled by lifting the baseline between S and T
    // We cheat slightly by adding a broad flat gaussian or just offsetting T and S tails
    // Here we mainly offset the T wave and add a bridge
    
    let tAmp = BASE_WAVES.T.a * (tInv ? -1 : 1);
    
    // Apply ST Elevation to T-wave base and a bridge gaussian
    if (Math.abs(stElev) > 0.1) {
       y += gaussian(phase, stOffset, 0.55, 0.1); // ST Bridge
       tAmp += stOffset; // Lift T wave too
    }

    y += gaussian(phase, tAmp, BASE_WAVES.T.b, BASE_WAVES.T.c);
  }

  // 4. V-Fib Chaos (overrides everything)
  if (options.isVfib) {
    y = Math.sin(phase * 15) * 0.3 + Math.sin(phase * 19) * 0.2; 
  }
  
  // 5. Asystole
  if (options.isAsystole) {
    y = 0;
  }

  // 6. Noise
  if (noise > 0) {
    y += (Math.random() - 0.5) * noise;
  }

  return y;
};


export default function PatientMonitor() {
  // --- Refs for Canvas & Buffers ---
  const ecgCanvasRef = useRef(null);
  const plethCanvasRef = useRef(null);
  const respCanvasRef = useRef(null);

  // Data Buffers (Circular or simple push/shift)
  // We use simple arrays and shift for this demo as performance is fine for < 2000 points
  const ecgBuffer = useRef(new Array(1000).fill(0));
  const plethBuffer = useRef(new Array(1000).fill(0));
  const respBuffer = useRef(new Array(1000).fill(0));

  // --- Simulation State ---
  const [isPlaying, setIsPlaying] = useState(true);
  const [lastFrameTime, setLastFrameTime] = useState(0);
  
  // Patient Parameters
  const [params, setParams] = useState({
    hr: 80,
    spo2: 98,
    rr: 16,
    bpSys: 120,
    bpDia: 80,
    temp: 37.0,
    etco2: 38
  });

  // Rhythm & Conditions
  const [rhythm, setRhythm] = useState('NSR'); // NSR, AFib, VTach, VFib, Asystole
  const [conditions, setConditions] = useState({
    pvc: false, // Premature Ventricular Contractions (random)
    stElev: 0,  // -5 to +5 mm
    tInv: false,
    wideQRS: false,
    noise: 0
  });

  const [controlsOpen, setControlsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('rhythm'); // rhythm, vitals, display

  // Internal Physics State
  const physics = useRef({
    phase: 0.0,      // 0.0 to 1.0 (cardiac cycle position)
    respPhase: 0.0,  // 0.0 to 1.0 (respiratory cycle)
    lastBeatTime: 0,
    nextBeatDuration: 750, // ms
    pvcChance: 0.0,  // Dynamic probability
  });

  // --- Animation Loop ---
  useEffect(() => {
    let animationId;
    let lastTime = performance.now();

    const loop = (time) => {
      const dt = time - lastTime;
      lastTime = time;

      if (isPlaying) {
        updateSimulation(dt);
        drawWaveforms();
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, params, rhythm, conditions]);

  // --- Physics Update ---
  const updateSimulation = (dt) => {
    const p = physics.current;
    
    // 1. Calculate Cardiac Phase
    // Adjust HR dynamically based on rhythm
    let currentHR = params.hr;
    if (rhythm === 'VTach') currentHR = 160;
    if (rhythm === 'VFib') currentHR = 0; // Chaotic phase, HR meaningless
    if (rhythm === 'Asystole') currentHR = 0;

    // Cycle duration in ms
    let targetDuration = currentHR > 0 ? (60000 / currentHR) : 1000;
    
    // Arrhythmia variability
    if (rhythm === 'AFib') {
        // Randomize duration significantly
        targetDuration = (60000 / params.hr) + (Math.random() * 300 - 150);
    }

    // Advance Phase
    if (rhythm === 'Asystole') {
        p.phase = 0; // Stuck
    } else if (rhythm === 'VFib') {
        p.phase += dt / 200; // Fast chaos
    } else {
        // Normal beat progression
        p.phase += dt / p.nextBeatDuration;
        if (p.phase >= 1.0) {
            p.phase = 0; // Beat Reset
            p.nextBeatDuration = targetDuration; // New interval for next beat
            
            // Random PVC trigger
            if (conditions.pvc && Math.random() < 0.15) {
                // Shorten next beat for PVC (early beat)
                p.nextBeatDuration *= 0.6; 
                p.isNextPVC = true;
            } else {
                p.isNextPVC = false;
            }

            // Beep (Audio trigger would go here)
        }
    }

    // 2. Advance Respiratory Phase
    const respDuration = params.rr > 0 ? (60000 / params.rr) : 10000;
    p.respPhase += dt / respDuration;
    if (p.respPhase >= 1.0) p.respPhase = 0;


    // 3. Generate Data Points
    // We generate multiple points if dt is large, but for 60fps dt~16ms, usually 1 point is enough.
    // For smoothness, we can push 2 points per frame if we want higher temporal res scrolling.
    
    const isPVC = p.isNextPVC; // Simplified: Current beat is PVC?
    
    // ECG
    const ecgOpts = {
        stElev: conditions.stElev,
        tInv: conditions.tInv,
        wideQRS: conditions.wideQRS ? 1 : 0,
        noise: conditions.noise,
        hideP: rhythm === 'AFib' || rhythm === 'VTach',
        afibNoise: rhythm === 'AFib',
        isPVC: isPVC,
        isVfib: rhythm === 'VFib',
        isAsystole: rhythm === 'Asystole',
    };
    
    // Map phase 0..1 to Gaussian domain
    // We add a scrolling offset to phase if we want, but here we just sample the current static function at 'phase'
    const ecgVal = GenerateECGRaw(p.phase, ecgOpts);
    ecgBuffer.current.shift();
    ecgBuffer.current.push(ecgVal);

    // PLETH (SpO2) - Simplified Dicrotic Notch Pulse
    // Peaks slightly after ECG R-wave (phase ~0.4)
    let plethVal = 0;
    if (currentHR > 0) {
        const plethPhase = (p.phase - 0.1 + 1.0) % 1.0; // Delayed
        // Pulse shape: Rise fast, fall slow with notch
        if (plethPhase < 0.2) {
             // Systolic upstroke
             plethVal = Math.sin(plethPhase * 5 * Math.PI / 2);
        } else {
             // Diastolic runoff with dicrotic notch at 0.5
             const decay = 1 - ((plethPhase - 0.2) / 0.8);
             const notch = Math.exp(-Math.pow(plethPhase - 0.5, 2) / 0.005) * 0.15;
             plethVal = decay * 0.8 + notch;
        }
    }
    // Add resp variation to pleth (pulsus paradoxus / baseline sway)
    plethVal *= (1 + 0.1 * Math.sin(p.respPhase * 2 * Math.PI));
    
    plethBuffer.current.shift();
    plethBuffer.current.push(plethVal);

    // RESP (Impedance) - Simple Breath Wave
    const respVal = Math.sin(p.respPhase * 2 * Math.PI);
    respBuffer.current.shift();
    respBuffer.current.push(respVal);
  };

  // --- Drawing ---
  const drawWaveforms = () => {
    drawCanvas(ecgCanvasRef.current, ecgBuffer.current, '#00ff00', 2, 1);
    drawCanvas(plethCanvasRef.current, plethBuffer.current, '#0ea5e9', 1.5, 0.5); // Cyan
    drawCanvas(respCanvasRef.current, respBuffer.current, '#f59e0b', 1.5, 0); // Amber/Yellow
  };

  const drawCanvas = (canvas, data, color, lineWidth, gain) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Grid (faint)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    // Vertical lines every 50px
    for (let x=0; x<w; x+=50) { ctx.moveTo(x,0); ctx.lineTo(x,h); }
    ctx.stroke();

    // Signal
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    const step = w / data.length;
    // Auto-center baseline
    const baseline = h / 2;
    const scale =  -(h * 0.4); // Negative to flip Y (up is positive voltage)

    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const y = baseline + (data[i] * scale * (gain || 1));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  // --- Resize Handler ---
  useEffect(() => {
    const handleResize = () => {
      [ecgCanvasRef, plethCanvasRef, respCanvasRef].forEach(ref => {
        if (ref.current) {
            // Make internal resolution match display size (or 2x for retina)
            const rect = ref.current.getBoundingClientRect();
            ref.current.width = rect.width * 2;
            ref.current.height = rect.height * 2;
        }
      });
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 font-sans overflow-hidden select-none">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="bg-neutral-800 p-2 rounded-md">
            <Monitor className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">ICU MONITOR 01</h1>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
               <User className="w-3 h-3" />
               <span>DOE, JOHN • 45M • ID: 899212</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right mr-4 hidden md:block">
            <div className="text-sm font-bold text-neutral-300">{new Date().toLocaleTimeString()}</div>
            <div className="text-xs text-neutral-500">{new Date().toLocaleDateString()}</div>
          </div>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' : 'bg-green-900/40 text-green-400 animate-pulse'}`}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          
          <button 
             className={`p-2 rounded-full transition-colors ${conditions.noise > 0 || params.hr > 120 ? 'bg-red-900/40 text-red-500 animate-pulse' : 'bg-neutral-800 text-neutral-400'}`}
          >
            <Bell className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setControlsOpen(true)}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-lg shadow-blue-900/20"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* WAVEFORMS (LEFT) */}
        <div className="flex-1 flex flex-col bg-black relative">
          
          {/* Channel 1: ECG */}
          <div className="flex-1 min-h-[160px] border-b border-neutral-800/50 relative group">
             <div className="absolute top-2 left-3 z-10 font-mono text-sm font-bold text-green-500 select-none">
                II <span className="text-xs font-normal opacity-70 ml-1">1mV</span>
             </div>
             <canvas ref={ecgCanvasRef} className="w-full h-full block" />
             <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black via-transparent to-transparent pointer-events-none" />
          </div>
          
          {/* Channel 2: PLETH */}
          <div className="h-32 border-b border-neutral-800/50 relative">
             <div className="absolute top-2 left-3 z-10 font-mono text-sm font-bold text-sky-500 select-none">
                PLETH
             </div>
             <canvas ref={plethCanvasRef} className="w-full h-full block" />
          </div>

          {/* Channel 3: RESP */}
          <div className="h-32 border-b border-neutral-800/50 relative">
             <div className="absolute top-2 left-3 z-10 font-mono text-sm font-bold text-amber-500 select-none">
                RESP <span className="text-xs font-normal opacity-70 ml-1">Imp</span>
             </div>
             <canvas ref={respCanvasRef} className="w-full h-full block" />
          </div>

        </div>

        {/* VITALS (RIGHT SIDEBAR) */}
        <div className="w-64 bg-neutral-900/50 backdrop-blur-sm border-l border-neutral-800 flex flex-col shrink-0">
          
          {/* HR Box */}
          <div className="flex-1 border-b border-neutral-800 p-4 flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-2 left-3 text-green-500 font-bold text-sm flex items-center gap-1">
                <Heart className="w-3 h-3" /> HR
             </div>
             <div className="text-right relative z-10">
                <div className={`text-7xl font-mono font-bold tracking-tighter ${rhythm === 'Asystole' ? 'text-red-500' : 'text-green-500'}`}>
                   {rhythm === 'Asystole' || rhythm === 'VFib' ? '---' : params.hr}
                </div>
                <div className="text-neutral-500 text-xs mt-[-5px]">bpm</div>
             </div>
          </div>

          {/* SpO2 Box */}
          <div className="h-32 border-b border-neutral-800 p-4 flex flex-col justify-center relative">
             <div className="absolute top-2 left-3 text-sky-500 font-bold text-sm">SpO2</div>
             <div className="text-right">
                <div className="text-5xl font-mono font-bold tracking-tighter text-sky-500">
                   {params.spo2}<span className="text-2xl opacity-50">%</span>
                </div>
             </div>
             {/* Signal Quality Bar */}
             <div className="absolute bottom-3 left-4 right-4 h-1 bg-neutral-800 rounded overflow-hidden">
                <div className="h-full bg-sky-600 w-[90%]" />
             </div>
          </div>

          {/* NIBP Box */}
          <div className="h-32 border-b border-neutral-800 p-4 flex flex-col justify-center relative">
             <div className="absolute top-2 left-3 text-red-500 font-bold text-sm">NIBP</div>
             <div className="text-right mt-2">
                <div className="text-4xl font-mono font-bold tracking-tighter text-red-100 leading-none">
                   {params.bpSys}/{params.bpDia}
                </div>
                <div className="text-red-400 text-sm mt-1 font-mono">
                   ({Math.round((params.bpSys + 2*params.bpDia)/3)})
                </div>
             </div>
             <div className="absolute bottom-2 left-3 text-[10px] text-neutral-500">
                AUTO 15min • <span className="text-neutral-300">14:02</span>
             </div>
          </div>
          
           {/* NIBP Box */}
          <div className="h-32 border-b border-neutral-800 p-4 flex flex-col justify-center relative">
             <div className="absolute top-2 left-3 text-amber-500 font-bold text-sm">RESP</div>
             <div className="text-right">
                <div className="text-5xl font-mono font-bold tracking-tighter text-amber-500">
                   {params.rr}
                </div>
                <div className="text-neutral-500 text-xs">rpm</div>
             </div>
          </div>

        </div>
      </div>

      {/* CONTROLS OVERLAY (DRAWER) */}
      <div 
        className={`fixed inset-y-0 right-0 w-96 bg-neutral-900 border-l border-neutral-700 shadow-2xl transform transition-transform duration-300 ease-out z-50 flex flex-col ${controlsOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-800">
           <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              Simulator Controls
           </h2>
           <button onClick={() => setControlsOpen(false)} className="text-neutral-400 hover:text-white">
              <X className="w-6 h-6" />
           </button>
        </div>
        
        {/* Tabs */}
        <div className="flex p-1 bg-neutral-900 border-b border-neutral-800">
            {['rhythm', 'vitals'].map(tab => (
               <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-md transition-colors ${activeTab === tab ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
               >
                 {tab}
               </button>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           
           {activeTab === 'rhythm' && (
             <div className="space-y-6">
                
                {/* Rhythm Select */}
                <div className="space-y-2">
                   <label className="text-xs font-bold text-neutral-500 uppercase">Primary Rhythm</label>
                   <div className="grid grid-cols-1 gap-2">
                      {['NSR', 'AFib', 'VTach', 'VFib', 'Asystole'].map(r => (
                        <button
                          key={r}
                          onClick={() => setRhythm(r)}
                          className={`px-4 py-3 rounded-md text-left text-sm font-bold border transition-all ${rhythm === r ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
                        >
                           {r === 'NSR' ? 'Normal Sinus Rhythm' : r}
                        </button>
                      ))}
                   </div>
                </div>

                {/* Ectopics & Noise */}
                <div className="space-y-2">
                   <label className="text-xs font-bold text-neutral-500 uppercase">Modifiers</label>
                   <div className="space-y-3 bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                      
                      <div className="flex items-center justify-between">
                         <span className="text-sm text-neutral-300">PVCs (Ectopics)</span>
                         <button 
                            onClick={() => setConditions(c => ({...c, pvc: !c.pvc}))}
                            className={`w-12 h-6 rounded-full relative transition-colors ${conditions.pvc ? 'bg-green-600' : 'bg-neutral-700'}`}
                         >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${conditions.pvc ? 'left-7' : 'left-1'}`} />
                         </button>
                      </div>

                      <div className="flex items-center justify-between">
                         <span className="text-sm text-neutral-300">Wide QRS</span>
                         <button 
                            onClick={() => setConditions(c => ({...c, wideQRS: !c.wideQRS}))}
                            className={`w-12 h-6 rounded-full relative transition-colors ${conditions.wideQRS ? 'bg-green-600' : 'bg-neutral-700'}`}
                         >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${conditions.wideQRS ? 'left-7' : 'left-1'}`} />
                         </button>
                      </div>

                      <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                             <span className="text-neutral-400">ST Deviation</span>
                             <span className="text-blue-400 font-mono">{conditions.stElev > 0 ? '+' : ''}{conditions.stElev} mm</span>
                          </div>
                          <input 
                            type="range" min="-5" max="5" step="0.5"
                            value={conditions.stElev}
                            onChange={(e) => setConditions(c => ({...c, stElev: parseFloat(e.target.value)}))}
                            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                          />
                      </div>
                      
                      <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                             <span className="text-neutral-400">Signal Noise</span>
                             <span className="text-blue-400 font-mono">{conditions.noise}/10</span>
                          </div>
                          <input 
                            type="range" min="0" max="10" step="1"
                            value={conditions.noise}
                            onChange={(e) => setConditions(c => ({...c, noise: parseInt(e.target.value)}))}
                            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                          />
                      </div>

                   </div>
                </div>

             </div>
           )}

           {activeTab === 'vitals' && (
              <div className="space-y-6">
                 {/* HR */}
                 <div className="space-y-2">
                    <div className="flex justify-between items-end">
                       <label className="text-xs font-bold text-neutral-500 uppercase">Heart Rate</label>
                       <span className="text-xl font-mono text-green-500 font-bold">{params.hr}</span>
                    </div>
                    <input 
                      type="range" min="20" max="250" 
                      value={params.hr}
                      onChange={(e) => setParams(p => ({...p, hr: parseInt(e.target.value)}))}
                      className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                 </div>

                 {/* SpO2 */}
                 <div className="space-y-2">
                    <div className="flex justify-between items-end">
                       <label className="text-xs font-bold text-neutral-500 uppercase">SpO2</label>
                       <span className="text-xl font-mono text-sky-500 font-bold">{params.spo2}%</span>
                    </div>
                    <input 
                      type="range" min="50" max="100" 
                      value={params.spo2}
                      onChange={(e) => setParams(p => ({...p, spo2: parseInt(e.target.value)}))}
                      className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                 </div>
                 
                 {/* RR */}
                 <div className="space-y-2">
                    <div className="flex justify-between items-end">
                       <label className="text-xs font-bold text-neutral-500 uppercase">Resp Rate</label>
                       <span className="text-xl font-mono text-amber-500 font-bold">{params.rr}</span>
                    </div>
                    <input 
                      type="range" min="0" max="60" 
                      value={params.rr}
                      onChange={(e) => setParams(p => ({...p, rr: parseInt(e.target.value)}))}
                      className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                 </div>

                 {/* BP */}
                 <div className="space-y-4 pt-4 border-t border-neutral-800">
                    <div className="space-y-2">
                       <div className="flex justify-between items-end">
                          <label className="text-xs font-bold text-neutral-500 uppercase">Systolic BP</label>
                          <span className="text-lg font-mono text-red-400 font-bold">{params.bpSys}</span>
                       </div>
                       <input 
                         type="range" min="50" max="250" 
                         value={params.bpSys}
                         onChange={(e) => setParams(p => ({...p, bpSys: parseInt(e.target.value)}))}
                         className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                       />
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-end">
                          <label className="text-xs font-bold text-neutral-500 uppercase">Diastolic BP</label>
                          <span className="text-lg font-mono text-red-500 font-bold">{params.bpDia}</span>
                       </div>
                       <input 
                         type="range" min="30" max="150" 
                         value={params.bpDia}
                         onChange={(e) => setParams(p => ({...p, bpDia: parseInt(e.target.value)}))}
                         className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                       />
                    </div>
                 </div>

              </div>
           )}

        </div>
        
        {/* Footer actions */}
        <div className="p-4 border-t border-neutral-800 bg-black/50">
           <button 
             onClick={() => {
                // Reset to defaults
                setRhythm('NSR');
                setParams({ hr: 80, spo2: 98, rr: 16, bpSys: 120, bpDia: 80, temp: 37.0, etco2: 38 });
                setConditions({ pvc: false, stElev: 0, tInv: false, wideQRS: false, noise: 0 });
             }}
             className="w-full py-3 rounded border border-neutral-700 text-neutral-400 font-bold text-xs uppercase hover:bg-neutral-800 transition-colors"
           >
              Reset Simulation
           </button>
        </div>

      </div>

    </div>
  );
}
