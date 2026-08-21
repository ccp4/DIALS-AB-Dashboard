# Known Issues and Improvements

Findings from a full read of the codebase (2026-08-18), verified against a running instance
with the `xia2-irrmc-inflate-2700` dataset. Ordered within each section by value-to-effort.

**Audience context:** this is intended for the wider community — specialised scientists and
software engineers who are semi-familiar with the domain. That raises the priority of
deployability, provenance, and clear failure reporting well above what a personal tool would need.

---

## 0. Order of work

> **Resuming? Start here.** Phase 0 through phase 3 are all complete. `GET /runs/{run_id}/cohort` is
> live, one row per `(dataset, sample)`, with a metric registry and exact per-sample
> coverage/memory/runtime. Every `dataset` parameter in the backend — routes, extractors — is now a
> composite `"dataset/sample"` id; see CLAUDE.md's workspace-layout note before touching any of
> `xia2_extractor.py`'s per-dataset functions. `/runs/{run_id}` now also carries each run's A/B
> DIALS build, surfaced by `RunProvenance.jsx` on both pages, with a warning when selected runs'
> A builds differ. `/cohort`/`/memory`/`/cumulative` were also sped up ~12–24x (section 3) before
> starting phase 4, since every phase-4 view depends on `/cohort`. **Phase 4 is underway**: 8.2
> (`MetricScatter`, the shared parity-scatter primitive), 8.3 (`CohortGrid`, the small-multiples
> overview, live at `/explore`), 8.5 (outlier points highlighted by colour in `MetricScatter`) and
> 8.4 (the dataset detail page and "what moved" strip, at `/explore/dataset/:run/*`) are all done.
> **The next task is 8.6 — the comparison basket.** Read section 8 in full before starting; it's
> ordered by dependency and 8.2 is deliberately the shared primitive the rest configure.
>
> `backend/test_cohort.py` is the first test in the repo — `cd backend && venv/bin/python3 -m
> pytest` runs it. Everything else is still `npm run dev` and looking at it.

Sections 1–8 are organised by *category*, which is right for lookup and wrong for deciding what to
do next. This section is the other axis: the sequence. Items stay defined in their own sections;
this one only orders them and records why.

**Ordering principle, chosen deliberately: least wasted work.** Not "fix all bugs first" and not
"cheapest first" — sequence by what avoids doing the same job twice. Two consequences that look
wrong out of context:

- Some live bugs are deliberately *not* fixed, because the code holding them is being deleted. They
  are marked below as resolving by deletion, with the phase that deletes them.
- Some cheap items are deliberately *delayed*, because doing them before a structural change means
  doing them again after it. The eslint sweep is the clearest case.

Each phase notes what it unblocks. Where an item is cheapest because you are already inside that
file for another reason, that is stated — most of the savings here come from batching by file
rather than by category.

### Phase 0 — free wins, nothing later touches them

Independent of everything below, no rework risk, roughly an afternoon.

- [x] Delete the `async` keywords from the route handlers (section 1). **Do this first** — it also
      gates phase 1b, because fanning out to per-dataset requests against a blocked event loop is
      worse than one fat request.
- [x] Uncomment `GZipMiddleware` (section 2) — 4.3x on the wire. Measured after: 4.47x.
- [x] Remove the debug `print` (section 2); fix the duplicate `get_raw_dataset` name and the stray
      mid-file `import json` (section 2) — you are in `runs.py` anyway for the `async` fix.
- [x] Move `echarts-stat` into `frontend/package.json` (section 6) — currently resolves only by Node
      walking up to the repo root, so a `frontend/`-only checkout fails to build.
- [x] Delete the confirmed-dead: `normalizeName`, `chartjs-plugin-zoom`, `react-chartjs-2`,
      `frontend/src/data.json`, `frontend/src/sigma.json` (section 6). **Before** the eslint sweep in
      phase 1c, so the sweep is smaller.
- [x] Fix `MemoryABChart`'s mislabelled x-axis (section 1). The block holding the bug turned out to
      be unreachable — an unfinished rank-distribution chart shadowed by the per-run grid. Decision
      taken to **wire it up** rather than delete it: real rank axis, dataset names moved to the
      tooltip. Still superseded by 8.3 eventually.
- [x] Fix the gradient-only "B is faster by N%" headline (section 1) in both charts. Replaced with
      win count + median B/A, fit expression kept as a secondary line. Logic is duplicated across the
      two charts by choice — phase 1c can extract it.
- [x] Add an error boundary (section 4) — `ErrorBoundary.jsx`, a thin wrapper over
      `react-error-boundary` supplying the MUI fallback. Used per-route in `App.jsx` and per-chart
      in `DataMemoryPage`. **Wrap the phase-4 components in it as they land.**

### Phase 1 — foundations that get more expensive the longer you wait

The heart of the ordering principle: each of these is O(1) now and O(n) once the phase-4 views
exist. Split into three sub-phases because they must happen in this order.

**1a — plumbing and tokens (no component surgery).** Everything here is either a new module or a
global switch, so it lands without rewriting the charts:

> **Status: all five items below are done.** 1a-ii ended up going through a `Chart.jsx` wrapper
> around `<ReactECharts>` rather than a `theme="dials"` prop added file-by-file — same effect
> (every chart is themed, and the theme cannot be forgotten by a new chart that imports
> `echarts-for-react` directly instead), less repetition. `MemoryComparisonBlock.jsx` still has an
> unused `ReactECharts` import left over from before the wrapper; that is 1c's eslint sweep, not a
> gap here — it renders no chart itself, only `MemoryOverlayChart`/`SingleMemoryPlot`, which are
> themed.

- [x] A single API client reading `import.meta.env.VITE_API_URL` (section 4). Seven files hardcode
      `http://localhost:8000` today; section 8 would add an eighth. Also the deployability blocker.
      `src/api/client.js` — `apiGet(path)` plus an `ApiError` carrying `status` (0 for a network
      failure, so "backend down" is distinguishable from 404). Raw paths at the call sites rather
      than a named route map; revisit if phase 1b's `/raw` retirement proves fiddly.
      `frontend/.env.copy` documents the variable; the fallback means no `.env` is needed for
      local work.
- [x] One fetch idiom, with `AbortController` in it once (section 4, section 1). Also route fetch
      failures into the error boundary via `useErrorBoundary()` — today a dead backend shows a
      permanent "Loading…", because boundaries do not catch async errors. Doing it here does it
      once rather than three times. There are three
      idioms now; doing cancellation per-idiom is three times the work. This also fixes
      `useListDatasets`' stale closure and `RunMetricPanel:15`'s stale lazy initialiser as a side
      effect — neither is worth fixing standalone.
      Done as `src/hooks/useApi.js`: `useApi(path)` and `useApiAll([{key, path}])`. Two hooks
      because the multi-run accumulate-and-prune shape is genuinely different; forcing one hook to
      do both would be the bad abstraction. Escalation to the boundary is the default, with
      `{throwOnError: false}` to opt out. `useRunResource` deleted. **`RunMetricPanel` was not
      fixed as a side effect** — the lazy initialiser needed an explicit change (seed `{}` and let
      an absent key read as null). `useApi` derives `loading` from a path stored alongside the
      data rather than storing it, which avoids `react-hooks/set-state-in-effect` and the flash of
      the previous path's data.
- [x] The URL-state mechanism (8.7). Building views with it is far cheaper than retrofitting five
      views afterwards. Per-view adoption follows in 1b and phase 4.
      `src/hooks/useUrlState.js` — `useUrlParam` and `useUrlParamList` over react-router's
      `useSearchParams`, writing with `replace` so a five-chip selection leaves one history entry.
      **Adopted for selected runs only.** Axes, active dataset and basket contents are still
      `useState`; 8.7 stays open until they follow.
      Both pages were split so the run selector sits *outside* the boundary the fetch escalates to
      (`MemoryPanels`, `CC_halfOverallPanel`) — otherwise a failed request takes the selector with
      it and leaves no control to retry from.
- [x] `tokens.js` → `theme.js` + `echartsTheme.js` (section 4). One file holding every hex, spacing
      and chart height; the MUI theme and an `echarts.registerTheme("dials", …)` both built from it.
      `registerTheme` is a global switch, so charts inherit the palette without being rewritten —
      which is why this belongs *before* the migration rather than after it.

      **Agreed shape.** There is no `tokens.js` today; `src/theme.js` is 14 lines holding only
      `primary`/`secondary`, and is imported by `main.jsx`. Replace it with a `src/theme/`
      directory: `tokens.js` (the values), `muiTheme.js` (`createTheme` from tokens, default
      export, so `main.jsx`'s import path is the only thing that changes there) and
      `echartsTheme.js` (calls `echarts.registerTheme("dials", …)` as an import side effect,
      imported once from `main.jsx`).

      The registered theme carries **chrome only** — fonts, grid margins, axis line and label
      colour, tooltip, dataZoom, legend. Not the A/B pair; see the next item for why.

      Then add `theme="dials"` to every `<ReactECharts>`: `MemoryABChart`, `MemoryRankChart`,
      `MemoryProfilerPlot` (two), `CumulativeTimeTaken`, `CC_halfOverallChart`, `DatasetChart`,
      `RawDataChart`. Note `RawDataChart` and `MetricGroupCard` are deleted in 1b — do them anyway,
      it is a one-line prop, and skipping them means the two pages look different until 1b lands.

      **Done differently: `src/components/Chart.jsx`** wraps `<ReactECharts>`, sets `theme="dials"`
      once, and imports `echartsTheme.js` for its registration side effect so no caller has to
      remember to. Every chart component now imports `Chart` instead of `echarts-for-react`
      directly (`RawDataChart` included, per the note above). `MetricGroupCard` was not touched — it
      is dead code already superseded per section 6, not a chart still being rendered.

      Record `dark` values in tokens alongside `light`, but **do not wire a mode toggle** — there is
      no dark mode in the app and building the switch before anything asks for it is the kind of
      speculative work the rest of this file avoids.
- [x] Fix A and B to semantic colour tokens — `tokens.variant.A` / `.B`, never a palette index.
      A/B colour is data encoding, not decoration (section 4), and A must be the same colour in
      every chart regardless of how many series are on screen. Validated pair: light
      `#2a78d6` / `#eb6834`, dark `#3987e5` / `#d95926` — passes lightness band, chroma floor,
      colourblind separation (ΔE 24.7 light / 26.8 dark against a ≥8 target), normal-vision floor
      (33.6 / 31.8 against ≥15) and 3:1 contrast, on the stricter all-pairs test that the parity
      scatters require. Note the current `primary: #0080ff` is nearly the same blue, so pick a
      chrome primary *outside* the A/B pair or buttons and A-data will read alike. The `#d62728`
      regression lines are a series red doing an annotation's job — move them to muted ink.

      **Chrome primary decided: slate teal `#0f6e6b`.** Outside the blue/orange pair, reads as
      chrome rather than data, and works against both variants. `secondary` can stay `#9c27b0`.

      **The A/B colours cannot come from the registered theme's `color` array — it is positional.**
      In `MemoryABChart` the identity line and the regression are series 0 and 1, so A would take
      the third entry; in `MemoryRankChart` the series count varies with how many runs are
      selected. Set `itemStyle`/`lineStyle` explicitly per series from `tokens.variant.A` / `.B`.
      This is what "never a palette index" means in practice, and it is the part most likely to be
      got wrong by assuming `registerTheme` handles it.

      Charts to change, with what is A/B in each: `MemoryABChart` (scatter is a *pair* per point,
      so A/B colour does not apply to the marks — colour the axis names instead, and move the
      `#d62728` regression to muted ink), `MemoryRankChart` (`${run} A` / `${run} B` series),
      `MemoryProfilerPlot` (the "DIALS A" and "DIALS B" charts), `CumulativeTimeTaken` (same as
      `MemoryABChart`), `CC_halfOverallChart` and `DatasetChart` (traces are located by the
      `"A - "` / `"B - "` name prefix — see the series contract in CLAUDE.md).

      **Done as `src/theme/variant.js`.** `variantOf(name)` reads the series-contract prefix (or a
      bare `"A"`/`"B"`, which is what the merging-stats traces use) back into a variant;
      `variantSeriesStyle(variant, index)` returns the `itemStyle`/`lineStyle` for it. `index` picks
      a line dash from `LINE_TYPES` so same-variant series sharing a colour (different runs, or
      different traces within one variant) stay distinguishable — that need wasn't visible when
      this item was written but fell out of `RawDataChart`/`DatasetChart` having several A traces
      and several B traces on screen at once. Applied to all six charts listed above; `RawDataChart`
      and `DatasetChart` also use `variantOf` to route non-A/B traces (fit lines, `cc_half` overlays)
      to the plain categorical palette instead.

**1b — finish the in-flight migration. Done.** Written against 1a's client, fetch idiom and tokens,
so the new components were correct the first time:

- [x] Complete `MetricGroupCard` + `RawDataChart` → `RunMetricPanel` + `RunPanel` + `DatasetChart`
      (section 6), resolving the ~80% overlap between the two chart components rather than shipping
      both. Both old components had zero live callers by the time this was picked up — the
      migration itself (lifting selection into `RunMetricPanel`/`RunPanel`) was already done;
      deleting the two files was what remained.
- [x] Retire `/raw` for curve consumers in favour of `/raw/datasets/{id}`. **These are one change,
      not two:** `RawDataChart` owns its own run→dataset→trace selection internally, so it cannot
      fetch narrowly — the fat endpoint is a consequence of the component's shape. Lifting selection
      into `RunMetricPanel` is what makes the per-dataset endpoint possible.
      `RunMetricPanel`/`RunPanel` already read through `/runs/{run_id}/dataset/{dataset}/{metric}`
      (`useDatasetResource`) — this was in fact already done; `/raw` remains live only for
      `CC_halfOverallPanel`, which is expected per phase 5 to retire separately once the cohort
      table exists.
- [x] Delete `RunSelector` once `DataMemoryPage` migrates (section 6), and remove `DataSetsPage`'s
      commented-out markup — **this is what expires the second item in section 7.** `DataMemoryPage`
      now uses `MultiRunSelector`, same as `DataSetsPage` (both still share the `runs` URL param);
      `RunSelector.jsx` is deleted. The commented-out `MetricGroupCard`/`RunSelector` JSX and the
      now-dead imports (`RawDataChart`, `MetricGroupCard`, `Card`, `CardContent`, `Typography`,
      `Grid`) are gone from `DataSetsPage.jsx`.
- [x] Move `RunMetricPanel`'s dataset choice and sync toggle onto the URL (8.7), and
      `MemoryProfilerPlot`'s dataset selection. The mechanism exists from 1a; this is the per-view
      adoption. Cheapest while already rewriting these components.
      Added `useUrlParamMap(key)` to `useUrlState.js` — mirrors `useUrlParamList`'s
      `key1:val1,key2:val2` convention (`setValue` takes the full next map, not a `useState`-style
      updater) for the rare case of a selection keyed by a dynamic id set, which the existing two
      hooks didn't cover. `RunMetricPanel` uses `${metric}_ds` / `${metric}_sync`, so the "Raw" and
      "Comparison" panels get independent URL keys automatically. `MemoryProfilerPlot` uses a plain
      `useUrlParam(`ds_${run}`)` — one component instance per run already, no map needed there.
- [x] Check `RunMetricPanel:75`: `<Grid xs={12} md={6}>` is the pre-v6 API and the project is on MUI
      v9, which wants `size={{ xs: 12, md: 6 }}`. If so the props are ignored and the panels are not
      going two-up.
      Confirmed and fixed — the props were being silently ignored.
- [x] Remove the remaining `console.log`s (section 2) — only in files that survive this phase.
      The two in `DatasetChart.jsx` (`console.log(data)`, `console.log(traces)`); the third
      (`RawDataChart.jsx:68`) went with the file.
- [x] `RawDataChart`'s `undefined` holes (section 1) **resolve by deletion here.** `DatasetChart`
      handles the `cc_half` fit case via `legend.selected` instead of filtering the array, which
      makes that bug structurally unrepresentable rather than fixed.

**1c — chart chrome and layout, applied to the survivors only. Done**, with two items scoped down
from how they're written below — see each for why:

- [x] `makeChartOptions()` — the chrome-vs-meaning split (section 4). Chrome (dataZoom, toolbox,
      legend placement, grid margins, tooltip) is shared; meaning (axis names, formatters like
      `invSqToD`, series, markLines) stays inline in the component. Prefer a factory over an object
      to spread — a plain spread replaces nested keys like `grid`/`tooltip` wholesale instead of
      merging. This is the ~60 near-identical lines currently duplicated between `DatasetChart` and
      `RawDataChart`.
      **Scoped down.** By the time this was picked up `RawDataChart` was already gone (1b), so its
      ~60 shared lines with `DatasetChart` were moot. Re-checked all seven live `<Chart>` call
      sites directly rather than trusting the estimate above: grid margins and tooltip formatters
      turned out to genuinely differ per chart everywhere — there was no hidden shared shape left to
      merge, so a `makeChartOptions()` factory would have wrapped almost nothing. What *is*
      literally duplicated: `dataZoom: [{type:"inside"},{type:"slider"}]` (six charts) and
      `legend: {top: 30}` (three charts). Exported both as named constants
      (`STANDARD_DATA_ZOOM`, `STANDARD_LEGEND`) from a new `src/theme/chartChrome.js` instead of a
      factory — a factory around two constants would reintroduce the spread-vs-merge risk this item
      warns about for no benefit. `baseLineChartOptions.js` matched no live chart's actual
      grid/legend/toolbox shape — deleted rather than folded in, per this item's own fallback.
- [x] Move sizing out of the charts. Fourteen hardcoded `height: 600` / `width: "35vw"` values
      belong to the container, not the chart; charts take `height: "100%"` and the card decides.
      This is what makes layout rearrangeable later.
      **Scoped down to centralising, not restructuring.** `tokens.chart.height`'s four buckets
      (`sparkline` 220, `panel` 450, `full` 600, `tall` 700) already matched every literal height in
      the codebase exactly, so every `<Chart style={{height: ...}}>` now reads from
      `tokens.chart.height.*` — no more magic numbers. Did **not** do the "container decides, chart
      takes `height:\"100%\"`" restructuring: that needs a sized wrapper introduced at each call site
      (`MemoryPanels`, `RunPanel`, `CC_halfOverallPanel`), which is real layout work better done
      alongside phase 4's actual grids than before they exist — doing it now risked redoing it.
      `CC_halfOverallChart`'s `70vw` and `DatasetChart`'s `40vw` are unchanged for the same reason.
- [x] Establish the loading / error / empty state pattern (section 4). With multi-second responses,
      users cannot currently distinguish slow from broken. Adoption per view follows in phase 4.
      Half the problem is already solved: `useApi` escalates failures to the boundary, so *broken*
      now looks broken. What is left is the **loading and empty** halves, which are still a bare
      `<p>Loading...</p>` in seven places, and the fact that `useApiAll` reports `loading` for the
      whole set — adding a second run blanks the first run's charts rather than showing them beside
      a spinner. Fixing that means rendering from the partial `data` map while `loading` is true.
      Added `src/components/LoadingState.jsx` (label + MUI spinner) and swapped in all seven bare
      `<p>` strings. For the partial-render bug: `useApi.js` already populates `data` from cache
      before the new fetch resolves (confirmed reading it) — the bug was at the call site, not the
      hook. `MemoryPanels`/`CC_halfOverallPanel` now always render from `data` and derive
      `pending = runs.filter(run => !(run in data))` to show a `LoadingState` only for runs not yet
      present, instead of gating the whole panel on the aggregate `loading` boolean.
- [x] **Then** the eslint sweep (section 2) — last, once the deletions in phase 0 and 1b have
      shrunk it. Doing it earlier means doing it twice.
      Ran after all the above: zero errors. `DataSetsPage`'s seven unused imports were gone with the
      1b cleanup; `BrowserRouter` (`main.jsx`), `ReactECharts` + `Typography`
      (`MemoryComparisonBlock`) and `children` (`DashboardLayout` — genuinely dead, it renders via
      `<Outlet/>`) were deleted; `DatasetChart`'s `react-hooks/set-state-in-effect` was fixed by
      deriving `activeKey = keys.includes(selectedKey) ? selectedKey : keys[0]` during render
      instead of `setState` inside a `useEffect`, the same shape `useApi` already uses for `loading`.

### Phase 2 — the cohort table (8.1). Core done; 2b split out and still open

One coherent piece of backend work. Several bugs are batched in because they live in the files you
are already editing, not because they are urgent.

- [x] Everything in 8.1: the full `xia2-summary.dat` extractor, the metric registry, the `/cohort`
      endpoint, coverage reporting.
      Done as `extract_xia2_summary`/`extract_xia2_samples` (`xia2_extractor.py`), `build_cohort`
      (`xia2_processor.py`), `RunService.get_cohort`, `GET /runs/{run_id}/cohort`. Verified against
      `xia2-irrmc-inflate-2700`: 231 `(dataset, sample)` rows, 228 complete, 1 `missing_a`, 2
      `missing_b` — reported, not dropped. `7ris` correctly produces two distinct rows.
- [ ] **Rekey results by `(dataset, sample)` — fixes the multi-sample collision bug (section 1).**
      This must happen here: a cohort table keyed by dataset would bake the data loss into every new
      feature.
      **Turned out not to be a hard dependency of 8.1, so it's split out as 2b below, still open.**
      The new cohort extractor parses `xia2-summary.dat` fresh — it never calls `_top_dir` or goes
      through `_extract_json_files`, so it derives `(dataset, sample)` directly from the path it's
      already walking and was never at risk of inheriting the bug. Retrofitting `_top_dir` itself
      is real work with its own blast radius (see 2b) — batching it into "build `/cohort`" would
      have made this phase both a new-feature and a breaking-API-change PR at once.
- [x] Reconcile the `Workspace` Protocol with `LocalWorkspace` (section 4). Moved forward from
      "before the SSH backend" because the rekey requires reasoning carefully about what
      `list_files()` returns — which is exactly what the Protocol misdeclares. Nearly free while you
      are already there.
      `list_dirs`/`list_files` now declared with the real signatures (`path: str | Path | None`,
      returning `list[Path]` for `list_files`) instead of the fictional no-arg `list[str]` ones.
- [x] Capture `sanitise`'s output shape backend-side, then delete it (sections 5 and 6).
      The shape (per-item reason, `total`/`complete`/`missing_a`/`missing_b` counts) is
      `CohortRow.status` + `CohortCoverage`. `sanitiseMemoryData.js` deleted (confirmed zero
      importers).
- [x] Add `run_exists` checks to all routes (section 1) — and give the new `/cohort` endpoint a
      Pydantic response model (section 4). **New endpoint only; do not retrofit the old ones yet.**
      Every route in `runs.py` now 404s via a shared `_ensure_run_exists` guard (was `200 []`).
      `routers/models.py` — `CohortResponse`/`CohortRow`/`CohortCoverage`/`MetricDefinition` — is
      the first Pydantic response model in the codebase; the older routes stay untyped dicts.
- [x] Add the `else` branch to `_apache_series_builder` (section 1).
      Returns `None` on an unrecognised filename instead of raising `UnboundLocalError`; the caller
      (`process_xia2_data`) skips a `None` result rather than crashing.
- [x] One contract test on the cohort shape and the series names (section 4). The series-name
      coupling is the thing most likely to break silently, and phase 4 is about to depend on it.
      `backend/test_cohort.py` — the first test file in the repo. Fixture-workspace-backed (a
      `LocalWorkspace` over a `tmp_path`, swapped in via `monkeypatch.setattr` on
      `routers.runs.service`, since that module builds its `RunService` singleton from the real
      configured workspace at import time). Asserts the row/coverage shape and that the metric
      registry's keys are exactly what's expected — not the series-name contract in CLAUDE.md
      (`/cohort` doesn't go through `_apache_series_builder` at all), but the same *kind* of
      silent-breakage risk, for the registry instead.
      `pytest`/`httpx` added to `requirements.txt` — first test dependencies in the repo.
- [x] `DatasetSelector` likely becomes a dataset+sample selector here — `7ris` offering one entry
      when it holds two different crystals is wrong.
      **Resolved in 2b without touching `DatasetSelector` at all** — `7ris`'s two samples are
      already two separate composite-id entries in whatever list of datasets it's given (see 2b),
      so the component needed no change; the fix was one level down, in what `dataset` means.

### Phase 2b — rekey the old per-dataset extractors by `(dataset, sample)`. Done

Split out of phase 2 above: the direct fix for the multi-sample collision bug (section 1), but a
second, separately-testable, API-shape change rather than a side effect of building `/cohort`.

**Built simpler than the write-up below originally called for** — discussed with the author before
implementing: instead of threading a new `sample` parameter through every function/route/frontend
call site, `dataset` **became** the composite `"dataset/sample"` id everywhere it was already just
an opaque string being passed through, which was almost everywhere:

- `extract_xia2_datasets` now returns composite ids directly (always, even for the ~226
  single-sample datasets — no format-sniffing anywhere downstream). `get_datasets`/
  `get_run_metadata` needed **no code change**, since it already just returns whatever that function
  gives it.
- `_top_dir` → `_sample_key`, deriving the composite key from the path directly. Feeds
  `_extract_json_files`/`_extract_memory_files` (→ `/raw`, `/comparison`, `/memory`) — confirmed
  harmless there, every chart consumer already treats the key as an opaque label.
- `extract_xia2_dataset_raw`/`extract_xia2_dataset_comparison`/`extract_xia2_dataset_memplot`/
  `extract_xia2_timing`/`extract_xia2_unit_cell`/`extract_xia2_space_group` resolve through a new
  `_dataset_sample_path(run_id, dataset)` helper (splits the composite id, resolves to
  `run_id/dataset/data/sample`) instead of naive `run_id + "/" + dataset` concatenation. **No new
  parameter, no `service.py` changes** — `dataset` was already just a string flowing through.
- `extract_xia2_cumulative_timing` iterates the composite id list directly instead of bare dataset
  names — this **also resolved `build_cohort`'s "known approximation"** (multi-sample datasets'
  memory/runtime being duplicated across rows) as a side effect, once `extract_xia2_memory` and this
  function were both composite-keyed. Verified against real data: `7ris`'s two samples now show
  genuinely different peak memory (16478 vs 12816 MiB) and runtime (1068 vs 1585 s) instead of an
  identical duplicated value.
- Routes: only the path *declaration* changed, `{dataset}` → `{dataset:path}`, on the five routes
  that take one — no new segment. Verified directly against a live FastAPI instance (not assumed)
  that this correctly captures an embedded `/`, including percent-encoded `%2F`, even with a fixed
  suffix segment after it (e.g. `.../raw`). **Found and fixed a real route-ordering trap this
  created**: `/memory/{dataset:path}` and `/memory/{dataset:path}/events` share a prefix where one
  is a strict suffix-extension of the other, and Starlette's greedy `:path` match on whichever is
  declared *first* swallows the other's requests. The bare route now must be declared after the
  `/events` one — confirmed both orderings against a live instance before picking the working one.
- **Frontend: zero changes.** `DatasetSelector`/`useListDatasets`, `RunPanel`/`useDatasetResource`,
  `RunMetricPanel`'s `${metric}_ds` URL map, `MemoryProfilerPlot`'s dataset `Autocomplete`/
  `ds_${run}` param — all already treated `dataset` as an opaque string end to end, so they started
  working correctly the moment the string itself became composite. No dependent dataset→sample
  dropdown, no new `datasetSamples.js` utility — neither was needed.
- `backend/test_cohort.py` strengthened: `multi-ds`'s two fixture samples now write different
  peak-memory/runtime values, so the test would have caught the pre-fix duplication rather than
  passing regardless (its previous fixture used the same value for both, which couldn't distinguish
  a real per-sample join from the bug it was meant to catch).

### Phase 3 — provenance. Done

Small, independent, and a prerequisite in spirit for phase 4.

- [x] Extract the A and B build hashes from `xia2-debug.txt` and surface them in the run header
      (section 5).
      `extract_xia2_build_info` (`xia2_extractor.py`) — reads only as many of the ~2000-line
      `xia2-debug.txt` copies as it takes to find one A and one B, not all 460 (they're identical
      per variant across a whole run; confirmed against run 2700's real files before assuming it).
      Added to `/runs/{run_id}` as a `builds` field — no new endpoint. Verified against real data:
      run 2700 → `A: DIALS 3.dev.1493-gf324578a1, B: DIALS 3.dev.1505-g0cc846ac7`; run 5400 → a
      different A (`3.dev.1488-g893c8dfee`), matching this file's own worked example above.
- [x] Warn when selected runs have differing A builds (section 5). 8.3 plots several runs on shared
      axes, which is misleading until this exists.
      New `frontend/src/components/RunProvenance.jsx` — fetches `/runs/{run}` per selected run
      (`useApiAll`, same idiom as everywhere else), lists each run's A/B build, and shows a warning
      `Alert` when the selected runs' A builds aren't all the same. Wired into both `DataMemoryPage`
      and `DataSetsPage` (both already have this confound live today via `MemoryRankChart` and
      `CC_halfOverallChart`, not just the not-yet-built 8.3), each in its own `ErrorBoundary` so a
      failed provenance fetch doesn't take the run selector down with it.

### Phase 4 — the views

Section 8's order. Each inherits 1a's tokens and 1c's chrome rather than establishing its own.

- [x] 8.2 `MetricScatter` — the shared primitive.
      Done as `frontend/src/components/MetricScatter.jsx` — one B-against-A parity scatter per
      metric, with an identity line, a linear fit (`echarts-stat`) and a win-count/median-B/A
      summary callout, per the domain conventions' "no single sign convention" rule. **Reimplements
      `MemoryABChart`'s identity-line/regression/summary logic independently rather than extracting
      it** — `MemoryABChart` is itself superseded and deleted later in this phase (see the bullet
      below), so extracting from code about to be deleted wasn't worth it. **Colour/size encoding
      props from the original 8.2 write-up are deferred to 8.8** — the workbench is the first real
      consumer of them; 8.3 doesn't need them and nothing else does yet.
- [x] 8.3 small multiples overview, adopting the loading/error/empty pattern from 1c.
      Done as `frontend/src/components/CohortGrid.jsx` (a grid of `MetricScatter`, one card per
      registry metric, click-to-expand into a `Dialog`) and `frontend/src/pages/ExplorePage.jsx`
      (new `/explore` route: run selector in the page, `CohortGrid` fetching inside its own
      `ErrorBoundary` — the same split as `DataMemoryPage`/`DataSetsPage`, so a failed `/cohort`
      fetch doesn't take the run selector down with it). The coverage line (`n / N complete`, missing
      A/missing B counts) reads straight off `/cohort`'s `coverage` field.
- [x] 8.5 outlier callouts — nearly free once 8.2 exists, confirmed true: a per-datapoint
      `itemStyle` override in `MetricScatter`'s existing scatter series, no new component.
- [x] 8.4 dataset detail page and the "what moved" strip — new route
      `/explore/dataset/:run/*` (splat for the composite id, mirroring the backend's
      `{dataset:path}`), reached both by clicking a `MetricScatter` point and by a manual
      `DatasetSelector` on `/explore`; both call the same `goToDataset` helper
      (`frontend/src/navigation.js`).
- [ ] 8.6 comparison basket. **Next up.**
- [ ] 8.8 the workbench — last, and judged in use. It is 8.2 with the axes unpinned, so it is cheap
      to try and cheap to remove.
- [ ] `MemoryABChart` and `MemoryRankChart` are superseded by 8.3 here; `CC_halfOverallChart` should move from `/raw` to
      the cohort table, at which point `/raw` may have no consumers left.

### Phase 5 — reassess, do not schedule yet

Mostly blocked by phase 2 rather than deprioritised — there is no tidy table to export, aggregate or
facet until it exists.

- [ ] Export (CSV/JSON) — near-trivial once the cohort table exists, since it is already
      CSV-shaped. Pull into phase 2's tail if wanted.
- [ ] Delta distributions, per-dataset significance (section 5) — the wrong-direction headline is
      already handled in phase 0; this is the rest.
- [ ] Spacegroup and cell-volume facets (section 8, deferred) — once 8.3 shows which hypotheses are
      worth testing.
- [ ] Cross-filtered linked views (section 8, deferred) — needs the phase-4 views to exist first.
- [ ] User-facing docs on what the charts mean (section 5) — genuinely last; written earlier they
      document views that are about to change.
- [ ] Residual event-loop stall at response encoding (section 3) — same disposition as the
      pagination item below: retiring `/raw` removes it. Do not chase it separately.
- [ ] **`/raw` pagination (section 3): probably do not do this.** Its surviving consumer,
      `CC_halfOverallPanel` (the fetch was lifted out of `CC_halfOverallChart` in 1a), pulls 1.68 MB
      to read three scalars that the cohort table will hold. Expect to retire the endpoint rather
      than paginate it — confirm after phase 4. Retiring it deletes `CC_halfOverallPanel` too.
- [ ] `interpolate`'s descending-`x` bug (section 1): **do not fix.** Section 6 records that
      `/raw/interpolated` is being reworked to *extract* the real value rather than interpolate one,
      which dissolves the bug. Just do not reintroduce interpolation over descending `x`.

---

## 1. Bugs — wrong output or crashes

- [x] **Every endpoint blocks the whole server.** All routes in
      [backend/routers/runs.py](backend/routers/runs.py) are `async def` but call synchronous,
      IO-heavy extractors, so they run on the event loop instead of FastAPI's threadpool.
      Measured: `/ping` goes from **1.9 ms → 1107 ms** while one `/raw` request is in flight.
      One user stalls every other user. `MemoryProfilerPlot`'s three `Promise.all` fetches
      serialize as a result.
      *Fix: delete the `async` keyword from the route handlers (lines 14, 21, 28, 37, 43, 49, 56,
      63, 70, 77, 84, and the `/info` route). FastAPI then threadpools them automatically.*

- [ ] **`interpolate` returns silently wrong numbers.**
      [xia2_processor.py:58-66](backend/runs/xia2_processor.py#L58-L66) — `np.interp` requires
      ascending `x`, but the real `cc_half` data is descending (confirmed:
      `0.160222, 0.157991, 0.155688…`). On a toy case this gives `0.1` where the answer is `0.65`.
      The commented-out `arr[::-1]` on line 60 is the intended fix.
      Currently dormant: `/raw/interpolated` has zero frontend callers. Fix before wiring it up.

- [x] **`MemoryABChart` mislabels its x-axis.**
      [MemoryABChart.jsx](frontend/src/components/MemoryABChart.jsx#L36) — `labels` is pushed in
      original dataset order (line 36) but the series values are sorted descending (lines 26-34),
      then `labels[0]` is used as the category axis (line 84). Every point carries the wrong
      dataset name. Note the whole top-level `series`/`options` block appears to be dead — the
      component returns the per-run grid built from a shadowed inner `options`.

- [x] **Multi-sample datasets silently lose a sample.** [`_top_dir`](backend/runs/xia2_extractor.py#L150)
      returns the *dataset* name, and both [`_extract_json_files`](backend/runs/xia2_extractor.py#L153)
      and [`_extract_memory_files`](backend/runs/xia2_extractor.py#L190) write `result[dataset][...]`.
      Where a dataset holds two samples the second overwrites the first — no error, no warning.
      Five datasets in run 2700 are affected: `7dkp`, `7ris`, `data_9crw`,
      `frpha_20731_a_vl2-apo_9cwl`, `idp95897_8ew4`. `7ris`'s two samples are *different crystals*
      (`GLVaseHo_21148c5b_1_2_9.001` and `GLVase_Ca_we21108b7b_1_2_2.001`), so this is not a
      harmless duplicate-sweep case. 227 dataset directories hold 232 samples.
      Fixed in TODO section 0 phase 2b: `_top_dir` → `_sample_key`, returning a composite
      `"dataset/sample"` key; every `dataset` parameter in the backend is that composite id now.
      Verified against real data — `7ris`'s two samples produce genuinely different values instead
      of one silently overwriting the other.

- [x] **`_apache_series_builder` raises `UnboundLocalError` on unknown filenames.**
      [xia2_processor.py:88-97](backend/runs/xia2_processor.py#L88-L97) — no `else` branch, so
      `name` is unbound if `file` isn't one of the three hardcoded names. Any new source file
      crashes extraction instead of being skipped.
      Fixed: returns `None` on an unrecognised filename; `process_xia2_data` skips a `None` result.

- [x] **Unknown run returns HTTP 200, not 404.** `curl /runs/DOES_NOT_EXIST/memory` → `200 []`.
      `Path.rglob` on a missing directory yields nothing, so a typo is indistinguishable from an
      empty result. Add existence checks (`RunService.run_exists` already exists and is unused).
      Fixed: every route in `runs.py` now calls a shared `_ensure_run_exists` guard, 404 via
      `HTTPException`.

- [x] **`RawDataChart` puts `undefined` holes in the series array.**
      [RawDataChart.jsx:54-66](frontend/src/components/RawDataChart.jsx#L54-L66) — the `cc_half`
      branch maps with no `else`, so non-`fit` traces become `undefined`.
      Resolved by deletion in phase 1b — `DatasetChart` handles the same case via `legend.selected`
      instead of filtering the array.

- [x] **`useListDatasets` has a stale-closure bug.**
      [useListDatasets.js:28](frontend/src/components/data-quality/useListDatasets.js#L28) — uses
      `runId` but has an empty dep array. Gone: the hook is now a wrapper over `useApi`, which keys
      its effect on the path.

- [x] **No request cancellation anywhere.** No `AbortController` in any hook. Combined with
      StrictMode's double-invoke, switching runs quickly lets a stale response overwrite a newer
      one. Both `useApi` and `useApiAll` abort on input change and unmount, and `apiGet` rethrows
      `AbortError` unwrapped so an abort is never mistaken for a failure.

- [x] **The headline "B is faster/larger by N%" is derived from the gradient alone.**
      [CumulativeTimeTaken.jsx:52-54](frontend/src/components/CumulativeTimeTaken.jsx#L52-L54) and
      [MemoryABChart.jsx:132-136](frontend/src/components/MemoryABChart.jsx#L132-L136) both compute
      `Math.abs((gradient - 1) * 100)` and ignore the intercept. A fit with a non-zero intercept can
      cross the parity line inside the data range — B faster on small datasets and slower on large
      ones — and the banner still asserts a single direction. This is a live component stating a
      conclusion the data does not support. Listed under "thin statistics" in section 5, but the
      wrong-direction case makes it a correctness bug.
      *Fix: report gradient and intercept, or a median ratio, or say "B/A = m·x + c" and let the
      chart carry it. Do not state a single percentage for a fit that crosses parity.*

- [x] **`CumulativeTimeTaken` crashed on render.** Undefined `regressionSummary`/`maxValue`, series
      nested inside `dataZoom`, and point data that didn't match its own axes. Fixed — now an
      A-vs-B scatter with identity line and regression fit.

## 2. Quick fixes

- [x] Uncomment `GZipMiddleware` in [main.py:34-38](backend/main.py#L34). The `/raw` payload is
      **1.68 MB uncompressed, 387 KB gzipped** — a 4.3x saving.
- [x] Remove the debug `print("AAAAAAAAAAAAARRGGHHHHHH")` in
      [xia2_processor.py:12](backend/runs/xia2_processor.py#L12) — it sits in a data-validation
      path where a real warning belongs.
- [x] Remove leftover `console.log`s: `RawDataChart.jsx` (deleted in phase 1b),
      `DatasetSelector.jsx`/`useListDatasets.js` (gone by the time this was picked up — already
      clean), `DatasetChart.jsx` (removed in phase 1b).
- [x] Two route handlers are both named `get_raw_dataset`
      ([runs.py:37,43](backend/routers/runs.py#L37)). Routing works, but the second shadows the
      first in the module namespace. Also an unused mid-file `import json`.
- [x] `~35` eslint errors, almost all unused imports. `npm --prefix frontend run lint` is currently
      too noisy to be useful as a signal.
      Down to 0 as of phase 1c's eslint sweep (section 0).

## 3. Performance

- [x] **Blocking event loop** — see section 1; this is the dominant cost.
- [x] **No compression** — see section 2.
- [x] **`/memory`, `/cumulative` and `/cohort` were walking the whole run tree with `rglob` to find
      a few hundred small files by name**, instead of constructing the (now-known) exact path per
      `(dataset, sample, variant)` — the same pattern `extract_xia2_summary` already used. Found by
      profiling `/cohort` directly (it was measured, not assumed, at **3.2–3.4 s**) rather than
      guessing: `extract_xia2_memory` was 1.33 s of that, `extract_xia2_cumulative_timing` 1.65 s
      (via 231 separate small `rglob` calls in `extract_xia2_timing`, one per sample, instead of one
      shared walk or — better — no walk at all). Rewrote `_extract_memory_files` and
      `extract_xia2_timing` to build the direct path and check `exists()` instead of listing and
      filtering. Verified output is byte-identical before/after on `xia2-irrmc-inflate-2700`, and
      re-measured: `/cohort` 3.2–3.4 s → **~0.25–0.3 s** (~12x), `/memory` 1.5 s → **0.06 s** (~24x),
      `/cumulative` 1.65 s → **0.14 s** (~12x). Done before phase 4 rather than after, since every
      phase-4 view reads `/cohort` and would otherwise pay this tax through the whole phase's
      development. **Deliberately left `_extract_json_files` (backs `/raw`, `/comparison`) alone** —
      not a measured bottleneck for anything currently planned, and `/raw` is a phase-5 retirement
      candidate once `CC_halfOverallChart` moves onto the cohort table, so optimising its walk would
      likely be wasted work.
- [ ] `/raw` returns all 227 datasets in one 1.68 MB response. No pagination or partial fetch.
      Measured latencies (superseded by the walk fix above for `/memory`/`/cumulative`): `/raw`
      1.51 s.
- [ ] **Residual event-loop stall at response encoding** (found while verifying the `async` fix).
      With the handlers threadpooled, `/ping` now stays at 3–5 ms for the whole of `/raw`'s
      extraction — but spikes once to **312 ms** at the moment `/raw` completes. That is FastAPI
      serialising the 1.68 MB dict to JSON, which happens on the event loop regardless of how the
      handler ran. Down from a sustained 1107 ms, so the fix is real, but not to zero. Dissolves if
      `/raw` is retired (phase 5) — do not chase it before then.
- [ ] Response caching is intentionally deferred (see [CLAUDE.md](CLAUDE.md)) — still true, but the
      "no cache, no compression, blocking loop" combination named here is now down to just `/raw`
      and `/comparison`; `/memory`/`/cumulative`/`/cohort` no longer need a cache to feel fast.

## 4. Architecture and design

- [x] **The `Workspace` Protocol is decorative and would not survive an SSH implementation.**
      [workspace/base.py](backend/workspace/base.py) declares `list_dirs(self)` and
      `list_files(self)` returning `list[str]`; [local.py](backend/workspace/local.py) implements
      `list_dirs(self, path=None)` and `list_files(self, path)` returning `list[Path]` — and
      callers depend on the `Path` behaviour (`.name`, `.parent.name`, `.parts`). Protocols aren't
      runtime-checked so nothing errors today. Reconcile this *before* writing the SSH backend.
      Done in phase 2 (section 0) — signatures now match `LocalWorkspace`.

- [ ] **No domain model.** The A/B concept is rediscovered in every extractor — sometimes from a
      filename suffix, sometimes from `f.parent.name` — each returning an ad-hoc `{"A": [], "B": []}`.
      There's no type for a run, a dataset, or an A/B pair, so "these two things are comparable" is
      re-asserted by hand in a dozen places.

- [ ] **The API contract is untyped magic strings.** The backend emits `"A - d_min"`; three
      frontend components substring-match it (`CC_halfOverallChart`, `RawDataChart`,
      `DatasetChart`). No Pydantic response models, so FastAPI validates nothing and `/docs` is
      uninformative. A rename produces a blank chart and no error anywhere.

- [x] **The frontend cannot be deployed.** `http://localhost:8000` is hardcoded in seven files.
      Needs a single API client reading `import.meta.env.VITE_API_URL`. **Blocker for community use.**
      Done in `src/api/client.js`; the only remaining literal is that file's fallback. Note the
      backend's `FRONTEND_URL` CORS origin has to match wherever the frontend is actually served
      from — deploying needs both variables set, not just this one.

- [x] **Three parallel data-fetching idioms** — `useRunResource`, the `data-quality/use*` hooks, and
      ad-hoc `useEffect`+`fetch` inside `RunSelector`/`MemoryProfilerPlot`/`CumulativeTimeTaken`.
      Consolidate onto one. Now one: `useApi` / `useApiAll`. The `data-quality/use*` hooks survive
      as three-line named wrappers over `useApi`, which is a naming convenience rather than a
      second idiom.

- [x] **No shared chart config — split by *chrome vs meaning*, not by chart.**
      [baseLineChartOptions.js](frontend/src/utils/baseLineChartOptions.js) has zero importers, so
      every chart duplicates axis, tooltip and dataZoom setup inline.

      The choice is not "one shared file" vs "one options file per chart" — per-chart files are the
      worst of both, adding indirection without reuse. Split by what the option *is*:

      - **Chrome** (dataZoom, toolbox, legend placement, grid margins, colour, fonts) — product-level
        conventions. Shared. Inconsistency here is what makes a dashboard feel like ten separate
        experiments rather than one tool.
      - **Meaning** (axis names, axis types, formatters like `invSqToD`, series, markLines) — this
        *is* the chart. Stays inline in the component.

      Done this way the clarity concern mostly evaporates: a reader still sees everything
      semantically important in the component. Prefer a `makeChartOptions({...})` factory over a
      static object to spread — a plain spread replaces nested objects like `grid`/`tooltip`
      wholesale instead of merging them.
      Done as `src/theme/chartChrome.js` (section 0, phase 1c) — turned out smaller than a factory
      once checked against the live charts; see that item for why. `baseLineChartOptions.js` is
      deleted.

- [x] **A/B colour is data encoding, not decoration.** Every chart currently falls through to
      ECharts' default palette, so "A" can be blue in one chart and green in the next. For a
      comparison dashboard that actively misleads. Fix A and B to fixed colours globally — this is
      functionality, not polish, and belongs before any presentation work.
      Done in `src/theme/variant.js` + `tokens.variant` (section 0, phase 1a) — see that item for
      the shape.

- [x] **No error boundary.** One throwing component blanks the entire page — as `CumulativeTimeTaken`
      demonstrated.

- [x] **Loading/error/empty states are functionality, not polish.** Currently bare `<p>Loading...</p>`
      or nothing at all. With multi-second responses (section 3), users cannot distinguish slow from
      broken. Charts also hardcode `width: "35vw"`/`"40vw"`, so readability depends on window size.
      The loading half is done — `LoadingState` (section 0, phase 1c). The `35vw`/`40vw` widths are
      deliberately still there; see phase 1c's sizing item for why moving them to the container is
      deferred to phase 4.

- [ ] **No tests of any kind**, on a project whose entire value is numerical correctness. The
      series-name coupling above is exactly the kind of thing a small contract test would pin down.
      Partially addressed: `backend/test_cohort.py` (phase 2, section 0) is the first test in the
      repo, covering `/cohort`'s shape and the 404-on-unknown-run fix. Everything else — the series
      contract itself, the numeric extractors, the frontend — is still untested.

## 5. Product gaps — what stops this being a useful dashboard

- [ ] **Incomplete A/B pairs are silently dropped.** The distinction that matters is *relevance*,
      not "failure", and there are two clearly different cases that currently get identical
      treatment:

      - **Structurally absent** — a missing `B/` directory means the comparison *cannot be made*
        for that dataset. This must be reported. **Currently it is not:** the extractor simply
        omits the key, and the frontend's `.filter(Number.isFinite)` (`MemoryABChart`, `MemoryRankChart`,
        `MemoryOverlayChart` 16, `SingleMemoryPlot` 12) discards it without a trace, so the
        regression line looks healthy over a silently shrunken sample.
      - **Noise within a file** — empty lists and mismatched `x`/`y` arrays. Irrelevant; filter
        silently. `_clean_trace_data` already does this and is **correct as-is** — no change needed.

      The bug is that both land in the same bucket. Per the project's principle — *the backend
      prepares, the frontend displays* — the count and identity of incomplete pairs should come
      from the extractor/processor. [sanitiseMemoryData.js](frontend/src/utils/sanitiseMemoryData.js)
      is worth keeping as a **specification of the output shape** (per-dataset reason plus a
      `total/valid/invalid` summary) even though the frontend implementation is retired — capture
      that shape backend-side before deleting it.

      Minimum useful version: every response reports `n` datasets compared out of `N` present, and
      the UI states it. A silently shrinking denominator is the worst outcome for a comparison tool.

      **Done for the new path, not the old one.** `/cohort` (phase 2, section 0) reports exactly
      this shape — `CohortRow.status` (`"complete"`/`"missing_a"`/`"missing_b"`) plus
      `CohortCoverage`'s `total`/`complete`/`missing_a`/`missing_b` — and phase 4's views will read
      it. `/memory`/`/raw` and the charts named above are untouched and still silently filter; they
      are superseded by 8.3 per TODO section 0 phase 4, so fixing them separately would be waste.

- [x] **Provenance is already on disk, unextracted — this is nearly free.** The convention is that
      **A is the current main DIALS build and B is the version under test**; the run folder name
      hints at what B is. That convention is written down nowhere in the code or docs — record it.

      But the exact builds don't need to be left to the user's memory. `xia2-debug.txt` (also
      `xia2.txt` and `dials.integrate.log`) carries the full version with git hash, per variant:

      ```
      2700   A: DIALS 3.dev.1493-gf324578a1    B: DIALS 3.dev.1505-g0cc846ac7
      5400   A: DIALS 3.dev.1488-g893c8dfee    B: DIALS 3.dev.1499-gd696be54c
      ```

      One extractor following the existing `extract_xia2_unit_cell` pattern turns "the user should
      know what their B is" into the dashboard stating it outright. Surface it in the run header.
      Done in phase 3 (section 0) — `extract_xia2_build_info`, surfaced via `/runs/{run_id}`'s new
      `builds` field and `RunProvenance.jsx`. The convention itself is written down here and in
      CLAUDE.md's domain conventions, per this item's own ask.

- [x] **A is not a fixed baseline across runs.** Confirmed with the author: A tracks whatever main
      was at the time the run executed — it is not pinned per campaign. Run 2700's A is
      `1493-gf324578a1`; run 5400's A is `1488-g893c8dfee`.

      Any cross-run comparison is therefore **confounded**: a difference between two runs may be
      baseline drift rather than an effect of B. `CC_halfOverallChart` and `MemoryRankChart` both plot
      multiple runs on shared axes and give no indication of this. Runs months apart are not
      straightforwardly comparable.

      Minimum mitigation: warn when selected runs have differing A builds. Better: show both build
      hashes per run in the legend or run header so the confound is visible rather than implied.
      **Both done**, in phase 3: `RunProvenance.jsx` shows every selected run's A/B build *and* warns
      when the A builds differ, on both pages — not just a minimum mitigation.

- [ ] **No "so what?" layer.** No landing view answering *which datasets regressed, by how much,
      ranked*. Users must select runs and eyeball charts. This is the difference between a plotting
      tool and a dashboard.

- [ ] **No shareable state.** Selections live in `useState`, not the URL, so you can't send a
      colleague a link to what you just found. Matters much more for a community tool.

- [ ] **No export.** No CSV/JSON download for downstream analysis.

- [ ] **Thin statistics.** A regression slope is the only aggregate, and the "B is faster/slower by
      N%" phrasing derives from gradient alone — with a non-zero intercept it flattens a crossover.
      Same wording issue in `MemoryABChart`. No delta distribution, per-dataset significance, or
      outlier flagging.

- [ ] **No user-facing docs.** The README covers setup only — nothing on what the charts mean or
      how to interpret A vs B. Needed for a semi-familiar audience.

## 6. Unused code — status confirmed

All confirmed to have zero callers. Dispositions below are from the author.

**Planned work, keep:**

- [ ] [`_extract_cc_half_from_raw`](backend/runs/xia2_extractor.py#L169) — to be completed. Moves
      CC½-at-a-threshold lookup (e.g. the value at 0.5) from the frontend to the backend.
- [ ] `/runs/{run_id}/raw/interpolated` — to be reworked alongside the above so it **extracts** the
      real value rather than interpolating one. Rename accordingly (`/cc_half/at/{value}` or
      similar). Note this **dissolves the `np.interp` bug in section 1** rather than requiring a
      fix — just don't reintroduce interpolation over descending `x` without reversing first.
- [ ] [`MemoryOverlayChart`](frontend/src/components/MemoryOverlayChart.jsx) — exploratory but
      considered useful; keep for now.
- [x] `RunService.run_exists` — no current caller, but it is the natural fix for the HTTP 200
      -on-unknown-run bug in section 1. Keep and use it.
      Used now, in every route's `_ensure_run_exists` guard (phase 2, section 0).

**Superseded, safe to delete:**

- [x] [`normalizeName`](frontend/src/NameNormalise.js) — was for stripping special characters from
      long series names; that job now happens backend-side in `_apache_series_builder`.
- [x] `chartjs-plugin-zoom` + `react-chartjs-2` in `frontend/package.json` — leftover from a
      pre-ECharts experiment.
- [x] `sanitise` — the sanitisation role moved to the backend extractor/processor. **Capture its
      output shape into the backend first** (section 5), then delete.
      Shape captured as `/cohort`'s `CohortRow.status` + `CohortCoverage` (phase 2, section 0);
      `sanitiseMemoryData.js` deleted.
- [x] `frontend/src/data.json`, `frontend/src/sigma.json` — caching experiments, to be removed. Confirmed absent from the repo and untracked; nothing to delete.

**Migration in progress:**

- [x] `RunSelector` → superseded by
      [`MultiRunSelector`](frontend/src/components/data-quality/MultiRunSelector.jsx), which is
      correctly separated from its fetch. `DataMemoryPage` migrated (phase 1b) and `RunSelector.jsx`
      is deleted.
- [x] `MetricGroupCard` + `RawDataChart` → replaced by `RunMetricPanel` + `RunPanel` +
      `DatasetChart`. Both old files deleted in phase 1b (section 0).
- [ ] [`ChartCard`](frontend/src/components/ChartCard.jsx) — deferred presentation work. See the
      note in section 4 on which "presentation" concerns are actually functional.

**Already done — no action:**

- `/runs/{run_id}/dataset/{dataset}/comparison` exists at
  [runs.py:42](backend/routers/runs.py#L42), returns data, and is consumed by
  `RunMetricPanel metric="comparison"`. Easy to miss because its handler is the second function
  named `get_raw_dataset` (see the duplicate-name item in section 2).

**Packaging:**

- [x] `echarts-stat` is declared in the **root** `package.json`, not `frontend/`, and resolves only
      by Node walking up to the repo root. Should move to `frontend/package.json`.

**Outside this repo:** `~/ccp4/data/extract_AB.py`, `extract_data.py`, `full-output.json`,
`sigma.json` — caching experiments and example outputs, to be moved to an `archived/` folder.

## 7. Deliberate — do not "fix"

- The commented-out cache `load()` short-circuit in `RunService.get_xia2_raw` — deferred by choice.
- `MemoryPanels` and `CC_halfOverallPanel` looking like pointless one-job wrappers around a chart.
  They exist so the fetch escalates to a boundary that does **not** contain the run selector.
  Inlining them back into the page is the obvious simplification and it reintroduces the failure
  mode: backend down, whole page replaced by the error, no selector left to retry from.
- `useApi` deriving `loading` from a path stored beside the data instead of holding it in state.
  Storing it is the obvious shape and costs a render where the previous path's data is still on
  screen under a `loading: false`, plus a `react-hooks/set-state-in-effect` error.

## 8. New features — the exploration loop

Direction agreed 2026-08-18. The dashboard's primary job is **exploration**: answering *why* B
differs from A, not delivering a ship/don't-ship verdict. Two frictions were named as what the
current UI fails at — you cannot correlate across the cohort, and you cannot see enough context on
a single dataset. Everything below follows from those two. This section is additive to sections 1–5,
not a replacement: several items here make the fixes in sections 1 and 2 more valuable, and one
(8.1) depends on a fix in section 1.

**The spine: a single cohort table underpins every view.** 8.1 blocks everything else. 8.2 is the
shared primitive that 8.3, 8.5 and 8.8 are configurations of, so the later views cost far less than
the first. Build in order.

### 8.1 The cohort table — the backbone. Done — see TODO section 0, phase 2

- [x] **Parse the whole of `xia2-summary.dat` into a per-sample record.** Only two fields are read
      from it today, by [`extract_xia2_unit_cell`](backend/runs/xia2_extractor.py#L82) and
      [`extract_xia2_space_group`](backend/runs/xia2_extractor.py#L101). The file already carries,
      per variant, nine metrics each reported as *overall / inner shell / outer shell*:

      ```
      High resolution limit       0.93    2.52    0.93
      Low resolution limit       62.70   62.84    0.95
      Completeness              100.0   100.0    99.9
      Multiplicity                6.7     6.9     6.6
      I/sigma                     7.2    44.4     0.1
      Rmerge(I+/-)              0.069   0.050   3.889
      CC half                   0.996   0.994   0.375
      Anomalous completeness     94.0    98.9    90.0
      Anomalous multiplicity      3.5     3.7     3.5
      Cell:  88.671  88.671  39.520  90.000  90.000  90.000
      Spacegroup: P 41
      ```

      — plus image count (`Images: 1 to 1800`), wavelength, detector distance and beam centre. One
      extractor following the existing pattern turns all of it into plottable axes. Joined with the
      existing peak-memory, timing and `d_min` extractors, the result is a tidy table: one row per
      `(dataset, sample, variant)`, ~30 numeric columns. **This one piece of work is what makes
      8.2–8.8 cheap.**

      **Done as `extract_xia2_summary`/`extract_xia2_samples`.** Scoped down slightly:
      image count/wavelength/detector distance/beam centre are the same physical data collection for
      A and B, not an A/B comparison axis, so they're **not** in the row schema — YAGNI per this
      file's own stated philosophy. `cell`/`spacegroup` are kept (already-parsed lines, and 8's
      deferred facets want them later). Row granularity is `(dataset, sample)`, with A/B nested
      inside each row rather than a flat `(dataset, sample, variant)` row per the sketch above — a
      nested `{dataset, sample, status, A, B}` is what lets `status` exist at all (see below).

- [x] **Row granularity must be the sample, not the dataset.** Depends on the collision bug in
      section 1 — a cohort table keyed by dataset would bake that silent data loss into every new
      feature.
      Done for `/cohort` specifically first: it parses `xia2-summary.dat` fresh and never went
      through the buggy `_top_dir`, so it was never at risk of inheriting the bug. `_top_dir` itself
      — and therefore `/raw`/`/memory`/`/comparison` — was fixed separately in **section 0 phase
      2b**, once it turned out fixing it was smaller than originally scoped (see 2b's write-up).

- [x] **Report coverage rather than filtering it.** Measured on `xia2-irrmc-inflate-2700`: 227
      dataset directories → 232 samples, of which 231 have an A summary and 229 a B, giving ~229
      complete pairs. The gaps are the *structurally absent* case from section 5 and must be
      surfaced, not dropped.
      **Re-measured via the actual extractor** (not manual counting): 231 samples, 230 with an A
      summary, 229 with a B, 228 complete pairs — one dataset dir (`nsls2_fmx_20161122_lys_266`) has
      no `data/` subdirectory at all and contributes zero samples, which accounts for the small
      difference from the estimate above. `CohortRow.status` (`"complete"`/`"missing_a"`/
      `"missing_b"`) plus `CohortCoverage`'s counts report exactly this, per row and in aggregate.

- [x] **A metric registry, backend-owned.** Per metric: key, label, unit, formatter, and
      direction-of-better. CLAUDE.md records that there is no single sign convention across metrics,
      so "did this get better?" needs defining once instead of being re-derived in each chart. This
      is also the domain model section 4 says the project lacks, arriving as a by-product rather
      than as a refactor.
      Done as `backend/runs/metrics.py` — 11 entries (the 9 xia2-summary metrics' `overall` value +
      peak memory + cumulative runtime; inner/outer shell values ride along on each row but aren't
      separate registry entries — nothing reads them yet). `low_resolution_limit`'s `better` is
      `None`, deliberately: it reflects data-collection geometry, not something either DIALS build
      makes better or worse, and guessing a direction would be worse than admitting there isn't one.
      Serialized into every `/cohort` response (`CohortResponse.metrics`) so the frontend never
      hardcodes metric metadata.

- [x] **One endpoint — `/runs/{run_id}/cohort`.** Every view below reads it and nothing else. Note
      it is a second large payload alongside `/raw`, which makes section 2's GZip item and section
      1's event-loop item materially more valuable than they are today.
      Live, with a Pydantic response model (`routers/models.py`) — the first in the codebase.

### 8.2 `MetricScatter` — the shared primitive. Done

- [x] **One scatter component, configured three ways.** Props: x metric, y metric, optional colour
      and size encodings, optional parity line, optional regression fit. Small multiples (8.3) is a
      grid of it with axes pinned to `(A metric, B metric)`; the workbench (8.8) is a single
      instance with those axes exposed as pickers. Because they are the same component, trying the
      workbench costs a dropdown panel rather than a second view.
      Done as `frontend/src/components/MetricScatter.jsx`, taking `rows` (cohort rows) and a
      `metric` (one registry entry) and rendering a B-against-A scatter for it: identity line,
      linear fit (`echarts-stat`'s `regression("linear", ...)`), and a summary callout of
      win-count-vs-`metric.better` plus median B/A — the win-count/median-ratio shape CLAUDE.md's
      domain conventions require for any new A/B summary, not a gradient-only headline. Axes are
      pinned to `A`/`B`, not configurable yet — that's what makes it "one primitive, configured
      three ways" rather than a generic XY scatter; 8.8 is the configuration that unpins them.
      **Scoped down from the write-up:** colour/size encoding props don't exist yet, deferred to
      8.8 (the first thing that actually needs them — 8.3 shows one metric per panel, so it has
      nothing to colour or size by). **Not extracted from `MemoryABChart`** despite the
      near-identical identity-line/regression/summary shape — `MemoryABChart` is superseded and
      deleted later in this phase (see the phase-4 bullet below), so sharing code with something
      about to be deleted would have been wasted effort. The actual prop is a single `metric` (not
      separate x/y metric props — both axes are pinned to A and B of the same metric), and the
      identity line and regression fit are unconditional, always rendered when the data allows,
      not optional toggles. That means 8.8 (unpinning the axes) will need a **signature change** to
      `MetricScatter` — accepting separate x/y metrics — plus a corresponding change to how
      `CohortGrid`/the workbench calls it, not just a new boolean prop; keep that in mind so 8.8's
      cost estimate stays honest.
      **Visual polish pass, after looking at it live:** `grid` margins are fixed pixel values, not
      `containLabel: true` — the latter resizes the plot box per-panel to fit that panel's own tick
      label width, which is what made panels look inconsistently shaped next to each other; fixed
      margins make every panel's plot box identical regardless of content. Axis ticks are truncated
      to 0–2 decimals by magnitude (`formatAxisTick`) rather than showing a raw padded float. The
      regression line is `tokens.series[0]`, not `tokens.line.annotation` like `MemoryABChart`'s —
      `line.annotation` is the same hex as the point colour here, so the two were indistinguishable;
      a categorical accent reads clearly against both the muted points and the dashed identity line.
      The summary callout's position depends on `enableZoom`: a plain band under the plot when zoom
      is off (the small-multiples grid), the original boxed top-right overlay when zoom is on (the
      expanded dialog) — the zoom slider needs the bottom of the chart there instead.
- [x] Fix A and B to consistent colours here — section 4 already flags that A/B colour is data
      encoding, not decoration, and this is the component that should establish it.
      Done: axis *names* (not points — see the note below) use `tokens.variant.A`/`.B`, since a
      `MetricScatter` point is one sample carrying both an A and a B value rather than a
      per-variant series — there is no "A-coloured mark" here the way there is in the six charts
      `tokens.variant` was written for. See CLAUDE.md's Frontend section for why this is a
      deliberately different use of the same tokens.

### 8.3 Small multiples overview — the way in. Done

- [x] **A grid of B-vs-A parity scatters, one panel per metric, all showing the same ~229 samples.**
      At a glance: which metrics B moved and which it left alone. Click a panel to expand it; click
      a point to open that sample's detail page (8.4). This is the front door for the whole loop —
      a survey, not a hypothesis test.
      Done as `frontend/src/components/CohortGrid.jsx`, mounted at the new `/explore` route
      (`frontend/src/pages/ExplorePage.jsx`, added to `src/App.jsx`'s route table). One
      `MetricScatter` per `/cohort` registry metric in a card grid; clicking a card opens the same
      metric full-size in a MUI `Dialog` rather than a dedicated expanded layout. Coverage
      (`n / N complete`, missing A/missing B) is a line above the grid, read straight off
      `/cohort`'s `coverage` field per the coverage-not-filtering rule. Clicking a point now opens
      that sample's detail page too — done in 8.4, below.

### 8.4 Dataset detail page and the "what moved" strip. Done

- [x] **A per-sample page that puts every metric in one place** — the cohort row's scalars, the CC½
      curve, the memory profile and the stage timings, for A and B together. This is the direct
      answer to "not enough context on one dataset": you currently cannot tell whether a memory
      spike coincides with a resolution change.
      Done as `frontend/src/pages/DatasetDetailPage.jsx`, mounted at `explore/dataset/:run/*` in
      `App.jsx` — a splat route for the composite `dataset/sample` id, the exact frontend analogue
      of the backend's `{dataset:path}` fix from phase 2b. Reuses `DatasetChart` +
      `useDatasetResource` (raw and comparison) and `MemoryProfilerPlot` unmodified apart from one
      new optional `fixedDataset` prop that bypasses its own picker — additive, existing callers
      unaffected. **Two entry points, one code path:** a `DatasetSelector` on `/explore`
      (`ExplorePage.jsx`) and a new `onPointClick` prop on `MetricScatter` (wired through
      `CohortGrid`, with `stopPropagation()` on the underlying DOM event so a point click doesn't
      also trigger the card's own expand-to-`Dialog` handler) both call the same
      `goToDataset(navigate, run, dataset)` helper — pulled out to `frontend/src/navigation.js`
      rather than colocated in `ExplorePage.jsx` as first drafted, since a page file exporting
      anything besides its component trips this repo's `react-refresh/only-export-components` lint
      rule.
- [x] **A "what moved" strip at the top** — a compact row of Δ badges (memory +12%, runtime −3%,
      d_min unchanged) so the answer precedes the charts rather than having to be read out of them.
      Direction-of-better comes from the metric registry (8.1), so a green badge means *better*,
      not *larger*.
      Done as `frontend/src/components/WhatMovedStrip.jsx` — one MUI `Chip` per `/cohort` registry
      metric (11 today), coloured `success`/`error` by `metric.better` vs the sign of `B - A`,
      neutral grey when `better` is `null` (e.g. `low_resolution_limit`), and a plain "—" chip for a
      row whose `status` isn't `"complete"` rather than a dropped badge, per the coverage-not-filtering
      rule. `formatValue`/`metricValue` (and `MetricScatter`'s `FORMATTERS`) were hoisted out of
      `MetricScatter.jsx` into `frontend/src/theme/metricFormat.js` so this component could reuse
      them without reaching into a chart component's internals.

### 8.5 Outlier callouts. Done

- [x] **Auto-label the N points furthest from the parity line** in any `MetricScatter`, so the
      interesting samples name themselves instead of having to be hunted by hover. Falls out of 8.2
      almost for free. Pairs naturally with 8.3: the overview then reads "B moved memory, and these
      four datasets are why".
      **Done as colour, not a label.** The top 5 points ranked by `|B - A|` (a proxy for distance
      from the parity line — exact for ranking purposes since both axes share one domain) get
      `tokens.series[1]` instead of the default muted colour, set per-datapoint via `itemStyle` on
      just those items. A text label was the original idea, but full sample ids are long enough to
      overlap heavily at this chart size; colour needs no layout space and the full id is still one
      hover away in the tooltip, unchanged. N was raised from the originally-discussed 3 to 5 once
      colour replaced text — clutter was the reason to keep N small, and a colour dot doesn't clutter
      the way a label would.

### 8.6 Comparison basket

- [ ] **Pin samples while exploring and view them together.** Having found four odd datasets, you
      want their curves overlaid rather than four separate visits. The basket persists across views,
      and its contents belong in the URL (8.7) so a basket is shareable.

### 8.7 URL-encoded state

- [ ] **Make every view addressable.** Selected runs, chosen axes, active dataset and basket
      contents currently live in `useState`, so a finding cannot be sent to a colleague. Section 5
      lists this as a product gap; in an exploration tool it is more than that — it is what turns
      solitary exploration into a shared conversation. Small, and best done early, because
      retrofitting URL state across views built without it is much more work than building with it.

      **Mechanism built in phase 1a** (`src/hooks/useUrlState.js`) and adopted for selected runs on
      both pages. Still on `useState` and still to move: `RunMetricPanel`'s per-run dataset choice
      and sync toggle, `MemoryProfilerPlot`'s dataset, `RawDataChart`/`DatasetChart`'s trace
      selection. Do each as its view is touched in 1b and phase 4 rather than as a sweep. Note both
      pages use the parameter name `runs`, so a link carries selection across the two views.

### 8.8 The workbench

- [ ] **Free axis pickers on X and Y over the full metric vocabulary** (A, B and Δ variants), plus
      colour and size encodings and brush-to-select. Whether an open-ended plotting surface earns
      its place is genuinely unknown — open-ended tools can suffer a blank-page problem. Because it
      is 8.2 with the axes unpinned, it can be tried cheaply and removed cheaply. Ship it last and
      judge it in use.

### Deferred — considered and not now

- **Spacegroup and cell-volume facets** (filter the cohort to P4₁ only, or the largest cells).
  Turns the scatter into a hypothesis tester. Worth having, but only once 8.3 shows which
  hypotheses are worth testing.
- **A fully cross-filtered dashboard** where brushing one view filters all the others. The best
  possible answer to "why does B differ", and technically feasible at ~229 points — but it needs
  shared selection state the app has no pattern for. This is where 8.1–8.8 grow to, once it is
  clear which views actually get used.
- **The provenance header** is not listed here because it is already section 5's item — but it is a
  dependency in spirit: a cohort view that plots several runs together is misleading until the A
  build hash for each run is on screen.
