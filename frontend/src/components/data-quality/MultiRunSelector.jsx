import {
  Autocomplete,
  TextField,
} from "@mui/material";

import LoadingState from "../LoadingState";
import { useAllRuns } from "../../hooks/useRunsApi";

function MultiRunSelector({ value, onChange }) {

  const {
    runs,
    loading
  } = useAllRuns();

  if (loading) return <LoadingState label="Loading runs..." />;

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