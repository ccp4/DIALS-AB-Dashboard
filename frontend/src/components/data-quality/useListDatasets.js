import { useApi } from "../../hooks/useApi";

export function useListDatasets(runId, options) {
  const { data, loading, error } = useApi(runId ? `/runs/${runId}` : null, options);

  return {
    datasets: data?.datasets ?? [],
    loading,
    error,
  };
}
