import Chart from "./Chart";
import { tokens } from "../theme/tokens";
import { STANDARD_DATA_ZOOM, STANDARD_LEGEND } from "../theme/chartChrome";
import { lineType, variantSeriesStyle } from "../theme/variant";

// Convert (1/d)^2 -> d
function invSqToD(v) {
    if (
        v == null ||
        Number.isNaN(v) ||
        v <= 0
    ) {
        return null;
    }

    return 1 / Math.sqrt(v);
}

function CC_halfOverallChart({ data }) {

    const memory = data ?? {};
    const runs = Object.keys(memory);

    if (!runs.length) return null;

    const series = [];
    const datasetUnion = new Set();

    runs.forEach((run, runIndex) => {

        const runData = memory[run] ?? { A: [], B: [] };

        const aLookup = Object.fromEntries(runData.A ?? []);
        const bLookup = Object.fromEntries(runData.B ?? []);

        // Best (highest inverse-square-d, i.e. best resolution) first.
        const sortKey = (dataset) => aLookup[dataset] ?? bLookup[dataset] ?? -Infinity;

        const datasets = Array.from(new Set([...Object.keys(aLookup), ...Object.keys(bLookup)]))
            .sort((a, b) => sortKey(b) - sortKey(a));

        const valuesA = [];
        const valuesB = [];
        const valuesDiff = [];

        datasets.forEach(dataset => {

            const aVal = aLookup[dataset] ?? null;
            const bVal = bLookup[dataset] ?? null;

            valuesA.push(aVal);
            valuesB.push(bVal);

            valuesDiff.push(
                aVal != null && bVal != null
                    ? aVal - bVal
                    : null
            );

            if (aVal == null || bVal == null) {
                console.warn(
                    `[CC_halfOverallChart] Missing d_min`,
                    { run, dataset, aVal, bVal }
                );
            }

            datasetUnion.add(dataset);
        });

        series.push({
            name: `${run} - A`,
            type: "line",
            yAxisIndex: 0,
            showSymbol: true,
            data: valuesA,
            ...variantSeriesStyle("A", runIndex),
        });

        series.push({
            name: `${run} - B`,
            type: "line",
            yAxisIndex: 0,
            showSymbol: true,
            data: valuesB,
            ...variantSeriesStyle("B", runIndex),
        });

        series.push({
            name: `${run} Δ`,
            type: "line",
            yAxisIndex: 1,
            showSymbol: true,
            data: valuesDiff,
            itemStyle: { color: tokens.series[0] },
            lineStyle: {
                color: tokens.series[0],
                type: lineType(runIndex),
                width: 2,
            },
            symbol: "diamond",
        });
    });

    const xAxis = Array.from(datasetUnion);

    const options = {
        title: {
            text: "CC½ Resolution and A−B Difference",
            left: "center",
        },

        tooltip: {
            trigger: "axis",
            axisPointer: {
                type: "cross",
            },
        },

        legend: STANDARD_LEGEND,

        xAxis: {
            type: "category",
            data: xAxis,
            name: "Dataset",
        },

        yAxis: [
            {
                type: "value",
                inverse: true,
                name: "Resolution (Å)",
                axisLabel: {
                    formatter: (value) => {
                        if (!Number.isFinite(value) || value <= 0) {
                            return "";
                        }

                        return invSqToD(value).toFixed(2);
                    }
                }
            },
            {
                type: "value",
                name: "Difference (Å⁻²)",
                position: "right",
                alignTicks: true,
                axisLine: {
                    show: true,
                },
                axisLabel: {
                    formatter: value => value.toFixed(3),
                }
            }
        ],

        dataZoom: STANDARD_DATA_ZOOM,

        series,
    };

    return (
        <Chart
            option={options}
            notMerge
            lazyUpdate
            style={{
                height: tokens.chart.height.tall,
                width: "70vw",
            }}
        />
    );
}

export default CC_halfOverallChart;