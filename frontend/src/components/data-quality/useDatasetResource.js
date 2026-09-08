import { useApi } from "../../hooks/useApi";

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
