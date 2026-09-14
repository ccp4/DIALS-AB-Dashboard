"""
The metric registry: one entry per xia2-summary.dat metric, with its label,
unit, formatter, and whether higher or lower is better. Served to the
frontend as part of `/cohort`.

`better` is `None` where there's no real direction — e.g. `low_resolution_limit`
reflects data-collection geometry, not something either DIALS build improves.
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
