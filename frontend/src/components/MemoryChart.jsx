import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";

function collateMemory(memory) {
  const result = {};

  for (const key in memory) {
    const parts = key.split("/");
    const type = parts.pop(); // A or B
    const dataset = parts.join("/");

    if (!result[dataset]) {
      result[dataset] = { dataset, A: 0, B: 0 };
    }

    result[dataset][type] = memory[key];
  }

  return Object.values(result);
}

function MemoryChart({ dataJSON }) {
  const memory = dataJSON?.memory || {};

  const [mode, setMode] = useState("ab"); 
  // "ab" | "diff"

  const [sortMode, setSortMode] = useState("original");
  // "original" | "a-desc"

  // 🔥 base data
  const baseData = useMemo(() => collateMemory(memory), [memory]);

  // 🔥 sorting layer
  const data = useMemo(() => {
    if (sortMode === "a-desc") {
      return [...baseData].sort((a, b) => b.A - a.A);
    }
    return baseData;
  }, [baseData, sortMode]);

  const xAxisData = useMemo(
    () => data.map((_, i) => i),
    [data]
  );

  // 🔥 SERIES SWITCHING LOGIC
  const series = useMemo(() => {
    if (mode === "diff") {
      return [
        {
          name: "A - B",
          type: "line",
          showSymbol: false,
          lineStyle: { color: "green" },
          data: data.map((d) => d.A - d.B),
        },
      ];
    }

    return [
      {
        name: "A",
        type: "line",
        showSymbol: false,
        lineStyle: { color: "blue" },
        data: data.map((d) => d.A),
      },
      {
        name: "B",
        type: "line",
        showSymbol: false,
        lineStyle: { color: "red" },
        data: data.map((d) => d.B),
      },
    ];
  }, [data, mode]);

  const option = useMemo(
    () => ({
      title: {
        text: "Memory Comparison",
        left: "center",
        top: 10,
      },

      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          const idx = params[0].dataIndex;
          const item = data[idx];

          if (mode === "diff") {
            return `
              Index: ${idx}<br/>
              Dataset: ${item.dataset}<br/>
              A-B: ${item.A - item.B}
            `;
          }

          return `
            Index: ${idx}<br/>
            Dataset: ${item.dataset}<br/>
            A: ${item.A}<br/>
            B: ${item.B}
          `;
        },
      },

      legend: {
        top: 40,
        data: series.map((s) => s.name),
      },

      grid: {
        top: 100,
        left: 60,
        right: 30,
        bottom: 80,
      },

      xAxis: {
        type: "category",
        data: xAxisData,
      },

      yAxis: {
        type: "value",
      },

      dataZoom: [
        { type: "inside" },
        { type: "slider" },
      ],

      series,
    }),
    [data, xAxisData, series, mode]
  );

  return (
    <div>
      {/* 🔘 Mode buttons */}
      <div style={{ marginBottom: 10 }}>
        <button
          onClick={() => setMode("ab")}
          style={{
            marginRight: 8,
            padding: "6px 10px",
            background: mode === "ab" ? "#ddd" : "#fff",
          }}
        >
          A / B
        </button>

        <button
          onClick={() => setMode("diff")}
          style={{
            padding: "6px 10px",
            background: mode === "diff" ? "#ddd" : "#fff",
          }}
        >
          A - B
        </button>

        {/* 🔽 Sort buttons */}
        <div style={{ marginTop: 10 }}>
          <button
            onClick={() => setSortMode("original")}
            style={{
              marginRight: 8,
              padding: "6px 10px",
              background: sortMode === "original" ? "#ddd" : "#fff",
            }}
          >
            Original
          </button>

          <button
            onClick={() => setSortMode("a-desc")}
            style={{
              padding: "6px 10px",
              background: sortMode === "a-desc" ? "#ddd" : "#fff",
            }}
          >
            Sort A (High → Low)
          </button>
        </div>
      </div>

      <ReactECharts
        option={option}
        notMerge={true}
        lazyUpdate={true}
        style={{ height: 600, width: 600 }}
      />
    </div>
  );
}

export default MemoryChart;