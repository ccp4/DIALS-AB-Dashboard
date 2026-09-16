# Dashboard for visualising DIALS A/B testing

## Prerequisites

Before starting ensure the following are installed:

- Python 3.10+
- Node.js and npm

## Setup and run

Run the setup script — it creates the Python virtualenv, installs dependencies, copies the `.env`
files, and starts the dashboard. The only thing it'll ask you for is `WORKSPACE_DIR`, the path to
your xia2 run data:

```bash
chmod +x setup.sh
./setup.sh
```

## What this dashboard shows

This dashboard visualises runs produced by the [xia2-irrmc-h5](https://github.com/dagewa/xia2-irrmc-h5)
scripts. Every run compares two DIALS builds — **A**, the current main build, and **B**, whatever
change you want to test against it (a branch, a PR, an experimental feature) — across the same
datasets, so you can see where B improves on A and where it doesn't.

A few things worth knowing about the metrics:

- Lower is better for memory and runtime; a lower resolution limit is better for image quality.
  Some metrics don't have a defined direction at all.
- Wherever you see a "N / M complete" line, that's telling you some datasets are missing an A or a
  B result — the comparison genuinely couldn't be made for those, rather than them being silently
  left out of the chart.

### Memory Usage (`/memory`)

Select one or more runs to compare peak memory and processing time.

- **Peak memory ranking** — every dataset in a run, ranked by peak memory, separately for A and B.
- **Overlay by shape** — the same ranking, reshaped to compare how quickly A and B diverge across
  multiple selected runs at once.
- **A vs B scatter** — one point per dataset, A's peak memory against B's, per run.
- **Memory profile** — pick a dataset to see memory use over time for DIALS A and B side by side,
  with the processing stage (spot-finding, indexing, integration) marked on the timeline.
- **Cumulative runtime** — total processing time per dataset, A vs B.

### Data Quality (`/datasets`)

Select one or more runs to compare merging statistics per dataset.

- **Resolution / Merging stats** — pick a dataset to switch between its CC½-vs-resolution curve
  (from `dials.estimate_resolution`) and its merging-statistics curves (from
  `xia2.compare_merging_stats`).
- **CC½ resolution** — per run, the resolution cutoff DIALS reached for A vs B, one point per
  dataset.

### Explore (`/explore`)

Pick a single run to see every dataset at once.

- **Metric grid** — one card per metric (CC½, peak memory, completeness, and more), each plotting
  every dataset's A value against its B value, with the largest outliers highlighted. Click a card
  to see it enlarged, or click a point to open that dataset's detail page.
- **Dataset detail page** — a "what moved" summary across every metric for that one dataset, plus
  the same curves as Data Quality and the same memory profile as Memory Usage, all scoped to it.