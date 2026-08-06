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
    .map(([dataset, aValue]) => {
      const bValue = bLookup[dataset];

      if (!Number.isFinite(aValue) || !Number.isFinite(bValue)) {
        return null;
      }

      return {
        dataset,
        A: aValue,
        B: bValue,
        value: [aValue, bValue],
      };
    })
    .filter(Boolean);

  const maxValue = Math.max(
    ...points.flatMap((p) => [p.A, p.B]),
    1
  );

  const regression = EChartsStat.regression(
    "linear",
    points.map((p) => [p.A, p.B])
  );

  const regressionLine = regression.points;
  const [[x1, y1], [x2, y2]] = regression.points;
  const slope = regression.parameter.gradient;
  const intercept = regression.parameter.intercept;
  const regressionSummary =
    `${slope >= 1 ? "B is larger" : "B is smaller"} than A by ` +
    `${Math.abs((slope - 1) * 100).toFixed(2)}%` +
    `${Math.abs(intercept) > 0.01
      ? `\nOffset: ${intercept >= 0 ? "+" : ""}${intercept.toFixed(2)} units`
      : ""}` +
    `\n${regression.expression}`;

  const identityLine = [];
  const step = Math.max(maxValue / 100, 1);

  for (let x = 0; x <= maxValue; x += step) {
    identityLine.push([x, x]);
  }

  if (identityLine.at(-1)?.[0] !== maxValue) {
    identityLine.push([maxValue, maxValue]);
  }

  const series = [
    {
      name: "x = y",
      type: "line",
      data: identityLine,
      symbol: "none",
      silent: true,
      animation: false,
      lineStyle: {
        color: "#999",
        width: 1,
        type: "dashed",
      },
      z: 0,
    },
    {
      name: "Regression",
      type: "line",
      data: regressionLine,
      symbol: "none",
      silent: true,
      animation: false,
      lineStyle: {
        color: "#d62728",
        width: 2,
      },
      z: 1,
    },
    {
      name: "Datasets",
      type: "scatter",
      symbolSize: 6,
      itemStyle: {
        opacity: 0.6,
      },
      emphasis: {
        scale: true,
        itemStyle: {
          opacity: 1,
          borderColor: "#000",
          borderWidth: 1,
        },
      },
      data: points,
      z: 2,
    },
  ]

  const option = {
    title: {
      text: "Cumulative Runtime: A vs B",
    },
    graphic: [
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
    ],

    tooltip: {
      trigger: "item",
      formatter: (params) => {
        const d = params.data;

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
      {
        type: "inside",
      },
      {
        type: "slider",
      },
    ],

    series
  };

  return <ReactECharts option={option} style={{ height: 600 }} />;
}

export default CumulativeTimeTaken;