import { useState, useEffect, useMemo } from "react";
import ReactECharts from "echarts-for-react";

function DatasetChart({ data }) {
  const dataset = Array.isArray(data) ? data[0] : data;
  const keys = useMemo(() => Object.keys(dataset ?? {}), [dataset]);
  const [selectedKey, setSelectedKey] = useState("");
  console.log(data)

  useEffect(() => {
    if (keys.length > 0) {
      setSelectedKey(keys[0]);
    }
  }, [keys]);

  if (!dataset || keys.length === 0) {
    return <div>No data</div>;
  }

  let traces = dataset[selectedKey] ?? [];
  console.log(traces)

  // if (selectedKey === "cc_half" && traces.length != 0) {
  //   traces = traces.filter(trace => trace.name.includes("fit"));
  // }

  const series = traces.map(( trace , i) => {
    return {
      name: trace.name ?? `Trace ${i + 1}`,
      type: "line",
      showSymbol: false,
      data: trace.data,
    }})
  
  const shouldSelectFits = selectedKey === "cc_half" && traces.length > 0;

  const legend = {
    orient: "vertical",
    left: "75%",
    top: "center",
    align: "left",
    selected: shouldSelectFits
      ? Object.fromEntries(traces.map(({ name }) => [name, name.includes("fit")]))
      : undefined,
  };
  
  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      formatter: (params) => {
        if (!params.length) return "";
        const xRaw = params[0].value[0];
        const xDisplay =
          Math.sqrt(1 / xRaw).toFixed(3);
        let text = `x: ${xDisplay}<br/>`;
        params.forEach((p) => {
          text += `${p.marker} ${p.seriesName}: ${p.value[1]}<br/>`;
        });

        return text;
      },
    },
    legend,
    dataZoom: [
      { type: "inside" },
      { type: "slider" },
    ],
    xAxis: {
      type: "value",
      name: "Resolution (d)",
      nameLocation: "middle",
      nameGap: 30,
      axisLabel: {
        formatter: (value) => {
          const d = Math.sqrt(1 / value);
          return d.toFixed(2);
        },
      },
    },
    yAxis: {
      type: "value",
      name: `${selectedKey}`,
      nameLocation: "middle",
      nameRotate: 90,
      nameGap: 30,
    },
    grid: {
      left: "5%",
      right: "20%",
      top: "10%",
      bottom: "15%",
      containLabel: true,
    },
    series,
  };

  return (
    <>
      <select
        value={selectedKey}
        onChange={(e) => setSelectedKey(e.target.value)}
      >
        {keys.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>

      <ReactECharts
        option={option}
        style={{
          height: 600,
          width: "40vw"
        }}
        notMerge={true}
        lazyUpdate={true}
      />
    </>
  );
}

export default DatasetChart;