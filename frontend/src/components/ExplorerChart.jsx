import { useMemo, useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { normalizeName } from "../NameNormalise";


// =======================
// PURE DATA LAYER
// =======================

function buildSeries(filesObj, selectedSubDataset) {
  const series = [];

  for (const fileName of Object.keys(filesObj)) {
    const sub = filesObj[fileName]?.[selectedSubDataset];
    const dataArr = sub?.data;

    if (!Array.isArray(dataArr)) continue;

    for (const trace of dataArr) {
      if (!trace?.x || !trace?.y) continue;

      const transformed = trace.x.map((x, i) => {
        const y = trace.y[i];
        return [x, y]; // keep (1/d)^2
      });

      series.push({
        name: normalizeName(fileName, trace.name || "unnamed"),
        type: "line",
        data: transformed,
        showSymbol: false,
      });
    }
  }

  return series;
}


// =======================
// MAIN COMPONENT
// =======================

function ExplorerChart({ dataJSON }) {

  const sources = ["comparison_data", "ab_data"];
  const [selectedSource, setSelectedSource] = useState("comparison_data");

  const rootData = dataJSON?.[selectedSource] || {};
  const dirs = Object.keys(rootData);

  const [selectedDir, setSelectedDir] = useState(dirs[0]);
  

  const filesObj = rootData?.[selectedDir] || {};
  const fileNames = Object.keys(filesObj);

  const subDatasetNames = useMemo(() => {
    const set = new Set();

    for (const file of fileNames) {
      const subs = filesObj[file] || {};
      Object.keys(subs).forEach((s) => set.add(s));
    }

    return Array.from(set);
  }, [filesObj, fileNames]);

  const [selectedSubDataset, setSelectedSubDataset] = useState("");

  useEffect(() => {
    if (dirs.length > 0) {
      setSelectedDir(dirs[0]);
    }
  }, [selectedSource, dataJSON]);

  useEffect(() => {
    if (subDatasetNames.length > 0) {
      setSelectedSubDataset(subDatasetNames[0]);
    }
  }, [selectedDir, selectedSource]);

  useMemo(() => {
    if (!selectedSubDataset && subDatasetNames.length > 0) {
      setSelectedSubDataset(subDatasetNames[0]);
    }
  }, [subDatasetNames, selectedSubDataset]);

 
  const series = useMemo(() => {
    return buildSeries(filesObj, selectedSubDataset);
  }, [filesObj, selectedSubDataset]);


  const option = useMemo(() => ({
    title: {
      text: `${selectedSource} → ${selectedDir} → ${selectedSubDataset}`,
    },

    tooltip: {
      trigger: "axis",
      axisPointer: { type: 'cross' },
      formatter: (params) => {
        if (!params.length) return "";

        const xRaw = params[0].value[0];
        const xDisplay = Math.sqrt(1 / xRaw).toFixed(3)

        let text = `x: ${xDisplay}<br/>`;

        params.forEach((p) => {
          text += `${p.marker} ${p.seriesName}: ${p.value[1]}<br/>`;
        });

        return text;
      },
    },

    legend: {
      orient: "vertical",
      right: 0,
      top: "center",
    },

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
      name: `${selectedSubDataset}`,
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
  }), [series, selectedSource, selectedDir, selectedSubDataset]);


  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>

      {/* Data source */}
      <div style={{ marginBottom: 10 }}>
        <label>
          Data source:{" "}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
          >
            {sources.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Directory */}
      <div style={{ marginBottom: 10 }}>
        <label>
          Directory:{" "}
          <select
            value={selectedDir}
            onChange={(e) => setSelectedDir(e.target.value)}
          >
            {dirs.map((dir) => (
              <option key={dir} value={dir}>
                {dir}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Subdataset */}
      <div style={{ marginBottom: 10 }}>
        <label>
          Sub-dataset:{" "}
          <select
            value={selectedSubDataset}
            onChange={(e) => setSelectedSubDataset(e.target.value)}
          >
            {subDatasetNames.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Chart */}
      <ReactECharts
        option={option}
        style={{ height: 600 }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
}

export default ExplorerChart;