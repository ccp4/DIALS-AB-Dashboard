import EChartsStat from "echarts-stat";

import Chart from "../Chart";
import LoadingState from "../LoadingState";
import { tokens } from "../../theme/tokens";
import { STANDARD_DATA_ZOOM } from "../../theme/chartChrome";
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

  const maxValue = Math.max(...points.flatMap((p) => [p.A, p.B]), 1);

  // Regression needs at least two points to fit
  const regression =
    points.length >= 2
      ? EChartsStat.regression("linear", points.map((p) => [p.A, p.B]))
      : null;

  const ratios = points
    .map((p) => p.B / p.A)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const median = ratios.length
    ? ratios.length % 2
      ? ratios[(ratios.length - 1) / 2]
      : (ratios[ratios.length / 2 - 1] + ratios[ratios.length / 2]) / 2
    : null;

  const bFaster = points.filter((p) => p.B < p.A).length;

  const regressionSummary =
    `B faster on ${bFaster} of ${points.length}` +
    `${median !== null ? `\nmedian B/A = ${median.toFixed(3)}` : ""}` +
    `${regression ? `\nfit: ${regression.expression}` : ""}`;

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

    graphic: regressionSummary
      ? [
          {
            type: "group",
            right: 20,
            top: 200,
            children: [
              {
                type: "rect",
                shape: {
                  width: 220,
                  height: 80,
                  r: 5,
                },
                style: {
                  fill: tokens.surface.overlay,
                  stroke: tokens.surface.border,
                  lineWidth: 1,
                  shadowBlur: 5,
                  shadowColor: tokens.surface.border,
                },
              },
              {
                type: "text",
                left: 10,
                top: 10,
                style: {
                  text: regressionSummary,
                  font: `${tokens.font.size.annotation}px ${tokens.font.family}`,
                  fill: tokens.ink.base,
                  lineHeight: 20,
                },
              },
            ],
          },
        ]
      : undefined,

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
      nameTextStyle: { color: tokens.variant.A, fontWeight: 600 },
      min: 0,
      max: maxValue,
      scale: true,
    },

    yAxis: {
      type: "value",
      name: "B Runtime (s)",
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

  return <Chart option={option} style={{ height: tokens.chart.height.full }} />;
}

export default CumulativeTimeTaken;