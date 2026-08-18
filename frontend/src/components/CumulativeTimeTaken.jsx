import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import EChartsStat from "echarts-stat";

function CumulativeTimeTaken({ run }) {
  const apiURL = "http://localhost:8000";
  const [data, setData] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`${apiURL}/runs/${run}/cumulative`);

        if (!response.ok) {
          throw new Error("Failed to fetch cumulative timings");
        }

        setData(await response.json());
      } catch (err) {
        console.error(err);
      }
    }

    fetchData();
  }, [run]);

  if (!data.A || !data.B) {
    return <p>Loading...</p>;
  }
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
      lineStyle: { color: "#999", width: 1, type: "dashed" },
      z: 0,
    },
    {
      name: run,
      type: "scatter",
      symbolSize: 6,
      itemStyle: { opacity: 0.55 },
      emphasis: {
        scale: true,
        itemStyle: { opacity: 1, borderColor: "#000", borderWidth: 1 },
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
      lineStyle: { color: "#d62728", width: 2 },
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
                  fill: "rgba(255,255,255,0.85)",
                  stroke: "#ccc",
                  lineWidth: 1,
                  shadowBlur: 5,
                  shadowColor: "rgba(0,0,0,0.1)",
                },
              },
              {
                type: "text",
                left: 10,
                top: 10,
                style: {
                  text: regressionSummary,
                  font: "14px sans-serif",
                  fill: "#333",
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
      min: 0,
      max: maxValue,
      scale: true,
    },

    yAxis: {
      type: "value",
      name: "B Runtime (s)",
      min: 0,
      max: maxValue,
      scale: true,
    },

    grid: {
      containLabel: true,
    },

    dataZoom: [
      { type: "inside" },
      { type: "slider" },
    ],

    series,
  };

  return <ReactECharts option={option} style={{ height: 600 }} />;
}

export default CumulativeTimeTaken;