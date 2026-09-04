import {
  Autocomplete,
  TextField,
} from "@mui/material";

import LoadingState from "../LoadingState";
import { useListDatasets } from "./useListDatasets";

function DatasetSelector({ runId, value, onChange }) {

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
      sx={{ width: 300 }}
      onChange={(event, dataset) => onChange(dataset)}
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