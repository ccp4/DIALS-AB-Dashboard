import Chart from "../Chart";
import { tokens } from "../../theme/tokens";
import { STANDARD_DATA_ZOOM, STANDARD_LEGEND, noDataGraphic } from "../../theme/chartChrome";
import { variantSeriesStyle } from "../../theme/variant";
import type { MemoryRow } from "./MemoryABChart";

interface RankedPoint {
    value: number | null;
    dataset: string;
}

interface TooltipParam {
    marker: string;
    seriesName: string;
    axisValue: string | number;
    data: RankedPoint;
}

interface MemoryRankChartProps {
    data: Record<string, MemoryRow[]>;
    ranking?: "independent" | "matched";
}

/**
 * Peak memory for every dataset, ranked high to low, with all selected runs
 * on shared axes.
 *
 * Independent ranking (default): A and B are ranked separately, so rank i is
 * generally a different dataset in each series. Matched ranking: B follows
 * A's order dataset-for-dataset instead, with a gap where B is missing, so
 * you can read off a per-dataset A/B difference at the cost of B's own line
 * no longer being sorted.
 *
 * Colour carries the variant, line style carries the run.
 */
function MemoryRankChart({ data, ranking = "independent" }: MemoryRankChartProps) {
    const runs = Object.keys(data);

    const series: Record<string, unknown>[] = [];

    // No run selected — an empty A/B legend still shows what this chart
    // compares, rather than a bare axis with nothing to explain it.
    if (!runs.length) {
        series.push(
            { name: "A", type: "line", showSymbol: false, data: [], ...variantSeriesStyle("A", 0) },
            { name: "B", type: "line", showSymbol: false, data: [], ...variantSeriesStyle("B", 0) },
        );
    }

    let globalMaxRank = 0;

    runs.forEach((run, runIndex) => {
        const runData = data[run]!;

        let rankedA: RankedPoint[], rankedB: RankedPoint[];

        if (ranking === "matched") {
            const orderedByA = runData
                .filter(d => Number.isFinite(d.A))
                .sort((a, b) => b.A! - a.A!);

            rankedA = orderedByA.map(d => ({ value: d.A, dataset: d.label }));
            rankedB = orderedByA.map(d => ({
                value: Number.isFinite(d.B) ? d.B : null,
                dataset: d.label,
            }));
        } else {
            const ranked = (key: "A" | "B") => runData
                .filter(d => Number.isFinite(d[key]))
                .map(d => ({ value: d[key], dataset: d.label }))
                .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

            rankedA = ranked("A");
            rankedB = ranked("B");
        }

        globalMaxRank = Math.max(globalMaxRank, rankedA.length, rankedB.length);

        series.push(
            {
                name: `${run} A`,
                type: "line",
                showSymbol: false,
                data: rankedA,
                ...variantSeriesStyle("A", runIndex),
            },
            {
                name: `${run} B`,
                type: "line",
                showSymbol: false,
                data: rankedB,
                ...variantSeriesStyle("B", runIndex),
            }
        );
    });

    const ranks = Array.from(
        { length: globalMaxRank },
        (_, i) => i + 1
    );

    const options = {
        title: {
            text: "A vs B Peak Memory Distribution",
            left: "center",
        },

        graphic: runs.length ? undefined : noDataGraphic(),

        tooltip: {
            trigger: "axis",
            axisPointer: { type: "cross" },
            formatter: (params: TooltipParam[]) => {
                const rows = params
                    .filter(p => p.data && p.data.value != null)
                    .map(p =>
                        `${p.marker}${p.seriesName}: ${p.data.dataset}` +
                        ` — ${p.data.value!.toFixed(0)} MiB`
                    )
                    .join("<br/>");

                if (!rows) return "";

                return `<b>Rank ${params[0]!.axisValue}</b><br/>${rows}`;
            },
        },

        legend: STANDARD_LEGEND,

        grid: {
            top: 90,
            left: 70,
            right: 30,
            bottom: 80,
        },

        xAxis: {
            type: "category",
            data: ranks,
            name: "Rank (High → Low)",
            nameLocation: "middle",
            nameGap: 30,
        },

        yAxis: {
            type: "value",
            name: "Peak memory (MiB)",
            nameLocation: "middle",
            nameGap: 45,
            nameRotate: 90,
        },

        dataZoom: STANDARD_DATA_ZOOM,

        series
    };

    return (
        <Chart
            option={options}
            notMerge
            lazyUpdate
            style={{
                width: tokens.chart.width.main,
                height: tokens.chart.height.tall,
            }}
        />
    );
}

export default MemoryRankChart;
