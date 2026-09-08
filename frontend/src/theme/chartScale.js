/**
 * Round an axis bound to a "nice" 2-significant-figure number instead of a
 * raw computed value (e.g. 42343.234234) — ECharts only auto-generates nice
 * ticks when min/max are left unset, so charts that pin an axis to a
 * computed max need to round it themselves.
 */

function magnitude(value, sigFigs) {
    const abs = Math.abs(value);
    if (abs === 0) return 1;
    return Math.pow(10, Math.floor(Math.log10(abs)) - (sigFigs - 1));
}

/** Rounds away from zero, so an upper bound never clips the data it covers. */
export function niceCeil(value, sigFigs = 2) {
    if (!Number.isFinite(value)) return value;
    const m = magnitude(value, sigFigs);
    return Math.ceil(value / m) * m;
}

/** Rounds toward zero, so a lower bound never clips the data it covers. */
export function niceFloor(value, sigFigs = 2) {
    if (!Number.isFinite(value)) return value;
    const m = magnitude(value, sigFigs);
    return Math.floor(value / m) * m;
}
