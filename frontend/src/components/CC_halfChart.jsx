import { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";

 
// Convert (1/d)^2  ->  d
function invSqToD(v) {
  if (
    v == null ||
    Number.isNaN(v) ||
    v <= 0
  ) {
    return null;
  }

  return 1 / Math.sqrt(v);
}

 
// Interpolate x-value where y ~= targetY 
function interpolateXatY(
  xs,
  ys,
  targetY = 0.5,
  tolerance = 0.025
) {
  if (!Array.isArray(xs) || !Array.isArray(ys)) {
    return null;
  }

  const len = Math.min(xs.length, ys.length);

  if (len < 2) return null;

  // Require at least one nearby point
  const nearTarget = ys.some(
    (y) =>
      typeof y === "number" &&
      Math.abs(y - targetY) <= tolerance
  );

  if (!nearTarget) return null;

  let bestIndex = -1;
  let bestDistance = Infinity;

  for (let i = 0; i < len - 1; i++) {
    const x1 = xs[i];
    const x2 = xs[i + 1];
    const y1 = ys[i];
    const y2 = ys[i + 1];

    if (
      [x1, x2, y1, y2].some(
        (v) => typeof v !== "number" || Number.isNaN(v)
      )
    ) {
      continue;
    }

    // exact match
    if (y1 === targetY) {
      return x1;
    }

    // direct bracket
    const brackets =
      (y1 <= targetY && y2 >= targetY) ||
      (y1 >= targetY && y2 <= targetY);

    if (brackets) {
      bestIndex = i;
      break;
    }

    // fallback nearest segment
    const distance = Math.min(
      Math.abs(y1 - targetY),
      Math.abs(y2 - targetY)
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = i;
    }
  }

  if (bestIndex === -1) return null;

  const x1 = xs[bestIndex];
  const x2 = xs[bestIndex + 1];
  const y1 = ys[bestIndex];
  const y2 = ys[bestIndex + 1];

  if (y1 === y2) return x1;

  return (
    x1 + ((targetY - y1) * (x2 - x1)) / (y2 - y1)
  );
}

 
function extractDatasetValues(
  datasets,
  traceName,
  targetY = 0.5
) {
  const map = {};

  for (const datasetKey of Object.keys(
    datasets || {}
  )) {
    const dataset = datasets[datasetKey];

    for (const fileKey of Object.keys(dataset || {})) {
      const file = dataset[fileKey];

      const traces = file?.cc_half?.data;

      if (!Array.isArray(traces)) continue;

      for (const trace of traces) {
        if (trace?.name !== traceName) {
          continue;
        }

        const x = interpolateXatY(
          trace.x,
          trace.y,
          targetY
        );

        if (
          x == null ||
          Number.isNaN(x) ||
          !Number.isFinite(x)
        ) {
          continue;
        }

        if (!map[datasetKey]) {
          map[datasetKey] = {
            dataset: datasetKey,
            A: null,
            B: null,
          };
        }

        const label =
          fileKey ===
          "dials.estimate_resolution-B.json"
            ? "B"
            : "A";

        map[datasetKey][label] = x;
      }
    }
  }

  return Object.values(map);
}

 
function CC_halfChart({ dataJSON }) {
  const [selected, setSelected] =
    useState(null);

  const traceName = "CC<sub>\u00bd</sub>";

 
  // Build dataset table
  const datasets = useMemo(() => {
    const vals = extractDatasetValues(
      dataJSON?.ab_data,
      traceName,
      0.5
    );

    // sort by average resolution
    vals.sort((a, b) => {
      const avgA =
        ((a.A ?? 0) + (a.B ?? 0)) / 2;

      const avgB =
        ((b.A ?? 0) + (b.B ?? 0)) / 2;

      return avgA - avgB;
    });

    return vals.map((d, idx) => ({
      ...d,
      index: idx + 1,
    }));
  }, [dataJSON]);

  // Build series
  const seriesA = datasets
    .filter((d) => d.A != null)
    .map((d) => ({
      value: [d.index, d.A],
      dataset: d.dataset,
      labelType: "A",
      rawValue: d.A,
      dValue: invSqToD(d.A),
    }));

  const seriesB = datasets
    .filter((d) => d.B != null)
    .map((d) => ({
      value: [d.index, d.B],
      dataset: d.dataset,
      labelType: "B",
      rawValue: d.B,
      dValue: invSqToD(d.B),
    }));

 
  // Chart option
  const option = useMemo(
    () => ({
      tooltip: {
        trigger: "item",

        formatter: (params) => {
          const d = params.data;

          return `
            <strong>${d.dataset}</strong><br/>
            File: ${d.labelType}<br/>
            d: ${d.dValue?.toFixed(3)} Å
          `;
        },
      },

      legend: {
        data: ["A", "B"],
      },

      xAxis: {
        type: "value",
        name: "Dataset Index",
        min: 1,
        max: datasets.length,
      },

      yAxis: {
        type: "value",

        name: "Resolution d (Å)",

        axisLabel: {
          formatter: (value) => {
            const d = invSqToD(value);

            return d
              ? d.toFixed(2)
              : "";
          },
        },
      },

      series: [
        {
          name: "A",
          type: "line",
          data: seriesA,
          connectNulls: false,
          symbolSize: 8,

          lineStyle: {
            width: 2,
            color: "#1f77b4",
          },

          itemStyle: {
            color: "#1f77b4",
          },
        },

        {
          name: "B",
          type: "line",
          data: seriesB,
          connectNulls: false,
          symbolSize: 8,

          lineStyle: {
            width: 2,
            color: "#d62728",
          },

          itemStyle: {
            color: "#d62728",
          },
        },
      ],
    }),
    [datasets, seriesA, seriesB]
  );

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
      }}
    >
      {/* Chart */}
      <div style={{ flex: 1 }}>
        <ReactECharts
          option={option}
          style={{
            width: 500,
            height: 600,
          }}
          onEvents={{
            click: (params) => {
              setSelected(params.data);
            },
          }}
        />
      </div>

      {/* Side Panel */}
      <div
        style={{
          width: "300px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "12px",
          background: "#fafafa",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          Dataset Details
        </h3>

        {!selected ? (
          <p>Click a point</p>
        ) : (
          <>
            <p>
              <strong>Dataset:</strong>{" "}
              {selected.dataset}
            </p>

            <p>
              <strong>File:</strong>{" "}
              {selected.labelType}
            </p>

            <p>
              <strong>d:</strong>{" "}
              {selected.dValue?.toFixed(4)} Å
            </p>

            <p>
              <strong>(1/d²):</strong>{" "}
              {selected.rawValue?.toFixed(5)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default CC_halfChart;