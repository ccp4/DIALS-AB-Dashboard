"""
The metric registry — the one place "is this metric better higher or lower"
is decided, per CLAUDE.md's note that the dashboard has no single sign
convention for "B improved". Served to the frontend as part of `/cohort` so
metric metadata is never hardcoded on that side.

`better` is `None` where there genuinely isn't a direction: `low_resolution_limit`
reflects data-collection geometry (detector distance, sweep coverage), not
something either DIALS build makes better or worse.
"""

METRICS = [
    {
        "key": "high_resolution_limit",
        "label": "High resolution limit",
        "unit": "Å",
        "formatter": "resolution",
        "better": "lower",
    },
    {
        "key": "low_resolution_limit",
        "label": "Low resolution limit",
        "unit": "Å",
        "formatter": "resolution",
        "better": None,
    },
    {
        "key": "completeness",
        "label": "Completeness",
        "unit": "%",
        "formatter": "percent",
        "better": "higher",
    },
    {
        "key": "multiplicity",
        "label": "Multiplicity",
        "unit": "",
        "formatter": "ratio",
        "better": "higher",
    },
    {
        "key": "i_over_sigma",
        "label": "I/σ",
        "unit": "",
        "formatter": "ratio",
        "better": "higher",
    },
    {
        "key": "r_merge",
        "label": "Rmerge(I+/-)",
        "unit": "",
        "formatter": "ratio",
        "better": "lower",
    },
    {
        "key": "cc_half",
        "label": "CC½",
        "unit": "",
        "formatter": "ratio",
        "better": "higher",
    },
    {
        "key": "anomalous_completeness",
        "label": "Anomalous completeness",
        "unit": "%",
        "formatter": "percent",
        "better": "higher",
    },
    {
        "key": "anomalous_multiplicity",
        "label": "Anomalous multiplicity",
        "unit": "",
        "formatter": "ratio",
        "better": "higher",
    },
    {
        "key": "peak_memory",
        "label": "Peak memory",
        "unit": "MiB",
        "formatter": "mib",
        "better": "lower",
    },
    {
        "key": "cumulative_runtime",
        "label": "Cumulative runtime",
        "unit": "s",
        "formatter": "seconds",
        "better": "lower",
    },
]
