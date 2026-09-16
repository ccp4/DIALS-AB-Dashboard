import { Chip, Stack } from "@mui/material";

import { formatValue, metricValue } from "../../utils/metricFormat";
import type { MetricVariant } from "../../utils/metricFormat";

interface CohortRow {
    status: string;
    A: MetricVariant | null;
    B: MetricVariant | null;
}

interface Metric {
    key: string;
    label: string;
    formatter: string;
    better: "higher" | "lower" | null;
}

const WRAPPING_LABEL_SX = {
    height: "auto",
    "& .MuiChip-label": {
        display: "block",
        whiteSpace: "normal",
        padding: "6px 4px",
        textAlign: "center",
        lineHeight: 1.4,
    },
};

const WRAPPING_LABEL_WITH_VALUES_SX = {
    ...WRAPPING_LABEL_SX,
    "& .MuiChip-label": {
        ...WRAPPING_LABEL_SX["& .MuiChip-label"],
        whiteSpace: "pre-line",
    },
};

interface WhatMovedStripProps {
    row: CohortRow;
    metrics: Metric[];
}

/**
 * One badge per cohort metric, showing how far B moved from A on this one
 * sample, plus the raw A/B values. Colour is a directional judgement about
 * this row (success/error), never tokens.variant — those colours are
 * reserved for per-variant series, and this is neither.
 */
export default function WhatMovedStrip({ row, metrics }: WhatMovedStripProps) {
    return (
        <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 2, flexWrap: "wrap" }}>
            {metrics.map((metric) => {
                const a = metricValue(row.A, metric.key);
                const b = metricValue(row.B, metric.key);

                if (row.status !== "complete" || a == null || b == null) {
                    return (
                        <Chip
                            key={metric.key}
                            label={`${metric.label}: —`}
                            variant="outlined"
                            sx={WRAPPING_LABEL_SX}
                        />
                    );
                }

                // Undefined, not 0%, when A is 0 — forcing it to 0% would show
                // "+0.0%" on a chip whose colour (below) reflects a real change.
                const delta = a !== 0 ? ((b - a) / a) * 100 : null;
                const improved =
                    b === a
                        ? null
                        : metric.better === "higher"
                            ? b > a
                            : metric.better === "lower"
                                ? b < a
                                : null;

                const color = improved === null ? "default" : improved ? "success" : "error";

                const deltaLabel = delta === null
                    ? (b === a ? "no change" : `${b > a ? "+" : "-"}${formatValue(Math.abs(b - a), metric.formatter)}`)
                    : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;

                return (
                    <Chip
                        key={metric.key}
                        label={
                            `${metric.label}: ${deltaLabel}\n` +
                            `${formatValue(a, metric.formatter)} → ${formatValue(b, metric.formatter)}`
                        }
                        color={color}
                        variant={color === "default" ? "outlined" : "filled"}
                        sx={WRAPPING_LABEL_WITH_VALUES_SX}
                    />
                );
            })}
        </Stack>
    );
}
