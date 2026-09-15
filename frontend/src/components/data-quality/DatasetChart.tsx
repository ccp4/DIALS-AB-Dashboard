import { useMemo } from "react";
import type { ChangeEvent } from "react";

import Chart from "../Chart";
import { tokens } from "../../theme/tokens";
import { STANDARD_DATA_ZOOM, noDataGraphic } from "../../theme/chartChrome";
import { variantOf, variantSeriesStyle } from "../../theme/variant";
import { useUrlParam } from "../../hooks/useUrlState";

interface TraceSeries {
    name: string;
    data: [number, number][];
}

type DatasetData = Record<string, TraceSeries[]>;

interface AxisTooltipParam {
    value: [number, number];
    marker: string;
    seriesName: string;
}

// Shared by both the skeleton and the populated chart.
const RESOLUTION_X_AXIS = {
  type: "value",
  name: "Resolution (d)",
  nameLocation: "middle",
  nameGap: 30,
  axisLabel: {
    formatter: (value: number) => {
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

interface DatasetChartProps {
  data: DatasetData | never[];
  /** Makes the trace-selection URL param unique per `DatasetChart` instance. */
  urlKey: string;
  /** Bigger, dedicated sizing for a lone chart. */
  single?: boolean;
}

function DatasetChart({ data, urlKey, single = false }: DatasetChartProps) {
  const dataset = (Array.isArray(data) ? data[0] : data) as DatasetData | undefined;
  const keys = useMemo(() => Object.keys(dataset ?? {}), [dataset]);
  const [selectedKey, setSelectedKey] = useUrlParam(`trace_${urlKey}`);

  const chartStyle = single
    ? { height: tokens.chart.height.single, width: tokens.chart.width.single }
    : { height: tokens.chart.height.panel, width: "100%" };

  // Trace groups are DIALS-driven, not known ahead of data, so the skeleton
  // is partial: real x-axis, blank y-axis, an A/B legend, trace picker disabled.
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

  // Falls back to the first key, derived during render rather than synced via an effect.
  const activeKey = selectedKey != null && keys.includes(selectedKey) ? selectedKey : keys[0]!;

  // `activeKey` is always a real key of `dataset`.
  const traces = dataset[activeKey]!;

  // Colour carries the variant; line style separates same-variant traces.
  const seen: Record<"A" | "B", number> = { A: 0, B: 0 };

  const series = traces.map((trace, i) => {
    const variant = variantOf(trace.name);

    return {
      name: trace.name ?? `Trace ${i + 1}`,
      type: "line",
      showSymbol: false,
      data: trace.data,
      ...(variant ? variantSeriesStyle(variant, seen[variant]++) : {}),
    }})

  const isFitTrace = (name: string) => name.includes("fit");

  const shouldSelectFits = activeKey === "cc_half" && traces.length > 0;
  // No match (e.g. DIALS renamed the trace) shows everything instead of hiding all.
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
      formatter: (params: AxisTooltipParam[]) => {
        if (!params.length) return "";
        const xRaw = params[0]!.value[0];
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
        onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedKey(e.target.value)}
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
