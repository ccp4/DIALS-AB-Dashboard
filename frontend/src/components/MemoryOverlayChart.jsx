import ReactECharts from "echarts-for-react";

function MemoryOverlayChart({ data }) {
    const runs = Object.keys(data);
    const metric = (A, B) => A - B;

    if (!runs.length) {
        return null;
    }

    const sortedSeries = runs.map(run => {
        const sorted = (data[run] ?? [])
            .map(item => ({
                value: metric(item.A, item.B),
                A: item.A,
                B: item.B,
                label: item.label,
            }))
            .filter(item => Number.isFinite(item.value))
            .sort((a, b) => b.value - a.value);

        return {
            name: run,
            type: "line",
            showSymbol: false,
            data: sorted,
        };
    });

    const crossings = sortedSeries.map(series => {
        const index = series.data.findIndex(item => item.value < 0);
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

    if (Number.isFinite(allNegativeRank) && series.length > 0) {
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
            formatter: params => {
                const rank = params[0].axisValue;

                let html = `<b>Rank ${rank}</b><br/><br/>`;

                params.forEach(p => {
                    const d = p.data;
                    html += `
                        ${p.marker}<b>${p.seriesName}</b><br/>
                        Dataset: ${d.label}<br/>
                        A: ${d.A}<br/>
                        B: ${d.B}<br/>
                        A - B: ${d.value}<br/><br/>
                    `;
                });

                return html;
            },
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