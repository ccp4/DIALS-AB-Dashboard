import MultiRunSelector from "../components/data-quality/MultiRunSelector";
import MemoryPanels from "../components/MemoryPanels";
import RunProvenance from "../components/RunProvenance";
import ErrorBoundary from "../components/ErrorBoundary";
import { useUrlParamList } from "../hooks/useUrlState";

export default function DataMemoryPage(){
	const [selectedRuns, setSelectedRuns] = useUrlParamList("runs");

	return(
		<>
			<MultiRunSelector
				value={selectedRuns}
				onChange={setSelectedRuns}
			/>

			{selectedRuns.length > 0 && (
				<>
					<ErrorBoundary label="Run provenance" resetKeys={selectedRuns}>
						<RunProvenance runs={selectedRuns} />
					</ErrorBoundary>

					<ErrorBoundary label="Memory data" resetKeys={selectedRuns}>
						<MemoryPanels runs={selectedRuns} />
					</ErrorBoundary>
				</>
			)}
		</>
	)
}
