import ReactECharts from "echarts-for-react";

// Convert (1/d)^2  ->  d
function invSqToD(v) {
  if (
    v == null ||
    Number.isNaN(v) ||
    v <= 0
  ) {
    return null;
  }

  return 1 / Math.sqrt(v);
}

function CC_halfOverallChart({ data }) {

    const memory = data ?? {};
    const runs = Object.keys(memory);

    if (!runs.length) return null;

    const series = [];
    const datasetUnion = new Set();

    runs.forEach(run => {

        const runData = memory[run] ?? {};

        const runDatasets = Object.keys(runData);

        const datasets = runDatasets.sort((a, b) => {

            const getVal = (ds) => {
                const ccHalf = runData[ds]?.cc_half ?? [];

                const trace = ccHalf.find(t =>
                    t?.name?.includes("d_min")
                );

                return trace?.data?.[0]?.[0] ?? -Infinity;
            };

            return getVal(b) - getVal(a);
        });

        const values = datasets.map(dataset => {

            const ccHalf = runData[dataset]?.cc_half ?? [];

            const trace = ccHalf.find(t =>
                t?.name?.includes("B - d_min")
            );

            const value = trace?.data?.[0]?.[0] ?? null;

            if (!trace || !trace?.data?.length) {
                console.warn(
                    `[CC_halfOverallChart] Missing d_min`,
                    {
                        run,
                        dataset,
                        ccHalfAvailable: ccHalf.map(t => t?.name)
                    }
                );
            }

            datasetUnion.add(dataset);

            return value;
        });

        series.push({
            name: run,
            type: "line",
            showSymbol: true,
            data: values,
        });
    });

    const xAxis = Array.from(datasetUnion);

    const options = {
        title: {
            text: "CC Half at 0.5 per Dataset",
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
            data: xAxis,
            name: "Dataset",
        },

        yAxis: {
            type: "value",
            inverse: true,
            name: "Resolution (Å)",
            axisLabel: {
                formatter: (value) => {
                    if (!Number.isFinite(value) || value <= 0) {
                        return "";
                    }

                    return invSqToD(value).toFixed(2);
                }
            }
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

export default CC_halfOverallChart;