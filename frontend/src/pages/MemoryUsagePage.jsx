import MultiRunSelector from "../components/data-quality/MultiRunSelector";
import MemoryPanels from "../components/memory/MemoryPanels";
import RunProvenance from "../components/RunProvenance";
import ErrorBoundary from "../components/ErrorBoundary";
import { useUrlParamList } from "../hooks/useUrlState";

export default function MemoryUsagePage(){
	const [selectedRuns, setSelectedRuns] = useUrlParamList("runs");

	return(
		<>
			<MultiRunSelector
				value={selectedRuns}
				onChange={setSelectedRuns}
			/>

			<ErrorBoundary label="Run provenance" resetKeys={selectedRuns}>
				<RunProvenance runs={selectedRuns} />
			</ErrorBoundary>

			<ErrorBoundary label="Memory data" resetKeys={selectedRuns}>
				<MemoryPanels runs={selectedRuns} />
			</ErrorBoundary>
		</>
	)
}
