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
  `MemoryRankChart` both plot multiple runs on shared axes without flagging this.
- **The exact builds are recorded on disk but not yet extracted.** `xia2-debug.txt` (also `xia2.txt`
  and `dials.integrate.log`) contains the full DIALS version and git hash for each variant.
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
rather than estimated.

Read it before proposing changes. In particular:

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
  What remains in that category: silent HTTP 200 on unknown runs, multi-sample datasets overwriting
  each other, and silently dropped incomplete A/B pairs. Prefer fixing those over adding features.

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

There is no test suite. `test.py` at the repo root is a gitignored scratch file, not a test runner —
verification means running the dashboard and looking at it.

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
2. **`_top_dir()` returns `path.parts[1]`, which is the dataset name.** This works only because
   `LocalWorkspace.list_files()` returns paths relative to the *workspace root*, so `parts[0]` is
   always the run id. Changing what `list_files` returns silently rekeys every result dict.

## Backend pipeline

`routers/runs.py` → `runs/service.py` (`RunService`) → `runs/xia2_extractor.py` → `runs/xia2_processor.py`

- **Router** is a thin HTTP surface; a module-level singleton `RunService` is built at import time,
  so the workspace is resolved once at startup. **The route handlers are deliberately plain `def`,
  not `async def`.** They call synchronous, IO-heavy extractors, so FastAPI must be allowed to run
  them in its threadpool; making one `async` puts that work back on the event loop and stalls every
  other request (measured: `/ping` 3 ms → 1107 ms while one `/raw` was in flight). Do not add
  `async` to a handler unless its body is genuinely awaitable throughout.
- **Extractor** does all workspace I/O and file parsing. Every extractor walks `list_files()` and
  filters by an exact filename set — there is no globbing or path construction to the leaf files.
- **Processor** reshapes into ECharts-ready series and does the numeric work (`numpy` interpolation
  for CC½ at a given resolution).
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
- `RawDataChart` and `DatasetChart` — `"fit"`, to pick out fitted curves within `cc_half`

**Renaming in the builder breaks those charts silently** — no error, just an empty plot. Grep the
frontend for the trace name before changing it.

## Frontend

React 19 + Vite + MUI, charts via `echarts-for-react` — ECharts is the only charting library.
`echarts-stat` (the regression lines in `MemoryABChart` and `CumulativeTimeTaken`) lives in
`frontend/package.json` alongside everything else; the root `package.json` holds only
`concurrently`. Keep frontend dependencies in `frontend/` — declaring one at the root makes it
resolve by Node walking up the tree, which works locally and fails for anyone who installs only
`frontend/`.

Routing in `src/App.jsx`: `/` → `DataMemoryPage` (memory + timings), `/datasets` → `DataSetsPage`
(data quality). Both render inside `DashboardLayout`.

`src/components/ErrorBoundary.jsx` wraps `react-error-boundary` with the dashboard's MUI fallback.
It is used at two levels: around each route in `App.jsx`, and around each chart in the pages.
**Wrap new charts in it** — one throwing component used to blank the whole page, and with
multi-second responses a blank page is indistinguishable from a slow one. Pass `resetKeys` (the
selected runs, or the run id) so changing selection retries instead of leaving the error stuck.

**It only catches render errors.** Fetch failures reach it because `useApi` forwards them with
`useErrorBoundary().showBoundary()`, not because React catches them. Anything that throws
asynchronously outside those hooks still needs forwarding by hand.

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
render is fine and expected.

The `data-quality/use*.js` hooks are three-line named wrappers over `useApi` — a naming
convenience, not a second idiom.

## URL state

`src/hooks/useUrlState.js` — `useUrlParam` / `useUrlParamList` over react-router's
`useSearchParams`. Writes use `replace`, so a multi-select does not fill the history.

Both pages read selected runs from the **same `runs` parameter**, so a link carries a selection
across the two views. Only run selection is on the URL so far; dataset, trace and axis choices are
still `useState` and move over per-view as those views are touched (TODO 8.7).

`DataSetsPage` contains substantial commented-out markup from the older `MetricGroupCard` /
`RunSelector` approach alongside the newer `MultiRunSelector` / `RunMetricPanel` one. The migration
to the data-quality components is in progress and not finished, so **the old markup stays until it
is complete** — don't delete it as cleanup.

`src/utils/baseLineChartOptions.js` looks like shared chart config but has **no importers** — every
chart builds its ECharts `option` object inline and independently, so axis/tooltip/dataZoom setup is
duplicated across components. Editing that file changes nothing until something imports it.
