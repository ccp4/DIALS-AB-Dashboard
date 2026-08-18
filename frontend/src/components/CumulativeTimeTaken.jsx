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
  const ranked = [...data.A]
    .map(([dataset, aValue], index) => ({
      rank: index + 1,
      dataset,
      A: aValue,
      B: bLookup[dataset] ?? null,
    }));

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
        name: "A",
        type: "scatter",
        smooth: true,
        showSymbol: false,
        data: ranked.map((r) => ({
          value: [r.rank, r.A],
          ...r
        }))
      },
      {
        name: "B",
        type: "scatter",
        smooth: true,
        showSymbol: false,
        data: ranked.map((r) => ({
          value: [r.rank, r.B],
          ...r
        }))
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: 600 }} />;
}

export default CumulativeTimeTaken;