import { useApi } from "../../hooks/useApi";

export function useListDatasets(runId) {
  const { data, loading, error } = useApi(runId ? `/runs/${runId}` : null);

  return {
    datasets: data?.datasets ?? [],
    loading,
    error,
  };
}
