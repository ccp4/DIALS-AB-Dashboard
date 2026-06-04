import { useEffect, useState } from "react"
import ReactECharts from "echarts-for-react";
import { Button } from "@mui/material";

function MemoryComparisonChart(){

    const apiURL = "http://localhost:8000"
    const [memory, setMemory] = useState([])
    const [sortMode, setSortMode] = useState(false)

    useEffect(() => {
        fetch(apiURL + "/runs/run-310326/memory")
        .then((response) => response.json())
        .then((data) => {
            setMemory(data);
        })
        .catch((err) => {console.log(err.message)});
    }, [])

    const chartData = sortMode
        ? [...memory].sort(
            (a, b) => (b.A - b.B) - (a.A - a.B)
        )
        : memory;

    const labels = chartData.map(d => d.label);
    const diffData = chartData.map(d => d.A - d.B);

    const series = [
        {
            name: "A-B",
            type: "line",
            showSymbol: false,
            lineStyle: {color: "blue"},
            data: diffData

        },
    ]

    const options = {
        title: {
            text: "A - B Memory Comparison",
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
            data: labels
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
    );
}

export default MemoryComparisonChart