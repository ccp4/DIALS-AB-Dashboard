import { Alert, Box, Typography } from "@mui/material";

import { useApiAll } from "../hooks/useApi";

interface RunBuilds {
    A: string | null;
    B: string | null;
}

interface RunMetadata {
    builds: RunBuilds;
}

/**
 * A is not a fixed baseline — it tracks whatever main was at run time, so a
 * difference between two runs may be baseline drift rather than an effect of
 * B. Surfaces each selected run's A/B build, and warns when they differ.
 */
export default function RunProvenance({ runs }: { runs: string[] }) {
    const { data } = useApiAll<RunMetadata>(runs.map(run => ({ key: run, path: `/runs/${run}` })));

    const entries = runs
        .filter(run => run in data)
        .map(run => ({ run, builds: data[run]!.builds }));

    if (!entries.length) return null;

    const distinctA = new Set(entries.map(e => e.builds.A).filter(Boolean));

    return (
        <Box sx={{ mb: 2 }}>
            {distinctA.size > 1 && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                    Selected runs use different A builds — a difference between them may be
                    baseline drift rather than an effect of B.
                </Alert>
            )}

            {entries.map(({ run, builds }) => (
                <Typography key={run} variant="body2" color="text.secondary">
                    <strong>{run}</strong> — A: {builds.A ?? "unknown"} · B: {builds.B ?? "unknown"}
                </Typography>
            ))}
        </Box>
    );
}
