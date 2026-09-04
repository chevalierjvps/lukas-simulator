import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, X, ImageOff } from 'lucide-react';
import { createHostAssetService } from '../hostAssetService.js';
import { SlideAssetCard } from '../../components/pathology/SlideAssetCard.jsx';
import { SlideCanvas } from '../../components/pathology/SlideCanvas.jsx';
import { materializeSlideAsset } from '../../components/pathology/assetCatalog.js';
import { apiFetch } from '../../services/apiClient';

const pathologyAssetService = createHostAssetService({ pluginId: 'pathology' });

/**
 * Read-only study room: the platform's pathology slide catalogue and
 * radiology study catalogue, browsable independent of whatever the active
 * case configured. Two tabs, same shape as the Radiología room's
 * Pedidos/Imágenes split (App.jsx), but everything here is a preview — no
 * "add to case" action anywhere, no ordering, no persistence.
 *
 * Chrome mirrors PathologyScreen.jsx exactly: this mounts through the same
 * generic, full-screen `activePlugin` branch in App.jsx that pathology's own
 * room does (not embedded in a tab), so it owns its own `h-screen w-screen`.
 */
export function ReferenceLibraryRoom({ caseTitle, topBarControls = null, roomNav, t = (key, fallback) => fallback }) {
    const [tab, setTab] = useState('pathology');

    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-slate-100">
            <header className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-6 py-3 shadow-lg shadow-black/20 backdrop-blur">
                <div className="flex min-w-0 items-center gap-3 max-lg:max-w-[40%]">
                    <BookOpen className="h-6 w-6 shrink-0 text-slate-300" />
                    <div className="flex min-w-0 items-baseline gap-2 text-sm">
                        <span className="whitespace-nowrap text-base font-semibold text-slate-100">
                            {t('room_reference_library', 'Reference Library')}
                        </span>
                        {caseTitle && (
                            <>
                                <span className="text-slate-500 max-lg:hidden">·</span>
                                <span className="truncate text-slate-300 max-lg:hidden">{caseTitle}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">{topBarControls}</div>
            </header>

            <div role="tablist" className="flex items-center gap-1 border-b border-slate-800/80 bg-slate-950/60 px-6 py-2">
                {[
                    ['pathology', t('room_pathology', 'Pathology')],
                    ['radiology', t('room_radiology', 'Radiology & diagnostics')],
                ].map(([key, label]) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={tab === key}
                        onClick={() => setTab(key)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            tab === key
                                ? 'bg-slate-500/15 text-slate-100 ring-1 ring-slate-500/30'
                                : 'text-slate-400 hover:bg-white/5'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {tab === 'pathology' ? <PathologyLibraryTab /> : <RadiologyLibraryTab />}
            </div>

            {roomNav}
        </div>
    );
}

function PathologyLibraryTab() {
    const [assets, setAssets] = useState(null);
    const [error, setError] = useState(null);
    const [openAsset, setOpenAsset] = useState(null);

    useEffect(() => {
        let cancelled = false;
        pathologyAssetService.list()
            .then((result) => { if (!cancelled) setAssets(result.assets ?? []); })
            .catch((err) => { if (!cancelled) setError(err?.message ?? 'Failed to load'); });
        return () => { cancelled = true; };
    }, []);

    const slide = useMemo(() => (openAsset ? materializeSlideAsset({}, openAsset) : null), [openAsset]);

    if (error) return <EmptyState message={error} />;
    if (assets === null) return <EmptyState message="Loading…" />;
    if (assets.length === 0) return <EmptyState message="No slides in the library yet." />;

    return (
        <>
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
                {assets.map((asset) => (
                    <SlideAssetCard key={asset.id} asset={asset} onOpen={setOpenAsset} />
                ))}
            </div>
            {slide && (
                <SlideModal title={openAsset?.label || openAsset?.id} onClose={() => setOpenAsset(null)}>
                    <SlideCanvas slide={slide} startedAt={Date.now()} />
                </SlideModal>
            )}
        </>
    );
}

function RadiologyLibraryTab() {
    const [studies, setStudies] = useState(null);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState('');
    const [openStudy, setOpenStudy] = useState(null);

    useEffect(() => {
        let cancelled = false;
        apiFetch('/radiology-database')
            .then((data) => { if (!cancelled) setStudies(data?.studies ?? []); })
            .catch((err) => { if (!cancelled) setError(err?.message ?? 'Failed to load'); });
        return () => { cancelled = true; };
    }, []);

    const filtered = useMemo(() => {
        if (!studies) return [];
        const q = query.trim().toLowerCase();
        if (!q) return studies;
        return studies.filter((s) =>
            s.name?.toLowerCase().includes(q) ||
            s.modality?.toLowerCase().includes(q) ||
            s.body_region?.toLowerCase().includes(q));
    }, [studies, query]);

    if (error) return <EmptyState message={error} />;
    if (studies === null) return <EmptyState message="Loading…" />;

    return (
        <div className="p-6">
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar estudio, modalidad, región…"
                    className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((study) => (
                    <button
                        key={study.id}
                        type="button"
                        onClick={() => setOpenStudy(study)}
                        className="rounded-xl bg-slate-900/70 p-4 text-left ring-1 ring-slate-800 transition-shadow hover:ring-slate-500/50"
                    >
                        <h3 className="text-sm font-semibold text-slate-100">{study.name}</h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">{study.modality} · {study.body_region}</p>
                    </button>
                ))}
                {filtered.length === 0 && (
                    <p className="col-span-full p-2 text-xs text-slate-500">Sin resultados.</p>
                )}
            </div>
            {openStudy && (
                <SlideModal title={openStudy.name} onClose={() => setOpenStudy(null)}>
                    <div className="mx-auto max-w-2xl space-y-4 overflow-y-auto p-6 text-sm text-slate-200">
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hallazgos normales</h4>
                            <p className="mt-1 whitespace-pre-line">{openStudy.normal_findings}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interpretación</h4>
                            <p className="mt-1 whitespace-pre-line">{openStudy.normal_interpretation}</p>
                        </div>
                    </div>
                </SlideModal>
            )}
        </div>
    );
}

function SlideModal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/80 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
                <h3 className="truncate text-sm font-semibold text-slate-100">{title}</h3>
                <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
                    <X className="h-5 w-5" />
                </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
    );
}

function EmptyState({ message }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
            <ImageOff className="h-8 w-8" />
            <p className="text-sm">{message}</p>
        </div>
    );
}

export default ReferenceLibraryRoom;
