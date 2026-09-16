/** Rounds an axis bound to a "nice" N-significant-figure number, for charts that pin min/max to a computed value. */

function magnitude(value: number, sigFigs: number): number {
    const abs = Math.abs(value);
    if (abs === 0) return 1;
    return Math.pow(10, Math.floor(Math.log10(abs)) - (sigFigs - 1));
}

/** Rounds away from zero. */
export function niceCeil(value: number, sigFigs = 2): number {
    if (!Number.isFinite(value)) return value;
    const m = magnitude(value, sigFigs);
    return Math.ceil(value / m) * m;
}

/** Rounds toward zero. */
export function niceFloor(value: number, sigFigs = 2): number {
    if (!Number.isFinite(value)) return value;
    const m = magnitude(value, sigFigs);
    return Math.floor(value / m) * m;
}
