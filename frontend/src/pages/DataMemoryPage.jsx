import ChartCard from "../components/ChartCard"
import { Grid } from "@mui/material"
import MemoryABChart from "../components/MemoryABChart";
import MemoryComparisonBlock from "../components/MemoryComparisonBlock";
import RunSelector from "../components/RunSelector";
import { useState, useEffect } from "react";
import useRunResource from "../hooks/useRunResource";

export default function DataMemoryPage(){
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
					<MemoryComparisonBlock
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