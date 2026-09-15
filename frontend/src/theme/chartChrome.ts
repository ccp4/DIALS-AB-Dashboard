/**
 * The ECharts option fragments that are genuinely identical across charts,
 * rather than merely similar. Grid margins and tooltip formatters differ per
 * chart (they depend on axis name length and what the chart is showing) and
 * stay inline in the component — only literal duplicates live here.
 */

import { tokens } from "./tokens";
import { niceCeil } from "../utils/chartScale";

export const STANDARD_DATA_ZOOM = [
    { type: "inside" },
    { type: "slider" },
];

export const STANDARD_LEGEND = { top: 30 };

/**
 * The centred watermark drawn over an empty plot area — a chart with real
 * axes/legend but nothing plotted needs this to read as "waiting for a
 * selection" rather than "failed to load."
 */
export function noDataGraphic(text = "No data"): object[] {
    return [{
        type: "text",
        left: "center",
        top: "middle",
        style: {
            text,
            fill: tokens.ink.muted,
            font: `${tokens.font.size.title}px ${tokens.font.family}`,
        },
    }];
}

/**
 * The real-axes/identity-line shape for an empty A/B parity scatter, before
 * any run is selected — shared by `MemoryABChart`, `CC_halfOverallChart` and
 * `CumulativeTimeTaken`. `axisLabelFormatter`, if given, applies to both axes.
 */
interface ParityScatterSkeletonOptions {
    title: string;
    xName: string;
    yName: string;
    axisLabelFormatter?: (value: number) => string;
}

export function parityScatterSkeleton({ title, xName, yName, axisLabelFormatter }: ParityScatterSkeletonOptions) {
    const maxValue = niceCeil(1);
    const axisLabel = axisLabelFormatter ? { axisLabel: { formatter: axisLabelFormatter } } : {};

    return {
        title: { text: title, left: "center" },
        graphic: noDataGraphic(),
        xAxis: {
            type: "value",
            name: xName,
            nameLocation: "middle",
            nameGap: 30,
            nameTextStyle: { color: tokens.variant.A, fontWeight: 600 },
            min: 0,
            max: maxValue,
            ...axisLabel,
        },
        yAxis: {
            type: "value",
            name: yName,
            nameLocation: "middle",
            nameGap: 45,
            nameRotate: 90,
            nameTextStyle: { color: tokens.variant.B, fontWeight: 600 },
            min: 0,
            max: maxValue,
            ...axisLabel,
        },
        grid: { containLabel: true },
        series: [{
            name: "x = y",
            type: "line",
            data: [[0, 0], [maxValue, maxValue]],
            symbol: "none",
            silent: true,
            animation: false,
            lineStyle: { color: tokens.line.reference, width: 1, type: "dashed" },
        }],
    };
}

/**
 * The boxed regression-summary callout used by every A/B parity chart.
 * Position/width/style default to a bottom-right fit clear of a dataZoom
 * slider, but are overridable per call site. Height derives from `text`'s line count.
 */
interface SummaryBoxOverrides {
    position?: Record<string, string | number>;
    width?: number;
    style?: Record<string, unknown>;
}

export function summaryBoxGraphic(text: string, overrides: SummaryBoxOverrides = {}) {
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
