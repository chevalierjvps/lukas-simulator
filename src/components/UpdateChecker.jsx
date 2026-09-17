import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';
import { isTauri } from '../services/tauriBridge';
import { checkForUpdate } from '../services/autoUpdater';

// Mounted once at App root. Pure side effect, renders nothing. No-ops on the
// web build — isTauri() is false there, and checkForUpdate() already
// short-circuits on that, so this is a cheap no-op import either way.
export default function UpdateChecker() {
    const { t } = useTranslation('common');
    const toast = useToast();

    useEffect(() => {
        if (!isTauri()) return;
        // Delay past initial boot (DB init, case load) so the update check
        // never competes with the app becoming usable.
        const timer = setTimeout(async () => {
            const result = await checkForUpdate();
            if (!result.available) return;
            const proceed = await toast.confirm(
                t('update_available_body', { version: result.version }),
                { title: t('update_available_title') }
            );
            if (!proceed) return;
            toast.info(t('update_downloading'));
            try {
                await result.apply();
                // apply() relaunches the app on success — nothing after this
                // point normally runs.
            } catch (err) {
                console.warn('[UpdateChecker] apply failed:', err?.message || err);
                toast.error(t('update_failed'));
            }
        }, 8000);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}
