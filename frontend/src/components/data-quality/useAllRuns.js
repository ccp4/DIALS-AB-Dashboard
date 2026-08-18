import { useApi } from "../../hooks/useApi";

export function useAllRuns() {
  const { data, loading, error } = useApi("/runs/");

  return {
    runs: data ?? [],
    loading,
    error,
  };
}
