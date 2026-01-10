import React, { useState } from 'react';

/**
 * Body Map Component with Professional Silhouette and Floating Hotspots
 * Hotspots are always visible as subtle dots, become prominent on hover/selection
 */
export default function BodyMap({
    view = 'anterior',
    gender = 'male',
    selectedRegion,
    onRegionClick,
    examinedRegions = new Set(),
    abnormalRegions = new Set()
}) {
    const [hoveredRegion, setHoveredRegion] = useState(null);

    // Hotspot positions calibrated to actual SVG silhouettes
    // Man SVG: 358.5 x 1086 (narrow, tall ~1:3)
    // Woman SVG: 640 x 1280 (wider, ~1:2)
    const hotspots = {
        anterior: {
            male: [
                // Head & Neck (0-10% height)
                { id: 'head', x: 50, y: 3.5, label: 'Head' },
                { id: 'eyes', x: 50, y: 2.5, label: 'Eyes', small: true },
                { id: 'ears', x: 44, y: 3, label: 'L. Ear', small: true },
                { id: 'mouth', x: 50, y: 5, label: 'Mouth', small: true },
                { id: 'neck', x: 50, y: 7.5, label: 'Neck' },

                // Shoulders & Upper torso (10-18%)
                { id: 'shoulderLeft', x: 32, y: 11, label: 'L. Shoulder' },
                { id: 'shoulderRight', x: 68, y: 11, label: 'R. Shoulder' },
                { id: 'chestAnterior', x: 50, y: 14, label: 'Chest' },
                { id: 'heart', x: 54, y: 15, label: 'Heart', small: true },

                // Arms (extending outward, 12-40%)
                { id: 'upperLimbLeft', x: 24, y: 17, label: 'L. Upper Arm' },
                { id: 'upperLimbRight', x: 76, y: 17, label: 'R. Upper Arm' },
                { id: 'elbowLeft', x: 15, y: 24, label: 'L. Elbow', small: true },
                { id: 'elbowRight', x: 85, y: 24, label: 'R. Elbow', small: true },
                { id: 'forearmLeft', x: 10, y: 30, label: 'L. Forearm', small: true },
                { id: 'forearmRight', x: 90, y: 30, label: 'R. Forearm', small: true },
                { id: 'handLeft', x: 6, y: 38, label: 'L. Hand', small: true },
                { id: 'handRight', x: 94, y: 38, label: 'R. Hand', small: true },

                // Abdomen & Pelvis (18-35%)
                { id: 'abdomen', x: 50, y: 22, label: 'Abdomen' },
                { id: 'groin', x: 50, y: 32, label: 'Groin', small: true },

                // Thighs (35-52%)
                { id: 'thighLeft', x: 43, y: 42, label: 'L. Thigh' },
                { id: 'thighRight', x: 57, y: 42, label: 'R. Thigh' },

                // Knees (52-58%)
                { id: 'kneeLeft', x: 42, y: 53, label: 'L. Knee' },
                { id: 'kneeRight', x: 58, y: 53, label: 'R. Knee' },

                // Lower legs (58-82%)
                { id: 'lowerLimbLeft', x: 40, y: 67, label: 'L. Shin' },
                { id: 'lowerLimbRight', x: 60, y: 67, label: 'R. Shin' },

                // Ankles (82-88%)
                { id: 'ankleLeft', x: 38, y: 82, label: 'L. Ankle', small: true },
                { id: 'ankleRight', x: 62, y: 82, label: 'R. Ankle', small: true },

                // Feet (88-97%)
                { id: 'footLeft', x: 35, y: 92, label: 'L. Foot', small: true },
                { id: 'footRight', x: 65, y: 92, label: 'R. Foot', small: true },
            ],
            female: [
                // Head & Neck - woman has proportionally smaller head
                { id: 'head', x: 50, y: 4, label: 'Head' },
                { id: 'eyes', x: 50, y: 3, label: 'Eyes', small: true },
                { id: 'ears', x: 45, y: 3.5, label: 'L. Ear', small: true },
                { id: 'mouth', x: 50, y: 5.5, label: 'Mouth', small: true },
                { id: 'neck', x: 50, y: 8, label: 'Neck' },

                // Shoulders & Upper torso - woman has narrower shoulders
                { id: 'shoulderLeft', x: 36, y: 12, label: 'L. Shoulder' },
                { id: 'shoulderRight', x: 64, y: 12, label: 'R. Shoulder' },
                { id: 'chestAnterior', x: 50, y: 16, label: 'Chest' },
                { id: 'heart', x: 54, y: 17, label: 'Heart', small: true },

                // Arms - closer to body for woman
                { id: 'upperLimbLeft', x: 28, y: 19, label: 'L. Upper Arm' },
                { id: 'upperLimbRight', x: 72, y: 19, label: 'R. Upper Arm' },
                { id: 'elbowLeft', x: 22, y: 26, label: 'L. Elbow', small: true },
                { id: 'elbowRight', x: 78, y: 26, label: 'R. Elbow', small: true },
                { id: 'forearmLeft', x: 18, y: 32, label: 'L. Forearm', small: true },
                { id: 'forearmRight', x: 82, y: 32, label: 'R. Forearm', small: true },
                { id: 'handLeft', x: 14, y: 40, label: 'L. Hand', small: true },
                { id: 'handRight', x: 86, y: 40, label: 'R. Hand', small: true },

                // Abdomen & Pelvis
                { id: 'abdomen', x: 50, y: 24, label: 'Abdomen' },
                { id: 'groin', x: 50, y: 35, label: 'Groin', small: true },

                // Thighs - woman has wider hips
                { id: 'thighLeft', x: 41, y: 46, label: 'L. Thigh' },
                { id: 'thighRight', x: 59, y: 46, label: 'R. Thigh' },

                // Knees
                { id: 'kneeLeft', x: 42, y: 58, label: 'L. Knee' },
                { id: 'kneeRight', x: 58, y: 58, label: 'R. Knee' },

                // Lower legs
                { id: 'lowerLimbLeft', x: 41, y: 72, label: 'L. Shin' },
                { id: 'lowerLimbRight', x: 59, y: 72, label: 'R. Shin' },

                // Ankles
                { id: 'ankleLeft', x: 40, y: 86, label: 'L. Ankle', small: true },
                { id: 'ankleRight', x: 60, y: 86, label: 'R. Ankle', small: true },

                // Feet
                { id: 'footLeft', x: 38, y: 94, label: 'L. Foot', small: true },
                { id: 'footRight', x: 62, y: 94, label: 'R. Foot', small: true },
            ]
        },
        posterior: {
            male: [
                // Head & Neck
                { id: 'head', x: 50, y: 3.5, label: 'Head' },
                { id: 'neck', x: 50, y: 7.5, label: 'Neck' },

                // Shoulders & Upper back
                { id: 'shoulderLeft', x: 32, y: 11, label: 'L. Shoulder' },
                { id: 'shoulderRight', x: 68, y: 11, label: 'R. Shoulder' },
                { id: 'scapulaLeft', x: 40, y: 14, label: 'L. Scapula', small: true },
                { id: 'scapulaRight', x: 60, y: 14, label: 'R. Scapula', small: true },
                { id: 'backUpper', x: 50, y: 16, label: 'Upper Back' },

                // Arms
                { id: 'upperLimbLeft', x: 24, y: 17, label: 'L. Upper Arm' },
                { id: 'upperLimbRight', x: 76, y: 17, label: 'R. Upper Arm' },
                { id: 'elbowLeft', x: 15, y: 24, label: 'L. Elbow', small: true },
                { id: 'elbowRight', x: 85, y: 24, label: 'R. Elbow', small: true },

                // Lower back & Sacrum
                { id: 'backLower', x: 50, y: 24, label: 'Lower Back' },
                { id: 'sacrum', x: 50, y: 30, label: 'Sacrum', small: true },

                // Buttocks
                { id: 'buttockLeft', x: 43, y: 34, label: 'L. Buttock' },
                { id: 'buttockRight', x: 57, y: 34, label: 'R. Buttock' },

                // Posterior thighs
                { id: 'thighLeft', x: 43, y: 44, label: 'L. Thigh' },
                { id: 'thighRight', x: 57, y: 44, label: 'R. Thigh' },

                // Popliteal fossa (back of knee)
                { id: 'poplitealLeft', x: 42, y: 53, label: 'L. Popliteal', small: true },
                { id: 'poplitealRight', x: 58, y: 53, label: 'R. Popliteal', small: true },

                // Calves
                { id: 'calfLeft', x: 40, y: 67, label: 'L. Calf' },
                { id: 'calfRight', x: 60, y: 67, label: 'R. Calf' },

                // Achilles & Heels
                { id: 'achillesLeft', x: 38, y: 80, label: 'L. Achilles', small: true },
                { id: 'achillesRight', x: 62, y: 80, label: 'R. Achilles', small: true },
                { id: 'heelLeft', x: 36, y: 90, label: 'L. Heel', small: true },
                { id: 'heelRight', x: 64, y: 90, label: 'R. Heel', small: true },
            ],
            female: [
                // Head & Neck
                { id: 'head', x: 50, y: 4, label: 'Head' },
                { id: 'neck', x: 50, y: 8, label: 'Neck' },

                // Shoulders & Upper back
                { id: 'shoulderLeft', x: 36, y: 12, label: 'L. Shoulder' },
                { id: 'shoulderRight', x: 64, y: 12, label: 'R. Shoulder' },
                { id: 'scapulaLeft', x: 42, y: 16, label: 'L. Scapula', small: true },
                { id: 'scapulaRight', x: 58, y: 16, label: 'R. Scapula', small: true },
                { id: 'backUpper', x: 50, y: 18, label: 'Upper Back' },

                // Arms
                { id: 'upperLimbLeft', x: 28, y: 19, label: 'L. Upper Arm' },
                { id: 'upperLimbRight', x: 72, y: 19, label: 'R. Upper Arm' },
                { id: 'elbowLeft', x: 22, y: 26, label: 'L. Elbow', small: true },
                { id: 'elbowRight', x: 78, y: 26, label: 'R. Elbow', small: true },

                // Lower back & Sacrum
                { id: 'backLower', x: 50, y: 26, label: 'Lower Back' },
                { id: 'sacrum', x: 50, y: 32, label: 'Sacrum', small: true },

                // Buttocks - wider for woman
                { id: 'buttockLeft', x: 41, y: 37, label: 'L. Buttock' },
                { id: 'buttockRight', x: 59, y: 37, label: 'R. Buttock' },

                // Posterior thighs
                { id: 'thighLeft', x: 42, y: 48, label: 'L. Thigh' },
                { id: 'thighRight', x: 58, y: 48, label: 'R. Thigh' },

                // Popliteal fossa
                { id: 'poplitealLeft', x: 42, y: 58, label: 'L. Popliteal', small: true },
                { id: 'poplitealRight', x: 58, y: 58, label: 'R. Popliteal', small: true },

                // Calves
                { id: 'calfLeft', x: 41, y: 72, label: 'L. Calf' },
                { id: 'calfRight', x: 59, y: 72, label: 'R. Calf' },

                // Achilles & Heels
                { id: 'achillesLeft', x: 40, y: 84, label: 'L. Achilles', small: true },
                { id: 'achillesRight', x: 60, y: 84, label: 'R. Achilles', small: true },
                { id: 'heelLeft', x: 38, y: 93, label: 'L. Heel', small: true },
                { id: 'heelRight', x: 62, y: 93, label: 'R. Heel', small: true },
            ]
        }
    };

    const currentHotspots = hotspots[view]?.[gender] || hotspots.anterior.male;

    // Get hotspot visual state
    const getHotspotState = (regionId) => {
        const isSelected = selectedRegion === regionId;
        const isHovered = hoveredRegion === regionId;
        const isExamined = examinedRegions.has(regionId);
        const isAbnormal = abnormalRegions.has(regionId);

        return { isSelected, isHovered, isExamined, isAbnormal };
    };

    const silhouetteSrc = gender === 'female' ? '/woman-silhouette.svg' : '/man-silhouette.svg';

    return (
        <div className="relative w-full h-full flex flex-col overflow-hidden">
            {/* Silhouette Container - Full height */}
            <div className="relative flex-1 flex items-center justify-center min-h-0">
                {/* Wrapper for proper aspect ratio */}
                <div
                    className="relative h-full"
                    style={{
                        aspectRatio: gender === 'female' ? '1/2' : '1/3',
                        maxHeight: '100%',
                        maxWidth: '100%'
                    }}
                >
                    {/* SVG Silhouette */}
                    <img
                        src={silhouetteSrc}
                        alt={`${gender} body silhouette`}
                        className="w-full h-full object-contain select-none"
                        style={{
                            filter: 'invert(0.7) sepia(0.05) saturate(0.3) brightness(1.2)',
                        }}
                        draggable={false}
                    />

                    {/* Hotspots Overlay */}
                    <div className="absolute inset-0">
                        {currentHotspots.map(hotspot => {
                            const { isSelected, isHovered, isExamined, isAbnormal } = getHotspotState(hotspot.id);
                            const isActive = isSelected || isHovered;

                            // Determine colors
                            let bgColor = 'bg-white/40';
                            let borderColor = 'border-white/60';
                            let ringColor = '';

                            if (isAbnormal) {
                                bgColor = 'bg-red-500';
                                borderColor = 'border-red-300';
                                ringColor = 'ring-2 ring-red-500/50';
                            } else if (isExamined) {
                                bgColor = 'bg-emerald-500';
                                borderColor = 'border-emerald-300';
                            } else if (isSelected) {
                                bgColor = 'bg-cyan-400';
                                borderColor = 'border-cyan-200';
                                ringColor = 'ring-2 ring-cyan-400/50';
                            } else if (isHovered) {
                                bgColor = 'bg-white/80';
                                borderColor = 'border-white';
                            }

                            const size = hotspot.small
                                ? (isActive ? 'w-4 h-4' : 'w-2 h-2')
                                : (isActive ? 'w-5 h-5' : 'w-3 h-3');

                            return (
                                <div
                                    key={hotspot.id}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10"
                                    style={{
                                        left: `${hotspot.x}%`,
                                        top: `${hotspot.y}%`,
                                    }}
                                >
                                    {/* Pulse ring for abnormal */}
                                    {isAbnormal && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-6 h-6 rounded-full bg-red-500/30 animate-ping" />
                                        </div>
                                    )}

                                    {/* Hotspot button */}
                                    <button
                                        onClick={() => onRegionClick(hotspot.id)}
                                        onMouseEnter={() => setHoveredRegion(hotspot.id)}
                                        onMouseLeave={() => setHoveredRegion(null)}
                                        className={`
                                            ${size} ${bgColor} ${borderColor} ${ringColor}
                                            rounded-full border shadow-sm
                                            cursor-pointer transition-all duration-150
                                            hover:scale-150 hover:bg-white/90 hover:border-white
                                            flex items-center justify-center
                                        `}
                                        title={hotspot.label}
                                    />

                                    {/* Label - shows on hover */}
                                    <div className={`
                                        absolute left-1/2 -translate-x-1/2 mt-1
                                        px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap
                                        bg-black/80 text-white border border-white/20
                                        transition-all duration-150 pointer-events-none
                                        ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}
                                    `}>
                                        {hotspot.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Compact Legend */}
            <div className="flex items-center justify-center gap-4 py-1.5 border-t border-slate-700/50 bg-slate-900/50">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-white/40 border border-white/60" />
                    <span className="text-[10px] text-slate-500">Not examined</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-300" />
                    <span className="text-[10px] text-slate-500">Normal</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 border border-red-300" />
                    <span className="text-[10px] text-slate-500">Abnormal</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 border border-cyan-200" />
                    <span className="text-[10px] text-slate-500">Selected</span>
                </div>
            </div>
        </div>
    );
}
