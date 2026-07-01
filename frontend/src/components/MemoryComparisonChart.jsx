import { useState } from "react";
import ReactECharts from "echarts-for-react";
import { Button } from "@mui/material";

function MemoryComparisonChart({ data }) {

    const memoryData = data;
    const runs = Object.keys(memoryData);

    const [sortMode, setSortMode] = useState(false);


    if (!runs.length) {
        return null;
    }


    const firstRunData = memoryData[runs[0]] ?? [];


    // create sorted reference data
    const orderedData = sortMode
        ? [...firstRunData]
            .map(item => ({
                ...item,
                difference: item.A - item.B
            }))
            .filter(item => Number.isFinite(item.difference))
            .sort((a, b) => b.difference - a.difference)
        : firstRunData.map(item => ({
            ...item,
            difference: item.A - item.B
        }));
        
    const badValues = orderedData.filter(
        item => Number.isNaN(item.difference)
    );

    console.log("NaN entries:", badValues);

    const labels = orderedData.map(
        item => item.label
    );



    const series = runs.map(run => {

        const runData = memoryData[run] ?? [];


        const diffLookup = Object.fromEntries(
            runData.map(item => [
                item.label,
                item.A - item.B
            ])
        );


        return {
            name: run,
            type: "line",

            data: labels.map(
                label => diffLookup[label] ?? null
            ),
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

            // makes positive/negative split clearer
            axisLine: {
                onZero: true
            }
        },


        dataZoom: [
            { type: "inside" },
            { type: "slider" },
        ],


        series,
    };



    return (
        <div>

            <Button
                onClick={() =>
                    setSortMode(prev => !prev)
                }
            >
                {sortMode
                    ? "Original Order"
                    : "Sort by Difference"
                }
            </Button>


            <ReactECharts
                option={options}
                notMerge={true}
                lazyUpdate={true}
                style={{
                    height: 600,
                    width: "60vw"
                }}
            />

        </div>
    );
}


export default MemoryComparisonChart;