import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  TextField,
} from "@mui/material";


function RunSelector({ value, onChange }) {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiURL = "http://localhost:8000";

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const response = await fetch(`${apiURL}/runs/`);

        if (!response.ok) {
          throw new Error("Failed to fetch runs");
        }

        const data = await response.json();
        setRuns(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, []);

  if (loading) return <p>Loading options...</p>;
  if (error) return <p>Error: {error}</p>;


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