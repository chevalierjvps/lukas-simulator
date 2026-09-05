import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Search, X, ImageOff } from 'lucide-react';
import { createHostAssetService } from '../hostAssetService.js';
import { SlideAssetCard } from '../../components/pathology/SlideAssetCard.jsx';
import { SlideCanvas } from '../../components/pathology/SlideCanvas.jsx';
import { materializeSlideAsset } from '../../components/pathology/assetCatalog.js';
import { apiFetch } from '../../services/apiClient';
import { fetchArchive } from '../pacs/hostArchive.js';
import { createHostSeriesLoader } from '../pacs/hostSeriesLoader.js';
import { readArchive } from '../../components/pacs/archive.js';
import { resolveRemoteRefs } from '../context.js';
import { PacsScreen } from '../../components/pacs/PacsScreen.jsx';

const pathologyAssetService = createHostAssetService({ pluginId: 'pathology' });
const PACS_PLUGIN_ID = 'pacs';
const pacsLoadSeries = createHostSeriesLoader({ pluginId: PACS_PLUGIN_ID });

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
    const { t } = useTranslation('reference_library');
    const [assets, setAssets] = useState(null);
    const [error, setError] = useState(null);
    const [openAsset, setOpenAsset] = useState(null);

    useEffect(() => {
        let cancelled = false;
        pathologyAssetService.list()
            .then((result) => { if (!cancelled) setAssets(result.assets ?? []); })
            .catch((err) => { if (!cancelled) setError(err?.message ?? t('failed_to_load')); });
        return () => { cancelled = true; };
    }, [t]);

    const slide = useMemo(() => (openAsset ? materializeSlideAsset({}, openAsset) : null), [openAsset]);

    if (error) return <EmptyState message={error} />;
    if (assets === null) return <EmptyState message={t('loading')} />;
    if (assets.length === 0) return <EmptyState message={t('no_slides_yet')} />;

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
    // 'reference_library' owns this tab's own chrome text; 'investigations'
    // is reused for "Interpretation" — the exact same word/concept the real
    // Radiología room's report viewer already uses, not a second one that
    // could drift from it.
    const { t, i18n } = useTranslation('reference_library');
    const { t: tInv } = useTranslation('investigations');
    const [studies, setStudies] = useState(null);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState('');
    const [openStudy, setOpenStudy] = useState(null);
    // The archive of REAL bundled imaging (server/plugin-content/pacs), the
    // same one the case-authoring PACS editor previews from and a session's
    // Radiología > Imágenes tab opens ordered studies against. Not every one
    // of the 74 catalogue studies has a real scan behind it yet — this map
    // is how a card knows whether to open the actual DICOM reader or the
    // text-only normal report.
    const [archiveByStudyId, setArchiveByStudyId] = useState(new Map());

    useEffect(() => {
        let cancelled = false;
        // `lang` opts this (student-facing, case-independent) browse into
        // localization — the case-authoring tool that owns this same
        // endpoint never sends it, and keeps getting the raw English source.
        apiFetch(`/radiology-database?lang=${encodeURIComponent(i18n.language)}`)
            .then((data) => { if (!cancelled) setStudies(data?.studies ?? []); })
            .catch((err) => { if (!cancelled) setError(err?.message ?? t('failed_to_load')); });
        fetchArchive({ pluginId: PACS_PLUGIN_ID }).then(({ archive }) => {
            if (cancelled) return;
            const byStudyId = new Map();
            readArchive(archive).entries.forEach((entry) => {
                // First entry wins: a few studyIds carry more than one archive
                // preparation (e.g. mri_pelvis has both a CT and an MR of the
                // same region) — the catalogue card names one study, so it
                // opens one reader, not a picker between near-duplicates.
                if (entry.studyId && !byStudyId.has(entry.studyId)) byStudyId.set(entry.studyId, entry);
            });
            setArchiveByStudyId(byStudyId);
        });
        // No catch: an archive that fails to load (no imaging origin
        // configured) just means every card falls back to its text report —
        // exactly like the case-authoring editor's own "no imaging yet"
        // degradation, never a broken library.
        return () => { cancelled = true; };
    }, [i18n.language, t]);

    const filtered = useMemo(() => {
        if (!studies) return [];
        const q = query.trim().toLowerCase();
        if (!q) return studies;
        return studies.filter((s) =>
            s.name?.toLowerCase().includes(q) ||
            s.modality?.toLowerCase().includes(q) ||
            s.body_region?.toLowerCase().includes(q));
    }, [studies, query]);

    const imagingEntry = openStudy ? archiveByStudyId.get(openStudy.id) : null;
    const worklist = useMemo(() => (
        imagingEntry ? [worklistRowFromArchiveEntry(imagingEntry)] : []
    ), [imagingEntry]);

    if (error) return <EmptyState message={error} />;
    if (studies === null) return <EmptyState message={t('loading')} />;

    return (
        <div className="p-6">
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('search_placeholder')}
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
                        {archiveByStudyId.has(study.id) && (
                            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-400">
                                {t('has_imaging')}
                            </p>
                        )}
                    </button>
                ))}
                {filtered.length === 0 && (
                    <p className="col-span-full p-2 text-xs text-slate-500">{t('no_results')}</p>
                )}
            </div>
            {openStudy && imagingEntry && (
                <SlideModal title={openStudy.name} onClose={() => setOpenStudy(null)}>
                    <PacsScreen worklist={worklist} loadSeries={pacsLoadSeries} t={t} />
                </SlideModal>
            )}
            {openStudy && !imagingEntry && (
                <SlideModal title={openStudy.name} onClose={() => setOpenStudy(null)}>
                    <div className="mx-auto max-w-2xl space-y-4 overflow-y-auto p-6 text-sm text-slate-200">
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('normal_findings_heading')}</h4>
                            <p className="mt-1 whitespace-pre-line">{openStudy.normal_findings}</p>
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tInv('interpretation')}</h4>
                            <p className="mt-1 whitespace-pre-line">{openStudy.normal_interpretation}</p>
                        </div>
                    </div>
                </SlideModal>
            )}
        </div>
    );
}

/**
 * One archive entry, in the worklist shape `PacsScreen` renders — always
 * "available" (this is a reference archive, not an order gated by
 * turnaround), refs rewritten from `remote:` onto the plugin's proxy mount
 * exactly as the session-based Radiología > Imágenes tab does (see
 * src/plugins/pacs/index.jsx > worklistProps).
 */
function worklistRowFromArchiveEntry(entry) {
    const series = resolveRemoteRefs(entry.series, PACS_PLUGIN_ID);
    return {
        id: entry.id,
        studyId: entry.studyId,
        description: entry.label || entry.id,
        modality: entry.modality,
        accession: null,
        available: series.length > 0,
        error: series.length === 0,
        ref: series[0]?.ref ?? null,
        series,
    };
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
