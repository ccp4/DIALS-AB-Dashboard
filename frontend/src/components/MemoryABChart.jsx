import { useEffect, useState } from "react"
import ReactECharts from "echarts-for-react";
import { Button } from "@mui/material";

function MemoryABChart({ data }){

    const memory = data
    const [sortMode, setSortMode] = useState(false)

    const runs = Object.keys(data)

    const firstRunData = memory[runs[0]] ?? [];
    const chartData = sortMode
        ? [...firstRunData].sort(
              (a, b) => (b.A - b.B) - (a.A - a.B)
          )
        : firstRunData;

    const labels = chartData.map((d) => d.label)

    const series = runs.flatMap(run => {

        const runData = memory[run] ?? [];
        const diffLookup = Object.fromEntries(
            runData.map(item => [
                item.label,
                [item.A, item.B]
            ])
        );
        return [
            {
                name: "A " + run,
                type: "line",
                showSymbol: false,
                lineStyle: { color: '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')},
                data: labels.map(label =>
                    diffLookup[label]
                        ? diffLookup[label][0]
                        : null
                ),
            },

            {
                name: "B " + run,
                type: "line",
                showSymbol: false,
                lineStyle: {color: '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')},
                data: labels.map(label =>
                    diffLookup[label]
                        ? diffLookup[label][1]
                        : null
                ),
            }
        ];

    });

    const options = {
        title: {
            text: "Raw AB Memory",
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

        series
    }
    return (
        <>
            <div>
                <Button onClick={() => setSortMode((prev) => !prev)}>
                    {sortMode ? "Original Order" : "Sort by A"}
                </Button>
                <ReactECharts
                    option={options}
                    notMerge={true}
                    lazyUpdate={true}
                    style={{ height: 600, width: "30vw" }}          
                />
            </div>
        </>
    );
}

export default MemoryABChart