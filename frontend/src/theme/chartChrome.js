/**
 * The ECharts option fragments that are genuinely identical across charts,
 * rather than merely similar. Grid margins and tooltip formatters differ per
 * chart (they depend on axis name length and what the chart is showing) and
 * stay inline in the component — only literal duplicates live here.
 */

export const STANDARD_DATA_ZOOM = [
    { type: "inside" },
    { type: "slider" },
];

export const STANDARD_LEGEND = { top: 30 };
