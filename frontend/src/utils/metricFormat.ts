export const FORMATTERS: Record<string, (v: number) => string> = {
    resolution: (v) => `${v.toFixed(2)} Å`,
    percent: (v) => `${v.toFixed(1)}%`,
    ratio: (v) => v.toFixed(3),
    mib: (v) => `${v.toFixed(0)} MiB`,
    seconds: (v) => `${v.toFixed(1)} s`,
};

export function formatValue(value: number, formatter: string): string {
    const fn = FORMATTERS[formatter];
    return fn ? fn(value) : `${value}`;
}

export type ShellValue = { overall: number; inner: number; outer: number };
export type MetricEntry = number | ShellValue;
export type MetricVariant = Record<string, MetricEntry>;

/** Handles both metric shapes: `{overall, inner, outer}` and flat numbers. */
export function metricValue(variant: MetricVariant | null | undefined, key: string): number | null {
    if (!variant) return null;
    const entry = variant[key];
    if (entry == null) return null;
    return typeof entry === "object" ? entry.overall : entry;
}
