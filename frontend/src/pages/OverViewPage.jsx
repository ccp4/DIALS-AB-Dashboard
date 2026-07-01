import ChartCard from "../components/ChartCard"
import { Grid } from "@mui/material"
import MemoryABChart from "../components/MemoryABChart";
import MemoryComparisonChart from "../components/MemoryComparisonChart";
import ResolutionChecker from "../components/ResolutionChecker"
import RunSelector from "../components/RunSelector";
import { useState, useEffect } from "react";
import useRunResource from "../hooks/useRunResource";

export default function OverViewPage(){
	const [selectedRuns, setSelectedRuns] = useState([]);
    const memory = useRunResource(selectedRuns, "memory");
    const loading = memory.loading

	return(
		<>
			<RunSelector
				value={selectedRuns}
				onChange={setSelectedRuns}
			/>

            {loading && (
                <p>Loading...</p>
            )}

            {!loading && selectedRuns.length > 0 && (
				<>
					<MemoryComparisonChart
						data={memory.data}
					/>

					<MemoryABChart
						data={memory.data}
					/>
				</>
            )}

        </>
	)
}