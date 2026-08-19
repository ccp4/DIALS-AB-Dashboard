import CC_halfOverallChart from "./CC_halfOverallChart";
import LoadingState from "./LoadingState";
import { useApiAll } from "../hooks/useApi";

/**
 * Fetches the raw resource for each selected run and hands it to
 * `CC_halfOverallChart`.
 *
 * Exists so the fetch sits inside a boundary below the run selector rather
 * than in the page beside it. Retired along with `/raw` in phase 1b, when
 * selection moves into `RunMetricPanel` and per-dataset requests replace it.
 *
 * @param {string[]} runs Run ids.
 */
export default function CC_halfOverallPanel({ runs }) {
    const { data } = useApiAll(
        runs.map(run => ({ key: run, path: `/runs/${run}/raw` }))
    );

    // Runs already in `data` render immediately; only the ones still in
    // flight get a loading line, rather than blanking the whole panel every
    // time a run is added to the selection.
    const pending = runs.filter(run => !(run in data));

    return (
        <>
            <CC_halfOverallChart data={data} />

            {pending.length > 0 && (
                <LoadingState
                    label={`Loading merging statistics for ${pending.length} more run${pending.length === 1 ? "" : "s"}...`}
                />
            )}
        </>
    );
}
