import React, { useRef } from "react";
import ReactECharts from "echarts-for-react";

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
                const chartRef = useRef(null);

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
                    ...points.flatMap(p => [
                        p.A,
                        p.B,
                    ]),
                    1
                );

                const updateReferenceLine = () => {
                    const chart = chartRef.current?.getEchartsInstance();

                    if (!chart) return;

                    const start = chart.convertToPixel(
                        {
                            xAxisIndex: 0,
                            yAxisIndex: 0,
                        },
                        [0, 0]
                    );

                    const end = chart.convertToPixel(
                        {
                            xAxisIndex: 0,
                            yAxisIndex: 0,
                        },
                        [maxValue, maxValue]
                    );

                    if (!start || !end) return;

                    chart.setOption({
                        graphic: [
                            {
                                id: "identity-line",
                                type: "line",
                                shape: {
                                    x1: start[0],
                                    y1: start[1],
                                    x2: end[0],
                                    y2: end[1],
                                },
                                style: {
                                    stroke: "#999",
                                    lineWidth: 1,
                                    lineDash: [5, 5],
                                },
                                silent: true,
                            },
                        ],
                    });
                };

                const onEvents = {
                    datazoom: updateReferenceLine,
                };

                const options = {
                    title: {
                        text: `${run}: A vs B`,
                        left: "center",
                    },

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

                    series: [
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
                        },
                    ],

                    graphic: [],
                };

                return (
                    <ReactECharts
                        key={run}
                        ref={chartRef}
                        option={options}
                        onChartReady={updateReferenceLine}
                        onEvents={onEvents}
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