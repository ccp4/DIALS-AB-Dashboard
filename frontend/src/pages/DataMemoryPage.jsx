import RunSelector from "../components/RunSelector";
import MemoryPanels from "../components/MemoryPanels";
import ErrorBoundary from "../components/ErrorBoundary";
import { useUrlParamList } from "../hooks/useUrlState";

export default function DataMemoryPage(){
	const [selectedRuns, setSelectedRuns] = useUrlParamList("runs");

	return(
		<>
			<RunSelector
				value={selectedRuns}
				onChange={setSelectedRuns}
			/>

			{selectedRuns.length > 0 && (
				<ErrorBoundary label="Memory data" resetKeys={selectedRuns}>
					<MemoryPanels runs={selectedRuns} />
				</ErrorBoundary>
			)}
		</>
	)
}
