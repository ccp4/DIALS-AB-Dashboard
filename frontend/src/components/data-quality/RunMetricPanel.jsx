import { useEffect } from "react";
import {
    Card,
    CardContent,
    Typography,
    Grid,
    Switch,
    FormControlLabel
} from "@mui/material";
import RunPanel from "./RunPanel";
import { useUrlParam, useUrlParamMap } from "../../hooks/useUrlState";

function RunMetricPanel({ title, run_ids, metric }) {

    const [syncRaw, setSyncRaw] = useUrlParam(`${metric}_sync`);
    const sync = syncRaw === "1";
    const setSync = (enabled) => setSyncRaw(enabled ? "1" : null);

    const [datasets, setDatasets] = useUrlParamMap(`${metric}_ds`);

    // `datasets` is keyed by run id, but nothing else ties its lifetime to
    // `run_ids` — deselecting a run leaves its entry (and its dataset name)
    // in the URL forever. Prune on every change; idempotent once nothing is
    // stale, so this settles in one extra render rather than looping.
    useEffect(() => {
        const stale = Object.keys(datasets).some(id => !run_ids.includes(id));
        if (!stale) return;

        setDatasets(
            Object.fromEntries(
                Object.entries(datasets).filter(([id]) => run_ids.includes(id))
            )
        );
    }, [run_ids, datasets, setDatasets]);

    const handleDatasetChange = (changedRunId, dataset) => {
        if (sync) {
            // Every run uses the same dataset
            const syncedDatasets = {};
            run_ids.forEach(runId => {
                syncedDatasets[runId] = dataset;
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

    const handleSyncToggle = (enabled) => {
        setSync(enabled);
        if (!enabled) return;

        const firstSelected = datasets[run_ids[0]];
        if (!firstSelected) return;

        const synced = {};
        run_ids.forEach(id => {
            synced[id] = firstSelected;
        });

        setDatasets(synced);
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

                <FormControlLabel
                    control={
                        <Switch
                            checked={sync}
                            onChange={(e) => handleSyncToggle(e.target.checked)}
                        />
                    }
                    label="Synchronise charts"
                />

                <Grid container spacing={2}>
                    {run_ids.map(runId => (
                        <Grid size={{ xs: 12, md: 6 }} key={runId}>
                            <RunPanel
                                runId={runId}
                                metric={metric}
                                dataset={datasets[runId]}
                                onDatasetChange={(dataset) =>
                                    handleDatasetChange(runId, dataset)
                                }
                            />
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
}

export default RunMetricPanel;