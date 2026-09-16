import type { NavigateFunction } from "react-router-dom";

/** The one navigation call both dataset-detail entry points (ExplorePage's
 * manual selector, and a MetricScatter point click in CohortGrid) use. */
export function goToDataset(navigate: NavigateFunction, run: string | null | undefined, dataset: string) {
    navigate(`/explore/dataset/${run}/${dataset}`);
}
