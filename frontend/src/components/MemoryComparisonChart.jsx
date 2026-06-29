import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { Button } from "@mui/material";

function MemoryComparisonChart({ data }) {
    const apiURL = "http://localhost:8000";

    const memoryData = data
    const runs = Object.keys(memoryData)
    const [sortMode, setSortMode] = useState(false);


    if (!runs?.length) {
        return null;
    }

    const firstRunData = memoryData[runs[0]] ?? [];

    const chartData = sortMode
        ? [...firstRunData].sort(
              (a, b) => (b.A - b.B) - (a.A - a.B)
          )
        : firstRunData;

    const labels = chartData.map(d => d.label);

    const series = runs.map(run => {
        const runData = memoryData[run] ?? [];

        const diffLookup = Object.fromEntries(
            runData.map(item => [item.label, item.A - item.B])
        );

        return {
            name: run,
            type: "line",
            showSymbol: false,
            data: labels.map(label => diffLookup[label] ?? null),
        };
    });

    const options = {
        title: {
            text: "Memory Comparison",
            left: "center",
            top: 10,
        },

        legend: {
            top: 40,
        },

        tooltip: {
            trigger: "axis",
        },

        grid: {
            top: 100,
            left: 60,
            right: 30,
            bottom: 80,
        },

        xAxis: {
            type: "category",
            data: labels,
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
        <div>
            <Button onClick={() => setSortMode(prev => !prev)}>
                {sortMode ? "Original Order" : "Sort by Difference"}
            </Button>

            <ReactECharts
                option={options}
                notMerge={true}
                lazyUpdate={true}
                style={{ height: 600, width: "60vw" }}
            />
        </div>
    );
}

export default MemoryComparisonChart;