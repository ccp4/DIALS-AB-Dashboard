import {
  Autocomplete,
  TextField,
} from "@mui/material";

import LoadingState from "../LoadingState";
import { useAllRuns } from "../../hooks/useRunsApi";

interface MultiRunSelectorProps {
  value: string[] | null | undefined;
  onChange: (next: string[]) => void;
}

function MultiRunSelector({ value, onChange }: MultiRunSelectorProps) {

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
      onChange={(_event, newValue) => onChange(newValue)}
      sx={{ mb: 2 }}
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