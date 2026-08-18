
import React from "react";
import ReactECharts from "echarts-for-react";
import EChartsStat from "echarts-stat";

function MemoryABChart({ data }) {

    const memory = data ?? {};
    const runs = Object.keys(memory);

    if (!runs.length) return null;

    // ---------------------------------------
    // Build series across ALL runs
    // ---------------------------------------
    const series = [];

    let globalMaxRank = 0;

    const labels = []

    runs.forEach(run => {

        const runData = memory[run] ?? [];

        const sortedA = runData
            .map(d => d.A)
            .filter(Number.isFinite)
            .sort((a, b) => b - a);

        const sortedB = runData
            .map(d => d.B)
            .filter(Number.isFinite)
            .sort((a, b) => b - a);
        
        labels.push(runData.map(d => d.label));

        globalMaxRank = Math.max(globalMaxRank, sortedA.length, sortedB.length);

        const ranks = Array.from(
            { length: Math.max(sortedA.length, sortedB.length) },
            (_, i) => i + 1
        );

        series.push(
            {
                name: `${run} A`,
                type: "line",
                showSymbol: false,
                data: ranks.map(i => sortedA[i - 1] ?? null),
            },
            {
                name: `${run} B`,
                type: "line",
                showSymbol: false,
                data: ranks.map(i => sortedB[i - 1] ?? null),
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
            text: "A vs B Data Set Distribution (All Runs)",
            left: "center",
        },

        tooltip: {
            trigger: "axis",
            axisPointer: { type: "cross" },
        },

        legend: {
            top: 30,
        },

        xAxis: {
            type: "category",
            data: labels[0],
            name: "Rank (High → Low)",
        },

        yAxis: {
            type: "value",
        },

        dataZoom: [
            { type: "inside" },
            { type: "slider" },
        ],

        series
    };

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
                const [[x1, y1], [x2, y2]] = regression.points;
                const slope = regression.parameter.gradient;
                const intercept = regression.parameter.intercept;
                const regressionSummary =
                    `${slope >= 1 ? "B is larger" : "B is smaller"} than A by ` +
                    `${Math.abs((slope - 1) * 100).toFixed(2)}%` +
                    `${Math.abs(intercept) > 0.01
                        ? `\nOffset: ${intercept >= 0 ? "+" : ""}${intercept.toFixed(2)} units`
                        : ""}` +
                    `\n${regression.expression}`;

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