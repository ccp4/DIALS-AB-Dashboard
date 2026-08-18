import CC_halfOverallChart from "./CC_halfOverallChart";
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
    const { data, loading } = useApiAll(
        runs.map(run => ({ key: run, path: `/runs/${run}/raw` }))
    );

    if (loading) return <p>Loading merging statistics...</p>;

    return <CC_halfOverallChart data={data} />;
}
