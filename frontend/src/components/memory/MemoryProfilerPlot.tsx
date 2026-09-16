import { Autocomplete, TextField, Box } from "@mui/material";

import Chart from "../Chart";
import LoadingState from "../LoadingState";
import { tokens, withAlpha } from "../../theme/tokens";
import { niceCeil } from "../../utils/chartScale";
import { noDataGraphic } from "../../theme/chartChrome";
import { useApi } from "../../hooks/useApi";
import { useUrlParam } from "../../hooks/useUrlState";

type Sample = [number, number];

interface TimingEvent {
    command: string;
    time_start: number;
    time_end: number;
    runtime: number;
}

interface MemoryProfile {
    A: Sample[];
    B: Sample[];
}

interface MemoryEvents {
    A: TimingEvent[];
    B: TimingEvent[];
}

interface ABPair {
    A: string;
    B: string;
}

interface DatasetInfo {
    unit_cell: ABPair;
    space_group: ABPair;
}

interface RunMetadata {
    datasets: string[];
}

/**
 * Background bands for the three long-running stages. Drawn from the
 * non-variant palette on purpose: a blue or orange band would read as A or B
 * on a chart that is already entirely one variant.
 */
const STAGE_BANDS: Record<string, string> = {
  "dials.find_spots": withAlpha(tokens.series[2]!, 0.25),
  "dials.index": withAlpha(tokens.series[4]!, 0.25),
  "dials.integrate": withAlpha(tokens.series[0]!, 0.25),
};

// Shown in place of `infoData` before a dataset is chosen — same shape
// (`{section: {A, B}}`) as the real response, so the render logic below
// doesn't need a separate branch for the empty case.
const INFO_PLACEHOLDER: DatasetInfo = {
  unit_cell: { A: "—", B: "—" },
  space_group: { A: "—", B: "—" },
};

function relativeDuration(samples: Sample[] | undefined): number {
  if (!samples || samples.length === 0) return 0;
  const t0 = samples[0]![0];
  return Math.max(...samples.map(([t]) => t - t0));
}

function maxMemory(samples: Sample[] | undefined): number {
  if (!samples || samples.length === 0) return 0;
  return Math.max(...samples.map(([, m]) => m));
}

interface MemoryProfilerPlotProps {
  run?: string;
  fixedDataset?: string;
}

function MemoryProfilerPlot({ run, fixedDataset }: MemoryProfilerPlotProps) {
  const [urlDataset, setUrlDataset] = useUrlParam(`ds_${run}`);
  const selectedDataset = fixedDataset ?? urlDataset;

  // `run` is optional — the zero-runs skeleton renders one generic instance with nothing to fetch yet.
  const { data: runInfo, loading: loadingDatasets } = useApi<RunMetadata>(
    fixedDataset || !run ? null : `/runs/${run}`
  );

  const memoryPath = selectedDataset
    ? `/runs/${run}/memory/${selectedDataset}`
    : null;

  const memory = useApi<MemoryProfile>(memoryPath);
  const commands = useApi<MemoryEvents>(memoryPath && `${memoryPath}/events`);
  const info = useApi<DatasetInfo>(selectedDataset ? `/runs/${run}/info/${selectedDataset}` : null);

  const datasets = runInfo?.datasets ?? [];

  const memoryData = memory.data;
  const commandData = commands.data;
  const infoData = info.data;

  const loadingMemory = memory.loading || commands.loading || info.loading;

  // Shared axes so A and B render at the same scale — otherwise each
  // auto-scales and a smaller run looks misleadingly similar to a bigger one.
  const xMax = niceCeil(Math.max(relativeDuration(memoryData?.A), relativeDuration(memoryData?.B)) * 1.05 || 1);
  const yMax = niceCeil(Math.max(maxMemory(memoryData?.A), maxMemory(memoryData?.B)) * 1.05 || 1);

  if (loadingDatasets) return <LoadingState label="Loading datasets..." />;

  const makeOption = (
    title: string,
    samples: Sample[] | undefined,
    commands: TimingEvent[] | undefined,
    variant: "A" | "B",
    xMax: number,
    yMax: number
  ) => {
    const hasData = samples && samples.length > 0;
    const t0 = hasData ? samples[0]![0] : 0;

    const relative = hasData ? samples.map(([t, m]) => [t - t0, m]) : [];

    const markAreas = hasData ? (commands ?? []).map(cmd => {
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
    }) : [];

    return {
      title: {
        text: title,
        textStyle: { color: tokens.variant[variant] }
      },

      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
      },

      graphic: hasData ? undefined : noDataGraphic(),

      xAxis: {
        type: "value",
        name: "Time (s)",
        nameLocation: "middle",
        nameGap: 30,
        min: 0,
        max: xMax
      },

      yAxis: {
        type: "value",
        name: "Memory (MiB)",
        nameLocation: "middle",
        nameGap: 45,
        nameRotate: 90,
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
          value={selectedDataset ?? null}
          disabled={!run}
          onChange={(_event, value) => setUrlDataset(value)}
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

      {!loadingMemory && (
        <>
          <div>
            {Object.entries(infoData ?? INFO_PLACEHOLDER).map(([key, inner]: [string, ABPair]) => (
              <div key={key}>
                <h3>{key}</h3>

                {Object.entries(inner).map(([k, v]: [string, string]) => (
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
              memoryData?.A,
              commandData?.A,
              "A",
              xMax,
              yMax
            )}
            style={{ height: tokens.chart.height.panel, width: tokens.chart.width.main }}
          />

          <Chart
            option={makeOption(
              "DIALS B",
              memoryData?.B,
              commandData?.B,
              "B",
              xMax,
              yMax
            )}
            style={{ height: tokens.chart.height.panel, width: tokens.chart.width.main, marginTop: 30 }}
          />
        </>
      )}
    </Box>
  );
}

export default MemoryProfilerPlot;
