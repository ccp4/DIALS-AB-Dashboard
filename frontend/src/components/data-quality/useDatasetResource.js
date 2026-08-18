import { useEffect, useState } from "react";

export function useDatasetResource(run_id, dataset, metric) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiURL = "http://localhost:8000";

  useEffect(() => {
    if (!dataset) return;

const fetchData = async () => {
  try {
    setLoading(true);
    setError("");
    const response = await fetch(
      `${apiURL}/runs/${run_id}/dataset/${dataset}/${metric}`
    );
    const result = await response.json();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

    fetchData();
  }, [run_id, dataset, metric]);

  return {
    data,
    loading,
    error,
  };
}