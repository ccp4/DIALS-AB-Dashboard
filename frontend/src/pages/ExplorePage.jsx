import { Autocomplete, Box, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";

import CohortGrid from "../components/CohortGrid";
import DatasetSelector from "../components/data-quality/DatasetSelector";
import ErrorBoundary from "../components/ErrorBoundary";
import RunProvenance from "../components/RunProvenance";
import { useAllRuns } from "../components/data-quality/useAllRuns";
import { useUrlParam } from "../hooks/useUrlState";
import { goToDataset } from "../navigation";

export default function ExplorePage() {
    const [run, setRun] = useUrlParam("run");
    const { runs, loading } = useAllRuns();
    const navigate = useNavigate();

    return (
        <>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <Autocomplete
                    options={runs}
                    value={run}
                    loading={loading}
                    onChange={(event, value) => setRun(value)}
                    sx={{ width: 400 }}
                    renderInput={(params) => (
                        <TextField {...params} variant="standard" label="Run" placeholder="Select a run" />
                    )}
                />

                {run && (
                    <DatasetSelector
                        runId={run}
                        value={null}
                        onChange={(dataset) => dataset && goToDataset(navigate, run, dataset)}
                    />
                )}
            </Box>

            <ErrorBoundary label="Run provenance" resetKeys={[run]}>
                <RunProvenance runs={run ? [run] : []} />
            </ErrorBoundary>

            <ErrorBoundary label="Cohort overview" resetKeys={[run]}>
                <CohortGrid run={run} />
            </ErrorBoundary>
        </>
    );
}
