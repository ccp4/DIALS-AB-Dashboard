import React, { useEffect, useState } from "react";
import { Autocomplete, TextField, Box } from "@mui/material";
import ReactECharts from "echarts-for-react";

function MemoryProfilerPlot({ run }) {
  const apiURL = "http://localhost:8000";

  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);

  const [memoryData, setMemoryData] = useState(null);
  const [commandData, setCommandData] = useState(null);

  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loadingMemory, setLoadingMemory] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDatasets() {
      try {
        const response = await fetch(`${apiURL}/runs/${run}`);

        if (!response.ok) {
          throw new Error("Failed to fetch datasets");
        }

        const data = await response.json();
        setDatasets(data.datasets);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingDatasets(false);
      }
    }

    fetchDatasets();
  }, [run]);

  useEffect(() => {
    if (!selectedDataset) return;

    async function fetchData() {
      setLoadingMemory(true);

      try {
        const [memoryResponse, commandResponse] = await Promise.all([
          fetch(`${apiURL}/runs/${run}/memory/${selectedDataset}`),
          fetch(`${apiURL}/runs/${run}/memory/${selectedDataset}/events`)
        ]);

        if (!memoryResponse.ok || !commandResponse.ok) {
          throw new Error("Failed to fetch profiling data");
        }

        const memory = await memoryResponse.json();
        const commands = await commandResponse.json();

        setMemoryData(memory);
        setCommandData(commands);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingMemory(false);
      }
    }

    fetchData();
  }, [selectedDataset, run]);

  if (loadingDatasets) return <p>Loading datasets...</p>;
  if (error) return <p>{error}</p>;

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

      {memoryData && commandData && (
        <>
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