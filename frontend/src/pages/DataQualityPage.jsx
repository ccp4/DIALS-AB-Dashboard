import ErrorBoundary from "../components/ErrorBoundary";
import CC_halfOverallPanel from "../components/data-quality/CC_halfOverallPanel";
import RunProvenance from "../components/RunProvenance";
import MultiRunSelector from "../components/data-quality/MultiRunSelector";
import RunMetricPanel from "../components/data-quality/RunMetricPanel";
import { useUrlParamList } from "../hooks/useUrlState";

export default function DataQualityPage() {
    const [selectedRuns, setSelectedRuns] = useUrlParamList("runs");

    return (
        <>
            <MultiRunSelector value={selectedRuns} onChange={setSelectedRuns} />

            <ErrorBoundary label="Run provenance" resetKeys={selectedRuns}>
                <RunProvenance runs={selectedRuns} />
            </ErrorBoundary>

            <ErrorBoundary label="Data quality panels" resetKeys={selectedRuns}>
                <RunMetricPanel title="Resolution estimates from dials.estimate_resolution" run_ids={selectedRuns} metric="raw" />

                <RunMetricPanel title="Merging statistics from xia2.compare_merging_stats" run_ids={selectedRuns} metric="comparison" />

                <CC_halfOverallPanel runs={selectedRuns} />
            </ErrorBoundary>
        </>
    );
}