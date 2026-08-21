import { useState } from "react";
import { Card, CardActionArea, CardContent, Dialog, DialogContent, Grid, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import LoadingState from "./LoadingState";
import MetricScatter from "./MetricScatter";
import { goToDataset } from "../navigation";
import { tokens } from "../theme/tokens";
import { useApi } from "../hooks/useApi";

/**
 * The small-multiples cohort overview — one MetricScatter per registry
 * metric, all showing the same run's samples.
 *
 * @param {string|null} run Selected run id, or null if none selected yet.
 */
export default function CohortGrid({ run }) {
    const [expandedKey, setExpandedKey] = useState(null);
    const { data, loading } = useApi(run ? `/runs/${run}/cohort` : null);
    const navigate = useNavigate();

    if (!run) return null;
    if (loading) return <LoadingState label="Loading cohort data..." />;
    if (!data) return null;

    const expandedMetric = data.metrics.find((m) => m.key === expandedKey) ?? null;
    const onPointClick = (sampleId) => goToDataset(navigate, run, sampleId);

    return (
        <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {data.coverage.complete} / {data.coverage.total} complete
                {data.coverage.missing_a > 0 && ` · ${data.coverage.missing_a} missing A`}
                {data.coverage.missing_b > 0 && ` · ${data.coverage.missing_b} missing B`}
            </Typography>

            <Grid container spacing={2}>
                {data.metrics.map((metric) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={metric.key}>
                        <Card>
                            <CardActionArea onClick={() => setExpandedKey(metric.key)}>
                                <CardContent>
                                    <MetricScatter
                                        rows={data.rows}
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
                            rows={data.rows}
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
