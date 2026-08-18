import ChartCard from "../components/ChartCard"
import { Grid } from "@mui/material"
import MemoryABChart from "../components/MemoryABChart";
import MemoryRankChart from "../components/MemoryRankChart";
import MemoryComparisonBlock from "../components/MemoryComparisonBlock";
import RunSelector from "../components/RunSelector";
import React, { useState, useEffect } from "react";
import useRunResource from "../hooks/useRunResource";
import MemoryProfilerPlot from "../components/MemoryProfilerPlot";
import CumulativeTimeTaken from "../components/CumulativeTimeTaken";
import ErrorBoundary from "../components/ErrorBoundary";

export default function DataMemoryPage(){
	const [selectedRuns, setSelectedRuns] = useState([]);
    const memory = useRunResource(selectedRuns, "memory");
    const loading = memory.loading
    const resetKey = selectedRuns.join()

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
					<ErrorBoundary label="Memory comparison" resetKeys={[resetKey]}>
						<MemoryComparisonBlock
							data={memory.data}
						/>
					</ErrorBoundary>

					<ErrorBoundary label="Peak memory distribution" resetKeys={[resetKey]}>
						<MemoryRankChart
							data={memory.data}
						/>
					</ErrorBoundary>

					<ErrorBoundary label="A vs B memory" resetKeys={[resetKey]}>
						<MemoryABChart
							data={memory.data}
						/>
					</ErrorBoundary>

					{Object.entries(memory.data).map(
                    ([run, runData]) => (
							<React.Fragment key={run}>
							<h3>{run}</h3>
							<ErrorBoundary label={`${run} memory profile`} resetKeys={[run]}>
								<MemoryProfilerPlot run={run} />
							</ErrorBoundary>
							</React.Fragment>
						))}

					{Object.entries(memory.data).map(
						([run, runData]) => (
							<React.Fragment key={run}>
							<h3>{run} cumulative time taken</h3>
							<ErrorBoundary label={`${run} cumulative timings`} resetKeys={[run]}>
								<CumulativeTimeTaken run={run} />
							</ErrorBoundary>
							</React.Fragment>
						))}
				</>
            )}

        </>
	)
}
