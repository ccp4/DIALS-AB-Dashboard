import Chart from "../Chart";
import { tokens } from "../../theme/tokens";
import { STANDARD_DATA_ZOOM, STANDARD_LEGEND } from "../../theme/chartChrome";

/** @param {"absolute"|"percent"} unit Controlled by the caller (`MemoryComparisonBlock`). */
function MemoryOverlayChart({ data, unit = "absolute" }) {
    const runs = Object.keys(data);
    const metric = unit === "percent"
        ? (A, B) => 100 * (A - B) / A
        : (A, B) => A - B;

    if (!runs.length) {
        return null;
    }

    const sortedSeries = runs.map(run => {
        const sorted = (data[run] ?? [])
            .map(item => ({
                value: metric(item.A, item.B),
                dataset: item.label,
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
        const index = series.data.findIndex(point => point.value < 0);
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

    const crossingRank = Number.isFinite(allNegativeRank) ? rankLabels[allNegativeRank] : null;

    if (crossingRank !== null) {
        series[0].markLine = {
            symbol: "none",
            lineStyle: {
                type: "dashed",
                color: tokens.line.annotation,
            },
            data: [
                { xAxis: crossingRank }
            ]
        };
    }

    const options = {
        title: {
            text: "A-B Ranked Memory",
            left: "center",
        },
        tooltip: {
            trigger: "axis",
            axisPointer: { type: "cross" },
            formatter: params => {
                const suffix = unit === "percent" ? "%" : " MiB";
                const rows = params
                    .filter(p => p.data)
                    .map(p =>
                        `${p.marker}${p.seriesName}: ${p.data.dataset}` +
                        ` — ${p.data.value.toFixed(1)}${suffix}`
                    )
                    .join("<br/>");

                if (!rows) return "";

                let text = `<b>Rank ${params[0].axisValue}</b><br/>${rows}`;

                if (crossingRank !== null && Number(params[0].axisValue) === crossingRank) {
                    text += "<br/><br/>Beyond this rank, A − B goes negative — B starts using more memory than A.";
                }

                return text;
            },
        },
        legend: STANDARD_LEGEND,
        grid: {
            top: 90,
            left: 70,
            right: 30,
            bottom: 80,
        },
        xAxis: {
            type: "category",
            name: "Rank",
            nameLocation: "middle",
            nameGap: 30,
            data: rankLabels,
        },
        yAxis: {
            type: "value",
            name: unit === "percent" ? "A - B (%)" : "A - B (MiB)",
            nameLocation: "middle",
            nameGap: 45,
            nameRotate: 90,
        },
        dataZoom: STANDARD_DATA_ZOOM,
        series,
    };

    return (
        <Chart
            option={options}
            notMerge
            lazyUpdate
            style={{
                width: tokens.chart.width.main,
                height: tokens.chart.height.tall,
            }}
        />
    );
}

export default MemoryOverlayChart;