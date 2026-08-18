import {
  Autocomplete,
  TextField,
} from "@mui/material";

import { useAllRuns } from "./useAllRuns";

function MultiRunSelector({ value, onChange }) {

  const {
    runs,
    loading
  } = useAllRuns();

  if (loading) return <p>Loading runs...</p>;

  return (
    <Autocomplete
      multiple
      options={runs}
      value={value || []}
      onChange={(event, newValue) => onChange(newValue)}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
          label="Multiple Run Selector"
          placeholder="Enter runs"
        />
      )}
    />
  );
}

export default MultiRunSelector;