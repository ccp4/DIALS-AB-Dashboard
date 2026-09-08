import { useState } from "react";
import { Card, CardActionArea, CardContent, Dialog, DialogContent, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";

import CoverageLine from "../CoverageLine";
import LoadingState from "../LoadingState";
import MetricScatter from "./MetricScatter";
import { goToDataset } from "../../navigation";
import { tokens } from "../../theme/tokens";
import { useApi } from "../../hooks/useApi";

/**
 * The small-multiples cohort overview — one MetricScatter per registry
 * metric, all showing the same run's samples.
 *
 * With no run selected, the same grid still renders — one skeleton
 * MetricScatter per metric — via the standalone `/metrics` registry route,
 * since the metric list is static and known ahead of any run.
 *
 * @param {string|null} run Selected run id, or null if none selected yet.
 */
export default function CohortGrid({ run }) {
    const [expandedKey, setExpandedKey] = useState(null);
    const { data, loading: loadingCohort } = useApi(run ? `/runs/${run}/cohort` : null);
    const { data: metricsOnly, loading: loadingMetrics } = useApi(run ? null : "/metrics");
    const navigate = useNavigate();

    if (run ? loadingCohort : loadingMetrics) {
        return <LoadingState label={run ? "Loading cohort data..." : "Loading metrics..."} />;
    }

    const metrics = data?.metrics ?? metricsOnly ?? [];
    if (!metrics.length) return null;

    const rows = data?.rows ?? [];

    const expandedMetric = metrics.find((m) => m.key === expandedKey) ?? null;
    const onPointClick = (sampleId) => goToDataset(navigate, run, sampleId);

    const missingA = rows.filter(r => r.status === "missing_a").map(r => `${r.dataset}/${r.sample}`);
    const missingB = rows.filter(r => r.status === "missing_b").map(r => `${r.dataset}/${r.sample}`);

    return (
        <>
            {data && (
                <CoverageLine coverage={data.coverage} missingA={missingA} missingB={missingB} sx={{ mb: 2 }} />
            )}

            <Grid container spacing={2}>
                {metrics.map((metric) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={metric.key}>
                        <Card>
                            <CardActionArea onClick={() => setExpandedKey(metric.key)}>
                                <CardContent>
                                    <MetricScatter
                                        rows={rows}
                                        metric={metric}
                                        style={{ height: tokens.chart.height.panel, width: "100%" }}
                                        onPointClick={onPointClick}
                                    />
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={expandedMetric !== null} onClose={() => setExpandedKey(null)} maxWidth="md" fullWidth>
                <DialogContent>
                    {expandedMetric && (
                        <MetricScatter
                            rows={rows}
                            metric={expandedMetric}
                            style={{ height: tokens.chart.height.tall, width: "100%" }}
                            enableZoom
                            onPointClick={onPointClick}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
