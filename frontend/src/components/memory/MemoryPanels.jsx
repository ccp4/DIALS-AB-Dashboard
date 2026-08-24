import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ErrorBoundary from "../ErrorBoundary";
import LoadingState from "../LoadingState";
import MemoryABChart from "./MemoryABChart";
import MemoryComparisonBlock from "./MemoryComparisonBlock";
import MemoryProfilerPlot from "./MemoryProfilerPlot";
import CumulativeTimeTaken from "./CumulativeTimeTaken";
import { useApiAll } from "../../hooks/useApi";

const DS_PREFIX = "ds_";

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
	const { data } = useApiAll(
		runs.map(run => ({ key: run, path: `/runs/${run}/memory` }))
	);

	// Each `MemoryProfilerPlot` instance owns a `ds_<run>` URL param
	// (`useUrlParam` on its own `run` prop). Deselecting a run unmounts that
	// instance, but a component can't safely clean up its own URL state from
	// an unmount effect — StrictMode's mount/cleanup/mount probe would fire
	// that cleanup for real on every initial mount and wipe out a dataset
	// selection loaded straight from a link. So the parent, which stays
	// mounted and knows the live `runs` list, prunes instead.
	const [searchParams, setSearchParams] = useSearchParams();

	useEffect(() => {
		const stale = [...searchParams.keys()].filter(
			key => key.startsWith(DS_PREFIX) && !runs.includes(key.slice(DS_PREFIX.length))
		);

		if (!stale.length) return;

		setSearchParams(prev => {
			const updated = new URLSearchParams(prev);
			stale.forEach(key => updated.delete(key));
			return updated;
		}, { replace: true });
	}, [runs, searchParams, setSearchParams]);

	// Runs already in `data` keep rendering; only the ones still in flight get
	// a loading line, so adding a run to the selection doesn't blank the ones
	// already on screen.
	const pending = runs.filter(run => !(run in data));

	return (
		<>
			{pending.length > 0 && (
				<LoadingState
					label={`Loading memory data for ${pending.length} more run${pending.length === 1 ? "" : "s"}...`}
				/>
			)}

			<ErrorBoundary label="Memory comparison" resetKeys={runs}>
				<MemoryComparisonBlock data={data} />
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
