import { useEffect, useState } from "react"
import ReactECharts from "echarts-for-react";
import { Autocomplete, TextField } from '@mui/material';
function RawDataChart({ data }) {

  const [selectRun, setSelectRun] = useState(null)
  const [selectTrace, setSelectTrace] = useState(null)

  useEffect(() => {
    const runs = Object.keys(data);

    if (runs.length) {
      setSelectRun(runs[0]);
    } else {
      setSelectRun(null);
    }

  }, [data]);

  useEffect(() => {
    const traces = Object.keys(data?.[selectRun] ?? {});
    setSelectTrace(traces[0] ?? null);
  }, [selectRun, data]);

  const keys = Object.keys(data);

  const traces = selectRun
    ? Object.keys(data[selectRun])
    : [];

  const series = selectRun && selectTrace
    ? data[selectRun][selectTrace].map(trace => ({
      name: trace.name,
      type: "line",
      data: trace.data,
      showSymbol: false,
    }))
    : [];

  const option = {
    title: {
      text: `${selectRun} → ${selectTrace}`,
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
      name: `${selectTrace}`,
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
  }


  return (
    <>

      <Autocomplete
        disablePortal
        options={keys}
        sx={{ width: 300 }}
        renderInput={(params) => <TextField {...params} label="Select data" />}
        value={selectRun}
        onChange={(e, run) => { setSelectRun(run) }}
      />

      <br />

      <Autocomplete
        disablePortal
        options={traces}
        sx={{ width: 300 }}
        renderInput={(params) => <TextField {...params} label="Select trace" />}
        value={selectTrace}
        onChange={(e, trace) => { setSelectTrace(trace) }}
      />

      <ReactECharts
        option={option}
        style={{ height: 600, width: "35vw"}}
        notMerge={true}
        lazyUpdate={true}
      />


    </>
  )
}

export default RawDataChart