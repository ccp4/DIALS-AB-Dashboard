import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Card,
    CardContent,
    Typography,
    Grid,
    Switch,
    FormControlLabel
} from "@mui/material";
import RunPanel from "./RunPanel";
import { encodeParamMap, useUrlParam, useUrlParamMap } from "../../hooks/useUrlState";
import { useApiAll } from "../../hooks/useApi";

interface RunMetadata {
    datasets: string[];
}

interface RunMetricPanelProps {
    title: string;
    run_ids: string[];
    metric: string;
}

function RunMetricPanel({ title, run_ids, metric }: RunMetricPanelProps) {

    const [syncRaw, setSyncRaw] = useUrlParam(`${metric}_sync`);
    const sync = syncRaw === "1";
    const setSync = (enabled: boolean) => setSyncRaw(enabled ? "1" : null);

    const [datasets, setDatasets] = useUrlParamMap(`${metric}_ds`);
    const [, setSearchParams] = useSearchParams();

    // Which datasets each run actually has — sync must not point a run at a
    // dataset name that belongs to a different run.
    const { data: runInfo } = useApiAll<RunMetadata>(run_ids.map(id => ({ key: id, path: `/runs/${id}` })));
    const datasetsFor = (runId: string) => runInfo[runId]?.datasets ?? [];

    useEffect(() => {
        const next = Object.fromEntries(
            Object.entries(datasets).filter(([id]) => run_ids.includes(id))
        );

        if (sync) {
            const reference = run_ids.map(id => next[id]).find(Boolean);

            if (reference) {
                run_ids.forEach(id => {
                    if (next[id] == null && (runInfo[id]?.datasets ?? []).includes(reference)) {
                        next[id] = reference;
                    }
                });
            }
        }

        if (JSON.stringify(next) !== JSON.stringify(datasets)) {
            setDatasets(next);
        }
    }, [run_ids, datasets, sync, runInfo, setDatasets]);

    const handleDatasetChange = (changedRunId: string, dataset: string | null) => {
        if (sync) {
            const syncedDatasets: Record<string, string | null> = {};
            run_ids.forEach(runId => {
                if (dataset != null && datasetsFor(runId).includes(dataset)) {
                    syncedDatasets[runId] = dataset;
                }
            });
            setDatasets(syncedDatasets);
        } else {
            // Only update the run that changed
            setDatasets({
                ...datasets,
                [changedRunId]: dataset
            });
        }
    };

    const handleSyncToggle = (enabled: boolean) => {
        if (!enabled) {
            setSync(false);
            return;
        }

        // Only rendered (and so only callable) when run_ids.length > 1.
        const firstSelected = datasets[run_ids[0]!];
        setSearchParams(prev => {
            const updated = new URLSearchParams(prev);
            updated.set(`${metric}_sync`, "1");

            if (firstSelected) {
                const synced = Object.fromEntries(
                    run_ids
                        .filter(id => datasetsFor(id).includes(firstSelected))
                        .map(id => [id, firstSelected])
                );
                const encoded = encodeParamMap(synced);

                if (encoded) updated.set(`${metric}_ds`, encoded);
                else updated.delete(`${metric}_ds`);
            }

            return updated;
        }, { replace: true });
    };

    return (
        <Card
            sx={{
                marginBottom: 3,
                padding: 2
            }}
        >
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {title}
                </Typography>

                {run_ids.length > 1 && (
                    <FormControlLabel
                        control={
                            <Switch
                                checked={sync}
                                onChange={(e) => handleSyncToggle(e.target.checked)}
                            />
                        }
                        label="Synchronise charts"
                    />
                )}

                <Grid container spacing={2}>
                    {run_ids.length === 0 ? (
                        <Grid size={{ xs: 12 }}>
                            <RunPanel metric={metric} onDatasetChange={() => {}} single />
                        </Grid>
                    ) : run_ids.map(runId => (
                        <Grid size={{ xs: 12, md: run_ids.length === 1 ? 12 : 6 }} key={runId}>
                            <Typography variant="subtitle1" gutterBottom>
                                {runId}
                            </Typography>
                            <RunPanel
                                runId={runId}
                                metric={metric}
                                dataset={datasets[runId]}
                                onDatasetChange={(dataset) =>
                                    handleDatasetChange(runId, dataset)
                                }
                                single={run_ids.length === 1}
                            />
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
}

export default RunMetricPanel;