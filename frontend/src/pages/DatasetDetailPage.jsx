import { Box } from "@mui/material";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import DatasetChart from "../components/data-quality/DatasetChart";
import DatasetSelector from "../components/data-quality/DatasetSelector";
import { useDatasetResource } from "../components/data-quality/useDatasetResource";
import ErrorBoundary from "../components/ErrorBoundary";
import LoadingState from "../components/LoadingState";
import MemoryProfilerPlot from "../components/memory/MemoryProfilerPlot";
import RunProvenance from "../components/RunProvenance";
import WhatMovedStrip from "../components/WhatMovedStrip";
import { useApi } from "../hooks/useApi";
import { goToDataset } from "../navigation";

export default function DatasetDetailPage() {
    const { run } = useParams();
    const dataset = useParams()["*"];
    const navigate = useNavigate();

    const { data: cohort, loading } = useApi(`/runs/${run}/cohort`);
    const { data: rawData } = useDatasetResource(run, dataset, "raw");
    const { data: comparisonData } = useDatasetResource(run, dataset, "comparison");

    if (loading) return <LoadingState label="Loading cohort data..." />;
    if (!cohort) return null;

    const row = cohort.rows.find((r) => `${r.dataset}/${r.sample}` === dataset);

    return (
        <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <RouterLink to={`/explore?run=${run}`}>&larr; Back to Explore</RouterLink>

                <DatasetSelector
                    runId={run}
                    value={dataset}
                    onChange={(next) => next && goToDataset(navigate, run, next)}
                />
            </Box>

            <ErrorBoundary label="Run provenance" resetKeys={[run]}>
                <RunProvenance runs={[run]} />
            </ErrorBoundary>

            {row ? (
                <ErrorBoundary label="What moved" resetKeys={[run, dataset]}>
                    <WhatMovedStrip row={row} metrics={cohort.metrics} />
                </ErrorBoundary>
            ) : (
                <p>No cohort row found for {dataset}.</p>
            )}

            <ErrorBoundary label="CC½ curve" resetKeys={[run, dataset]}>
                <DatasetChart data={rawData} urlKey="raw" />
            </ErrorBoundary>

            <ErrorBoundary label="Comparison series" resetKeys={[run, dataset]}>
                <DatasetChart data={comparisonData} urlKey="comparison" />
            </ErrorBoundary>

            <ErrorBoundary label="Memory profile" resetKeys={[run, dataset]}>
                <MemoryProfilerPlot run={run} fixedDataset={dataset} />
            </ErrorBoundary>
        </>
    );
}
