import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import CoverageLine from "../CoverageLine";
import ErrorBoundary from "../ErrorBoundary";
import LoadingState from "../LoadingState";
import MemoryABChart from "./MemoryABChart";
import MemoryComparisonBlock from "./MemoryComparisonBlock";
import MemoryProfilerPlot from "./MemoryProfilerPlot";
import CumulativeTimeTaken from "./CumulativeTimeTaken";
import { useApiAll } from "../../hooks/useApi";

interface MemoryStatusRow {
	label: string;
	A: number | null;
	B: number | null;
	status: "complete" | "missing_a" | "missing_b";
}

const DS_PREFIX = "ds_";

function memoryCoverage(rows: MemoryStatusRow[]) {
	const counts = { complete: 0, missing_a: 0, missing_b: 0 };
	rows.forEach(row => { counts[row.status] = (counts[row.status] ?? 0) + 1; });
	return { total: rows.length, ...counts };
}

/**
 * The body of the memory and timings page. Split out from the page so the
 * run selector sits *outside* the boundary that this component's fetch
 * escalates to — otherwise a failed request would take the selector with it
 * and leave no control to retry from.
 */
export default function MemoryPanels({ runs }: { runs: string[] }) {
	const { data } = useApiAll<MemoryStatusRow[]>(
		runs.map(run => ({ key: run, path: `/runs/${run}/memory` }))
	);

	// Each `MemoryProfilerPlot` owns a `ds_<run>` URL param but can't safely
	// clean it up on its own unmount — StrictMode's mount/cleanup/mount probe
	// would fire that for real and wipe a link-loaded selection. The parent
	// prunes stale ones instead, since it stays mounted with the live `runs` list.
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

	// Runs already in `data` keep rendering; only in-flight ones get a loading line.
	const pending = runs.filter(run => !(run in data));

	return (
		<>
			{pending.length > 0 && (
				<LoadingState
					label={`Loading memory data for ${pending.length} more run${pending.length === 1 ? "" : "s"}...`}
				/>
			)}

			{Object.entries(data).map(([run, rows]) => {
				const coverage = memoryCoverage(rows);
				const missingA = rows.filter(r => r.status === "missing_a").map(r => r.label);
				const missingB = rows.filter(r => r.status === "missing_b").map(r => r.label);
				return (
					<CoverageLine
						key={run}
						coverage={coverage}
						missingA={missingA}
						missingB={missingB}
						prefix={`${run}: `}
					/>
				);
			})}

			<ErrorBoundary label="Memory comparison" resetKeys={runs}>
				<MemoryComparisonBlock data={data} />
			</ErrorBoundary>

			<ErrorBoundary label="A vs B memory" resetKeys={runs}>
				<MemoryABChart data={data} />
			</ErrorBoundary>

			{Object.keys(data).length === 0 ? (
				<ErrorBoundary label="memory profile" resetKeys={runs}>
					<MemoryProfilerPlot />
				</ErrorBoundary>
			) : Object.keys(data).map(run => (
				<React.Fragment key={run}>
					<h3>{run}</h3>
					<ErrorBoundary label={`${run} memory profile`} resetKeys={[run]}>
						<MemoryProfilerPlot run={run} />
					</ErrorBoundary>
				</React.Fragment>
			))}

			{Object.keys(data).length === 0 ? (
				<ErrorBoundary label="cumulative timings" resetKeys={runs}>
					<CumulativeTimeTaken />
				</ErrorBoundary>
			) : Object.keys(data).map(run => (
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
