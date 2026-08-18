import { useState } from "react";
import {
    Card,
    CardContent,
    Typography,
    Grid,
    Switch,
    FormControlLabel
} from "@mui/material";
import RunPanel from "./RunPanel";

function RunMetricPanel({ title, run_ids, metric }) {

    const [sync, setSync] = useState(false);

    // Not seeded from run_ids: a lazy initialiser runs once, so a run selected
    // later would never get a key. An absent key reads the same as null here.
    const [datasets, setDatasets] = useState({});

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
            setDatasets(prev => ({
                ...prev,
                [changedRunId]: dataset
            }));
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
                        <Grid xs={12} md={6} key={runId}>
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