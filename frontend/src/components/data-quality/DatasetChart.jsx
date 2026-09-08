import { useMemo } from "react";

import Chart from "../Chart";
import { tokens } from "../../theme/tokens";
import { STANDARD_DATA_ZOOM, noDataGraphic } from "../../theme/chartChrome";
import { variantOf, variantSeriesStyle } from "../../theme/variant";
import { useUrlParam } from "../../hooks/useUrlState";

// Fixed regardless of which trace-group is active — shared by the skeleton
// (no trace-group known yet) and the populated option below.
const RESOLUTION_X_AXIS = {
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
};

const RESOLUTION_GRID = {
  left: "5%",
  right: "20%",
  top: "10%",
  bottom: "15%",
  containLabel: true,
};

/**
 * @param {string} urlKey Makes the trace-selection URL param unique when
 *        more than one DatasetChart is on screen at once (e.g. one per
 *        selected run, or raw vs comparison).
 * @param {boolean} [single] Bigger, dedicated sizing (matches MemoryABChart's
 *        single-run case) — true when this is the only DatasetChart of its
 *        kind on screen (one run selected, or the per-sample detail page).
 */
function DatasetChart({ data, urlKey, single = false }) {
  const dataset = Array.isArray(data) ? data[0] : data;
  const keys = useMemo(() => Object.keys(dataset ?? {}), [dataset]);
  const [selectedKey, setSelectedKey] = useUrlParam(`trace_${urlKey}`);

  const chartStyle = single
    ? { height: tokens.chart.height.single, width: tokens.chart.width.single }
    : { height: tokens.chart.height.panel, width: "100%" };

  // Which trace-groups exist (the options below) is DIALS-driven, not fixed
  // in code — unlike every other chart here, there's no known metric name to
  // preview before data has loaded once. Only the x-axis is genuinely fixed
  // regardless of which trace is active, so the skeleton is partial: real
  // x-axis, blank y-axis, an A/B legend (this chart is always an A/B
  // comparison whatever the metric), and the trace picker shown disabled
  // rather than hidden.
  if (!dataset || keys.length === 0) {
    return (
      <>
        <select disabled value="">
          <option value="">Trace</option>
        </select>

        <Chart
          option={{
            graphic: noDataGraphic(),
            legend: {
              orient: "vertical",
              left: "75%",
              top: "center",
              align: "left",
              data: ["A", "B"],
            },
            xAxis: RESOLUTION_X_AXIS,
            yAxis: { type: "value" },
            grid: RESOLUTION_GRID,
            series: [
              { name: "A", type: "line", data: [], ...variantSeriesStyle("A", 0) },
              { name: "B", type: "line", data: [], ...variantSeriesStyle("B", 0) },
            ],
          }}
          style={chartStyle}
          notMerge={true}
          lazyUpdate={true}
        />
      </>
    );
  }

  // Falls back to the first key without an effect: a selection left over
  // from a previous dataset (or no selection yet) is derived during render,
  // the way `useApi` derives `loading`, rather than synced afterwards.
  const activeKey = keys.includes(selectedKey) ? selectedKey : keys[0];

  let traces = dataset[activeKey] ?? [];

  // if (selectedKey === "cc_half" && traces.length != 0) {
  //   traces = traces.filter(trace => trace.name.includes("fit"));
  // }

  // Colour carries the variant, so several traces of the same variant separate
  // by line style instead.
  const seen = { A: 0, B: 0 };

  const series = traces.map(( trace , i) => {
    const variant = variantOf(trace.name);

    return {
      name: trace.name ?? `Trace ${i + 1}`,
      type: "line",
      showSymbol: false,
      data: trace.data,
      ...(variant ? variantSeriesStyle(variant, seen[variant]++) : {}),
    }})
  
  const isFitTrace = (name) => name.includes("fit");

  const shouldSelectFits = activeKey === "cc_half" && traces.length > 0;
  // If nothing matches "fit" (e.g. DIALS renamed the trace), fall back to
  // showing everything rather than defaulting every trace to hidden.
  const anyFitTrace = traces.some(({ name }) => isFitTrace(name));

  const legend = {
    orient: "vertical",
    left: "75%",
    top: "center",
    align: "left",
    selected: shouldSelectFits
      ? Object.fromEntries(traces.map(({ name }) => [name, anyFitTrace ? isFitTrace(name) : true]))
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
    dataZoom: STANDARD_DATA_ZOOM,
    xAxis: RESOLUTION_X_AXIS,
    yAxis: {
      type: "value",
      name: `${activeKey}`,
      nameLocation: "middle",
      nameRotate: 90,
      nameGap: 30,
    },
    grid: RESOLUTION_GRID,
    series,
  };

  return (
    <>
      <select
        value={activeKey}
        onChange={(e) => setSelectedKey(e.target.value)}
      >
        {keys.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>

      <Chart
        option={option}
        style={chartStyle}
        notMerge={true}
        lazyUpdate={true}
      />
    </>
  );
}

export default DatasetChart;