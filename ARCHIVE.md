# Archive — completed work

A compact changelog of completed work, mirroring TODO.md's section numbers exactly (e.g. "see
ARCHIVE.md section 4" always means the same section 4 as TODO.md's). Section 7 (deliberate,
do-not-fix policy) stays in TODO.md only — it's standing policy, not completed work.

---

## 0. Order of work

### Phase 0 — free wins, nothing later touches them. Done

- [x] Deleted `async` from route handlers (section 1).
- [x] Uncommented `GZipMiddleware` (section 2) — ~4.3x smaller on the wire.
- [x] Removed debug `print`, fixed duplicate `get_raw_dataset` name and a stray mid-file
      `import json` (section 2).
- [x] Moved `echarts-stat` into `frontend/package.json` (section 6).
- [x] Deleted confirmed-dead code: `normalizeName`, `chartjs-plugin-zoom`, `react-chartjs-2`,
      `frontend/src/data.json`, `frontend/src/sigma.json` (section 6).
- [x] Fixed `MemoryABChart`'s mislabelled x-axis (section 1) — wired up the previously-unreachable
      rank chart with a real rank axis; dataset names moved to the tooltip.
- [x] Fixed the gradient-only "B is faster by N%" headline (section 1) in both charts — replaced
      with win count + median B/A, fit kept as a secondary line.
- [x] Added an error boundary (section 4) — `ErrorBoundary.jsx`, used per-route and per-chart.

### Phase 1 — foundations that get more expensive the longer you wait. Done

Split into three ordered sub-phases: 1a plumbing/tokens, 1b finishing the in-flight component
migration, 1c chart chrome/layout.

**1a — plumbing and tokens. Done.**

- [x] Single API client (section 4) — `src/api/client.js`: `apiGet(path)` + `ApiError`
      (`status: 0` = network failure).
- [x] One fetch idiom with cancellation (sections 1, 4) — `src/hooks/useApi.js`: `useApi`/
      `useApiAll`, both abort on input change/unmount, escalate to the error boundary by default.
      Fixed `useListDatasets`'s stale closure and `RunMetricPanel`'s stale lazy initialiser as a
      side effect. `useRunResource` deleted.
- [x] URL-state mechanism (8.7) — `src/hooks/useUrlState.js`: `useUrlParam`/`useUrlParamList`,
      `replace`-based writes. Adopted for selected runs first.
- [x] `theme.js` → `src/theme/` (`tokens.js`, `muiTheme.js`, `echartsTheme.js`) (section 4) —
      chrome-only registered ECharts theme, applied via a new `Chart.jsx` wrapper around
      `<ReactECharts>` rather than a per-file prop, so no caller can forget it.
- [x] A/B fixed to semantic colour tokens, `tokens.variant.A`/`.B` (section 4) — validated for
      contrast/colourblind separation; chrome primary moved to slate teal `#0f6e6b` to avoid
      colliding with A's blue. Done as `src/theme/variant.js` (`variantOf`, `variantSeriesStyle`),
      applied to all six A/B charts.

**1b — finish the in-flight migration. Done.**

- [x] Completed `MetricGroupCard`+`RawDataChart` → `RunMetricPanel`+`RunPanel`+`DatasetChart`
      (section 6); both old files deleted.
- [x] Retired `/raw` for curve consumers in favour of `/runs/{run_id}/dataset/{dataset}/{metric}`
      (`useDatasetResource`) — `/raw` stayed live only for `CC_halfOverallPanel` (retired later, in
      phase 4).
- [x] Deleted `RunSelector` (section 6); `DataMemoryPage`/`DataSetsPage` both use
      `MultiRunSelector` now; removed `DataSetsPage`'s dead commented-out markup.
- [x] Moved `RunMetricPanel`'s dataset choice/sync toggle and `MemoryProfilerPlot`'s dataset choice
      onto the URL (8.7) — added `useUrlParamMap`.
- [x] Fixed `RunMetricPanel`'s pre-v6 `<Grid xs md>` props (silently ignored under MUI v9) to
      `size={{xs, md}}`.
- [x] Removed remaining `console.log`s (section 2).
- [x] `RawDataChart`'s `undefined` holes (section 1) resolved by deletion — `DatasetChart` uses
      `legend.selected` instead of filtering the array.

**1c — chart chrome and layout. Done**, two items scoped down:

- [x] Chrome-vs-meaning split (section 4) — done as `src/theme/chartChrome.js`
      (`STANDARD_DATA_ZOOM`, `STANDARD_LEGEND`) rather than a factory, once live charts showed no
      larger shared shape existed. `baseLineChartOptions.js` deleted (matched no live chart).
- [x] Centralised chart heights into `tokens.chart.height.*` (`sparkline`/`panel`/`full`/`tall`) —
      did not do the fuller "container decides sizing" restructuring, deferred to phase 4.
- [x] Loading/error/empty state pattern (section 4) — `src/components/LoadingState.jsx`;
      `MemoryPanels`/`CC_halfOverallPanel` render from partial `data` instead of gating on the
      aggregate `loading` boolean.
- [x] Eslint sweep (section 2), run last — down to 0 errors.

### Phase 2 — the cohort table (8.1). Done

- [x] Full `xia2-summary.dat` extractor, metric registry, `/cohort` endpoint, coverage reporting —
      `extract_xia2_summary`/`extract_xia2_samples`, `build_cohort`, `RunService.get_cohort`,
      `GET /runs/{run_id}/cohort`. Verified: 231 rows, 228 complete, 1 `missing_a`, 2 `missing_b`.
- [x] Multi-sample collision bug (section 1) — split out as phase 2b, since the new cohort
      extractor never went through the buggy `_top_dir` path.
- [x] Reconciled the `Workspace` Protocol with `LocalWorkspace` (section 4) — signatures now match.
- [x] Captured `sanitise`'s output shape backend-side as `CohortRow.status`/`CohortCoverage`, then
      deleted it (sections 5, 6).
- [x] Added `_ensure_run_exists` 404 guard to every route (section 1); gave `/cohort` a Pydantic
      response model (section 4) — `routers/models.py`, the first in the codebase.
- [x] Added the missing `else` branch to `_apache_series_builder` (section 1) — returns `None`
      instead of raising.
- [x] Added `backend/test_cohort.py` — first test file, asserts cohort row/coverage shape and
      registry keys.
- [x] `DatasetSelector` dataset+sample handling resolved in phase 2b without touching the
      component.

### Phase 2b — rekey the old per-dataset extractors by `(dataset, sample)`. Done

- [x] `dataset` became the composite `"dataset/sample"` id everywhere it was passed through as an
      opaque string, rather than threading a new `sample` parameter — `extract_xia2_datasets`
      returns composite ids always; `_top_dir` → `_sample_key`; the per-dataset extractors resolve
      through a new `_dataset_sample_path` helper; `extract_xia2_cumulative_timing` iterates
      composite ids (also fixed `build_cohort`'s duplicated multi-sample memory/runtime as a side
      effect).
- [x] Routes: `{dataset}` → `{dataset:path}` on the five routes that take one. Found and fixed a
      route-ordering trap — `/memory/{dataset:path}/events` must be declared before the bare
      `/memory/{dataset:path}`, or Starlette's greedy match swallows it.
- [x] Frontend needed zero changes — `dataset` was already treated as an opaque string everywhere.
- [x] Strengthened `test_cohort.py`'s fixture to use distinct per-sample values so it can actually
      catch the duplication bug.

### Phase 3 — provenance. Done

- [x] Extracted A/B build hashes from `xia2-debug.txt` (section 5) — `extract_xia2_build_info`,
      surfaced via `/runs/{run_id}`'s `builds` field.
- [x] Added a differing-A-build warning (section 5) — `RunProvenance.jsx`, fetches `/runs/{run}`
      per selected run, wired into both pages.

### Phase 4 — the views (completed items)

- [x] 8.2 `MetricScatter` — the shared primitive. `frontend/src/components/MetricScatter.jsx`:
      B-vs-A parity scatter, identity line, linear fit, win-count/median summary. Colour/size
      encoding props never built (planned consumer 8.8 was reverted first).
- [x] 8.3 small multiples overview — `CohortGrid.jsx` + `ExplorePage.jsx` (new `/explore` route),
      one `MetricScatter` per registry metric, click-to-expand `Dialog`.
- [x] 8.5 outlier callouts — per-datapoint `itemStyle` override in `MetricScatter`, no new
      component.
- [x] 8.4 dataset detail page and "what moved" strip — new splat route
      `/explore/dataset/:run/*`, reached via a `MetricScatter` point click or `DatasetSelector`,
      both through `goToDataset` (`src/navigation.js`).
- [x] 8.8 the workbench — built, tried against a real run, reverted. Judged not useful.
- [x] `CC_halfOverallChart` moved off `/raw` onto its own `GET /runs/{run_id}/cc_half` endpoint
      (kept separate from `/cohort` — different DIALS computation).

---

## 1. Bugs — wrong output or crashes (resolved)

- [x] **Every endpoint blocked the whole server** — route handlers were `async def` calling
      synchronous IO-heavy extractors, running on the event loop instead of FastAPI's threadpool
      (measured: `/ping` 1.9ms → 1107ms during a `/raw` request). Fixed by removing `async`.
- [x] **`MemoryABChart` mislabelled its x-axis** — `labels` pushed in original order but series
      sorted descending. Fixed.
- [x] **Multi-sample datasets silently lost a sample** — `_top_dir` keyed by dataset only, so the
      second sample overwrote the first (5 datasets in run 2700 affected, incl. `7ris`'s two
      distinct crystals). Fixed in phase 2b via `_sample_key`'s composite `dataset/sample` id.
- [x] **`_apache_series_builder` raised `UnboundLocalError` on unknown filenames** — no `else`
      branch. Fixed to return `None`.
- [x] **Unknown run returned HTTP 200, not 404** — fixed via shared `_ensure_run_exists` guard.
- [x] **Unknown dataset within a valid run returned HTTP 200, not 404** — fixed via
      `_ensure_dataset_exists`.
- [x] **`RawDataChart` put `undefined` holes in its series array** — resolved by deleting the
      component in phase 1b.
- [x] **`useListDatasets` had a stale-closure bug** — resolved by becoming a wrapper over `useApi`.
- [x] **No request cancellation anywhere** — `useApi`/`useApiAll` now abort on input change/unmount.
- [x] **"B is faster/larger by N%" headline derived from gradient alone**, ignoring intercept — can
      assert a direction the data doesn't support. Fixed: report win count + median ratio instead.
- [x] **`CumulativeTimeTaken` crashed on render** — undefined vars, malformed options. Fixed,
      rebuilt as an A-vs-B scatter with identity line + regression.
- [x] **`MemoryABChart`/`CumulativeTimeTaken` had a regression-line/point colour collision** (same
      hex for both) — fixed using the palette already proven in `MetricScatter`.
- [x] **`interpolate` returned silently wrong numbers** (required ascending x, real data is
      descending) — resolved by deletion; the real CC½ threshold is already DIALS-computed and
      directly readable, no interpolation needed (see section 6).

## 2. Quick fixes (done)

- [x] Uncommented `GZipMiddleware` — `/raw` payload 1.68MB → 387KB gzipped.
- [x] Removed debug `print` in `xia2_processor.py`.
- [x] Removed leftover `console.log`s across the frontend.
- [x] Fixed duplicate `get_raw_dataset` route handler name and a stray mid-file `import json`.
- [x] Eslint sweep — ~35 errors down to 0 (phase 1c).
- [x] `GET /runs` returned runs in filesystem-dependent order — `RunService.list_runs` now sorts by
      the marker file's mtime, most recent first.

## 3. Performance (resolved items)

- [x] Blocking event loop — see section 1.
- [x] No compression — see section 2.
- [x] **`/memory`, `/cumulative`, `/cohort` walked the whole run tree with `rglob`** instead of
      constructing exact paths. Rewrote `_extract_memory_files`/`extract_xia2_timing` to build
      paths directly. `/cohort` 3.2–3.4s → ~0.25–0.3s (~12x), `/memory` ~24x, `/cumulative` ~12x.
      `_extract_json_files` (backs `/raw`/`/comparison`) deliberately left alone — not a measured
      bottleneck.
- [x] **`GET /runs/{run_id}` took 1.4–1.6s** — the cost was `extract_xia2_build_info`'s full
      recursive `rglob` over the whole run tree. Rewrote `extract_xia2_datasets` to read
      `good_master_files.txt` directly, and `extract_xia2_build_info` to check direct paths.
      1.4–1.6s → 0.02–0.06s (~30–70x).

## 4. Architecture and design (resolved items)

- [x] **`Workspace` Protocol didn't match `LocalWorkspace`'s real signatures** — reconciled in
      phase 2.
- [x] **Frontend couldn't be deployed** — `localhost:8000` hardcoded in seven files. Fixed via
      `src/api/client.js` reading `VITE_API_URL`.
- [x] **Three parallel data-fetching idioms** — consolidated onto `useApi`/`useApiAll`.
- [x] **No shared chart config** — split by chrome (shared, `chartChrome.js`) vs meaning (stays
      inline per chart).
- [x] **A/B colour fell through to ECharts' default palette**, inconsistent across charts — fixed
      via `tokens.variant`/`variant.js` (phase 1a).
- [x] **No error boundary** — added `ErrorBoundary.jsx`; later refined to hint at
      `VITE_API_URL`/`FRONTEND_URL` when `error.status === 0`.
- [x] **Loading/error/empty states were bare `<p>` or nothing** — `LoadingState.jsx` added;
      partial-render bug (aggregate `loading` blanking already-loaded runs) fixed at the call
      sites.
- [x] **Extended Pydantic response models past `/cohort`** — `RunMetadata`, `CCHalfResponse`
      added; `/raw`/`/comparison`/`/memory`/`/info` stay untyped by design.
- [x] **No domain model** — added `ABPair[T]` (`runs/ab_pair.py`) and `DatasetSampleId`
      (`runs/dataset_id.py`), used by `CohortRow` and the per-sample extractors respectively. A
      `run_id` type was dropped — no structure to encapsulate.
- [x] **`cc_half`'s blank-chart-on-rename risk** — `DatasetChart` now falls back to showing every
      trace if none match `"fit"`, instead of defaulting all to hidden. Depending on DIALS's own
      `"fit"` naming is accepted, not hardened further.
- [x] **Typed the remaining live routes** — `TraceSeries`/`DatasetSeries`, `MemoryRow`,
      `MemoryProfile`, `MemoryEventsResponse`, `DatasetInfoResponse` (using `ABPair[str]`, which
      needed `extract_xia2_unit_cell`/`extract_xia2_space_group` fixed to return `None` instead of
      `[]` for a missing variant). `/cumulative` reuses `CCHalfResponse` (identical shape). The
      whole-run `/raw`/`/comparison` stay untyped — confirmed zero frontend consumers.

## 5. Product gaps (resolved items)

- [x] **Provenance (A/B build identity) was unextracted** — `extract_xia2_build_info` reads
      `xia2-debug.txt`, surfaced via `/runs/{run_id}`'s `builds` field and `RunProvenance.jsx`.
- [x] **A is not a fixed baseline across runs**, so cross-run comparisons are confounded —
      documented in CLAUDE.md; `RunProvenance.jsx` shows each run's A/B build and warns when A
      builds differ.
- [x] **No shareable state** — resolved by 8.7 (URL-backed selections). Two narrow exceptions left
      un-migrated by choice (`CohortGrid`'s dialog state, `MemoryComparisonBlock`'s mode toggle).
- [x] **Thin statistics** — gradient-only headline and outlier flagging fixed (phase 0, 8.5). A
      delta-distribution/significance histogram (`MetricDeltaHistogram.jsx`, modified z-score with
      Iglewicz & Hoaglin's MAD-zero fallback) was built and tried against a real run, then
      **reverted in full** — the statistical method was sound, the UI didn't earn its place.
      Decided not to revisit.
- [x] **Incomplete A/B pairs silently dropped in `/memory`** — `_extract_memory_files` now emits a
      row for every known sample (not just ones with ≥1 file present), each carrying an `ab_status`
      `status`. `MemoryPanels.jsx` shows a coverage line per run. `MemoryABChart`/etc. untouched —
      same array shape, now just complete.

## 6. Unused code — resolved

**Planned work, keep:**

- [x] `RunService.run_exists` — now used in `_ensure_run_exists` (phase 2).
- [x] `_extract_cc_half_from_raw`/`/raw/interpolated` — reworked into
      `GET /runs/{run_id}/cc_half`, reading the DIALS-computed threshold directly instead of
      interpolating. Payload dropped ~64x (1.72MB → 26KB). Kept separate from `/cohort` (different
      DIALS computation).
- [x] **`CC_halfOverallChart` redesigned as a per-run parity plot** — the old multi-line A/B/Δ
      overlay across 231 datasets was hard to read; rebuilt on `MemoryABChart`'s small-multiples
      parity-scatter shape instead. "Better" is `B > A` here (opposite of memory); axis/tooltip
      convert to Å via `invSqToD` while the fit/win-count are computed on raw values. No longer
      belongs in CLAUDE.md's shared-axes confound list.

**Superseded, safe to delete:**

- [x] `normalizeName` — sanitisation moved backend-side.
- [x] `chartjs-plugin-zoom` + `react-chartjs-2` — pre-ECharts leftovers.
- [x] `sanitise` — shape captured into `/cohort`'s `status`/`coverage` first, then deleted.
- [x] `frontend/src/data.json`, `frontend/src/sigma.json` — confirmed absent/untracked.

**Migration in progress:**

- [x] `RunSelector` → superseded by `MultiRunSelector`; deleted in phase 1b.
- [x] `MetricGroupCard`+`RawDataChart` → `RunMetricPanel`+`RunPanel`+`DatasetChart`; both old files
      deleted in phase 1b.

**Already done — no action:**

- `/runs/{run_id}/dataset/{dataset}/comparison` exists ([runs.py:42](backend/routers/runs.py#L42))
  and is consumed by `RunMetricPanel metric="comparison"`.

**Packaging:**

- [x] `echarts-stat` moved from the root `package.json` to `frontend/package.json`.

## 8. New features — the exploration loop (completed)

Direction agreed 2026-08-18: the dashboard's job is exploration — why B differs from A — not a
ship/don't-ship verdict. A single cohort table (8.1) underpins every view; `MetricScatter` (8.2)
is the shared primitive 8.3/8.5/8.8 configure. See TODO.md section 8 for 8.7 (open) and deferred
ideas.

### 8.1 The cohort table — the backbone. Done — see TODO section 0, phase 2

- [x] Parsed the whole of `xia2-summary.dat` into a per-sample record, joined with peak-memory/
      timing/`d_min` — `extract_xia2_summary`/`extract_xia2_samples`. Image count/wavelength/
      detector distance/beam centre excluded (not an A/B axis); `cell`/`spacegroup` kept.
- [x] Row granularity is the sample, not the dataset — depends on the phase 2b collision fix.
- [x] Reports coverage rather than filtering — 231 samples, 230 with an A summary, 229 with a B,
      228 complete pairs. `CohortRow.status`/`CohortCoverage` surface this per row and in
      aggregate.
- [x] A backend-owned metric registry (`backend/runs/metrics.py`) — 11 entries (9 `xia2-summary`
      overall metrics + peak memory + cumulative runtime), each with key/label/unit/formatter/
      `better`. `low_resolution_limit`'s `better` is deliberately `None`. Served in every
      `/cohort` response.
- [x] One endpoint, `GET /runs/{run_id}/cohort`, with a Pydantic response model — the first in the
      codebase.

### 8.2 `MetricScatter` — the shared primitive. Done

- [x] One scatter component configured three ways (small multiples, workbench) —
      `frontend/src/components/MetricScatter.jsx`, taking `rows` + one registry `metric`: identity
      line, linear fit, win-count/median-ratio summary. Axes pinned to A/B of one metric (not
      generic x/y) — 8.8 unpinned them, tried, reverted; `MetricScatter` itself never changed.
      Colour/size encoding props never built.
- [x] A and B fixed to consistent colours — axis *names* use `tokens.variant.A`/`.B` (points are a
      single plain colour since one point carries both an A and a B value).

### 8.3 Small multiples overview — the way in. Done

- [x] A grid of B-vs-A parity scatters, one panel per metric, over the same ~229 samples —
      `frontend/src/components/CohortGrid.jsx`, mounted at `/explore` (`ExplorePage.jsx`). Click a
      card to expand it in a `Dialog`; click a point to open that sample's detail page (8.4).
      Coverage line reads off `/cohort`'s `coverage` field.

### 8.4 Dataset detail page and the "what moved" strip. Done

- [x] A per-sample page with every metric, CC½ curve, memory profile and stage timings for A and B
      together — `frontend/src/pages/DatasetDetailPage.jsx`, splat route
      `explore/dataset/:run/*`. Reuses `DatasetChart`/`MemoryProfilerPlot` via a new
      `fixedDataset` prop. Two entry points (`DatasetSelector`, `MetricScatter` point click) both
      call `goToDataset` (`src/navigation.js`).
- [x] A "what moved" strip of Δ badges at the top — `frontend/src/components/WhatMovedStrip.jsx`,
      one MUI `Chip` per registry metric, coloured by `metric.better` vs sign of `B - A`, neutral
      for `better: null`, "—" for incomplete rows. `formatValue`/`metricValue` hoisted to
      `frontend/src/theme/metricFormat.js`.

### 8.5 Outlier callouts. Done

- [x] Auto-colour the top 5 points furthest from the parity line (ranked by `|B - A|`) in any
      `MetricScatter`, via per-datapoint `itemStyle` — colour instead of a text label, since full
      sample ids overlap at this chart size.

### 8.7 URL-encoded state. Done

- [x] Every view is addressable — adopted incrementally: selected runs, `RunMetricPanel`'s
      dataset/sync toggle, `MemoryProfilerPlot`'s dataset moved onto the URL earlier;
      `DatasetChart`'s trace selection (`trace_${urlKey}`) moved last.

### 8.8 The workbench. Tried, reverted

- [x] Free axis pickers over the full metric vocabulary — built as a mode toggle on `/explore`
      (`WorkbenchPlot.jsx`+`Workbench.jsx`, kept independent of `MetricScatter`/`CohortGrid`),
      tried against a real run, judged not useful, reverted in full.
