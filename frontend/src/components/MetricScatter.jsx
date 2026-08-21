import { memo } from "react";

import EChartsStat from "echarts-stat";

import Chart from "./Chart";
import { tokens } from "../theme/tokens";
import { STANDARD_DATA_ZOOM } from "../theme/chartChrome";

import { formatValue, metricValue } from "../theme/metricFormat";

// Axis ticks need less precision than the raw data — an untruncated float
// (e.g. from a padded min/max) eats horizontal space and shrinks the plot.
function formatAxisTick(value) {
    if (Math.abs(value) >= 100) return value.toFixed(0);
    if (Math.abs(value) >= 10) return value.toFixed(1);
    return value.toFixed(2);
}

/**
 * One B-against-A parity scatter for a single cohort metric, with an
 * identity line, a linear fit and a summary callout.
 *
 * @param {object[]} rows Cohort rows (CohortResponse.rows).
 * @param {{key: string, label: string, unit: string, formatter: string, better: string|null}} metric
 * @param {object} [style] Passed straight to the underlying Chart.
 * @param {boolean} [enableZoom] Show the dataZoom slider — off by default so a
 *        small-multiples grid isn't squashed by it; the expanded (clicked-into) view turns it on.
 */
function MetricScatter({ rows, metric, style, enableZoom = false, onPointClick }) {
    const points = rows
        .map((row) => ({
            sampleId: `${row.dataset}/${row.sample}`,
            A: metricValue(row.A, metric.key),
            B: metricValue(row.B, metric.key),
        }))
        .filter((p) => Number.isFinite(p.A) && Number.isFinite(p.B));

    if (!points.length) {
        return (
            <Chart
                option={{
                    title: { text: metric.label, left: "center" },
                    graphic: [
                        {
                            type: "text",
                            left: "center",
                            top: "middle",
                            style: {
                                text: "No comparable samples",
                                fill: tokens.ink.muted,
                                font: `${tokens.font.size.label}px ${tokens.font.family}`,
                            },
                        },
                    ],
                }}
                style={style}
            />
        );
    }

    const allValues = points.flatMap((p) => [p.A, p.B]);
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const pad = (max - min) * 0.05 || Math.abs(max) * 0.05 || 1;
    const domainMin = min - pad;
    const domainMax = max + pad;

    const regression =
        points.length >= 2
            ? EChartsStat.regression("linear", points.map((p) => [p.A, p.B]))
            : null;

    const ratios = points
        .map((p) => p.B / p.A)
        .filter(Number.isFinite)
        .sort((a, b) => a - b);

    const median = ratios.length
        ? ratios.length % 2
            ? ratios[(ratios.length - 1) / 2]
            : (ratios[ratios.length / 2 - 1] + ratios[ratios.length / 2]) / 2
        : null;

    const betterCount =
        metric.better === "higher"
            ? points.filter((p) => p.B > p.A).length
            : metric.better === "lower"
                ? points.filter((p) => p.B < p.A).length
                : null;

    const summaryLines = [
        betterCount !== null ? `B better on ${betterCount} of ${points.length}` : null,
        median !== null ? `median B/A = ${median.toFixed(3)}` : null,
        regression ? `fit: ${regression.expression}` : null,
    ].filter(Boolean);

    const identityLine = [
        [domainMin, domainMin],
        [domainMax, domainMax],
    ];

    // The N points furthest from the parity line get a distinct colour
    // instead of a label — self-identifying without hovering, and without
    // the overlap risk a text label would have at this size (TODO 8.5).
    const OUTLIER_COUNT = 5;
    const outlierIds = new Set(
        [...points]
            .sort((a, b) => Math.abs(b.B - b.A) - Math.abs(a.B - a.A))
            .slice(0, OUTLIER_COUNT)
            .map((p) => p.sampleId)
    );

    const series = [
        {
            name: "x = y",
            type: "line",
            data: identityLine,
            symbol: "none",
            silent: true,
            animation: false,
            lineStyle: { color: tokens.line.reference, width: 1, type: "dashed" },
            z: 0,
        },
        ...(regression
            ? [
                  {
                      name: "Regression",
                      type: "line",
                      data: regression.points,
                      symbol: "none",
                      silent: true,
                      animation: false,
                      lineStyle: { color: tokens.series[0], width: 2 },
                      z: 1,
                  },
              ]
            : []),
        {
            name: metric.label,
            type: "scatter",
            symbol: "circle",
            symbolSize: 6,
            itemStyle: { color: tokens.ink.strong, opacity: 0.7 },
            emphasis: {
                scale: true,
                itemStyle: { opacity: 1, borderColor: tokens.ink.strong, borderWidth: 1 },
            },
            data: points.map((p) => ({
                value: [p.A, p.B],
                ...p,
                ...(outlierIds.has(p.sampleId)
                    ? { itemStyle: { color: tokens.series[1], opacity: 1 } }
                    : {}),
            })),
            z: 2,
        },
    ];

    const option = {
        title: { text: metric.label, left: "center" },

        // Grid view (no zoom): a plain band under the plot, never overlapping
        // data. Expanded view (zoom on): back to a boxed top-right overlay,
        // since the zoom slider needs the bottom of the chart instead.
        graphic: summaryLines.length
            ? enableZoom
                ? [
                      {
                          type: "group",
                          right: 20,
                          top: 40,
                          children: [
                              {
                                  type: "rect",
                                  shape: { width: 200, height: summaryLines.length * 20 + 10, r: 5 },
                                  style: {
                                      fill: tokens.surface.overlay,
                                      stroke: tokens.surface.border,
                                      lineWidth: 1,
                                      shadowBlur: 5,
                                      shadowColor: tokens.surface.border,
                                  },
                              },
                              {
                                  type: "text",
                                  left: 10,
                                  top: 5,
                                  style: {
                                      text: summaryLines.join("\n"),
                                      font: `${tokens.font.size.annotation}px ${tokens.font.family}`,
                                      fill: tokens.ink.base,
                                      lineHeight: 20,
                                  },
                              },
                          ],
                      },
                  ]
                : [
                      {
                          type: "text",
                          left: "center",
                          bottom: 4,
                          style: {
                              text: summaryLines.join("\n"),
                              font: `${tokens.font.size.annotation}px ${tokens.font.family}`,
                              fill: tokens.ink.base,
                              lineHeight: 16,
                              align: "center",
                          },
                      },
                  ]
            : undefined,

        tooltip: {
            trigger: "item",
            formatter: (params) => {
                const d = params.data;
                if (!d || d.A === undefined) return "";
                return `
                    <b>${d.sampleId}</b><br/>
                    A: ${formatValue(d.A, metric.formatter)}<br/>
                    B: ${formatValue(d.B, metric.formatter)}
                `;
            },
        },

        xAxis: {
            type: "value",
            name: "A",
            nameLocation: "middle",
            nameGap: 22,
            nameTextStyle: { color: tokens.variant.A, fontWeight: 600 },
            axisLabel: { formatter: formatAxisTick },
            min: domainMin,
            max: domainMax,
            scale: true,
        },

        yAxis: {
            type: "value",
            name: "B",
            nameLocation: "middle",
            nameGap: 32,
            nameTextStyle: { color: tokens.variant.B, fontWeight: 600 },
            axisLabel: { formatter: formatAxisTick },
            min: domainMin,
            max: domainMax,
            scale: true,
        },

        // Fixed, not containLabel, and never varies with this panel's own
        // content (tick label width, summary line count): every panel gets
        // the identical plot-box shape. Margins sized for the worst case (3
        // summary lines) so a panel with fewer just has blank space there
        // rather than a differently-shaped plot area. Expanded (zoom) swaps
        // top/bottom to match the graphic moving to the top-right and to
        // leave room at the bottom for the dataZoom slider.
        grid: enableZoom
            ? { left: 56, right: 20, top: 90, bottom: 70 }
            : { left: 56, right: 20, top: 44, bottom: 92 },
        dataZoom: enableZoom ? STANDARD_DATA_ZOOM : undefined,
        series,
    };

    return (
        <Chart
            option={option}
            notMerge
            lazyUpdate
            style={style}
            onEvents={{
                click: (params) => {
                    if (params.componentType !== "series" || params.seriesType !== "scatter") return;
                    params.event?.event?.stopPropagation();
                    onPointClick?.(params.data.sampleId);
                },
            }}
        />
    );
}

export default memo(MetricScatter);
