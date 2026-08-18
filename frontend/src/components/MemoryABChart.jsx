import ReactECharts from "echarts-for-react";
import EChartsStat from "echarts-stat";

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

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
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

                const maxValue = Math.max(
                    ...points.flatMap(p => [p.A, p.B]),
                    1
                );

                const regression = EChartsStat.regression(
                "linear",
                points.map((p) => [p.A, p.B])
                );

                const regressionLine = regression.points;

                const ratios = points
                    .map(p => p.B / p.A)
                    .filter(Number.isFinite)
                    .sort((a, b) => a - b);

                const median = ratios.length
                    ? ratios.length % 2
                        ? ratios[(ratios.length - 1) / 2]
                        : (ratios[ratios.length / 2 - 1] + ratios[ratios.length / 2]) / 2
                    : null;

                const bSmaller = points.filter(p => p.B < p.A).length;

                const regressionSummary =
                    `B smaller on ${bSmaller} of ${points.length}` +
                    `${median !== null ? `\nmedian B/A = ${median.toFixed(3)}` : ""}` +
                    `\nfit: ${regression.expression}`;

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
                            color: "#999",
                            width: 1,
                            type: "dashed",
                        },
                        z: 0,
                    },
                    {
                        name: "Regression",
                        type: "line",
                        data: regressionLine,
                        symbol: "none",
                        silent: true,
                        animation: false,
                        lineStyle: {
                            color: "#d62728",
                            width: 2,
                        },
                        z: 1,
                    },
                    {
                        name: run,
                        type: "scatter",
                        symbol: "circle",
                        symbolSize: 6,

                        itemStyle: {
                            opacity: 0.55,
                        },

                        emphasis: {
                            scale: true,
                            itemStyle: {
                                opacity: 1,
                                borderColor: "#000",
                                borderWidth: 1,
                            },
                        },

                        data: points,
                        z: 2,
                    },
                ]

                const options = {
                    title: {
                        text: `${run}: A vs B`,
                        left: "center",
                    },

                        graphic: [
                        {
                            type: "group",
                            right: 20,
                            top: 200,
                            children: [
                                {
                                    type: "rect",
                                    shape: {
                                        width: 220,
                                        height: 80,
                                        r: 5,
                                    },
                                    style: {
                                        fill: "rgba(255,255,255,0.85)",
                                        stroke: "#ccc",
                                        lineWidth: 1,
                                        shadowBlur: 5,
                                        shadowColor: "rgba(0,0,0,0.1)",
                                    },
                                },
                                {
                                    type: "text",
                                    left: 10,
                                    top: 10,
                                    style: {
                                        text: regressionSummary,
                                        font: "14px sans-serif",
                                        fill: "#333",
                                        lineHeight: 20,
                                    },
                                },
                            ],
                        },
                    ],

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
                        name: "A",
                        nameLocation: "middle",
                        nameGap: 30,
                        min: 0,
                        max: maxValue,
                        scale: true,
                    },

                    yAxis: {
                        type: "value",
                        name: "B",
                        nameLocation: "middle",
                        nameGap: 40,
                        min: 0,
                        max: maxValue,
                        scale: true,
                    },

                    grid: {
                        containLabel: true,
                    },

                    dataZoom: [
                        {
                            type: "inside",
                        },
                        {
                            type: "slider",
                        },
                    ],

                    series
                };

                return (
                    <ReactECharts
                        key={run}
                        option={options}
                        notMerge
                        lazyUpdate
                        style={{
                            height: 450,
                            width: "100%",
                        }}
                    />
                );
            })}
        </div>
    );
}

export default MemoryABChart;
