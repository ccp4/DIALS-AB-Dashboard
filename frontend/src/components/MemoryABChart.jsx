import ReactECharts from "echarts-for-react";

function MemoryABChart({ data }) {
    const memory = data ?? {};
    const runs = Object.keys(memory);

    if (!runs.length) return null;

    const series = [];
    let globalMaxRank = 0;

    let xLabels = [];

    runs.forEach((run, runIndex) => {
        const runData = memory[run] ?? [];

        const sorted = [...runData]
            .filter(d => Number.isFinite(d.A) && Number.isFinite(d.B))
            .sort((a, b) => b.A - a.A);
        if (runIndex === 0) {
            xLabels = sorted.map(d => d.label);
        }

        globalMaxRank = Math.max(globalMaxRank, sorted.length);

        series.push(
            {
                name: `${run} A`,
                type: "line",
                showSymbol: false,
                data: sorted.map(d => ({
                    value: d.A,
                    label: d.label,
                    A: d.A,
                    B: d.B,
                })),
            },
            {
                name: `${run} B`,
                type: "line",
                showSymbol: false,
                data: sorted.map(d => ({
                    value: d.B,
                    label: d.label,
                    A: d.A,
                    B: d.B,
                })),
            }
        );
    });

    const options = {
        title: {
            text: "A vs B Data Set Distribution (Sorted by A)",
            left: "center",
        },

        tooltip: {
            trigger: "axis",
            axisPointer: { type: "cross" },
            formatter: params => {
                const d = params[0].data;

                const a = params.find(p => p.seriesName.endsWith(" A"))?.data?.value;
                const b = params.find(p => p.seriesName.endsWith(" B"))?.data?.value;

                return `
                    <b>${d.label}</b><br/>
                    A: ${a}<br/>
                    B: ${b}
                `;
            },
        },

        legend: {
            top: 30,
        },

        xAxis: {
            type: "category",
            data: xLabels,
            name: "Dataset (sorted by A)",
            axisLabel: {
                rotate: 45,
            },
        },

        yAxis: {
            type: "value",
        },

        dataZoom: [
            { type: "inside" },
            { type: "slider" },
        ],

        series,
    };

    return (
        <ReactECharts
            option={options}
            notMerge
            lazyUpdate
            style={{ height: 600, width: "60vw" }}
        />
    );
}

export default MemoryABChart;