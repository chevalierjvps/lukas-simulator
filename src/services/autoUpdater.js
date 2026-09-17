/**
 * Lukas 1.0 — Desktop auto-update (Tauri only)
 *
 * Wraps @tauri-apps/plugin-updater. The plugin checks the endpoint declared
 * in src-tauri/tauri.conf.json (plugins.updater.endpoints), which points at
 * GitHub's "latest release" pointer:
 *   https://github.com/chevalierjvps/lukas-simulator/releases/latest/download/latest.json
 * A future release just needs to (a) bump the version in tauri.conf.json +
 * Cargo.toml, (b) `npm run tauri:build`, (c) publish a GitHub Release
 * (not a draft/prerelease — those are invisible to "latest") carrying the
 * installer(s) + the generated latest.json + .sig. Every installed copy
 * then finds it here automatically — no separate distribution step.
 *
 * No-ops entirely in the web build (isTauri() false) and in any environment
 * without the Tauri updater plugin loaded — safe to import unconditionally.
 */
import { isTauri } from './tauriBridge.js';

/**
 * Check the update endpoint once.
 * @returns {Promise<{available: boolean, version?: string, notes?: string, apply?: () => Promise<void>}>}
 */
export async function checkForUpdate() {
    if (!isTauri()) return { available: false };
    try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        if (!update) return { available: false };
        return {
            available: true,
            version: update.version,
            notes: update.body || '',
            // Downloads + installs the update, then relaunches into it.
            // Kept as a closure over `update` so the caller never has to
            // hold the plugin's Update object itself.
            apply: async () => {
                await update.downloadAndInstall();
                const { relaunch } = await import('@tauri-apps/plugin-process');
                await relaunch();
            },
        };
    } catch (err) {
        // A failed check (offline, endpoint unreachable, no release yet) is
        // routine, not exceptional — the app must keep running normally.
        console.warn('[autoUpdater] check failed:', err?.message || err);
        return { available: false };
    }
}
