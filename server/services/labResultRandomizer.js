// Per-session variation for lab results (Lukas 1.0 exam realism pass).
//
// A case's case_investigations row is authored once and shared by every
// session that plays the case, so a fixed `current_value` means every
// student sees the identical number every time. This module turns that
// single authored value into a distribution and draws one sample per
// session (server/services/sessionLabResults.js does the freezing).
//
// Draws never cross the authored classification: an abnormal-high lab
// always samples strictly above max_value, an abnormal-low lab always
// samples strictly below min_value, and a normal lab always samples inside
// [min_value, max_value]. The point is realistic variety and rare extremes
// within the case's clinical intent, never a chance of contradicting it.

// Coarsest-first: the first tier whose `min` the value clears wins.
const MAGNITUDE_ROUNDING = [
    { min: 1000, step: 10 },
    { min: 100, step: 1 },
    { min: 10, step: 0.1 },
    { min: 0, step: 0.01 },
];

function roundToMagnitude(value) {
    const tier = MAGNITUDE_ROUNDING.find((t) => Math.abs(value) >= t.min);
    const rounded = Math.round(value / tier.step) * tier.step;
    // Math.round(v / 0.1) * 0.1 lands on binary-float noise like
    // 28.200000000000003 — go through toFixed to land on the decimal the
    // step actually implies (0 for step >= 1, else its own decimal count).
    const decimals = tier.step >= 1 ? 0 : tier.step.toString().split('.')[1].length;
    return Number(rounded.toFixed(decimals));
}

function uniform(low, high) {
    return high <= low ? low : low + Math.random() * (high - low);
}

// Averaging three uniform draws approximates a distribution concentrated at
// the midpoint, without pulling in a stats library.
function triangular(low, high) {
    const t = (Math.random() + Math.random() + Math.random()) / 3;
    return low + t * (high - low);
}

// 70% of draws land close to the authored target, 25% land moderately
// further out, 5% land in a rare, large excursion — "extremely high/low is
// rare" without a probability library. `from`/`to` are fractions of the
// clinical excess (how far past the normal boundary the authored target
// already sits).
const SEVERITY_BANDS = [
    { weight: 0.70, from: -0.15, to: 0.15 },
    { weight: 0.25, from: 0.15, to: 0.60 },
    { weight: 0.05, from: 0.60, to: 1.50 },
];

function pickBand() {
    const roll = Math.random();
    let acc = 0;
    for (const band of SEVERITY_BANDS) {
        acc += band.weight;
        if (roll <= acc) return band;
    }
    return SEVERITY_BANDS[SEVERITY_BANDS.length - 1];
}

/**
 * Roll one session's value for a lab whose case-authored range/target are
 * `min_value`/`max_value`/`current_value`/`is_abnormal`.
 */
export function rollLabValue({ min_value, max_value, current_value, is_abnormal } = {}) {
    const min = Number.isFinite(min_value) ? min_value : null;
    const max = Number.isFinite(max_value) ? max_value : null;
    const target = Number.isFinite(current_value) ? current_value : null;

    if (min == null || max == null) {
        // No authored range to sample within/around — nothing safe to vary.
        return target;
    }

    if (!is_abnormal) {
        return roundToMagnitude(triangular(min, max));
    }

    const width = Math.max(max - min, Math.abs(target ?? 0) * 0.1, 1e-6);
    const isLow = target != null ? target < min : false;
    const anchor = isLow ? min : max;
    // Distance the authored target already sits past the normal boundary;
    // falls back to a slice of the range width when the target is missing
    // or (a defensive case) sits inside the normal range despite being
    // flagged abnormal.
    const rawExcess = target != null ? Math.abs(target - anchor) : width * 0.2;
    const excess = Math.max(rawExcess, width * 0.05);

    const band = pickBand();
    // Sign convention: for a high-abnormal lab, more-positive spread means
    // more severe (further above target); for a low-abnormal lab it's
    // mirrored, so spread is subtracted instead of added.
    const spread = uniform(band.from, band.to) * excess;
    const base = target != null ? target : anchor + (isLow ? -excess : excess);
    let value = isLow ? base - spread : base + spread;

    // `excess` is an ABSOLUTE distance (target to boundary), which for a
    // low-count lab whose normal floor is far above zero (platelets:
    // target 38,000 vs. a 150,000 floor — excess 112,000, larger than the
    // target itself) can make the severe/extreme bands subtract more than
    // the target is worth, landing on a physically impossible negative
    // count. Cap the downward move at 85% of the base value itself; the
    // lenient side of the typical band (spread < 0, i.e. less severe than
    // target) is untouched since it moves away from zero, not toward it.
    if (isLow && spread > 0) {
        const maxDrop = Math.max(base, 0) * 0.85;
        value = base - Math.min(spread, maxDrop);
    }

    // However small the band roll, never let a draw fall back inside the
    // normal range — the classification the case was authored with is not
    // negotiable, only its magnitude is.
    const margin = Math.max(width * 0.02, 1e-6);
    value = isLow ? Math.min(value, min - margin) : Math.max(value, max + margin);

    // Universal backstop: no lab value is ever negative, regardless of unit.
    value = Math.max(value, 0);

    return roundToMagnitude(value);
}
