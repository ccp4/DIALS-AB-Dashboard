import React from "react";
import ErrorBoundary from "./ErrorBoundary";
import MemoryABChart from "./MemoryABChart";
import MemoryComparisonBlock from "./MemoryComparisonBlock";
import MemoryProfilerPlot from "./MemoryProfilerPlot";
import MemoryRankChart from "./MemoryRankChart";
import CumulativeTimeTaken from "./CumulativeTimeTaken";
import { useApiAll } from "../hooks/useApi";

/**
 * The body of the memory and timings page.
 *
 * Split out from the page so the run selector sits *outside* the boundary that
 * this component's fetch escalates to — otherwise a failed request would take
 * the selector with it and leave no control to retry from.
 *
 * @param {string[]} runs Run ids to fetch peak memory for.
 */
export default function MemoryPanels({ runs }) {
	const { data, loading } = useApiAll(
		runs.map(run => ({ key: run, path: `/runs/${run}/memory` }))
	);

	if (loading) return <p>Loading...</p>;

	return (
		<>
			<ErrorBoundary label="Memory comparison" resetKeys={runs}>
				<MemoryComparisonBlock data={data} />
			</ErrorBoundary>

			<ErrorBoundary label="Peak memory distribution" resetKeys={runs}>
				<MemoryRankChart data={data} />
			</ErrorBoundary>

			<ErrorBoundary label="A vs B memory" resetKeys={runs}>
				<MemoryABChart data={data} />
			</ErrorBoundary>

			{Object.keys(data).map(run => (
				<React.Fragment key={run}>
					<h3>{run}</h3>
					<ErrorBoundary label={`${run} memory profile`} resetKeys={[run]}>
						<MemoryProfilerPlot run={run} />
					</ErrorBoundary>
				</React.Fragment>
			))}

			{Object.keys(data).map(run => (
				<React.Fragment key={run}>
					<h3>{run} cumulative time taken</h3>
					<ErrorBoundary label={`${run} cumulative timings`} resetKeys={[run]}>
						<CumulativeTimeTaken run={run} />
					</ErrorBoundary>
				</React.Fragment>
			))}
		</>
	);
}
