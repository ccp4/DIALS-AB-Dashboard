import { Box, Chip, Stack, Tooltip } from "@mui/material";

import { formatValue, metricValue } from "../theme/metricFormat";

/**
 * One badge per cohort metric, showing how far B moved from A on this one
 * sample. Colour is a directional judgement about this row (success/error),
 * never tokens.variant — those colours are reserved for per-variant series,
 * and this is neither.
 *
 * @param {object} row One CohortResponse row ({status, A, B}).
 * @param {object[]} metrics CohortResponse.metrics (the registry).
 */
export default function WhatMovedStrip({ row, metrics }) {
    return (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {metrics.map((metric) => {
                const a = metricValue(row.A, metric.key);
                const b = metricValue(row.B, metric.key);

                if (row.status !== "complete" || a == null || b == null) {
                    return (
                        <Chip
                            key={metric.key}
                            label={`${metric.label}: —`}
                            variant="outlined"
                        />
                    );
                }

                const delta = a !== 0 ? ((b - a) / a) * 100 : 0;
                const improved =
                    metric.better === "higher"
                        ? b > a
                        : metric.better === "lower"
                            ? b < a
                            : null;

                const color = improved === null ? "default" : improved ? "success" : "error";

                return (
                    <Tooltip
                        key={metric.key}
                        title={
                            <Box>
                                {metric.label}<br />
                                A: {formatValue(a, metric.formatter)}<br />
                                B: {formatValue(b, metric.formatter)}
                            </Box>
                        }
                    >
                        <Chip
                            label={`${metric.label}: ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`}
                            color={color}
                            variant={color === "default" ? "outlined" : "filled"}
                        />
                    </Tooltip>
                );
            })}
        </Stack>
    );
}
