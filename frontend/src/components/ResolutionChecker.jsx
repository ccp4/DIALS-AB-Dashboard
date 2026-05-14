import { useMemo, useState } from "react";


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

  // Require curve to approach target
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

    // exact hit
    if (y1 === targetY) {
      return x1;
    }

    // bracket target
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

function ResolutionChecker({
  dataJSON,
}) {
  const [threshold, setThreshold] =
    useState(0.2);

  const traceName = "CC<sub>\u00bd</sub>";

  const processedDatasets = useMemo(() => {
    const extracted = extractDatasetValues(
      dataJSON?.ab_data,
      traceName,
      0.5
    );

    return extracted
      .map((d) => {
        const dA = invSqToD(d.A);
        const dB = invSqToD(d.B);

        const difference =
          dA != null && dB != null
            ? Math.abs(dA - dB)
            : null;

        return {
          dataset: d.dataset,
          dA,
          dB,
          difference,
        };
      })
      .filter(
        (d) =>
          d.difference != null
      );
  }, [dataJSON]);

  const flagged = useMemo(() => {
    return processedDatasets
      .filter(
        (d) =>
          d.difference >
          Number(threshold)
      )
      .sort(
        (a, b) =>
          b.difference - a.difference
      );
  }, [processedDatasets, threshold]);

  return (
    <div
      style={{
        width: "350px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        background: "#fafafa",
      }}
    >
      <h2
        style={{
          marginTop: 0,
        }}
      >
        Resolution Difference Checker
      </h2>

      {/* Threshold input */}
      <div
        style={{
          marginBottom: "16px",
        }}
      >
        <label>
          Difference threshold:
        </label>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "6px",
          }}
        >
          <input
            type="number"
            step="0.01"
            value={threshold}
            onChange={(e) =>
              setThreshold(
                Number(e.target.value)
              )
            }
            style={{
              width: "90px",
            }}
          />

          <span>Å</span>
        </div>
      </div>

      <div
        style={{
          marginBottom: "12px",
        }}
      >
        <strong>
          Flagged datasets:
        </strong>{" "}
        {flagged.length}
      </div>

      <hr />

      {/* Dataset list */}
      {flagged.length === 0 ? (
        <p>
          No datasets exceed threshold.
        </p>
      ) : (
        <ul
          style={{
            paddingLeft: "18px",
            margin: 0,
            maxHeight: "500px",
            overflowY: "auto",
          }}
        >
          {flagged.map((d) => (
            <li
              key={d.dataset}
              style={{
                marginBottom: "14px",
              }}
            >
              <strong>{d.dataset}</strong>

              <div>
                A:{" "}
                {d.dA != null
                  ? `${d.dA.toFixed(3)} Å`
                  : "N/A"}
              </div>

              <div>
                B:{" "}
                {d.dB != null
                  ? `${d.dB.toFixed(3)} Å`
                  : "N/A"}
              </div>

              <div
                style={{
                  color: "#cc0066",
                  fontWeight: 600,
                }}
              >
                Δ:{" "}
                {d.difference.toFixed(3)} Å
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ResolutionChecker;