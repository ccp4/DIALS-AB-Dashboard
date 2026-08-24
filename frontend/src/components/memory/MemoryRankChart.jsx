import Chart from "../Chart";
import { tokens } from "../../theme/tokens";
import { STANDARD_DATA_ZOOM, STANDARD_LEGEND } from "../../theme/chartChrome";
import { variantSeriesStyle } from "../../theme/variant";

/**
 * Peak memory for every dataset, ranked high to low, with all selected runs on
 * shared axes.
 *
 * A and B are ranked independently, so rank i is generally a different dataset
 * in each series — the dataset name is therefore carried on the point and shown
 * in the tooltip rather than on the axis.
 *
 * Colour carries the variant and line style carries the run, since colour
 * cannot carry both.
 *
 * @param {Object<string, Array<{label: string, A: number, B: number}>>} data
 *        Peak memory in MiB, keyed by run id.
 */
function MemoryRankChart({ data }) {

    const memory = data ?? {};
    const runs = Object.keys(memory);

    if (!runs.length) return null;

    const series = [];

    let globalMaxRank = 0;

    runs.forEach((run, runIndex) => {

        const runData = memory[run] ?? [];

        const ranked = key => runData
            .filter(d => Number.isFinite(d[key]))
            .map(d => ({ value: d[key], dataset: d.label }))
            .sort((a, b) => b.value - a.value);

        const rankedA = ranked("A");
        const rankedB = ranked("B");

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
            text: "A vs B Peak Memory Distribution (All Runs)",
            left: "center",
        },

        tooltip: {
            trigger: "axis",
            axisPointer: { type: "cross" },
            formatter: params => {
                const rows = params
                    .filter(p => p.data)
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
            nameGap: 60,
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
                height: tokens.chart.height.panel,
                width: "100%",
            }}
        />
    );
}

export default MemoryRankChart;
