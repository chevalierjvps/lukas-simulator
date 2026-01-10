import React, { useState } from 'react';

/**
 * Body Map Component with Professional Silhouette and Floating Hotspots
 * Uses provided SVG silhouettes with CSS-positioned interactive hotspots
 */
export default function BodyMap({
    view = 'anterior',
    gender = 'male', // 'male' or 'female'
    selectedRegion,
    onRegionClick,
    examinedRegions = new Set(),
    abnormalRegions = new Set()
}) {
    const [hoveredRegion, setHoveredRegion] = useState(null);

    // Hotspot positions (as percentages for responsive positioning)
    // Positions calibrated for the silhouette images
    const hotspots = {
        anterior: [
            { id: 'head', x: 50, y: 5, label: 'Head' },
            { id: 'neck', x: 50, y: 10, label: 'Neck' },
            { id: 'chestAnterior', x: 50, y: 18, label: 'Chest' },
            { id: 'heart', x: 55, y: 20, label: 'Heart', small: true },
            { id: 'abdomen', x: 50, y: 30, label: 'Abdomen' },
            { id: 'upperLimbLeft', x: 22, y: 22, label: 'L. Arm' },
            { id: 'upperLimbRight', x: 78, y: 22, label: 'R. Arm' },
            { id: 'lowerLimbLeft', x: 38, y: 60, label: 'L. Leg' },
            { id: 'lowerLimbRight', x: 62, y: 60, label: 'R. Leg' },
        ],
        posterior: [
            { id: 'head', x: 50, y: 5, label: 'Head' },
            { id: 'neck', x: 50, y: 10, label: 'Neck' },
            { id: 'backUpper', x: 50, y: 18, label: 'Upper Back' },
            { id: 'backLower', x: 50, y: 30, label: 'Lower Back' },
            { id: 'upperLimbLeft', x: 22, y: 22, label: 'L. Arm' },
            { id: 'upperLimbRight', x: 78, y: 22, label: 'R. Arm' },
            { id: 'lowerLimbLeft', x: 38, y: 60, label: 'L. Leg' },
            { id: 'lowerLimbRight', x: 62, y: 60, label: 'R. Leg' },
        ]
    };

    const currentHotspots = hotspots[view] || hotspots.anterior;

    // Get hotspot visual state
    const getHotspotState = (regionId) => {
        const isSelected = selectedRegion === regionId;
        const isHovered = hoveredRegion === regionId;
        const isExamined = examinedRegions.has(regionId);
        const isAbnormal = abnormalRegions.has(regionId);

        return { isSelected, isHovered, isExamined, isAbnormal };
    };

    // Get hotspot classes based on state
    const getHotspotClasses = (regionId, isSmall = false) => {
        const { isSelected, isHovered, isExamined, isAbnormal } = getHotspotState(regionId);

        const size = isSmall ? 'w-4 h-4' : 'w-5 h-5';
        let colorClasses = 'bg-slate-500/80 border-slate-400 shadow-slate-500/50';
        let animation = '';

        if (isAbnormal) {
            colorClasses = 'bg-red-500 border-red-300 shadow-red-500/50';
            animation = 'animate-pulse';
        } else if (isExamined) {
            colorClasses = 'bg-emerald-500 border-emerald-300 shadow-emerald-500/50';
        }

        if (isSelected) {
            colorClasses = 'bg-cyan-400 border-cyan-200 shadow-cyan-400/60';
        }

        const hoverScale = isHovered ? 'scale-125' : 'scale-100';

        return `${size} ${colorClasses} ${animation} ${hoverScale} rounded-full border-2 shadow-lg cursor-pointer transition-all duration-200 flex items-center justify-center`;
    };

    const silhouetteSrc = gender === 'female' ? '/woman-silhouette.svg' : '/man-silhouette.svg';

    return (
        <div className="relative w-full h-full flex flex-col">
            {/* Silhouette Container */}
            <div className="relative flex-1 flex items-center justify-center p-4">
                {/* SVG Silhouette */}
                <div
                    className="relative h-full max-h-[450px] aspect-[1/3]"
                    style={{
                        filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
                    }}
                >
                    <img
                        src={silhouetteSrc}
                        alt={`${gender} body silhouette`}
                        className="h-full w-auto object-contain"
                        style={{
                            filter: 'brightness(0.4) sepia(1) hue-rotate(180deg) saturate(0.3)',
                            opacity: 0.7
                        }}
                    />

                    {/* Hotspots Overlay */}
                    {currentHotspots.map(hotspot => {
                        const { isSelected, isAbnormal } = getHotspotState(hotspot.id);

                        return (
                            <div
                                key={hotspot.id}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                                style={{
                                    left: `${hotspot.x}%`,
                                    top: `${hotspot.y}%`,
                                }}
                            >
                                {/* Pulse ring for abnormal */}
                                {isAbnormal && (
                                    <div className="absolute inset-0 w-8 h-8 -m-1.5 rounded-full bg-red-500/30 animate-ping" />
                                )}

                                {/* Selection ring */}
                                {isSelected && (
                                    <div className="absolute inset-0 w-8 h-8 -m-1.5 rounded-full border-2 border-cyan-400/50 animate-pulse" />
                                )}

                                {/* Hotspot button */}
                                <button
                                    onClick={() => onRegionClick(hotspot.id)}
                                    onMouseEnter={() => setHoveredRegion(hotspot.id)}
                                    onMouseLeave={() => setHoveredRegion(null)}
                                    className={getHotspotClasses(hotspot.id, hotspot.small)}
                                    title={hotspot.label}
                                >
                                    <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                                </button>

                                {/* Label tooltip */}
                                <div className={`
                                    absolute left-1/2 -translate-x-1/2 -bottom-7
                                    px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap
                                    bg-slate-800 text-slate-200 border border-slate-600
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                    pointer-events-none z-10
                                `}>
                                    {hotspot.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 py-3 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-500 border border-slate-400" />
                    <span className="text-xs text-slate-400">Not examined</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300" />
                    <span className="text-xs text-slate-400">Normal</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 border border-red-300 animate-pulse" />
                    <span className="text-xs text-slate-400">Abnormal</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 border border-cyan-200" />
                    <span className="text-xs text-slate-400">Selected</span>
                </div>
            </div>
        </div>
    );
}
