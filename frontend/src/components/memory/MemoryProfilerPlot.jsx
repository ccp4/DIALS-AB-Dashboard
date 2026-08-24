import { Autocomplete, TextField, Box } from "@mui/material";

import Chart from "../Chart";
import LoadingState from "../LoadingState";
import { tokens, withAlpha } from "../../theme/tokens";
import { useApi } from "../../hooks/useApi";
import { useUrlParam } from "../../hooks/useUrlState";

/**
 * Background bands for the three long-running stages. Drawn from the
 * non-variant palette on purpose: a blue or orange band would read as A or B
 * on a chart that is already entirely one variant.
 */
const STAGE_BANDS = {
  "dials.find_spots": withAlpha(tokens.series[2], 0.25),
  "dials.index": withAlpha(tokens.series[4], 0.25),
  "dials.integrate": withAlpha(tokens.series[0], 0.25),
};

function relativeDuration(samples) {
  if (!samples || samples.length === 0) return 0;
  const t0 = samples[0][0];
  return Math.max(...samples.map(([t]) => t - t0));
}

function maxMemory(samples) {
  if (!samples || samples.length === 0) return 0;
  return Math.max(...samples.map(([, m]) => m));
}

function MemoryProfilerPlot({ run, fixedDataset }) {
  const [urlDataset, setUrlDataset] = useUrlParam(`ds_${run}`);
  const selectedDataset = fixedDataset ?? urlDataset;

  const { data: runInfo, loading: loadingDatasets } = useApi(fixedDataset ? null : `/runs/${run}`);

  const memoryPath = selectedDataset
    ? `/runs/${run}/memory/${selectedDataset}`
    : null;

  const memory = useApi(memoryPath);
  const commands = useApi(memoryPath && `${memoryPath}/events`);
  const info = useApi(selectedDataset ? `/runs/${run}/info/${selectedDataset}` : null);

  const datasets = runInfo?.datasets ?? [];

  const memoryData = memory.data;
  const commandData = commands.data;
  const infoData = info.data;

  const loadingMemory = memory.loading || commands.loading || info.loading;

  // Shared axes so A and B render at the same pixel-per-unit scale —
  // otherwise each chart auto-scales to its own data and a
  // shorter/lower-peak run looks misleadingly similar to a
  // longer/higher-peak one.
  const xMax = Math.max(relativeDuration(memoryData?.A), relativeDuration(memoryData?.B)) * 1.05 || 1;
  const yMax = Math.max(maxMemory(memoryData?.A), maxMemory(memoryData?.B)) * 1.05 || 1;

  if (loadingDatasets) return <LoadingState label="Loading datasets..." />;

  const makeOption = (title, samples, commands, variant, xMax, yMax) => {
      if (!samples || samples.length === 0) {
        return {
          title: {
            text: `${title} - No data`
          },
          series: []
        };
      }
    const t0 = samples[0][0];

    const relative = samples.map(([t, m]) => [
      t - t0,
      m
    ]);

const markAreas = commands.map(cmd => {
  const important = STAGE_BANDS[cmd.command];

  return [
    {
      name: cmd.command,
      xAxis: cmd.time_start - t0,

      itemStyle: {
        color: important
          ? important
          : "rgba(0,0,0,0)"
      },

      label: {
        show: true,
        color: important
          ? tokens.ink.base
          : "rgba(0,0,0,0)",
        position: "insideTop"
      }
    },
    {
      xAxis: cmd.time_end - t0
    }
  ];
});

    return {
      title: {
        text: title,
        textStyle: { color: tokens.variant[variant] }
      },

      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
      },

      xAxis: {
        type: "value",
        name: "Time (s)",
        min: 0,
        max: xMax
      },

      yAxis: {
        type: "value",
        name: "Memory (MiB)",
        min: 0,
        max: yMax
      },

      series: [
        {
          type: "line",
          showSymbol: false,
          data: relative,
          itemStyle: { color: tokens.variant[variant] },
          lineStyle: { color: tokens.variant[variant] },

          markArea: {
            silent: false,

            emphasis: {
              itemStyle: {
                color: withAlpha(tokens.brand.primary, 0.2)
              },

              label: {
                color: tokens.ink.base
              }
            },

            data: markAreas
          }
        }
      ]
    };
  };

  return (
    <Box>
      {!fixedDataset && (
        <Autocomplete
          options={datasets}
          value={selectedDataset}
          onChange={(event, value) => setUrlDataset(value)}
          sx={{ width: 300, mb: 3 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Dataset"
              variant="outlined"
            />
          )}
        />
      )}

      {loadingMemory && <LoadingState label="Loading memory profile..." />}

      {memoryData && commandData && infoData && (
        <>

          <div>
            {Object.entries(infoData).map(([key, inner]) => (
              <div key={key}>
                <h3>{key}</h3>

                {Object.entries(inner).map(([k, v]) => (
                  <div key={k}>
                    <strong>{k}:</strong> {v}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <Chart
            option={makeOption(
              "DIALS A",
              memoryData.A,
              commandData.A,
              "A",
              xMax,
              yMax
            )}
            style={{ height: tokens.chart.height.panel }}
          />

          <Chart
            option={makeOption(
              "DIALS B",
              memoryData.B,
              commandData.B,
              "B",
              xMax,
              yMax
            )}
            style={{ height: tokens.chart.height.panel, marginTop: 30 }}
          />
        </>
      )}
    </Box>
  );
}

export default MemoryProfilerPlot;