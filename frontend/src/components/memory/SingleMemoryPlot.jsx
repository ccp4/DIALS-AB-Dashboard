import Chart from "../Chart";
import { tokens } from "../../theme/tokens";

function SingleMemoryPlot({ run, data }) {

    const metric = (A, B) => 100 * (A - B) / A;

    const orderedData = (data ?? [])
        .map(item => ({
            label: item.label,
            value: metric(item.A, item.B)
        }))
        .filter(item => Number.isFinite(item.value))
        .sort((a, b) => b.value - a.value);

    const option = {
        title: {
            text: run,
            left: "center",
        },
        tooltip: {
            trigger: "axis",
        },
        grid: {
            top: 60,
            left: 45,
            right: 20,
            bottom: 40,
        },
        xAxis: {
            type: "category",
            data: orderedData.map(item => item.label),
            name: "Dataset",
        },
        yAxis: {
            type: "value",
            name: "A - B",
        },
        series: [
            {
                type: "line",
                showSymbol: false,
                data: orderedData.map(item => item.value),
            }
        ]
    };

    return (
        <Chart
            option={option}
            notMerge
            lazyUpdate
            style={{
                height: tokens.chart.height.sparkline,
                width: "100%",
            }}
        />
    );
}

export default SingleMemoryPlot;