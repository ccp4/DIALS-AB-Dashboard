import Chart from "../Chart";
import NoDataChart from "../NoDataChart";
import { tokens } from "../../theme/tokens";
import { STANDARD_DATA_ZOOM, summaryBoxGraphic } from "../../theme/chartChrome";
import { niceCeil } from "../../theme/chartScale";
import { abSummary } from "../../theme/abSummary";

/**
 * One B-against-A parity scatter per run, with an identity line, a linear fit
 * and a summary callout.
 *
 * Only datasets with a finite value for both variants are plotted; the count of
 * those that survive is reported in the callout as the denominator.
 *
 * @param {Object<string, Array<{label: string, A: number, B: number}>>} data
 *        Peak memory in MiB, keyed by run id.
 */
function MemoryABChart({ data }) {

    const memory = data ?? {};
    const runs = Object.keys(memory);

    if (!runs.length) return null;

    // A single run gets a bigger, dedicated chart; multiple runs share the grid.
    const chartStyle = runs.length === 1
        ? { height: tokens.chart.height.single, width: tokens.chart.width.single }
        : { height: tokens.chart.height.panel, width: "100%" };

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
                justifyItems: runs.length === 1 ? "center" : "stretch",
                gap: "20px",
            }}
        >
            {runs.map((run) => {
                const runData = memory[run] ?? [];

                const points = runData
                    .filter(d => Number.isFinite(d.A) && Number.isFinite(d.B))
                    .map(d => ({
                        value: [d.A, d.B],
                        label: d.label,
                        A: d.A,
                        B: d.B,
                    }));

                if (!points.length) {
                    return (
                        <NoDataChart
                            key={run}
                            title={`${run}: A vs B Memory per Dataset`}
                            message="No comparable datasets"
                            style={chartStyle}
                        />
                    );
                }

                const maxValue = niceCeil(Math.max(
                    ...points.flatMap(p => [p.A, p.B]),
                    1
                ));

                const { regression, text: regressionSummary } = abSummary(points, "lower");

                const identityLine = [];
                const step = Math.max(maxValue / 100, 1);

                for (let x = 0; x <= maxValue; x += step) {
                    identityLine.push([x, x]);
                }

                if (identityLine.at(-1)?.[0] !== maxValue) {
                    identityLine.push([maxValue, maxValue]);
                }

                const series = [
                    {
                        name: "x = y",
                        type: "line",
                        data: identityLine,
                        symbol: "none",
                        silent: true,
                        animation: false,
                        lineStyle: {
                            color: tokens.line.reference,
                            width: 1,
                            type: "dashed",
                        },
                        z: 0,
                    },
                    ...(regression ? [{
                        name: "Regression",
                        type: "line",
                        data: regression.points,
                        symbol: "none",
                        silent: true,
                        animation: false,
                        lineStyle: {
                            color: tokens.series[0],
                            width: 2,
                        },
                        z: 1,
                    }] : []),
                    {
                        name: run,
                        type: "scatter",
                        symbol: "circle",
                        symbolSize: 6,

                        itemStyle: {
                            color: tokens.ink.strong,
                            opacity: 0.7,
                        },

                        emphasis: {
                            scale: true,
                            itemStyle: {
                                opacity: 1,
                                borderColor: tokens.ink.strong,
                                borderWidth: 1,
                            },
                        },

                        data: points,
                        z: 2,
                    },
                ]

                const options = {
                    title: {
                        text: `${run}: A vs B Memory per Dataset`,
                        left: "center",
                    },

                        graphic: summaryBoxGraphic(regressionSummary),

                    tooltip: {
                        trigger: "item",
                        axisPointer: {
                            type: "cross",
                        },
                        formatter: params => {
                            const d = params.data;

                            return `
                                <b>${d.label}</b><br/>
                                A: ${d.A}<br/>
                                B: ${d.B}<br/>
                                Difference: ${(d.B - d.A).toFixed(3)}
                            `;
                        },
                    },

                    xAxis: {
                        type: "value",
                        name: "A (MiB)",
                        nameLocation: "middle",
                        nameGap: 30,
                        nameTextStyle: {
                            color: tokens.variant.A,
                            fontWeight: 600,
                        },
                        min: 0,
                        max: maxValue,
                        scale: true,
                    },

                    yAxis: {
                        type: "value",
                        name: "B (MiB)",
                        nameLocation: "middle",
                        nameGap: 50,
                        nameRotate: 90,
                        nameTextStyle: {
                            color: tokens.variant.B,
                            fontWeight: 600,
                        },
                        min: 0,
                        max: maxValue,
                        scale: true,
                    },

                    grid: {
                        containLabel: true,
                    },

                    dataZoom: STANDARD_DATA_ZOOM,

                    series
                };

                return (
                    <Chart
                        key={run}
                        option={options}
                        notMerge
                        lazyUpdate
                        style={chartStyle}
                    />
                );
            })}
        </div>
    );
}

export default MemoryABChart;
