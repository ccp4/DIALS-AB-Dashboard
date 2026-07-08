import ReactECharts from "echarts-for-react";

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
        <ReactECharts
            option={options}
            notMerge
            lazyUpdate
            style={{ height: 600, width: "60vw" }}
        />
    );
}

export default MemoryABChart;