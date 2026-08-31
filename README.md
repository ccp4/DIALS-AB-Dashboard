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

Every run compares two DIALS builds: **A**, the current main build, and **B**, the version under
test. Each page shows which A and B builds were actually used, and warns if you've
selected runs whose A builds differ, since a difference you see could then be baseline drift rather
than an effect of B.

A few things to note:

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

- **Raw / Comparison** — pick a dataset to see its merging-statistics curves (e.g. CC½ against
  resolution), switching between the two data sources with a dropdown.
- **CC½ resolution** — per run, the resolution cutoff DIALS reached for A vs B, one point per
  dataset.

### Explore (`/explore`)

Pick a single run to see every dataset at once.

- **Metric grid** — one card per metric (CC½, peak memory, completeness, and more), each plotting
  every dataset's A value against its B value, with the largest outliers highlighted. Click a card
  to see it enlarged, or click a point to open that dataset's detail page.
- **Dataset detail page** — a "what moved" summary across every metric for that one dataset, plus
  the same curves as Data Quality and the same memory profile as Memory Usage, all scoped to it.