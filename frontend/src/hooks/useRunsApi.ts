import { useApi, type UseApiOptions } from "./useApi";

interface RunMetadata {
  run_id: string;
  datasets: string[];
  builds: { A: string | null; B: string | null };
}

interface TraceSeries {
  name: string;
  data: [number, number][];
}

type DatasetSeries = Record<string, TraceSeries[]>;

/** Every run available in the workspace. */
export function useAllRuns() {
  const { data, loading, error } = useApi<string[]>("/runs/");

  return {
    runs: data ?? [],
    loading,
    error,
  };
}

/** A run's dataset list — used to populate a dataset picker. */
export function useListDatasets(runId: string | null, options?: UseApiOptions) {
  const { data, loading, error } = useApi<RunMetadata>(runId ? `/runs/${runId}` : null, options);

  return {
    datasets: data?.datasets ?? [],
    loading,
    error,
  };
}

/** One dataset's resolution/merging_stats series for a given run and metric. */
export function useDatasetResource(run_id: string, dataset: string | null, metric: string) {
  const { data, loading, error } = useApi<DatasetSeries>(
    dataset ? `/runs/${run_id}/dataset/${dataset}/${metric}` : null
  );

  return {
    data: data ?? [],
    loading,
    error,
  };
}
