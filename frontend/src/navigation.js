/** The one navigation call both dataset-detail entry points (ExplorePage's
 * manual selector, and a MetricScatter point click in CohortGrid) use. */
export function goToDataset(navigate, run, dataset) {
    navigate(`/explore/dataset/${run}/${dataset}`);
}
