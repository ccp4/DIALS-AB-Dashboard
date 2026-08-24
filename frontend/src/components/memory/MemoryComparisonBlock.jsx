import { useState } from "react";
import { Box, Grid, ToggleButton, ToggleButtonGroup } from "@mui/material";
import MemoryOverlayChart from "./MemoryOverlayChart";
import MemoryRankChart from "./MemoryRankChart";
import SingleMemoryPlot from "./SingleMemoryPlot";


function MemoryComparisonBlock({ data }) {
    const [mode, setMode] = useState("diff");

    return(
        <Grid container spacing={3}>

    <Grid size={{ xs: 12, md: 8 }}>
        <Box sx={{ mb: 1 }}>
            <ToggleButtonGroup
                value={mode}
                exclusive
                size="small"
                onChange={(event, next) => next && setMode(next)}
            >
                <ToggleButton value="ab">A, B</ToggleButton>
                <ToggleButton value="diff">A − B</ToggleButton>
            </ToggleButtonGroup>
        </Box>

        {mode === "ab" ? <MemoryRankChart data={data} /> : <MemoryOverlayChart data={data} />}
    </Grid>

    <Grid size={{ xs: 12, md: 4 }}>

        {Object.entries(data).map(([run, runData]) => (

            <SingleMemoryPlot
                key={run}
                run={run}
                data={runData}
            />

        ))}

    </Grid>

</Grid>
    )
}

export default MemoryComparisonBlock;