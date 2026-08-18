import {
  Autocomplete,
  TextField,
} from "@mui/material";

import { useListDatasets } from "./useListDatasets";

function DatasetSelector({ runId, value, onChange }) {

  const {
    datasets,
    loading,
  } = useListDatasets(runId);

  if (loading) return <p>Loading datasets...</p>;

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
        />
      )}
    />
  );
}

export default DatasetSelector;