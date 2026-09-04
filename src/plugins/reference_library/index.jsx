import { manifest } from './manifest.js';
import { ReferenceLibraryRoom } from './ReferenceLibraryRoom.jsx';

export default {
    manifest,
    component: ReferenceLibraryRoom,
    // Always available: this room reads platform-wide catalogues (pathology's
    // learner-projected catalog, the open radiology-database endpoint), never
    // case-specific material, so there is no case content to gate it on.
    available: () => true,
    props: (ctx, _persist) => ({
        t: ctx.t,
    }),
};
