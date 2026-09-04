/**
 * Reference library plugin manifest — RPS-1.
 *
 * A read-only browsing room, not a case-scoped one: it does not author or
 * grade anything, it just lets a student look through the platform's
 * catalogues (pathology slides, radiology studies) as study material,
 * independent of whatever the active case configured. That is why it
 * requests no capabilities beyond what it needs to render (none — it reads
 * other plugins' already-public endpoints and the open radiology catalogue
 * directly) and declares no `authoring` block: there is nothing here for an
 * educator to author, only a room that opens the same way for every case.
 *
 * `available: () => true` (the registry's own default, so it is not even
 * declared here) is deliberate: unlike a plugin whose room depends on case
 * material, this one shows up in every session regardless of what the case
 * configures — see PluginRoom.jsx's mount and RoomNavigator.jsx's nav list.
 */
export const REFERENCE_LIBRARY_ROOM = 'reference_library';

export const manifest = {
    id: REFERENCE_LIBRARY_ROOM,
    version: '1.0.0',
    room: {
        key: REFERENCE_LIBRARY_ROOM,
        labelKey: 'room_reference_library',
        subKey: 'room_reference_library_sub',
        icon: 'BookOpen',
        // Neutral slate, not a diagnostic accent (fuchsia/indigo/teal are
        // pathology/PACS/ECG) — this room is study material, never a live
        // clinical reading a case's findings could be mistaken for.
        accent: 'slate',
        // After every clinical room (pathology is 50, PACS/radiology sit
        // earlier) — a reference shelf belongs at the end of the dock.
        order: 60,
    },
    // No events of its own — a pure read-only browse room emits nothing
    // beyond what App.jsx already logs for room navigation. Declared
    // explicitly (not just `{}`) to match every other manifest's shape,
    // since some client code reads `vocabulary.verbs` without a fallback.
    vocabulary: { verbs: {}, objectTypes: {}, components: {} },
    capabilities: [],
    minRole: 'student',
};

export default manifest;
