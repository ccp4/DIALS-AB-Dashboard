import RawDataChart from "../components/RawDataChart";
import { useState, useEffect } from "react";
import RunSelector from "../components/RunSelector";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import useRunResource from "../hooks/useRunResource";
import MetricGroupCard from "../components/MetricGroupCard";

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

            <MetricGroupCard
                title="Raw Metrics"
                data={raw.data}
            />

            <MetricGroupCard
                title="Comparison Metrics"
                data={comparison.data}
            />
        </>
    );
}