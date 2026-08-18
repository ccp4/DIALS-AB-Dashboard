import RawDataChart from "../components/RawDataChart";
import { useState, useEffect } from "react";
import RunSelector from "../components/RunSelector";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import useRunResource from "../hooks/useRunResource";
import MetricGroupCard from "../components/MetricGroupCard";
import CC_halfOverallChart from "../components/CC_halfOverallChart";
import MultiRunSelector from "../components/data-quality/MultiRunSelector";
import RunMetricPanel from "../components/data-quality/RunMetricPanel";

export default function DataSetsPage() {
    const [selectedRuns, setSelectedRuns] = useState([]);

    const raw = useRunResource(selectedRuns, "raw");
    // const comparison = useRunResource(selectedRuns, "comparison");

    // const loading = raw.loading || comparison.loading;


    return (
        <>
            {/* <RunSelector
                value={selectedRuns}
                onChange={setSelectedRuns}
            /> */}

            <MultiRunSelector value={selectedRuns} onChange={setSelectedRuns} />

            <RunMetricPanel title="Raw" run_ids={selectedRuns} metric="raw" />
            
            <RunMetricPanel title="Comparison" run_ids={selectedRuns} metric="comparison" />
            {/* <RunMetricPanel title="Comparison" run_ids={selectedRuns} metric="comparison" /> */}

            <CC_halfOverallChart data={raw.data} /> 

            {/* <MetricGroupCard
                title="Raw Metrics"
                data={raw.data}
                type="raw"
            /> */}

            {/* <MetricGroupCard
                title="Comparison Metrics"
                data={comparison.data}
                type="comparison"
            /> */}
        </>
    );
}