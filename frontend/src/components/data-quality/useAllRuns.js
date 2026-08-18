import { useEffect, useState } from "react";

export function useAllRuns() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiURL = "http://localhost:8000";

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const response = await fetch(`${apiURL}/runs/`);
        if (!response.ok) {
          throw new Error("Failed to fetch runs");
        }
        const data = await response.json();
        setRuns(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRuns();
  }, []);

  return {
    runs,
    loading,
    error,
  };
}