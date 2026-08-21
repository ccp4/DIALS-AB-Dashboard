export const FORMATTERS = {
    resolution: (v) => `${v.toFixed(2)} Å`,
    percent: (v) => `${v.toFixed(1)}%`,
    ratio: (v) => v.toFixed(3),
    mib: (v) => `${v.toFixed(0)} MiB`,
    seconds: (v) => `${v.toFixed(1)} s`,
};

export function formatValue(value, formatter) {
    const fn = FORMATTERS[formatter];
    return fn ? fn(value) : `${value}`;
}

// The 9 xia2-summary metrics are {overall, inner, outer}; peak_memory and
// cumulative_runtime are flat numbers. One accessor for both shapes.
export function metricValue(variant, key) {
    if (!variant) return null;
    const entry = variant[key];
    if (entry == null) return null;
    return typeof entry === "object" ? entry.overall : entry;
}
