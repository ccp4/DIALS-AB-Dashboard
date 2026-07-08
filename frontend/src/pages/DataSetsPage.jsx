import RawDataChart from "../components/RawDataChart";
import { useState, useEffect } from "react";
import RunSelector from "../components/RunSelector";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import useRunResource from "../hooks/useRunResource";
import MetricGroupCard from "../components/MetricGroupCard";
import CC_halfOverallChart from "../components/CC_halfOverallChart";

export default function DataSetsPage() {
    const [selectedRuns, setSelectedRuns] = useState([]);

    const raw = useRunResource(selectedRuns, "raw");
    const comparison = useRunResource(selectedRuns, "comparison");

    const loading = raw.loading || comparison.loading;


    return (
        <>
            <RunSelector
                value={selectedRuns}
                onChange={setSelectedRuns}
            />

            <CC_halfOverallChart data={raw.data} />

            <MetricGroupCard
                title="Raw Metrics"
                data={raw.data}
                type="raw"
            />

            <MetricGroupCard
                title="Comparison Metrics"
                data={comparison.data}
                type="comparison"
            />
        </>
    );
}