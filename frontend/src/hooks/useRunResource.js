import { useEffect, useState } from "react";

const apiURL = "http://localhost:8000";

export default function useRunResource(selectedRuns, resource) {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Remove data for runs that are no longer selected
    useEffect(() => {
        setData(prev =>
            Object.fromEntries(
                selectedRuns
                    .filter(run => prev[run])
                    .map(run => [run, prev[run]])
            )
        );
    }, [selectedRuns]);

    // Fetch any newly-selected runs
    useEffect(() => {

        async function fetchMissingRuns() {

            const missingRuns = selectedRuns.filter(
                run => !data[run]
            );

            if (!missingRuns.length) {
                return;
            }

            setLoading(true);
            setError(null);

            try {

                const results = await Promise.all(
                    missingRuns.map(async run => {

                        const res = await fetch(
                            `${apiURL}/runs/${run}/${resource}`
                        );

                        if (!res.ok) {
                            throw new Error(`Failed to fetch ${resource} for ${run}`);
                        }

                        return {
                            run,
                            data: await res.json()
                        };
                    })
                );

                setData(prev => ({
                    ...prev,
                    ...Object.fromEntries(
                        results.map(({ run, data }) => [run, data])
                    )
                }));

            } catch (err) {
                console.error(err);
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        fetchMissingRuns();

    }, [selectedRuns, resource, data]);

    return {
        data,
        loading,
        error
    };
}