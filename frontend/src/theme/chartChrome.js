/**
 * The ECharts option fragments that are genuinely identical across charts,
 * rather than merely similar. Grid margins and tooltip formatters differ per
 * chart (they depend on axis name length and what the chart is showing) and
 * stay inline in the component — only literal duplicates live here.
 */

import { tokens } from "./tokens";

export const STANDARD_DATA_ZOOM = [
    { type: "inside" },
    { type: "slider" },
];

export const STANDARD_LEGEND = { top: 30 };

/**
 * The boxed regression-summary callout used by every A/B parity chart —
 * position/width/style default to the shape that fits a bottom-right corner
 * without colliding with a dataZoom slider, but all three are overridable
 * per call site (e.g. MetricScatter keeps its own top-right placement).
 * Height is derived from the number of lines in `text`, not hardcoded.
 */
export function summaryBoxGraphic(text, overrides = {}) {
    const {
        position = { right: "12%", bottom: "22%" },
        width = 150,
        style = {},
    } = overrides;

    const lineHeight = 20;
    const lines = text.split("\n").length;
    const height = lines * lineHeight + 10;

    return [
        {
            type: "group",
            ...position,
            children: [
                {
                    type: "rect",
                    shape: { width, height, r: 5 },
                    style: {
                        fill: tokens.surface.overlay,
                        stroke: tokens.brand.primary,
                        lineWidth: 1.5,
                        shadowBlur: 5,
                        shadowColor: tokens.surface.border,
                        ...style,
                    },
                },
                {
                    type: "text",
                    left: 10,
                    top: 10,
                    style: {
                        text,
                        font: `${tokens.font.size.annotation}px ${tokens.font.family}`,
                        fill: tokens.ink.base,
                        lineHeight,
                    },
                },
            ],
        },
    ];
}
