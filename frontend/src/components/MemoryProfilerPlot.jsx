import { useState } from "react";
import { Autocomplete, TextField, Box } from "@mui/material";
import ReactECharts from "echarts-for-react";

import { useApi } from "../hooks/useApi";

function MemoryProfilerPlot({ run }) {
  const [selectedDataset, setSelectedDataset] = useState(null);

  const { data: runInfo, loading: loadingDatasets } = useApi(`/runs/${run}`);

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

  if (loadingDatasets) return <p>Loading datasets...</p>;

  const makeOption = (title, samples, commands) => {
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

const importantCommands = {
  "dials.find_spots": "rgba(255, 99, 132, 0.25)",
  "dials.index": "rgba(54, 162, 235, 0.25)",
  "dials.integrate": "rgba(75, 192, 192, 0.25)"
};

const markAreas = commands.map(cmd => {
  const important = importantCommands[cmd.command];

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
          ? "#333"
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
        text: title
      },

      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
      },

      xAxis: {
        type: "value",
        name: "Time (s)"
      },

      yAxis: {
        type: "value",
        name: "Memory (MiB)"
      },

      series: [
        {
          type: "line",
          showSymbol: false,
          data: relative,

          markArea: {
            silent: false,

            emphasis: {
              itemStyle: {
                color: "rgba(80,120,255,0.2)"
              },

              label: {
                color: "#333"
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
      <Autocomplete
        options={datasets}
        value={selectedDataset}
        onChange={(event, value) => setSelectedDataset(value)}
        sx={{ width: 300, mb: 3 }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Dataset"
            variant="outlined"
          />
        )}
      />

      {loadingMemory && <p>Loading...</p>}

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
          <ReactECharts
            option={makeOption(
              "DIALS A",
              memoryData.A,
              commandData.A
            )}
            style={{ height: 450 }}
          />

          <ReactECharts
            option={makeOption(
              "DIALS B",
              memoryData.B,
              commandData.B
            )}
            style={{ height: 450, marginTop: 30 }}
          />
        </>
      )}
    </Box>
  );
}

export default MemoryProfilerPlot;