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
 * A `graphic` element's default `z` puts it *under* the grid, so splitlines
 * paint over any text it draws. `z: 1` lifts it clear of them while staying
 * below the series default of 2 — data still draws on top of the callout,
 * which is the wanted order: gridlines suppressed, points not hidden.
 */
const ABOVE_GRIDLINES = 1;

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
        z: ABOVE_GRIDLINES,
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
 * Position defaults to a bottom-right fit clear of a dataZoom slider, but is
 * overridable per call site.
 *
 * One `text` element rather than a rect with a text child: zrender draws a
 * text's `backgroundColor`/`border*`/`padding` as a box measured from the
 * glyphs themselves, so the box can't be wider than the text it holds. The
 * rect-plus-child version had to guess a width from the character count and
 * consistently guessed high.
 */
interface SummaryBoxOverrides {
    position?: Record<string, string | number>;
}

export function summaryBoxGraphic(text: string, { position = { right: "12%", bottom: "22%" } }: SummaryBoxOverrides = {}) {
    return [
        {
            type: "text",
            ...position,
            z: ABOVE_GRIDLINES,
            style: {
                text,
                font: `${tokens.font.size.label}px ${tokens.font.family}`,
                fill: tokens.ink.base,
                lineHeight: Math.round(tokens.font.size.label * 1.5),
                padding: 8,
                backgroundColor: tokens.surface.overlay,
                borderColor: tokens.brand.primary,
                borderWidth: 1.5,
                borderRadius: 5,
                shadowBlur: 5,
                shadowColor: tokens.surface.border,
            },
        },
    ];
}
