import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Quaternion, Vector3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { baseUrl } from '../../config/api.js';
import { resolveAvatarId } from '../../utils/resolveAvatar.js';
import { resolveCamera } from '../../utils/avatarFraming.js';
import { VISEME_KEYS } from '../../utils/visemes.js';
import {
    ensureStudentPresenceListener,
    getStudentGaze,
    getGlanceOverride,
    faceGazeAngles,
} from '../oyon/studentPresence.js';

// --- Eye contact ------------------------------------------------------------
// Every head in the catalogue is eye-boned (LeftEye/RightEye on the RPM /
// avaturn / vroid / mpfb heads, "Bip01 LEye"/"Bip01 REye" on the whole rb_*
// family — verified across all 27 GLBs), so gaze is driven by BONE rotation,
// which works everywhere; the eyeLook* blendshapes exist on only 5 heads and
// are not used. Rotations are applied about WORLD axes (transformed into the
// bone's parent space) so the weird local axes of Bip01 rigs don't matter.
// NB: GLTFLoader sanitizes node names (PropertyBinding.sanitizeNodeName), so
// the GLB's "Bip01 REye" arrives as "Bip01_REye" — match the runtime form.
const EYE_BONE_NAMES = new Set(['LeftEye', 'RightEye', 'Bip01_LEye', 'Bip01_REye']);
const HEAD_BONE_NAMES = new Set(['Head', 'Bip01_Head']);
const HEAD_FOLLOW = 0.4;      // head turns this fraction of the eye angle
const GAZE_SMOOTHING = 6;     // 1/s — exponential ease toward the target

// --- Bone-driven face fallback ----------------------------------------------
// Every stock head is a RocketBox/TalkingHead conversion with a viseme
// blendshape rig (see manifest.json's _comment), so the morph-target path
// above is normally the only one that ever runs. A user-supplied GLB (e.g. a
// fan-rigged game character) may have NO blendshapes at all but still carry
// named face BONES the mesh is actually skinned to — jaw, eyelids — from an
// era of facial animation that predates blendshape rigs. Rather than leaving
// such a head frozen, drive those bones with the same `aimBone` used for eye
// gaze above (world-axis pitch), gated so it only ever activates when the
// blendshape path found nothing to drive — it can never fight a real rig.
// Matching is substring-based on a normalized (lowercased, non-alnum-stripped)
// name rather than an exact set, because bone names here are arbitrary
// modeler-authored strings ("head jaw_030"), not a fixed convention.
const normalizeBoneName = (name) => (name || '').toLowerCase().replace(/[^a-z]/g, '');
const isJawBone = (n) => n.includes('jaw');
const isUpperEyelidBone = (n) => n.includes('eyelid') && n.includes('upper');
const JAW_MAX_PITCH = 0.30;      // rad (~17°) — full "aa" mouth-open
const EYELID_CLOSE_PITCH = 0.35; // rad — enough to visibly close a lid of this size
// Rough "how open is the mouth for this viseme" weight, 0 (closed) – 1 (wide
// open). Consonant shapes (PP/FF/TH/DD/kk/CH/SS/nn/RR) keep the jaw mostly
// shut; vowels drive it open, "aa" most of all.
const VISEME_OPEN_WEIGHT = {
    viseme_sil: 0, viseme_PP: 0.1, viseme_FF: 0.15, viseme_TH: 0.25, viseme_DD: 0.3,
    viseme_kk: 0.3, viseme_CH: 0.2, viseme_SS: 0.15, viseme_nn: 0.2, viseme_RR: 0.3,
    viseme_aa: 1.0, viseme_E: 0.55, viseme_I: 0.35, viseme_O: 0.75, viseme_U: 0.45
};

const _parentQuat = new Quaternion();
const _deltaQuat = new Quaternion();
const _axis = new Vector3();

// Rotate `bone` from its rest pose by yaw (about world Y) and pitch (about
// world X), composing the world-axis rotations in the bone's parent space.
function aimBone(bone, rest, yaw, pitch) {
    bone.parent.getWorldQuaternion(_parentQuat).invert();
    _axis.set(0, 1, 0).applyQuaternion(_parentQuat);
    _deltaQuat.setFromAxisAngle(_axis, yaw);
    bone.quaternion.copy(rest).premultiply(_deltaQuat);
    _axis.set(1, 0, 0).applyQuaternion(_parentQuat);
    _deltaQuat.setFromAxisAngle(_axis, pitch);
    bone.quaternion.premultiply(_deltaQuat);
}

export function CameraAim({ pos, lookY, fov }) {
    const { camera } = useThree();
    const [px, py, pz] = pos;
    useEffect(() => {
        camera.position.set(px, py, pz);
        camera.lookAt(0, lookY, 0);
        // Bug 12 (16.5.2026): R3F applies the `camera={{ fov }}` prop only
        // at initial Canvas mount. Later FOV-slider changes re-render but
        // never reach the live camera, so the preview ignored FOV while a
        // fresh sim mount (new camera) appeared to honour it. Apply fov
        // here so the preview tracks the slider.
        if (typeof fov === 'number' && camera.fov !== fov) {
            camera.fov = fov;
        }
        camera.updateProjectionMatrix();
    }, [camera, px, py, pz, lookY, fov]);
    return null;
}

function HeadMesh({ url, visemesRef, blinkRef, patient }) {
    const { scene: original } = useGLTF(url);
    // Clone so multiple avatars sharing this URL don't fight over morph/bone
    // state. SkeletonUtils.clone (not Object3D.clone) because a naive clone
    // leaves SkinnedMeshes bound to the ORIGINAL skeleton — rotating the
    // cloned eye bones would move nothing.
    const scene = useMemo(() => SkeletonUtils.clone(original), [original]);

    const morphTargets = useRef([]);
    // { eyes: [{bone, rest}], head: {bone, rest} | null } — rest = the
    // authored pose quaternion the gaze offsets compose onto.
    const gazeRig = useRef(null);
    // Smoothed gaze state, eased toward the live target each frame.
    const gaze = useRef({ yaw: 0, pitch: 0 });
    // Bone-driven face fallback (see VISEME_OPEN_WEIGHT above): only
    // populated when the head has jaw/eyelid bones, only ever READ when
    // morphTargets.current is empty.
    const faceBonesRig = useRef(null);

    useEffect(() => {
        const targets = [];
        const eyes = [];
        let head = null;
        const jaw = [];
        const upperEyelids = [];
        scene.traverse((obj) => {
            if (obj.morphTargetDictionary && obj.morphTargetInfluences) {
                targets.push(obj);
            }
            if (obj.isBone && EYE_BONE_NAMES.has(obj.name)) {
                eyes.push({ bone: obj, rest: obj.quaternion.clone() });
            }
            if (obj.isBone && HEAD_BONE_NAMES.has(obj.name) && !head) {
                head = { bone: obj, rest: obj.quaternion.clone() };
            }
            if (obj.isBone) {
                const norm = normalizeBoneName(obj.name);
                if (isJawBone(norm)) jaw.push({ bone: obj, rest: obj.quaternion.clone() });
                else if (isUpperEyelidBone(norm)) upperEyelids.push({ bone: obj, rest: obj.quaternion.clone() });
            }
        });
        morphTargets.current = targets;
        gazeRig.current = { eyes, head };
        faceBonesRig.current = (jaw.length > 0 || upperEyelids.length > 0) ? { jaw, upperEyelids } : null;
    }, [scene]);

    // Three.js requires us to mutate the morphTargetInfluences array in-place;
    // the WebGL renderer reads it by reference each frame.
    /* eslint-disable react-hooks/immutability */
    useFrame((_, delta) => {
        const targets = morphTargets.current;
        const target = visemesRef.current || {};
        const blink = blinkRef.current ? 1 : 0;

        const decay = 8 * delta;
        const rise = 12 * delta;

        // Blendshape path — the normal case for every stock head. Skipped
        // (not an early `return`, so gaze and the bone fallback below still
        // run) when this GLB has no morph targets at all.
        for (const mesh of targets) {
            const dict = mesh.morphTargetDictionary;
            const infl = mesh.morphTargetInfluences;
            if (!dict || !infl) continue;

            for (const key of VISEME_KEYS) {
                const idx = dict[key];
                if (idx == null) continue;
                const want = target[key] || 0;
                const cur = infl[idx];
                infl[idx] = want > cur
                    ? Math.min(want, cur + rise)
                    : Math.max(want, cur - decay);
            }

            const lIdx = dict.eyeBlinkLeft ?? dict.eyesClosed;
            const rIdx = dict.eyeBlinkRight ?? dict.eyesClosed;
            if (lIdx != null) infl[lIdx] = blink;
            if (rIdx != null && rIdx !== lIdx) infl[rIdx] = blink;

            // Blend physiological pain and emotional facial expressions
            const painFactor = (window.__LUKAS_PATIENT_PAIN ?? (patient?.initialVitals?.conditions?.stElev ? 0.75 : 0.4));
            const anxietyFactor = (window.__LUKAS_PATIENT_ANXIETY ?? 0.6);

            const browDown = Math.min(0.85, painFactor * 0.8 + anxietyFactor * 0.2);
            const eyeSquint = Math.min(0.75, painFactor * 0.7);
            const browInnerUp = Math.min(0.7, anxietyFactor * 0.6);

            if (dict.browDownLeft != null) infl[dict.browDownLeft] = browDown;
            if (dict.browDownRight != null) infl[dict.browDownRight] = browDown;
            if (dict.browDown != null) infl[dict.browDown] = browDown;
            if (dict.eyeSquintLeft != null) infl[dict.eyeSquintLeft] = eyeSquint;
            if (dict.eyeSquintRight != null) infl[dict.eyeSquintRight] = eyeSquint;
            if (dict.browInnerUp != null) infl[dict.browInnerUp] = browInnerUp;
        }

        // Bone-driven face fallback — only for a head with no morph targets
        // at all (see the comment by VISEME_OPEN_WEIGHT above). Reuses
        // `aimBone`'s world-axis pitch, exactly like the eye/head gaze below,
        // so "open" always means "rotate forward/down" regardless of the
        // bone's own local axis conventions.
        if (targets.length === 0 && faceBonesRig.current) {
            let openness = 0;
            for (const key of VISEME_KEYS) {
                const w = target[key];
                if (w) openness += w * (VISEME_OPEN_WEIGHT[key] ?? 0);
            }
            openness = Math.min(1, openness);
            for (const { bone, rest } of faceBonesRig.current.jaw) {
                aimBone(bone, rest, 0, openness * JAW_MAX_PITCH);
            }
            for (const { bone, rest } of faceBonesRig.current.upperEyelids) {
                aimBone(bone, rest, 0, blink * EYELID_CLOSE_PITCH);
            }
        }

        // Gaze priority: a scripted glance (e.g. the patient checking his
        // monitor during an alarm) wins; otherwise follow the student's
        // movement (deviation from the adaptive eye-contact baseline) from
        // Oyon's per-frame stream. No signal → ease back to neutral eye
        // contact with the viewer.
        const rig = gazeRig.current;
        if (rig && rig.eyes.length > 0) {
            const override = getGlanceOverride();
            const snap = override ? null : getStudentGaze();
            let wantYaw = 0;
            let wantPitch = 0;
            if (override) {
                wantYaw = override.yaw;
                wantPitch = override.pitch;
            } else if (snap) {
                const a = faceGazeAngles(snap.dx, snap.dy);
                wantYaw = a.yaw;
                wantPitch = a.pitch;
            }
            const g = gaze.current;
            const ease = Math.min(1, GAZE_SMOOTHING * delta);
            g.yaw += (wantYaw - g.yaw) * ease;
            g.pitch += (wantPitch - g.pitch) * ease;
            for (const { bone, rest } of rig.eyes) {
                aimBone(bone, rest, g.yaw, g.pitch);
            }
            if (rig.head) {
                aimBone(rig.head.bone, rig.head.rest, g.yaw * HEAD_FOLLOW, g.pitch * HEAD_FOLLOW);
            }
        }
    });
    /* eslint-enable react-hooks/immutability */

    return <primitive object={scene} />;
}

// `avatarType` used to be a prop accepting "3d" / "head" / "none" — but the
// component never branched on "3d" vs "head" (both rendered the same R3F
// canvas), and the "none" kill-switch is now enforced at the parent level
// (PatientVisual short-circuits when voiceSettings.avatar_type === 'none'),
// so the prop has been removed. If you arrived here looking for it, stop
// passing it from new callsites.
export default function PatientAvatar({
    patient,
    speaking = false,
    listening = false,
    visemes = null,
    headManifest,
    avatarId = null,
    cameraOverride = null,
    platformAvatars = null
}) {
    const { t } = useTranslation('chat');
    // Per-frame state held in refs so prop churn doesn't re-trigger useFrame.
    const visemesRef = useRef({ viseme_sil: 1 });
    const blinkRef = useRef(false);
    const [_blinkTick, setBlinkTick] = useState(0);

    // Wire the document-level oyon:sample listener (idempotent singleton) so
    // the head can make eye contact whenever Oyon capture is running.
    useEffect(() => {
        ensureStudentPresenceListener();
    }, []);

    useEffect(() => {
        if (visemes) visemesRef.current = visemes;
    }, [visemes]);

    useEffect(() => {
        let cancelled = false;
        let timeoutId;
        const schedule = () => {
            const wait = 3500 + Math.random() * 2000;
            timeoutId = setTimeout(() => {
                if (cancelled) return;
                blinkRef.current = true;
                setBlinkTick(t => t + 1);
                setTimeout(() => {
                    if (cancelled) return;
                    blinkRef.current = false;
                    schedule();
                }, 130);
            }, wait);
        };
        schedule();
        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    if (!headManifest) return null;

    const filename = resolveAvatarId({
        avatarId,
        gender: patient?.gender,
        manifest: headManifest,
        platformAvatars,
        patient
    });
    if (!filename) {
        // Manifest is loaded but has no entries yet — show a neutral placeholder.
        return (
            <div className="w-full h-full rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-500 text-xs">
                {t('no_avatar_configured')}
            </div>
        );
    }

    const url = baseUrl(`/avatars/heads/${filename}`);
    const ringColor = listening ? '#22c55e' : speaking ? '#3b82f6' : 'transparent';
    const cam = resolveCamera(headManifest, filename, cameraOverride);

    return (
        <div
            className="w-full h-full rounded-full overflow-hidden bg-neutral-900 border border-neutral-700"
            style={{
                boxShadow: ringColor !== 'transparent'
                    ? `0 0 0 4px ${ringColor}, 0 0 24px ${ringColor}`
                    : 'none',
                transition: 'box-shadow 200ms'
            }}
        >
            <Canvas camera={{ position: cam.pos, fov: cam.fov }}>
                <CameraAim pos={cam.pos} lookY={cam.lookY} fov={cam.fov} />
                <ambientLight intensity={1.0} />
                <directionalLight position={[2, 3, 2]} intensity={1.2} />
                <Suspense fallback={null}>
                    <HeadMesh
                        key={url}
                        url={url}
                        visemesRef={visemesRef}
                        blinkRef={blinkRef}
                        patient={patient}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
