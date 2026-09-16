import Chart from "../Chart";
import LoadingState from "../LoadingState";
import { tokens } from "../../theme/tokens";
import { STANDARD_DATA_ZOOM, summaryBoxGraphic, parityScatterSkeleton } from "../../theme/chartChrome";
import { niceCeil } from "../../utils/chartScale";
import { abSummary } from "../../utils/abSummary";
import { useApi } from "../../hooks/useApi";

interface CumulativeResponse {
  A: [string, number][];
  B: [string, number][];
}

function CumulativeTimeTaken({ run }: { run?: string }) {
  const { data, loading } = useApi<CumulativeResponse>(run ? `/runs/${run}/cumulative` : null);

  if (loading) return <LoadingState label="Loading timings..." />;

  const chartStyle = { height: tokens.chart.height.tall, width: tokens.chart.width.main };

  const bLookup = Object.fromEntries(data?.B ?? []);
  const points = (data?.A ?? [])
    .map(([dataset, aValue]) => ({
      dataset,
      A: aValue,
      B: bLookup[dataset] ?? null,
    }))
    .filter((p) => Number.isFinite(p.A) && Number.isFinite(p.B))
    .map((p) => ({ ...p, B: p.B!, value: [p.A, p.B!] as [number, number] }));

  const maxValue = niceCeil(Math.max(...points.flatMap((p) => [p.A, p.B]), 1));

  // No run selected, or a run with nothing comparable — same real-axes
  // skeleton either way, just with nothing plotted.
  if (!points.length) {
    return (
      <Chart
        option={parityScatterSkeleton({
          title: "Cumulative Runtime: A vs B",
          xName: "A Runtime (s)",
          yName: "B Runtime (s)",
        })}
        style={chartStyle}
      />
    );
  }

  const { regression, text: regressionSummary } = abSummary(points, "lower");

  const series = [
    {
      name: "x = y",
      type: "line",
      data: [[0, 0], [maxValue, maxValue]],
      symbol: "none",
      silent: true,
      animation: false,
      lineStyle: { color: tokens.line.reference, width: 1, type: "dashed" },
      z: 0,
    },
    {
      name: run,
      type: "scatter",
      symbolSize: 6,
      itemStyle: { color: tokens.ink.strong, opacity: 0.7 },
      emphasis: {
        scale: true,
        itemStyle: {
          opacity: 1,
          borderColor: tokens.ink.strong,
          borderWidth: 1,
        },
      },
      data: points,
      z: 2,
    },
  ];

  if (regression) {
    series.splice(1, 0, {
      name: "Regression",
      type: "line",
      data: regression.points,
      symbol: "none",
      silent: true,
      animation: false,
      lineStyle: { color: tokens.series[0]!, width: 2, type: "solid" },
      z: 1,
    });
  }

  const option = {
    title: {
      text: "Cumulative Runtime: A vs B",
    },

    graphic: regressionSummary ? summaryBoxGraphic(regressionSummary) : undefined,

    tooltip: {
      trigger: "item",
      formatter: (params: { data?: { dataset: string; A: number; B: number } }) => {
        const d = params.data;

        if (!d || d.dataset === undefined) return "";

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
      nameLocation: "middle",
      nameGap: 30,
      nameTextStyle: { color: tokens.variant.A, fontWeight: 600 },
      min: 0,
      max: maxValue,
      scale: true,
    },

    yAxis: {
      type: "value",
      name: "B Runtime (s)",
      nameLocation: "middle",
      nameGap: 45,
      nameRotate: 90,
      nameTextStyle: { color: tokens.variant.B, fontWeight: 600 },
      min: 0,
      max: maxValue,
      scale: true,
    },

    grid: {
      containLabel: true,
    },

    dataZoom: STANDARD_DATA_ZOOM,

    series,
  };

  return <Chart option={option} style={chartStyle} />;
}

export default CumulativeTimeTaken;