import {
  Autocomplete,
  TextField,
} from "@mui/material";

import LoadingState from "./LoadingState";
import { useListDatasets } from "../hooks/useRunsApi";

interface DatasetSelectorProps {
  runId: string | null;
  value: string | null | undefined;
  onChange: (dataset: string | null) => void;
}

function DatasetSelector({ runId, value, onChange }: DatasetSelectorProps) {

  const {
    datasets,
    loading,
    error,
  } = useListDatasets(runId, { throwOnError: false });

  if (loading) return <LoadingState label="Loading datasets..." />;

  return (
    <Autocomplete
      options={datasets}
      value={value ?? null}
      disabled={!runId}
      sx={{ width: 300 }}
      onChange={(_event, dataset) => onChange(dataset)}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
          label="Dataset"
          error={Boolean(error)}
          helperText={error ? "Failed to load datasets" : undefined}
        />
      )}
    />
  );
}

export default DatasetSelector;
