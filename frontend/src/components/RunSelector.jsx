import {
  Autocomplete,
  TextField,
} from "@mui/material";

import { useApi } from "../hooks/useApi";


function RunSelector({ value, onChange }) {
  const { data, loading } = useApi("/runs/");

  const runs = data ?? [];

  if (loading) return <p>Loading options...</p>;


  return (
    <>
      <Autocomplete
        multiple
        options={runs}
        value={value || []}
        onChange={(event, newValue) => onChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="standard"
            label="Run selector"
            placeholder="Enter runs"
          />
        )}
      />
  </>
  );
}

export default RunSelector;