import { memo } from "react";
import type { CSSProperties } from "react";

import Chart from "../Chart";
import { tokens } from "../../theme/tokens";
import { STANDARD_DATA_ZOOM, summaryBoxGraphic, noDataGraphic } from "../../theme/chartChrome";
import { niceCeil, niceFloor } from "../../utils/chartScale";
import { abSummary } from "../../utils/abSummary";

import { formatValue, metricValue } from "../../utils/metricFormat";
import type { MetricVariant } from "../../utils/metricFormat";

interface CohortRow {
    dataset: string;
    sample: string;
    A: MetricVariant | null;
    B: MetricVariant | null;
}

interface Metric {
    key: string;
    label: string;
    formatter: string;
    better: "higher" | "lower" | null;
}

interface RawPoint {
    sampleId: string;
    A: number | null;
    B: number | null;
}

interface ScatterPoint {
    sampleId: string;
    A: number;
    B: number;
}

interface ItemTooltipParam {
    data?: ScatterPoint;
}

interface ClickParam {
    componentType: string;
    seriesType?: string;
    data: ScatterPoint;
    event?: { event?: { stopPropagation: () => void } };
}

interface MetricScatterProps {
    rows: CohortRow[];
    metric: Metric;
    style?: CSSProperties;
    /** Show the dataZoom slider — off by default so a small-multiples grid isn't squashed by it. */
    enableZoom?: boolean;
    onPointClick?: (sampleId: string) => void;
}

// Axis ticks need less precision than the raw data — an untruncated float
// (e.g. from a padded min/max) eats horizontal space and shrinks the plot.
function formatAxisTick(value: number): string {
    if (Math.abs(value) >= 100) return value.toFixed(0);
    if (Math.abs(value) >= 10) return value.toFixed(1);
    return value.toFixed(2);
}

/**
 * One B-against-A parity scatter for a single cohort metric, with an
 * identity line, a linear fit and a summary callout.
 */
function MetricScatter({ rows, metric, style, enableZoom = false, onPointClick }: MetricScatterProps) {
    const rawPoints: RawPoint[] = rows.map((row) => ({
        sampleId: `${row.dataset}/${row.sample}`,
        A: metricValue(row.A, metric.key),
        B: metricValue(row.B, metric.key),
    }));

    const points: ScatterPoint[] = rawPoints.filter(
        (p): p is ScatterPoint => Number.isFinite(p.A) && Number.isFinite(p.B)
    );

    // No rows and "nothing comparable" share the same skeleton, with a default domain.
    const allValues = points.flatMap((p) => [p.A, p.B]);
    const min = points.length ? Math.min(...allValues) : 0;
    const max = points.length ? Math.max(...allValues) : 1;
    const pad = (max - min) * 0.05 || Math.abs(max) * 0.05 || 1;
    const domainMin = niceFloor(min - pad);
    const domainMax = niceCeil(max + pad);

    const { regression, lines: summaryLines } = points.length
        ? abSummary(points, metric.better)
        : { regression: null, lines: [] as string[] };

    const identityLine = [
        [domainMin, domainMin],
        [domainMax, domainMax],
    ];

    // The N points furthest from parity get a distinct colour instead of a
    // label — avoids the overlap risk a text label would have at this size.
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

        // Grid view: bottom-centered, clear of the plot's own corner. Expanded
        // view: bottom-right — summaryBoxGraphic's default offset already
        // clears the dataZoom slider.
        graphic: !points.length
            ? noDataGraphic()
            : summaryLines.length
                ? enableZoom
                    ? summaryBoxGraphic(summaryLines.join("\n"))
                    : summaryBoxGraphic(summaryLines.join("\n"), {
                          position: { left: "center", bottom: 4 },
                          width: 200,
                      })
                : undefined,

        tooltip: {
            trigger: "item",
            formatter: (params: ItemTooltipParam) => {
                const d = params.data;
                if (!d) return "";
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

        // Fixed margins, not containLabel, so every panel gets an identical
        // plot-box shape regardless of tick/summary length. Sized for the
        // worst case (3 summary lines); expanded (zoom) needs extra bottom room.
        grid: enableZoom
            ? { left: 56, right: 20, top: 44, bottom: 110 }
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
                click: (params: ClickParam) => {
                    if (params.componentType !== "series" || params.seriesType !== "scatter") return;
                    params.event?.event?.stopPropagation();
                    onPointClick?.(params.data.sampleId);
                },
            }}
        />
    );
}

export default memo(MetricScatter);
