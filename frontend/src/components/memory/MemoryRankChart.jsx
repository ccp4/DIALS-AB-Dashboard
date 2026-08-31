import Chart from "../Chart";
import { tokens } from "../../theme/tokens";
import { STANDARD_DATA_ZOOM, STANDARD_LEGEND } from "../../theme/chartChrome";
import { variantSeriesStyle } from "../../theme/variant";

/**
 * Peak memory for every dataset, ranked high to low, with all selected runs on
 * shared axes.
 *
 * Independent ranking (default): A and B are ranked separately, so rank i is
 * generally a different dataset in each series. Matched ranking: B follows
 * A's order dataset-for-dataset instead, with a gap where B is missing, so
 * you can read off a per-dataset A/B difference at the cost of B's own line
 * no longer being sorted.
 *
 * The dataset name is carried on the point and shown in the tooltip rather
 * than on the axis. Colour carries the variant and line style carries the
 * run, since colour cannot carry both.
 *
 * @param {Object<string, Array<{label: string, A: number, B: number}>>} data
 *        Peak memory in MiB, keyed by run id.
 * @param {"independent"|"matched"} ranking
 */
function MemoryRankChart({ data, ranking = "independent" }) {

    const memory = data ?? {};
    const runs = Object.keys(memory);

    if (!runs.length) return null;

    const series = [];

    let globalMaxRank = 0;

    runs.forEach((run, runIndex) => {

        const runData = memory[run] ?? [];

        let rankedA, rankedB;

        if (ranking === "matched") {
            const orderedByA = runData
                .filter(d => Number.isFinite(d.A))
                .sort((a, b) => b.A - a.A);

            rankedA = orderedByA.map(d => ({ value: d.A, dataset: d.label }));
            rankedB = orderedByA.map(d => ({
                value: Number.isFinite(d.B) ? d.B : null,
                dataset: d.label,
            }));
        } else {
            const ranked = key => runData
                .filter(d => Number.isFinite(d[key]))
                .map(d => ({ value: d[key], dataset: d.label }))
                .sort((a, b) => b.value - a.value);

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

    // shared rank axis (largest needed)
    const ranks = Array.from(
        { length: globalMaxRank },
        (_, i) => i + 1
    );

    const options = {
        title: {
            text: "A vs B Peak Memory Distribution",
            left: "center",
        },

        tooltip: {
            trigger: "axis",
            axisPointer: { type: "cross" },
            formatter: params => {
                const rows = params
                    .filter(p => p.data && p.data.value != null)
                    .map(p =>
                        `${p.marker}${p.seriesName}: ${p.data.dataset}` +
                        ` — ${p.data.value.toFixed(0)} MiB`
                    )
                    .join("<br/>");

                if (!rows) return "";

                return `<b>Rank ${params[0].axisValue}</b><br/>${rows}`;
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
