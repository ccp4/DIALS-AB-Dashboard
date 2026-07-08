import ReactECharts from "echarts-for-react";
import { Grid, Typography } from "@mui/material";
import MemoryOverlayChart from "./MemoryOverlayChart";
import SingleMemoryPlot from "./SingleMemoryPlot";


function MemoryComparisonBlock({ data }) {

    return(
        <Grid container spacing={3}>

    <Grid size={{ xs: 12, md: 8 }}>
        <MemoryOverlayChart data={data} />
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