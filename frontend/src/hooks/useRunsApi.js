import { useApi } from "./useApi";

/** Every run available in the workspace. */
export function useAllRuns() {
  const { data, loading, error } = useApi("/runs/");

  return {
    runs: data ?? [],
    loading,
    error,
  };
}

/** A run's dataset list — used to populate a dataset picker. */
export function useListDatasets(runId, options) {
  const { data, loading, error } = useApi(runId ? `/runs/${runId}` : null, options);

  return {
    datasets: data?.datasets ?? [],
    loading,
    error,
  };
}

/** One dataset's resolution/merging_stats series for a given run and metric. */
export function useDatasetResource(run_id, dataset, metric) {
  const { data, loading, error } = useApi(
    dataset ? `/runs/${run_id}/dataset/${dataset}/${metric}` : null
  );

  return {
    data: data ?? [],
    loading,
    error,
  };
}
