import RawDataChart from "../components/RawDataChart";
import RunSelector from "../components/RunSelector";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import ErrorBoundary from "../components/ErrorBoundary";
import MetricGroupCard from "../components/MetricGroupCard";
import CC_halfOverallPanel from "../components/CC_halfOverallPanel";
import MultiRunSelector from "../components/data-quality/MultiRunSelector";
import RunMetricPanel from "../components/data-quality/RunMetricPanel";
import { useUrlParamList } from "../hooks/useUrlState";

export default function DataSetsPage() {
    const [selectedRuns, setSelectedRuns] = useUrlParamList("runs");

    return (
        <>
            {/* <RunSelector
                value={selectedRuns}
                onChange={setSelectedRuns}
            /> */}

            <MultiRunSelector value={selectedRuns} onChange={setSelectedRuns} />

            <ErrorBoundary label="Data quality panels" resetKeys={selectedRuns}>
                <RunMetricPanel title="Raw" run_ids={selectedRuns} metric="raw" />

                <RunMetricPanel title="Comparison" run_ids={selectedRuns} metric="comparison" />
                {/* <RunMetricPanel title="Comparison" run_ids={selectedRuns} metric="comparison" /> */}

                <CC_halfOverallPanel runs={selectedRuns} />
            </ErrorBoundary>

            {/* <MetricGroupCard
                title="Raw Metrics"
                data={raw.data}
                type="raw"
            /> */}

            {/* <MetricGroupCard
                title="Comparison Metrics"
                data={comparison.data}
                type="comparison"
            /> */}
        </>
    );
}