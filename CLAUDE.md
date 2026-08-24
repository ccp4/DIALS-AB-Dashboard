# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A dashboard for visualising DIALS A/B testing. It reads the output of `xia2` processing runs from an
external workspace directory, extracts metrics (resolution estimates, merging stats, peak memory,
timings), and serves them to a React dashboard as chart-ready series.

"A" and "B" are the two variants being compared in every run — nearly every data structure in the
codebase is keyed by, or split into, `A` and `B`.

The intended audience is the wider community: specialised scientists and software engineers who are
semi-familiar with the domain. That raises the bar on deployability, provenance and clear reporting
above what a personal tool would need.

## Domain conventions

None of this is derivable from the code, and all of it affects whether a change is correct.

- **A is the current main DIALS build; B is the version being tested against it.** The run folder
  name hints at what B is (e.g. `xia2-irrmc-inflate-2700`) but does not identify it precisely.
- **A is not a fixed baseline.** It tracks whatever main was when the run executed — it is not
  pinned per campaign. Run 2700's A is `DIALS 3.dev.1493-gf324578a1`; run 5400's A is
  `3.dev.1488-g893c8dfee`. **Cross-run comparisons are therefore confounded** — a difference
  between runs may be baseline drift rather than an effect of B. `CC_halfOverallChart` and
  `MemoryRankChart` both plot multiple runs on shared axes; `RunProvenance.jsx` (phase 3) is the
  mitigation — it shows each selected run's A/B build and warns when the A builds differ, but it
  doesn't stop these two charts from still plotting the confounded data side by side.
- **The exact builds are extracted**, per variant, by `extract_xia2_build_info`
  (`xia2_extractor.py`, phase 3) — reads `xia2-debug.txt` (also `xia2.txt` and
  `dials.integrate.log`, unused so far), surfaced as `/runs/{run_id}`'s `builds` field.
- **Missing data is not all equal.** A missing `B/` directory means the comparison *cannot be made*
  and is significant. Empty lists or mismatched `x`/`y` arrays inside a data file are noise and
  should be filtered silently — `_clean_trace_data` does this and is correct as written. Do not
  conflate the two.
- **Direction of "better" varies by metric.** Lower is better for memory and runtime; for
  resolution, a lower `d_min` is better. There is no single sign convention for "B improved".
- **Never summarise A vs B from a regression gradient alone.** A fit with a non-zero intercept can
  cross the parity line inside the data range — B better on small datasets and worse on large ones —
  and a single "B is faster by N%" asserts a direction the data does not support. `MemoryABChart`
  and `CumulativeTimeTaken` therefore report **a win count and a median ratio**, which describe the
  samples rather than extrapolating from the fit, with the fit expression kept as a secondary line.
  Keep that shape for any new A/B summary.

## Known issues and planned work

[TODO.md](TODO.md) is the categorised backlog — bugs, quick fixes, performance, architecture,
product gaps, and the status of every unused symbol in the repo. It is the product of a full
codebase review with findings verified against a running instance, so measurements in it are real
rather than estimated. **[ARCHIVE.md](ARCHIVE.md) holds everything that reached `[x]`** — mirrors
TODO.md's section numbers exactly, so "section 4" means the same section in both files. TODO.md
stays the active backlog; ARCHIVE.md is where the detailed "why" behind a decision already made
lives, kept verbatim rather than summarized. Move an item there once it's done, don't delete it.

Read TODO.md before proposing changes. In particular:

- **Section 0 is the sequence, and the other sections are only the categories.** It orders every
  item into phases 0–5 on the principle of *least wasted work* — which is not the same as
  "bugs first". Some live bugs are deliberately left unfixed because the code holding them is
  about to be deleted, and some cheap items are deliberately delayed because doing them before a
  structural change means doing them twice. **Start from section 0, not from section 1**, and if
  you are about to fix something out of phase order, check there first for why it is where it is.
- **Section 6** records the disposition of every zero-caller symbol — which are planned work, which
  are superseded, which are mid-migration. Check there before deleting anything that looks dead.
- **Section 7** lists things that are deliberate and must not be "fixed".
- **Section 8** is the agreed feature direction: the dashboard's primary job is *exploration* —
  answering why B differs from A. It is ordered by dependency, and 8.1 (a per-sample cohort table
  parsed from `xia2-summary.dat`) is the backbone every other item reads from. Build in that order;
  new feature ideas should be checked against it before being started.
- Several items are load-bearing for correctness. Phase 0 is done — the blocking event loop, the
  mislabelled `MemoryABChart` axis and the gradient-only "B is faster by N%" headline are fixed.
  Silent HTTP 200 on unknown runs is fixed (phase 2). The multi-sample collision bug is fixed
  (phase 2b) — `/raw`/`/memory`/`/comparison`/`/cohort` are all sample-precise now. What remains:
  silently dropped incomplete A/B pairs in the old endpoints (`/cohort` reports coverage correctly;
  phase 4 is expected to move consumers onto it rather than fixing the old ones in place).

**Where the work is up to:** phases 0 through 3 are complete. The frontend plumbing and theme are
documented below under *Data fetching*, *URL state* and *Frontend*. `GET /runs/{run_id}/cohort`
(below, under *Backend pipeline*) is live: one row per `(dataset, sample)`, a backend-owned metric
registry, coverage reported rather than filtered, and its memory/runtime join is exact per sample.
`/runs/{run_id}` carries each run's A/B DIALS build (`builds`), surfaced by
`src/components/RunProvenance.jsx` on both pages. **Phase 4 — the views — is underway.** 8.2
(`MetricScatter`, the shared B-vs-A parity-scatter primitive), 8.3 (`CohortGrid`, the
small-multiples cohort overview, at `/explore`), 8.5 (outlier points highlighted by colour in
`MetricScatter`) and 8.4 (`DatasetDetailPage`, the per-sample detail view with its "what moved"
strip, at `/explore/dataset/:run/*`) are all live. 8.8 (the workbench — a mode toggle on `/explore`
unpinning `MetricScatter`'s axes) was also built, tried against a real run, and reverted in full
when judged not useful — see ARCHIVE.md's 8.8 entry. **The next thing to do is moving
`CC_halfOverallChart` off `/raw`** onto the cohort table (TODO section 0 and section 8).
`MemoryABChart` and `MemoryRankChart` are not superseded by 8.3 and both stay — they first looked
redundant with 8.3's per-metric panels, but 8.3/`/explore` is scoped to a single run at a time:
`MemoryABChart` renders one parity scatter per selected run in a grid on one page load, and
`MemoryRankChart` ranks peak memory across all selected runs on one shared chart. Both show every
selected run at once, which the single-run-scoped `/explore` doesn't do.

Keep it current: when you fix something, tick it; when you find something new, add it to the right
section **and** place it in section 0's sequence — an item with no phase is an item that will be
done in the wrong order.

## Commands

**`npm run dev` from the repo root is the way to run and test anything.** It starts both the Vite
frontend (`:5173`) and the uvicorn backend (`:8000`) together via `concurrently`, which is the only
configuration in which the dashboard actually works end to end. Use this by default rather than
starting either half on its own.

```bash
npm run dev
```

First-time setup (creates the venv, installs Python + both npm dependency sets, then runs
`npm run dev` itself):

```bash
./setup.sh
```

Lint and production build:

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

Single-service commands, for when you specifically need to isolate one half. The backend must run
from `backend/` — `config.py` reads `.env` and `FileSystemRunRepository` uses the relative path
`storage/processed_runs`, both of which break from another cwd:

```bash
cd backend && venv/bin/python3 -m uvicorn main:app --reload
npm --prefix frontend run dev
```

There is effectively no test suite. `backend/test_cohort.py` is the one exception — a contract test
on `/cohort`'s shape, run with `cd backend && venv/bin/python3 -m pytest`. `test.py` at the repo
root is a gitignored scratch file, not a test runner. Everywhere else, verification means running
the dashboard and looking at it.

## Configuration

`backend/.env` (copied from `backend/.env.copy`, gitignored) sets:

- `WORKSPACE_DIR` — absolute path to the xia2 run data. Read-only as far as this app is concerned.
- `WORKSPACE_TYPE` — `local` is the only implemented backend; `get_workspace()` returns `None` for
  `ssh`, which is a declared-but-unbuilt path.
- `FRONTEND_URL` — the single origin allowed by CORS. Changing the Vite port requires changing this too.

`frontend/.env` (copied from `frontend/.env.copy`, gitignored) sets:

- `VITE_API_URL` — where the frontend looks for the backend. Optional locally: `src/api/client.js`
  falls back to `http://localhost:8000`, which is where `npm run dev` puts uvicorn. Vite inlines it
  at build time, so changing it needs a restart, not a reload.

**Deploying needs both halves configured, and they point at each other:** `VITE_API_URL` at the
backend, `FRONTEND_URL` at wherever the frontend is served. Setting only one produces a CORS
failure that surfaces as `ApiError` with status 0.

## Two separate data roots

Do not confuse these:

- **`WORKSPACE_DIR`** — the source xia2 output. Large, external, never written to.
- **`backend/storage/processed_runs/`** — the app's own JSON cache. Gitignored, created on startup.

## Workspace layout the extractors assume

```
<WORKSPACE_DIR>/
  <run_id>/                       # e.g. xia2-irrmc-inflate-2700
    good_master_files.txt         # marker: presence here is what makes a dir a "run"
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

Run directories are large. When inspecting the workspace, pick one run rather than walking all of them.

Two consequences worth internalising:

1. **A/B is encoded two different ways** — by filename suffix for the resolution JSONs, by parent
   directory for the per-variant instrumentation files. Extractors handle each differently
   (`_apache_series_builder` switches on filename; `mprofile`/timing/memory extractors read
   `f.parent.name`).
2. **`_sample_key()` (`xia2_extractor.py`, renamed from `_top_dir` in TODO phase 2b) returns
   `"{parts[1]}/{parts[3]}"` — the composite `dataset/sample` id, not just the dataset.** This works
   only because `LocalWorkspace.list_files()` returns paths relative to the *workspace root*, so
   `parts[0]` is always the run id, `parts[1]` the dataset, `parts[3]` the sample (`parts[2]` is the
   fixed `data` directory). Changing what `list_files` returns silently rekeys every result dict.
   **`dataset` is a composite id everywhere in the backend, not just here** — `extract_xia2_datasets`
   returns `"dataset/sample"` strings (always, even for the ~226 single-sample datasets, so nothing
   downstream special-cases the format), and every route/function that takes a `dataset` parameter
   treats it as this opaque composite string end to end, splitting it only where it actually touches
   the filesystem (`_dataset_sample_path`). Routes that take one declare it `{dataset:path}`, not
   `{dataset}`, so the embedded `/` survives FastAPI's routing — verified this against a live
   instance before relying on it, including that a route with a fixed suffix after `{dataset:path}`
   (e.g. `.../raw`) still matches correctly. **One route-ordering trap this created:** where two
   routes share a `{dataset:path}` prefix and one is a strict suffix of the other's path shape
   (`/memory/{dataset:path}` vs `/memory/{dataset:path}/events`), the bare one must be declared
   *after* the more specific one, or Starlette's greedy `:path` match on the bare route swallows the
   `/events` requests first. `routers/runs.py` relies on this ordering — don't reorder those two
   routes without re-verifying.

## Backend pipeline

`routers/runs.py` → `runs/service.py` (`RunService`) → `runs/xia2_extractor.py` → `runs/xia2_processor.py`

- **Router** is a thin HTTP surface; a module-level singleton `RunService` is built at import time,
  so the workspace is resolved once at startup. **The route handlers are deliberately plain `def`,
  not `async def`.** They call synchronous, IO-heavy extractors, so FastAPI must be allowed to run
  them in its threadpool; making one `async` puts that work back on the event loop and stalls every
  other request (measured: `/ping` 3 ms → 1107 ms while one `/raw` was in flight). Do not add
  `async` to a handler unless its body is genuinely awaitable throughout. Every route calls
  `_ensure_run_exists(run_id)` first — a missing run 404s instead of the old silent `200 []`.
- **Extractor** does all workspace I/O and file parsing. `_extract_json_files` (backs `/raw`,
  `/comparison`) is the one extractor still walking `list_files()` and filtering by an exact
  filename set. Everything else that needs a specific sample's file constructs the path directly —
  `<run_id>/<dataset>/data/<sample>/{A,B}/<filename>` — rather than walking and filtering:
  `extract_xia2_summary` (needs to know *which* sample a file belongs to as it reads it),
  `extract_xia2_timing` and `_extract_memory_files` (backing `/cumulative` and `/memory`, rewritten
  in TODO section 3 after profiling showed the `rglob` walk, not the file parsing, was the entire
  cost — 1.3–1.65 s down to well under 0.2 s each). Keep this pattern for anything new that needs
  per-sample identity or gets measurably slow at `list_files`' expense. `_extract_json_files` is
  deliberately left alone — not a measured bottleneck, and `/raw` is a phase-5 retirement candidate.
- **Processor** reshapes into ECharts-ready series and does the numeric work (`numpy` interpolation
  for CC½ at a given resolution). `build_cohort` (below) is the one processor function that isn't
  reshaping for a chart — it's a join.
- **Storage** (`FileSystemRunRepository`) is a JSON cache keyed `<run_id>/<resource>`. `save()` is
  called but the corresponding `load()` short-circuit in `get_xia2_raw` is commented out, so
  requests currently re-extract from disk every time. This is why the timing middleware in
  `main.py` prints per-request durations. **This is deliberate and deferred — leave it commented
  out.** Do not re-enable the cache as a drive-by fix.

### The series contract

`_apache_series_builder` emits `{"name": ..., "data": [[x, y], ...]}` and prefixes names with
`"A - "` / `"B - "` based on the source filename. Three frontend components locate traces by
substring match on that name:

- `CC_halfOverallChart` — `"A - d_min"`, `"B - d_min"`, `"d_min"`
- `DatasetChart` — `"fit"`, to pick out fitted curves within `cc_half`

**Renaming in the builder breaks those charts silently** — no error, just an empty plot. Grep the
frontend for the trace name before changing it.

### The cohort table

`GET /runs/{run_id}/cohort` — the backbone every phase-4 view is meant to read, per TODO 8.1. One
row per `(dataset, sample)`:

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

**`status`/`coverage` are the coverage-not-filtering rule from the domain conventions made
concrete.** A missing side is a row with `null` for that variant and a `status`, not an absent row —
follow this shape for any new aggregate endpoint rather than dropping incomplete pairs.

**The metric registry (`backend/runs/metrics.py`) is the one place `better` (`"higher"`/`"lower"`/
`None`) is decided**, per the domain conventions' "no single sign convention" rule. It's served in
every `/cohort` response rather than duplicated frontend-side. `None` is a real, intentional value —
`low_resolution_limit` reflects data-collection geometry, not something either DIALS build makes
better or worse; don't fill in a guess to make every metric have a direction.

**Peak memory and cumulative runtime are joined in from `extract_xia2_memory`/
`extract_xia2_cumulative_timing`**, keyed by the same composite `"dataset/sample"` id as everything
else since phase 2b — exact per sample, including for the 5 datasets with more than one sample.

**`routers/models.py` (`CohortResponse` etc.) is the first Pydantic response model in the repo.**
The older routes (`/raw`, `/memory`, ...) stay untyped dicts on purpose — see TODO section 0 phase 2
for why they aren't retrofitted alongside this one.

## Frontend

React 19 + Vite + MUI, charts via `echarts-for-react` — ECharts is the only charting library.
`echarts-stat` (the regression lines in `MemoryABChart` and `CumulativeTimeTaken`) lives in
`frontend/package.json` alongside everything else; the root `package.json` holds only
`concurrently`. Keep frontend dependencies in `frontend/` — declaring one at the root makes it
resolve by Node walking up the tree, which works locally and fails for anyone who installs only
`frontend/`.

Routing in `src/App.jsx`: `/` → `DataMemoryPage` (memory + timings), `/datasets` → `DataSetsPage`
(data quality), `/explore` → `ExplorePage` (the cohort overview, TODO 8.3), `/explore/dataset/:run/*`
→ `DatasetDetailPage` (the per-sample detail view, TODO 8.4). All four render inside
`DashboardLayout`.

**`explore/dataset/:run/*` is a splat route** — the composite `dataset/sample` id (always contains a
literal `/`, per the workspace-layout note above) is captured by the trailing `*`, not a named
param, the frontend analogue of the backend's `{dataset:path}` fix from phase 2b.
`DatasetDetailPage` reads it via `useParams()["*"]`. It's reachable two ways, both funnelled through
one `goToDataset(navigate, run, dataset)` helper in `src/navigation.js`: a `DatasetSelector` on
`ExplorePage`, and a new `onPointClick` prop on `MetricScatter` (wired through `CohortGrid`).
`goToDataset` lives in its own module rather than being colocated in `ExplorePage.jsx` — a page file
exporting anything besides its default component trips this repo's
`react-refresh/only-export-components` lint rule.

`src/components/ErrorBoundary.jsx` wraps `react-error-boundary` with the dashboard's MUI fallback.
It is used at two levels: around each route in `App.jsx`, and around each chart in the pages.
**Wrap new charts in it** — one throwing component used to blank the whole page, and with
multi-second responses a blank page is indistinguishable from a slow one. Pass `resetKeys` (the
selected runs, or the run id) so changing selection retries instead of leaving the error stuck.

**It only catches render errors.** Fetch failures reach it because `useApi` forwards them with
`useErrorBoundary().showBoundary()`, not because React catches them. Anything that throws
asynchronously outside those hooks still needs forwarding by hand.

**`MetricScatter` (`/explore`, TODO 8.2) uses A/B differently from every other chart here.**
Everywhere else, A and B are two separate series, each drawn in its own fixed colour
(`tokens.variant.A`/`.B` — see section 0 phase 1a in TODO.md). `MetricScatter` instead puts A on
the x-axis and B on the y-axis: one point is one sample, carrying both an A value and a B value, so
there is no per-variant series to colour. Only the axis *names* use `tokens.variant.A`/`.B`; the
scatter points are a plain single colour. A future chart that treats a `MetricScatter` point as
"the A series" or "the B series" and tries to colour it from `tokens.variant` is misapplying a
convention built for a different chart shape.

## Data fetching

**One idiom. Do not add a bare `fetch` anywhere.**

- `src/api/client.js` — `apiGet(path, {signal})`. Base URL from `import.meta.env.VITE_API_URL`,
  falling back to `http://localhost:8000`; this is the only place that literal appears. Throws
  `ApiError` with a `status` field, where **status 0 means a network-level failure** (backend down,
  CORS) as opposed to an HTTP error. Aborts rethrow the original `AbortError` instead, so callers
  can drop them without unwrapping.
- `src/hooks/useApi.js` — `useApi(path)` for one resource, `useApiAll([{key, path}])` for a keyed
  set. Both abort on input change and unmount. Pass `path: null` to skip a fetch whose input is not
  chosen yet rather than calling the hook conditionally.

Two things about these that are easy to break:

1. **They escalate failures to the nearest `ErrorBoundary` by default.** So the fetch must not sit
   in the same component as the control that would let a user recover — a page that fetches beside
   its own run selector loses the selector when the backend is down. `DataMemoryPage` and
   `DataSetsPage` are split for exactly this reason: the selector stays in the page, the fetching
   lives in `MemoryPanels` / `CC_halfOverallPanel` inside a boundary. Keep that shape when adding a
   view, or pass `{throwOnError: false}` and handle it inline.
2. **`useErrorBoundary()` throws if there is no boundary above the caller**, so every consumer of
   these hooks must render inside one. `App.jsx` wraps both routes, which covers the tree today —
   a component mounted outside the router would not be covered.

`useApiAll` caches by path for the component's lifetime and returns exactly the keys you asked for,
so deselecting a run drops it from the result without discarding its data and reselecting it does
not refetch. It keys its effect on `JSON.stringify(requests)`, so building the array inline each
render is fine and expected. `data` is populated from cache before a newly-added key resolves, so a
consumer should render from `data` unconditionally and use `requests` minus `Object.keys(data)` to
show a partial loading state — gating the whole render on the aggregate `loading` boolean blanks
already-loaded keys every time a new one is added. `MemoryPanels` and `CC_halfOverallPanel` do this.

The `data-quality/use*.js` hooks are three-line named wrappers over `useApi` — a naming
convenience, not a second idiom.

## URL state

`src/hooks/useUrlState.js` — `useUrlParam` / `useUrlParamList` / `useUrlParamMap` over
react-router's `useSearchParams`. Writes use `replace`, so a multi-select does not fill the
history. `useUrlParamMap` is for a selection keyed by a dynamic id set (e.g. one dataset choice per
selected run) that the other two don't cover; like `useUrlParamList` its setter takes the full next
value rather than a `useState`-style updater.

Both pages read selected runs from the **same `runs` parameter**, so a link carries a selection
across the two views. Also on the URL: `RunMetricPanel`'s per-run dataset choice and sync toggle
(`${metric}_ds` as a map, `${metric}_sync`, so the "Raw" and "Comparison" panels on `DataSetsPage`
don't collide), and `MemoryProfilerPlot`'s dataset choice (`ds_${run}`). Still `useState`: trace
selection within `DatasetChart`, and the axis pickers phase 4's views will introduce (TODO 8.7).
`/explore` (`ExplorePage.jsx`) deliberately does **not** share `runs` — it holds its own single-run
`run` param instead, because reusing `runs` there let changing the dropdown silently truncate the
other pages' multi-run selection down to one.

## Chart chrome

`src/theme/chartChrome.js` exports `STANDARD_DATA_ZOOM` and `STANDARD_LEGEND` — the only two
ECharts option fragments that turned out to be byte-identical across charts when checked directly
(dataZoom in six charts, legend placement in three). Grid margins and tooltip formatters differ per
chart and stay inline; there was no larger shared shape to extract into a factory. Chart heights
come from `tokens.chart.height.*` (`sparkline`/`panel`/`full`/`tall`) rather than literals.
