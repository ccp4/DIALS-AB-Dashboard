import ErrorBoundary from "../components/ErrorBoundary";
import CC_halfOverallPanel from "../components/CC_halfOverallPanel";
import MultiRunSelector from "../components/data-quality/MultiRunSelector";
import RunMetricPanel from "../components/data-quality/RunMetricPanel";
import { useUrlParamList } from "../hooks/useUrlState";

export default function DataSetsPage() {
    const [selectedRuns, setSelectedRuns] = useUrlParamList("runs");

    return (
        <>
            <MultiRunSelector value={selectedRuns} onChange={setSelectedRuns} />

            <ErrorBoundary label="Data quality panels" resetKeys={selectedRuns}>
                <RunMetricPanel title="Raw" run_ids={selectedRuns} metric="raw" />

                <RunMetricPanel title="Comparison" run_ids={selectedRuns} metric="comparison" />

                <CC_halfOverallPanel runs={selectedRuns} />
            </ErrorBoundary>
        </>
    );
}