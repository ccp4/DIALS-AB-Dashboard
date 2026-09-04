import Chart from "../Chart";
import LoadingState from "../LoadingState";
import { tokens } from "../../theme/tokens";
import { STANDARD_DATA_ZOOM, summaryBoxGraphic } from "../../theme/chartChrome";
import { niceCeil } from "../../theme/chartScale";
import { abSummary } from "../../theme/abSummary";
import { useApi } from "../../hooks/useApi";

function CumulativeTimeTaken({ run }) {
  const { data, loading } = useApi(`/runs/${run}/cumulative`);

  if (loading) return <LoadingState label="Loading timings..." />;
  if (!data?.A || !data?.B) return <p>No timing data</p>;
  const bLookup = Object.fromEntries(data.B);
  const points = data.A
    .map(([dataset, aValue]) => ({
      dataset,
      A: aValue,
      B: bLookup[dataset] ?? null,
    }))
    .filter((p) => Number.isFinite(p.A) && Number.isFinite(p.B))
    .map((p) => ({ value: [p.A, p.B], ...p }));

  if (!points.length) {
    return <p>No comparable datasets</p>;
  }

  const maxValue = niceCeil(Math.max(...points.flatMap((p) => [p.A, p.B]), 1));

  const { regression, text: regressionSummary } = abSummary(points, "lower");

  const series = [
    {
      name: "x = y",
      type: "line",
      data: [[0, 0], [maxValue, maxValue]],
      symbol: "none",
      silent: true,
      animation: false,
      lineStyle: { color: tokens.line.reference, width: 1, type: "dashed" },
      z: 0,
    },
    {
      name: run,
      type: "scatter",
      symbolSize: 6,
      itemStyle: { color: tokens.ink.strong, opacity: 0.7 },
      emphasis: {
        scale: true,
        itemStyle: {
          opacity: 1,
          borderColor: tokens.ink.strong,
          borderWidth: 1,
        },
      },
      data: points,
      z: 2,
    },
  ];

  if (regression) {
    series.splice(1, 0, {
      name: "Regression",
      type: "line",
      data: regression.points,
      symbol: "none",
      silent: true,
      animation: false,
      lineStyle: { color: tokens.series[0], width: 2 },
      z: 1,
    });
  }

  const option = {
    title: {
      text: "Cumulative Runtime: A vs B",
    },

    graphic: regressionSummary ? summaryBoxGraphic(regressionSummary) : undefined,

    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const d = params.data;

        if (!d || d.dataset === undefined) return "";

        return `
          <strong>${d.dataset}</strong><br/>
          A: ${d.A.toFixed(2)} s<br/>
          B: ${d.B.toFixed(2)} s<br/>
          Difference: ${(d.B - d.A).toFixed(2)} s
        `;
      },
    },

    xAxis: {
      type: "value",
      name: "A Runtime (s)",
      nameLocation: "middle",
      nameGap: 30,
      nameTextStyle: { color: tokens.variant.A, fontWeight: 600 },
      min: 0,
      max: maxValue,
      scale: true,
    },

    yAxis: {
      type: "value",
      name: "B Runtime (s)",
      nameLocation: "middle",
      nameGap: 45,
      nameRotate: 90,
      nameTextStyle: { color: tokens.variant.B, fontWeight: 600 },
      min: 0,
      max: maxValue,
      scale: true,
    },

    grid: {
      containLabel: true,
    },

    dataZoom: STANDARD_DATA_ZOOM,

    series,
  };

  return <Chart option={option} style={{ height: tokens.chart.height.tall, width: tokens.chart.width.main }} />;
}

export default CumulativeTimeTaken;