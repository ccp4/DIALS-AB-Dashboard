# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A dashboard for visualising DIALS A/B testing. Reads `xia2` processing run output from an external
workspace, extracts metrics (resolution, merging stats, peak memory, timings), serves them to a
React dashboard as chart-ready series.

"A" and "B" are the two variants compared in every run — nearly every data structure is keyed by,
or split into, A and B.

Audience: the wider community (scientists + engineers semi-familiar with the domain) — raises the
bar on deployability, provenance and clear reporting above a personal tool.

## Domain conventions

None of this is derivable from the code; all of it affects correctness.

- **A is the current main DIALS build; B is the version under test.** The run folder name (e.g.
  `xia2-irrmc-inflate-2700`) hints at B but doesn't identify it precisely.
- **A is not a fixed baseline** — it tracks whatever main was at run time, not pinned per campaign
  (run 2700's A: `3.dev.1493-gf324578a1`; run 5400's A: `3.dev.1488-g893c8dfee`). **Cross-run
  comparisons are confounded** — a difference may be baseline drift, not an effect of B.
  `MemoryRankChart` plots multiple runs on shared axes; `RunProvenance.tsx` (phase 3) warns when A
  builds differ but doesn't stop the chart plotting confounded data. `CC_halfOverallChart`/
  `MemoryABChart` use one parity scatter per run instead — own axes, so the confound doesn't apply.
- **Exact builds extracted per variant** by `extract_xia2_build_info` (`xia2_extractor.py`) from
  `xia2-debug.txt` — surfaced as `/runs/{run_id}`'s `builds` field.
- **Missing data is not all equal.** A missing `B/` directory means the comparison *can't be made*
  — significant. Empty lists/mismatched x/y arrays are noise, filtered silently by
  `_clean_trace_data`. Don't conflate the two.
- **Direction of "better" varies by metric** — lower is better for memory/runtime, lower `d_min`
  is better for resolution. No single sign convention.
- **Never summarise A vs B from a regression gradient alone** — a non-zero intercept can cross the
  parity line inside the data range (B better on small datasets, worse on large ones).
  `MemoryABChart`/`CumulativeTimeTaken` report **win count + median ratio** instead, fit kept as a
  secondary line. Keep that shape for any new A/B summary.

## Commands

**`npm run dev` from the repo root** starts Vite (`:5173`) + uvicorn (`:8000`) together via
`concurrently` — the only configuration where the dashboard works end to end. Use this by default.

```bash
npm run dev
```

First-time setup (creates the venv, installs deps, copies `.env` files, prompts for
`WORKSPACE_DIR`, then runs `npm run dev`):

```bash
./setup.sh
```

Lint and production build:

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

Single-service commands, for isolating one half — the backend must run from `backend/`
(`config.py` uses paths relative to it):

```bash
cd backend && venv/bin/python3 -m uvicorn main:app --reload
npm --prefix frontend run dev
```

There is effectively no test suite. `backend/test_cohort.py` is the exception — a contract test on
`/cohort`'s shape (`cd backend && venv/bin/python3 -m pytest`). `test.py` at the repo root is a
gitignored scratch file, not a test runner. Otherwise, verification means running the dashboard.

## Configuration

`backend/.env` (copied from `.env.copy`, gitignored):

- `WORKSPACE_DIR` — absolute path to the xia2 run data. Read-only.
- `WORKSPACE_TYPE` — `local` is the only implemented backend; `ssh` is declared but unbuilt
  (`get_workspace()` returns `None`).
- `FRONTEND_URL` — the CORS origin. Must match the Vite port.

`frontend/.env` (copied from `.env.copy`, gitignored):

- `VITE_API_URL` — where the frontend looks for the backend. Optional locally (`src/api/client.ts`
  falls back to `localhost:8000`). Inlined at build time — changing it needs a restart, not a
  reload.

**Deploying needs both set and pointing at each other** — a mismatch surfaces as `ApiError` with
status 0.

## Project structure

Backend (`backend/`):

```
main.py                  # FastAPI app, CORS, GZip, timing middleware
config.py                # env loading
routers/runs.py          # HTTP surface — thin, no business logic
models/responses.py      # Pydantic response models
models/ab_pair.py        # ABPair[T] — the shared "A/B, either may be missing" type
runs/service.py          # RunService — orchestrates extractor + processor
runs/xia2_extractor.py   # all workspace I/O and file parsing
runs/xia2_processor.py   # reshapes extracted data into chart-ready series
runs/metrics.py          # the metric registry (label/unit/formatter/better)
runs/dataset_id.py       # DatasetSampleId — the shared "dataset/sample" id type
storage/local.py         # FileSystemRunRepository, a JSON cache (see below)
workspace/local.py       # LocalWorkspace — reads WORKSPACE_DIR
```

Frontend (`frontend/src/`):

```
App.tsx                     # routes
navigation.ts                # goToDataset — the one cross-page navigation helper
pages/                      # one file per route (LandingPage, MemoryUsagePage, DataQualityPage,
                            # ExplorePage, DatasetDetailPage)
components/                 # shared components (Chart.tsx, ErrorBoundary.tsx, RunProvenance.tsx, ...)
components/memory/          # Memory Usage page's components
components/data-quality/    # Data Quality page's components
components/explore/         # Explore and Dataset Detail pages' components
hooks/                      # useApi/useApiAll, useUrlParam/useUrlParamList/useUrlParamMap,
                            # useRunsApi (useAllRuns/useListDatasets/useDatasetResource)
theme/                      # tokens.ts, chartChrome.ts, echartsTheme.ts, variant.ts, muiTheme.ts
utils/                      # chartScale.ts, abSummary.ts, metricFormat.ts — pure computation, no tokens dependency
api/client.ts                # the one fetch wrapper
```

## Two separate data roots

- **`WORKSPACE_DIR`** — the source xia2 output. Large, external, never written to.
- **`backend/storage/processed_runs/`** — where `FileSystemRunRepository` (below) would write its
  JSON cache. Gitignored. `RunService` no longer instantiates the repository, so nothing writes
  here currently — the directory only exists from before that was removed.

## Workspace layout the extractors assume

```
<WORKSPACE_DIR>/
  <run_id>/                       # e.g. xia2-irrmc-inflate-2700
    datasets.txt                  # marker: presence here is what makes a dir a "run"
    <dataset>/                    # e.g. 5rvh
      data/
        <sample>/
          dials.estimate_resolution-A.json    # A/B by filename suffix
          dials.estimate_resolution-B.json
          xia2.compare_merging_stats.json
          A/                                  # A/B by parent directory name
            mprofile.dat, peak_memory-integrate.txt, xia2-timing.json, xia2-summary.dat
          B/
            ...
```

Run directories are large — inspect one run at a time, don't walk all of them.

Two consequences worth internalising:

1. **A/B is encoded two different ways** — by filename suffix for the resolution JSONs, by parent
   directory for the per-variant instrumentation files. Extractors handle each differently
   (`_apache_series_builder` switches on filename; mprofile/timing/memory extractors read
   `f.parent.name`).
2. **`_sample_key()` (renamed from `_top_dir`)** returns `"{parts[1]}/{parts[3]}"` — the composite
   `dataset/sample` id, not just the dataset. Works only because `LocalWorkspace.list_files()`
   returns paths relative to the workspace root. Changing what `list_files` returns silently
   rekeys every result dict. **`dataset` is this composite id everywhere in the backend** —
   `extract_xia2_datasets` always returns `"dataset/sample"` strings, even for single-sample
   datasets, and every route/function treats it as an opaque string, splitting only at the
   filesystem boundary. `runs/dataset_id.py`'s `DatasetSampleId.parse()` is the one place that
   split happens now — `_dataset_sample_path` and every extractor that used to do
   `dataset.split("/", 1)` by hand build on it instead. Routes declare it `{dataset:path}` so the
   embedded `/` survives routing — verified against a live instance, including with a fixed suffix
   after it (e.g. `.../resolution`). **One route-ordering trap this created:** where two routes share a
   `{dataset:path}` prefix and one is a strict suffix-extension of the other
   (`/memory/{dataset:path}` vs `/memory/{dataset:path}/events`), the bare one must be declared
   *after* the more specific one, or Starlette's greedy `:path` match swallows the specific
   route's requests. `routers/runs.py` relies on this ordering — don't reorder without
   re-verifying.

## Backend

`routers/runs.py` → `runs/service.py` (`RunService`) → `runs/xia2_extractor.py` → `runs/xia2_processor.py`

- **Router**: thin HTTP surface; module-level `RunService` singleton built at import time.
  **Route handlers are deliberately plain `def`, not `async def`** — they call synchronous,
  IO-heavy extractors, so FastAPI must run them in its threadpool; making one `async` puts that
  work back on the event loop and stalls every other request (measured: `/ping` 3ms → 1107ms while
  one `/resolution` was in flight). Don't add `async` to a handler unless its body is genuinely
  awaitable throughout. Every route depends on `valid_run` (and `valid_dataset`, which chains to
  it, for dataset-scoped routes) — a missing run/dataset 404s instead of silent `200 []`.
- **Extractor**: does all workspace I/O and file parsing. `_extract_json_files` (backs
  `/resolution`, `/merging_stats`) is the one extractor still walking `list_files()` and filtering
  by an exact filename set. Everything else constructs the path directly —
  `<run_id>/<dataset>/data/<sample>/{A,B}/<filename>` — rather than walking and filtering:
  `extract_xia2_summary`, `extract_xia2_timing`, `_extract_memory_files` (backing `/cumulative`
  and `/memory`, rewritten in TODO section 3 after profiling showed the `rglob` walk was the
  entire cost — 1.3–1.65s down to well under 0.2s each). Keep this pattern for anything new that
  needs per-sample identity or gets measurably slow at `list_files`'s expense.
  `_extract_json_files` is deliberately left alone — not a measured bottleneck. `/resolution` has
  zero frontend consumers now but stays as a dev/test route (TODO section 7) — do not delete it,
  `service.get_xia2_resolution`, or `extract_xia2_resolution` as dead code.
- **Processor**: reshapes into ECharts-ready series. `build_cohort` is the one processor function
  that isn't reshaping for a chart — it's a join.
- **Storage** (`FileSystemRunRepository`, `storage/local.py`): a JSON-cache implementation keyed
  `<run_id>/<resource>`, kept for potential future use but **not currently wired into
  `RunService`** — every request re-extracts from disk every time (hence the timing middleware in
  `main.py`). It previously backed three now-removed `RunMetadata` fields (`raw`/`comparison`/
  `memory` booleans — named for the routes as they were called then — sourced from
  `repo.exists()`) with no frontend consumer; those were dropped along with the wiring rather than
  left reporting a permanently-`false` value. Re-wiring the cache is a deliberate future decision,
  not a drive-by fix.

### The series contract

`_apache_series_builder` emits `{"name": ..., "data": [[x, y], ...]}`, prefixing names with
`"A - "`/`"B - "`. `DatasetChart` locates traces by substring match on that name (`"fit"`, for
`cc_half`'s fitted curve) — an accepted dependency on DIALS's own naming; if nothing matches,
`DatasetChart` falls back to showing every trace rather than defaulting all to hidden. Grep the
frontend for the trace name before changing it. `CC_halfOverallChart` no longer goes through
`_apache_series_builder` at all — see below.

### `GET /runs/{run_id}/cc_half`

Not an interpolation despite the route it replaced (`/raw/interpolated`) being named that way —
`dials.estimate_resolution-{A,B}.json`'s `cc_half.data` already carries the CC½-threshold crossing
DIALS itself computed, as a marker line named `"d_min = ... Å"` whose x-coordinate (inverse-
square-d units) *is* the value. `extract_xia2_cc_half` reads that directly per `(dataset, sample)`
via `_dataset_sample_path`, the same pattern as every other per-sample extractor. Response shape
matches `/cumulative`: `{"A": [[dataset, value], ...], "B": [...]}`. Kept separate from `/cohort`
— it's a different DIALS computation (`dials.estimate_resolution`) from the
`xia2-summary.dat`-derived registry, and doesn't fit the per-`(dataset, sample)` cohort row shape.

### The cohort table

`GET /runs/{run_id}/cohort` — the backbone every phase-4 view is meant to read. One row per
`(dataset, sample)`:

```
{
  "rows": [
    {
      "dataset": "7ris", "sample": "GLVaseHo_21148c5b_1_2_9.001",
      "status": "complete",             // "complete" | "missing_a" | "missing_b"
      "A": { "high_resolution_limit": {"overall": ..., "inner": ..., "outer": ...}, ...,
             "cell": [...], "spacegroup": "...", "peak_memory": ..., "cumulative_runtime": ... },
      "B": { ... } | null
    }, ...
  ],
  "coverage": { "total": 231, "complete": 228, "missing_a": 1, "missing_b": 2 },
  "metrics": [ { "key": "cc_half", "label": "CC½", "unit": "", "formatter": "ratio",
                 "better": "higher" }, ... ]
}
```

**`status`/`coverage` are the coverage-not-filtering rule made concrete.** A missing side is a row
with `null` for that variant and a `status`, not an absent row — follow this shape for any new
aggregate endpoint rather than dropping incomplete pairs.

**The metric registry (`backend/runs/metrics.py`) is the one place `better` (`"higher"`/`"lower"`/
`None`) is decided**, per the "no single sign convention" rule. It's served in every `/cohort`
response rather than duplicated frontend-side. `None` is a real, intentional value —
`low_resolution_limit` reflects data-collection geometry, not something either DIALS build makes
better or worse — don't fill in a guess.

**Peak memory and cumulative runtime are joined in** from `extract_xia2_memory`/
`extract_xia2_cumulative_timing`, keyed by the same composite `"dataset/sample"` id — exact per
sample, including for the 5 multi-sample datasets.

**`models/` holds every Pydantic model** (`models/responses.py` for API response models,
`models/ab_pair.py` for `ABPair[T]`), re-exported from `models/__init__.py` so callers do
`from models import X`. `CohortResponse` etc. now cover every route with a live frontend
consumer — including `/memory`, `/cumulative`, `/info/{dataset}`, and the dataset-scoped
`/dataset/{dataset}/resolution`/`merging_stats`. Only the whole-run `/resolution` and
`/merging_stats` stay untyped dicts — confirmed dev/test routes with zero consumers.

**`models/ab_pair.py`'s `ABPair[T]`** is the one reusable type for "two comparable values, either
side may be missing" — `status` is a computed field derived from A/B, never stored, so it can't
drift. `CohortRow` inherits from it. Reach for it before reinventing the `{"A":..., "B":...}` +
manual status-branch pattern anywhere else.

### Extending the backend: adding a new graph

Which pattern to follow depends on the shape of the data the graph needs:

1. **A `xia2-summary.dat` metric, one value per (dataset, sample)** — the cheapest case. Add an
   entry to `METRICS` in `runs/metrics.py` (`key`/`label`/`unit`/`formatter`/`better`); extend
   `_parse_xia2_summary` if the field isn't parsed yet. `build_cohort` joins it automatically, so it
   appears in `/cohort`, `CohortGrid`, and `WhatMovedStrip` with no frontend change.
2. **A single computed value per (dataset, sample, variant), not from `xia2-summary.dat`** (like
   `cc_half`'s `d_min`, peak memory, cumulative runtime) — a new extractor function in
   `xia2_extractor.py` that iterates `extract_xia2_datasets`, resolves each sample's path via
   `DatasetSampleId`/`_dataset_sample_path`, and returns `{"A": [[id, value], ...], "B": [...]}` —
   reuse `CCHalfResponse`'s shape/model directly if it fits. Add a route in `routers/runs.py` and
   wire it through `service.py`. Join it into `build_cohort` too if it belongs in the cohort table
   (the way `extract_xia2_memory`/`extract_xia2_cumulative_timing` are).
3. **A full multi-trace series per dataset** (like Raw/Comparison's resolution-dependent curves) —
   reuse `_apache_series_builder`/`_extract_json_files` if the source is DIALS JSON shaped like the
   existing ones; otherwise write a comparable extractor that still emits `{"name": ..., "data":
   [[x, y], ...]}` per trace, since `DatasetChart` depends on that shape (see "The series contract").
4. **A per-sample detail lookup that isn't a series** (like `/info/{dataset}`'s unit cell/spacegroup)
   — a small extractor reading one file per variant; use `ABPair[T]` for the response if either
   side may be missing.

Whichever shape: build the path directly — `<run_id>/<dataset>/data/<sample>/{A,B}/<filename>` —
rather than walking and filtering (see "Extractor" above), add a Pydantic model in
`models/responses.py`, and give any new route the same `valid_run`/`valid_dataset` dependency
every other route has.

## Frontend

React 19 + TypeScript + Vite + MUI, charts via `echarts-for-react` — ECharts is the only charting library.
`echarts-stat` (regression lines in `MemoryABChart`/`CumulativeTimeTaken`) lives in
`frontend/package.json`; the root `package.json` holds only `concurrently`. **Keep frontend
dependencies in `frontend/`** — declaring one at the root resolves via Node walking up the tree,
which works locally and fails for anyone who installs only `frontend/`.

### Routing

Routing in `src/App.tsx`: `/` → `LandingPage` (no `DashboardLayout`). `/memory` → `MemoryUsagePage`
(memory + timings), `/datasets` → `DataQualityPage` (data quality), `/explore` → `ExplorePage`
(cohort overview), `/explore/dataset/:run/*` → `DatasetDetailPage` (per-sample detail view) — these
four render inside `DashboardLayout`.

**`explore/dataset/:run/*` is a splat route** — the composite `dataset/sample` id (always contains
a literal `/`) is captured by the trailing `*`, the frontend analogue of the backend's
`{dataset:path}`. `DatasetDetailPage` reads it via `useParams()["*"]`. Reachable two ways, both
through one `goToDataset(navigate, run, dataset)` helper in `src/navigation.ts`: a
`DatasetSelector` on `ExplorePage`, and an `onPointClick` prop on `MetricScatter` (wired through
`CohortGrid`). `goToDataset` lives in its own module rather than in `ExplorePage.tsx` — a page
file exporting anything besides its default component trips this repo's
`react-refresh/only-export-components` lint rule.

### Error boundaries

`src/components/ErrorBoundary.tsx` wraps `react-error-boundary` with the dashboard's MUI fallback
— used per-route (`App.tsx`) and per-chart. **Wrap new charts in it** — one throwing component
used to blank the whole page, and with multi-second responses a blank page is indistinguishable
from a slow one. Pass `resetKeys` (selected runs, or the run id) so changing selection retries
instead of leaving the error stuck.

**It only catches render errors.** Fetch failures reach it because `useApi` forwards them via
`useErrorBoundary().showBoundary()`, not because React catches them. Anything that throws
asynchronously outside those hooks still needs forwarding by hand.

### Data fetching

**One idiom. Do not add a bare `fetch` anywhere.**

- `src/api/client.ts` — `apiGet(path, {signal})`. Base URL from `VITE_API_URL`, falling back to
  `http://localhost:8000` (the only place that literal appears). Throws `ApiError` with a
  `status` field — **0 means a network-level failure** (backend down, CORS), not an HTTP error.
  Aborts rethrow the original `AbortError` unwrapped.
- `src/hooks/useApi.ts` — `useApi(path)` for one resource, `useApiAll([{key, path}])` for a keyed
  set. Both abort on input change and unmount. Pass `path: null` to skip a fetch whose input isn't
  chosen yet, rather than calling the hook conditionally.

Two things about these that are easy to break:

1. **They escalate failures to the nearest `ErrorBoundary` by default**, so the fetch must not sit
   in the same component as the control that would let a user recover — a page fetching beside its
   own run selector loses the selector when the backend is down. `MemoryUsagePage`/`DataQualityPage`
   are split for exactly this reason. Keep that shape, or pass `{throwOnError: false}` and handle
   it inline.
2. **`useErrorBoundary()` throws if there is no boundary above the caller**, so every consumer must
   render inside one. `App.tsx` covers both routes today.

`useApiAll` caches by path for the component's lifetime and returns exactly the keys asked for —
deselecting a run drops it without discarding its data, and reselecting doesn't refetch. It keys
its effect on `JSON.stringify(requests)`, so building the array inline each render is fine. `data`
is populated from cache before a newly-added key resolves, so a consumer should render from `data`
unconditionally and use `requests` minus `Object.keys(data)` for a partial loading state — gating
on the aggregate `loading` boolean blanks already-loaded keys every time a new one is added.
`MemoryPanels`/`CC_halfOverallPanel` do this.

`hooks/useRunsApi.ts`'s three named hooks (`useAllRuns`/`useListDatasets`/`useDatasetResource`)
are thin wrappers over `useApi` — a naming convenience, not a second idiom. Grouped in one file
rather than one-per-file since each is a few lines and all three reshape the same `useApi` return
value for a different `/runs` path; splitting them bought file-per-export purity at the cost of
import boilerplate with nothing in return. Used across Data Quality, Explore, and the dataset
detail page — not scoped to one page family, despite the name suggesting "runs."

### URL state

`src/hooks/useUrlState.ts` — `useUrlParam`/`useUrlParamList`/`useUrlParamMap` over react-router's
`useSearchParams`. Writes use `replace`, so a multi-select doesn't fill the history. Setting a
value to `null`/`undefined`/`""` removes it from the URL rather than writing a placeholder — for
`useUrlParamMap` this matters per-entry (`setValue`'s `next` filters out `null` entries before
joining the map string, so clearing one item can't leave a stray `"key:null"` behind).
`useUrlParamMap` is for a selection keyed by a dynamic id set (e.g. one dataset choice per
selected run); like `useUrlParamList`, its setter takes the full next value rather than a
`useState`-style updater.

Both pages read selected runs from the **same `runs` parameter**, so a link carries a selection
across the two views. Also on the URL: `RunMetricPanel`'s per-run dataset choice/sync toggle
(`${metric}_ds` map, `${metric}_sync`), `MemoryProfilerPlot`'s dataset (`ds_${run}`), and
`DatasetChart`'s trace selection (`trace_${urlKey}`, `urlKey` supplied by the caller — `RunPanel`
passes `${metric}_${runId}`, `DatasetDetailPage` passes `"resolution"`/`"merging_stats"` — since
more than one `DatasetChart` instance can be on screen at once and its two call sites don't share
identifying props).

`/explore` deliberately does **not** share `runs` — it holds its own single-run `run` param,
because reusing `runs` there let changing the dropdown silently truncate the other pages'
multi-run selection down to one.

### Chart conventions

`src/theme/chartChrome.ts` exports the ECharts option fragments shared across charts:
`STANDARD_DATA_ZOOM`, `STANDARD_LEGEND`, and `summaryBoxGraphic(text, overrides)` — the regression-
summary callout (teal outline, height derived from line count), used by every A/B parity chart.
Grid margins and tooltip formatters differ per chart and stay inline. Chart sizing comes from
`tokens.chart.height.*`/`tokens.chart.width.*` rather than literals — `single`/`main` give a chart
the bigger, one-run treatment (`MemoryABChart`'s pattern); `panel`/`"100%"` is the multi-run default.

`src/utils/chartScale.ts`'s `niceCeil`/`niceFloor` round an axis bound to 2 significant figures —
use these on any chart that pins `min`/`max` to a computed value, since that disables ECharts' own
tick rounding and otherwise produces axis labels like `42343.234234`.

**`MetricScatter` uses A/B differently from every other chart here.** Elsewhere, A/B are two
separate series each in a fixed colour (`tokens.variant.A`/`.B`). `MetricScatter` puts A on the
x-axis and B on the y-axis: one point is one sample carrying both an A and a B value, so there is
no per-variant series to colour. Only the axis *names* use the tokens; the scatter points are a
plain single colour. A chart that treats a `MetricScatter` point as "the A series" and colours it
from `tokens.variant` is misapplying a convention built for a different chart shape.

## Known issues and planned work

[TODO.md](TODO.md) is the active backlog (see its own header for how it's organised) —
[ARCHIVE.md](ARCHIVE.md) holds everything done, mirroring TODO.md's section numbers exactly. Move
an item to the archive once it's done, don't delete it; keep new items in the right section **and**
in TODO's section 0 sequence, since an item with no phase is one that will be done out of order.
