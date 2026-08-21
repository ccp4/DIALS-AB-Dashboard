import { Autocomplete, TextField } from "@mui/material";

import CohortGrid from "../components/CohortGrid";
import ErrorBoundary from "../components/ErrorBoundary";
import RunProvenance from "../components/RunProvenance";
import { useAllRuns } from "../components/data-quality/useAllRuns";
import { useUrlParam } from "../hooks/useUrlState";

export default function ExplorePage() {
    const [run, setRun] = useUrlParam("run");
    const { runs, loading } = useAllRuns();

    return (
        <>
            <Autocomplete
                options={runs}
                value={run}
                loading={loading}
                onChange={(event, value) => setRun(value)}
                sx={{ width: 400, mb: 2 }}
                renderInput={(params) => (
                    <TextField {...params} variant="standard" label="Run" placeholder="Select a run" />
                )}
            />

            <ErrorBoundary label="Run provenance" resetKeys={[run]}>
                <RunProvenance runs={run ? [run] : []} />
            </ErrorBoundary>

            <ErrorBoundary label="Cohort overview" resetKeys={[run]}>
                <CohortGrid run={run} />
            </ErrorBoundary>
        </>
    );
}
