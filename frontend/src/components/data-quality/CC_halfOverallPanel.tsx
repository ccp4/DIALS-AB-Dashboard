import CC_halfOverallChart from "./CC_halfOverallChart";
import type { RunCCHalf } from "./CC_halfOverallChart";
import LoadingState from "../LoadingState";
import { useApiAll } from "../../hooks/useApi";

/**
 * Fetches the CC½ threshold crossing for each selected run and hands it to
 * `CC_halfOverallChart`. Exists so the fetch sits inside a boundary below the
 * run selector rather than in the page beside it.
 */
export default function CC_halfOverallPanel({ runs }: { runs: string[] }) {
    const { data } = useApiAll<RunCCHalf>(
        runs.map(run => ({ key: run, path: `/runs/${run}/cc_half` }))
    );

    // Runs already in `data` render immediately; only the ones still in
    // flight get a loading line
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
