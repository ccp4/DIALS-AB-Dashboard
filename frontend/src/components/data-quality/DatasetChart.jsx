import { useMemo } from "react";

import Chart from "../Chart";
import { tokens } from "../../theme/tokens";
import { STANDARD_DATA_ZOOM } from "../../theme/chartChrome";
import { variantOf, variantSeriesStyle } from "../../theme/variant";
import { useUrlParam } from "../../hooks/useUrlState";

/**
 * @param {string} urlKey Makes the trace-selection URL param unique when
 *        more than one DatasetChart is on screen at once (e.g. one per
 *        selected run, or raw vs comparison).
 */
function DatasetChart({ data, urlKey }) {
  const dataset = Array.isArray(data) ? data[0] : data;
  const keys = useMemo(() => Object.keys(dataset ?? {}), [dataset]);
  const [selectedKey, setSelectedKey] = useUrlParam(`trace_${urlKey}`);

  if (!dataset || keys.length === 0) {
    return <div>No data</div>;
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
  
  const shouldSelectFits = activeKey === "cc_half" && traces.length > 0;

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
    dataZoom: STANDARD_DATA_ZOOM,
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
      name: `${activeKey}`,
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
        style={{
          height: tokens.chart.height.full,
          width: "40vw"
        }}
        notMerge={true}
        lazyUpdate={true}
      />
    </>
  );
}

export default DatasetChart;