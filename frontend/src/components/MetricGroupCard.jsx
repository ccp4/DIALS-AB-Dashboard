import { useState } from "react";
import {
    Card,
    CardContent,
    Typography,
    Grid,
    Switch,
    FormControlLabel
} from "@mui/material";

import RawDataChart from "./RawDataChart";

function MetricGroupCard({title,data,type}) {

    const [sync, setSync] = useState(false);
    const [forcedSelection, setForcedSelection] = useState({
        run: null,
        trace: null
    });


    function handleSelectionChange(selection) {
        setForcedSelection(prev => ({
            ...prev,
            ...selection
        }));
    }


    return (
        <Card
            sx={{
                marginBottom: 3,
                padding: 2
            }}
        >

            <CardContent>

                <Typography
                    variant="h6"
                    gutterBottom
                >
                    {title}
                </Typography>


                <FormControlLabel
                    control={
                        <Switch
                            checked={sync}
                            onChange={(e) =>
                                setSync(e.target.checked)
                            }
                        />
                    }
                    label="Synchronise charts"
                />


                <Grid
                    container
                    spacing={2}
                >

                    {Object.entries(data).map(
                        ([run, runData]) => (

                        <Grid
                            xs={12}
                            md={6}
                            key={run}
                        >

                            <Typography variant="h6">
                                {run}
                            </Typography>


                            <RawDataChart
                                type={type}
                                data={runData}
                                sync={sync}
                                forcedSelection={
                                    forcedSelection
                                }
                                onSelectionChange={
                                    handleSelectionChange
                                }
                            />

                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
}

export default MetricGroupCard