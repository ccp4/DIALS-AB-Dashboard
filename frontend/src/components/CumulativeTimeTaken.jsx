import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";

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
    .sort((a, b) => b[1] - a[1])
    .map(([dataset, aValue], index) => ({
      rank: index + 1,
      dataset,
      A: aValue,
      B: bLookup[dataset] ?? null,
    }));

  const option = {
    title: {
      text: "Cumulative Runtime"
    },

    legend: {},

    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      formatter: (params) => {
        const row = params[0].data;

        let html = `<strong>${row.dataset}</strong><br/>`;
        html += `Rank: ${row.rank}<br/>`;

        params.forEach((p) => {
          html += `${p.marker} ${p.seriesName}: ${p.value[1].toFixed(2)} s<br/>`;
        });

        return html;
      }
    },

    xAxis: {
      type: "value",
      name: "Datasets"
    },

    yAxis: {
      type: "value",
      name: "Runtime (s)"
    },

    series: [
      {
        name: "A",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: ranked.map((r) => ({
          value: [r.rank, r.A],
          ...r
        }))
      },
      {
        name: "B",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: ranked.map((r) => ({
          value: [r.rank, r.B],
          ...r
        }))
      }
    ]
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 600 }}
    />
  );
}

export default CumulativeTimeTaken;