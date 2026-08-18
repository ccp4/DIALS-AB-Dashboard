import { useEffect, useState } from "react";

export function useListDatasets( runId ){
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiURL = "http://localhost:8000";

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        console.log(runId)
        const response = await fetch(`${apiURL}/runs/${runId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch runs");
        }
        const data = await response.json();
        setDatasets(data["datasets"]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  return {
    datasets,
    loading,
    error,
  };
}