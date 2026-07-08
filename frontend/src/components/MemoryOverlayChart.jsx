import ReactECharts from "echarts-for-react";

function MemoryOverlayChart({ data }) {
    const runs = Object.keys(data);
    const metric = (A, B) => (A - B) ;

    if (!runs.length) {
        return null;
    }

    const sortedSeries = runs.map(run => {
        const sorted = (data[run] ?? [])
            .map(item => ({
                value: metric(item.A, item.B)
            }))
            .filter(item => Number.isFinite(item.value))
            .sort((a, b) => b.value - a.value);
        return {
            name: run,
            type: "line",
            showSymbol: false,
            data: sorted.map(item => item.value),
        };
    });

    const crossings = sortedSeries.map(series => {
        const index = series.data.findIndex(value => value < 0);
        return index === -1 ? Infinity : index;
    });

    const allNegativeRank = Math.max(...crossings);

    const maxLength = Math.max(
        ...runs.map(run => (data[run] ?? []).length)
    );

    const rankLabels = Array.from(
        { length: maxLength },
        (_, i) => i + 1
    );

    
    const series = [...sortedSeries];

    if (Number.isFinite(allNegativeRank)) {
        series[0].markLine = {
            symbol: "none",
            lineStyle: {
                type: "dashed",
                color: "red",
            },
            data: [
                { xAxis: rankLabels[allNegativeRank] }
            ]
        };
    }

    const options = {
        title: {
            text: "Overlay by Shape",
            left: "center",
        },
        tooltip: {
            trigger: "axis",
            axisPointer: { type: "cross" },
        },
        legend: {
            top: 30,
        },
        grid: {
            top: 90,
            left: 60,
            right: 30,
            bottom: 80,
        },
        xAxis: {
            type: "category",
            name: "Rank",
            data: rankLabels,
        },
        yAxis: {
            type: "value",
            name: "A - B",
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
            style={{
                height: 600,
                width: "100%",
            }}
        />
    );
}

export default MemoryOverlayChart;