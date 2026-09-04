import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bed, FlaskConical, GraduationCap, HeartPulse, MessageCircle, Microscope, Scan, Stethoscope, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import { PLUGIN_MANIFESTS } from '../../../server/shared/plugins/manifests.generated.js';

// Static allowlists for what a plugin manifest may ask for. A manifest is
// server-importable DATA, so it carries the strings 'Microscope' / 'fuchsia'
// rather than a React component and a class list. Both must be resolved
// against literals here: Tailwind's JIT only emits a class it can see written
// out, so a computed `bg-${accent}-500/15` would silently render unstyled.
const PLUGIN_ICONS = { Microscope, FlaskConical, Scan, Stethoscope, BookOpen, GraduationCap, HeartPulse, Bed };
const PLUGIN_ACCENTS = {
    fuchsia: {
        iconText: 'text-fuchsia-300', activeText: 'text-fuchsia-200',
        activeBg: 'bg-fuchsia-500/15', activeRing: 'ring-fuchsia-500/30', activeBar: 'bg-fuchsia-400',
    },
    teal: {
        iconText: 'text-teal-300', activeText: 'text-teal-200',
        activeBg: 'bg-teal-500/15', activeRing: 'ring-teal-500/30', activeBar: 'bg-teal-400',
    },
    indigo: {
        iconText: 'text-indigo-300', activeText: 'text-indigo-200',
        activeBg: 'bg-indigo-500/15', activeRing: 'ring-indigo-500/30', activeBar: 'bg-indigo-400',
    },
    // Deliberately neutral — reference material, never a live clinical
    // reading a case's own findings could be confused for.
    slate: {
        iconText: 'text-slate-300', activeText: 'text-slate-200',
        activeBg: 'bg-slate-500/15', activeRing: 'ring-slate-500/30', activeBar: 'bg-slate-400',
    },
};

// Bottom navigation bar shared across every in-session surface — main
// chat, PhysicalExamScreen, InvestigationsScreen, DiscussionScreen.
// Lets the user hop directly between rooms without going back to the
// chat first.
//
// `currentRoom` is one of: 'chat' | 'examination' | 'lab' |
// 'radiology' | 'pathology' | 'consultant'. All six are peer rooms — visiting the
// Consultant doesn't end the session; that's a separate action wired
// up by the patient room's End & Debrief button.
//
// Visual treatment: each room carries its own accent so the active
// state reinforces "you're in the lab" / "you're in radiology" with a
// colour the user already associates with that room (purple lab, cyan
// imaging, amber debrief). At rest the buttons are quiet — the room
// icon shows the modality tint but the chrome stays neutral. Only the
// active room fills + underlines in its accent.
//
// `sessionId` opt-in: when present, the navigator polls lab + radiology
// orders for ready-but-unviewed counts and renders a small notification
// dot on the matching button. Replaces the floating "Ordered Tests"
// mini-window that used to clutter the patient screen (retired
// 2026-05-14). Skip the prop on test mounts that don't need the badge.
const CORE_ROOM_DEFS = [
    {
        key: 'chat',
        order: 10,
        labelKey: 'room_chat',
        subKey: 'room_chat_sub',
        icon: MessageCircle,
        iconText: 'text-rose-300',
        activeText: 'text-rose-200',
        activeBg: 'bg-rose-500/15',
        activeRing: 'ring-rose-500/30',
        activeBar: 'bg-rose-400',
    },
    {
        key: 'examination',
        order: 20,
        labelKey: 'room_examination',
        subKey: 'room_examination_sub',
        icon: Stethoscope,
        iconText: 'text-emerald-300',
        activeText: 'text-emerald-200',
        activeBg: 'bg-emerald-500/15',
        activeRing: 'ring-emerald-500/30',
        activeBar: 'bg-emerald-400',
    },
    {
        key: 'lab',
        order: 30,
        labelKey: 'room_lab',
        subKey: 'room_lab_sub',
        icon: FlaskConical,
        iconText: 'text-purple-300',
        activeText: 'text-purple-200',
        activeBg: 'bg-purple-500/15',
        activeRing: 'ring-purple-500/30',
        activeBar: 'bg-purple-400',
        badgeAccent: 'bg-emerald-500 text-emerald-50 ring-emerald-300/40',
    },
    {
        key: 'radiology',
        order: 40,
        labelKey: 'room_radiology',
        subKey: 'room_radiology_sub',
        icon: Scan,
        iconText: 'text-cyan-300',
        activeText: 'text-cyan-200',
        activeBg: 'bg-cyan-500/15',
        activeRing: 'ring-cyan-500/30',
        activeBar: 'bg-cyan-400',
        badgeAccent: 'bg-emerald-500 text-emerald-50 ring-emerald-300/40',
    },
    {
        key: 'consultant',
        order: 90,
        labelKey: 'room_consultant',
        subKey: 'room_consultant_sub',
        icon: GraduationCap,
        iconText: 'text-amber-300',
        activeText: 'text-amber-200',
        activeBg: 'bg-amber-500/15',
        activeRing: 'ring-amber-500/30',
        activeBar: 'bg-amber-400',
    },
];

// Plugin rooms (RPS-1). A plugin that declares a room appears here without
// rohy naming it — this file used to carry a hand-written pathology entry, and
// the point of the standard is that adding the next room is a manifest, not an
// edit to a shared component. A manifest asking for an icon or accent that is
// not allowlisted is skipped rather than rendered broken.
// 'pacs' is deliberately excluded from its own tab: its imaging viewer is now
// the "Imágenes" tab inside the core 'radiology' room (App.jsx renders it via
// the generic PluginRoom mount, keyed off a local tab state, never a room
// switch) rather than a second, unsynchronized room students had to discover
// on their own. `enabledPlugins` still includes 'pacs' when a case has real
// imaging — that's what gates whether the in-room "Imágenes" tab is offered
// at all — this filter only hides the now-redundant standalone nav entry.
const HIDDEN_PLUGIN_ROOMS = new Set(['pacs']);

const PLUGIN_ROOM_DEFS = PLUGIN_MANIFESTS
    .filter((m) => !HIDDEN_PLUGIN_ROOMS.has(m.room.key))
    .map((m) => {
        const icon = PLUGIN_ICONS[m.room.icon];
        const accent = PLUGIN_ACCENTS[m.room.accent];
        if (!icon || !accent) return null;
        return {
            key: m.room.key,
            order: m.room.order ?? 50,
            labelKey: m.room.labelKey,
            subKey: m.room.subKey,
            icon,
            isPlugin: true,
            ...accent,
        };
    })
    .filter(Boolean);

export const ROOM_DEFS = [...CORE_ROOM_DEFS, ...PLUGIN_ROOM_DEFS]
    .sort((a, b) => a.order - b.order);

// 10s cadence matches OrdersDrawer's polling cost-vs-staleness tradeoff
// closely enough that the badge feels live without doubling the request
// rate. Slightly off-phase from OrdersDrawer's 5s on purpose so two
// surfaces don't fire on the exact same tick.
const POLL_INTERVAL_MS = 10000;

function useReadyCounts(sessionId) {
    const [counts, setCounts] = useState({ lab: 0, radiology: 0 });

    useEffect(() => {
        // No session, no polling. Counts stay at whatever they were on
        // the previous session; the badge render gates on sessionId so
        // the stale value never shows. Avoids a setState-in-effect lint
        // warning (the rule discourages eager resets here).
        if (!sessionId) return undefined;
        let cancelled = false;
        const tick = async () => {
            try {
                const [labRes, radRes] = await Promise.all([
                    apiFetch(`/sessions/${sessionId}/orders`).catch(() => ({ orders: [] })),
                    apiFetch(`/sessions/${sessionId}/radiology-orders`).catch(() => ({ orders: [] })),
                ]);
                if (cancelled) return;
                const lab = (labRes?.orders || []).filter((o) => o.is_ready && !o.viewed_at).length;
                const radiology = (radRes?.orders || []).filter((o) => o.is_ready && !o.viewed_at).length;
                setCounts({ lab, radiology });
            } catch {
                // Swallow — transient fetch failures shouldn't blank the
                // badge; the next tick will refresh it.
            }
        };
        tick();
        const id = setInterval(tick, POLL_INTERVAL_MS);
        return () => { cancelled = true; clearInterval(id); };
    }, [sessionId]);

    return counts;
}

export default function RoomNavigator({
    currentRoom, onSelectRoom, onOpenCourse = null, sessionId = null,
    // Which plugin rooms this case actually offers. `null` means "no opinion"
    // so existing mounts (and tests) render every room exactly as before; App
    // passes the resolved list so a case carrying no pathology material shows
    // no Pathology tab, rather than a tab onto an empty state.
    enabledPlugins = null,
}) {
    const { t } = useTranslation('common');
    const counts = useReadyCounts(sessionId);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Active room label for the minimized toggle pill
    const activeDef = ROOM_DEFS.find((r) => r.key === currentRoom);
    const activeLabel = activeDef ? t(activeDef.labelKey) : t('room_navigation');

    return (
        <div className="w-full px-4 pb-2 pt-1 pointer-events-none flex flex-col items-center select-none">
            {/* Sliding Container with smooth transition */}
            <div className={`pointer-events-auto flex flex-col items-center transition-all duration-300 ease-out ${
                isCollapsed ? 'translate-y-[calc(100%-24px)] opacity-90 hover:opacity-100 hover:translate-y-0' : 'translate-y-0'
            }`}>
                {/* Pull handle / toggle bar */}
                <button
                    type="button"
                    onClick={() => setIsCollapsed((v) => !v)}
                    aria-label={isCollapsed ? t('expand_navigation', { defaultValue: 'Expand navigation' }) : t('collapse_navigation', { defaultValue: 'Hide navigation' })}
                    title={isCollapsed ? 'Expandir barra de navegação' : 'Recolher barra de navegação'}
                    className="group -mb-1 px-4 py-0.5 rounded-t-xl bg-[rgba(5,9,10,0.85)] hover:bg-[rgba(14,22,24,0.9)] border-t border-x border-white/15 backdrop-blur-md flex items-center gap-1.5 text-[11px] font-medium text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
                >
                    {isCollapsed ? (
                        <>
                            <ChevronUp className="w-3.5 h-3.5 text-teal-300 animate-bounce" />
                            <span className="tracking-tight">{activeLabel}</span>
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-300 transition-colors" />
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 group-hover:text-slate-200">
                                {t('hide_nav', { defaultValue: 'Recolher' })}
                            </span>
                        </>
                    )}
                </button>

                {/* Dock Nav */}
                <nav
                    className="flex items-stretch gap-1.5 px-3 py-1.5 w-full max-w-5xl console-glass-dock shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]"
                    aria-label={t('room_navigation')}
                >
                    {ROOM_DEFS
                        .filter((room) => !room.isPlugin || enabledPlugins === null || enabledPlugins.includes(room.key))
                        .map((room) => (
                        <RoomButton
                            key={room.key}
                            room={room}
                            active={currentRoom === room.key}
                            badge={room.key === 'lab' ? counts.lab : room.key === 'radiology' ? counts.radiology : 0}
                            onClick={() => onSelectRoom(room.key)}
                        />
                    ))}
                    {/* Course — a peer of the rooms but visually smaller and in black,
                        opening this case's course content (lessons + surveys). */}
                    {onOpenCourse && (
                        <button
                            type="button"
                            onClick={onOpenCourse}
                            aria-label={t('room_course', { defaultValue: 'Course' })}
                            className="shrink-0 self-stretch px-3.5 rounded-xl flex items-center gap-2 bg-white/5 text-white/90 ring-1 ring-white/10 hover:bg-white/10 hover:text-white hover:ring-white/20 transition-all active:scale-[0.98]"
                        >
                            <BookOpen className="w-4 h-4 text-teal-300" />
                            <span className="text-xs font-semibold">{t('room_course', { defaultValue: 'Course' })}</span>
                        </button>
                    )}
                </nav>
            </div>
        </div>
    );
}

function RoomButton({ room, active, badge, onClick }) {
    const { t } = useTranslation('common');
    const Icon = room.icon;
    // Room names come from the static ROOM_DEFS key map; every labelKey /
    // subKey has a matching entry in src/locales/en/common.json.
    const label = t(room.labelKey);
    // The badge accent is only declared on lab/radiology room defs, so
    // its absence doubles as the gate for "this room never shows a badge."
    const showBadge = badge > 0 && Boolean(room.badgeAccent);
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            aria-label={showBadge ? t('room_ready_results', { label, count: badge }) : label}
            className={`relative flex-1 px-3.5 py-2 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 group active:scale-[0.98] ${
                active
                    ? `${room.activeBg} ring-1 ${room.activeRing} shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]`
                    : 'hover:bg-white/5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)]'
            }`}
        >
            <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    active ? `${room.iconText} drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]` : `${room.iconText} opacity-70 group-hover:opacity-100`
                }`} />
                {showBadge && (
                    <span
                        className={`absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold leading-4 text-center ring-2 ring-slate-950 shadow-md ${room.badgeAccent}`}
                    >
                        {badge > 9 ? '9+' : badge}
                    </span>
                )}
            </div>
            {/* min-w-0 so the flex child MAY shrink: without it a long label
                cannot be truncated, it just forces the row wider. The labels
                are deliberately short — one word and one subtitle, the register
                the core rooms already use — but German and Finnish build
                compounds that no wording discipline shortens
                ("Befundungsarbeitsplatz", "kuvantamistyöasema"), so the bar
                must hold one that does not fit. Truncating one label is a
                readable row; wrapping it is a three-line row and every other
                room moves. */}
            <div className="flex min-w-0 flex-col items-start leading-tight">
                <span
                    title={label}
                    className={`w-full truncate text-sm font-semibold ${
                        active ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    }`}
                >
                    {label}
                </span>
                <span
                    title={t(room.subKey)}
                    className={`w-full truncate text-[10px] uppercase tracking-wider ${
                        active ? room.activeText : 'text-slate-500'
                    }`}
                >

                    {t(room.subKey)}
                </span>
            </div>
            {active && (
                <span className={`absolute left-4 right-4 -bottom-px h-0.5 rounded-full ${room.activeBar} shadow-[0_0_8px_currentColor]`} />
            )}
        </button>
    );
}
