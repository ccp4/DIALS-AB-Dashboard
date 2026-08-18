# Known Issues and Improvements

Findings from a full read of the codebase (2026-08-18), verified against a running instance
with the `xia2-irrmc-inflate-2700` dataset. Ordered within each section by value-to-effort.

**Audience context:** this is intended for the wider community — specialised scientists and
software engineers who are semi-familiar with the domain. That raises the priority of
deployability, provenance, and clear failure reporting well above what a personal tool would need.

---

## 0. Order of work

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

- [ ] A single API client reading `import.meta.env.VITE_API_URL` (section 4). Seven files hardcode
      `http://localhost:8000` today; section 8 would add an eighth. Also the deployability blocker.
- [ ] One fetch idiom, with `AbortController` in it once (section 4, section 1). Also route fetch
      failures into the error boundary via `useErrorBoundary()` — today a dead backend shows a
      permanent "Loading…", because boundaries do not catch async errors. Doing it here does it
      once rather than three times. There are three
      idioms now; doing cancellation per-idiom is three times the work. This also fixes
      `useListDatasets`' stale closure and `RunMetricPanel:15`'s stale lazy initialiser as a side
      effect — neither is worth fixing standalone.
- [ ] The URL-state mechanism (8.7). Building views with it is far cheaper than retrofitting five
      views afterwards. Per-view adoption follows in 1b and phase 4.
- [ ] `tokens.js` → `theme.js` + `echartsTheme.js` (section 4). One file holding every hex, spacing
      and chart height; the MUI theme and an `echarts.registerTheme("dials", …)` both built from it.
      `registerTheme` is a global switch, so charts inherit the palette without being rewritten —
      which is why this belongs *before* the migration rather than after it.
- [ ] Fix A and B to semantic colour tokens — `tokens.variant.A` / `.B`, never a palette index.
      A/B colour is data encoding, not decoration (section 4), and A must be the same colour in
      every chart regardless of how many series are on screen. Validated pair: light
      `#2a78d6` / `#eb6834`, dark `#3987e5` / `#d95926` — passes lightness band, chroma floor,
      colourblind separation (ΔE 24.7 light / 26.8 dark against a ≥8 target), normal-vision floor
      (33.6 / 31.8 against ≥15) and 3:1 contrast, on the stricter all-pairs test that the parity
      scatters require. Note the current `primary: #0080ff` is nearly the same blue, so pick a
      chrome primary *outside* the A/B pair or buttons and A-data will read alike. The `#d62728`
      regression lines are a series red doing an annotation's job — move them to muted ink.

**1b — finish the in-flight migration.** Written against 1a's client, fetch idiom and tokens, so the
new components are correct the first time:

- [ ] Complete `MetricGroupCard` + `RawDataChart` → `RunMetricPanel` + `RunPanel` + `DatasetChart`
      (section 6), resolving the ~80% overlap between the two chart components rather than shipping
      both.
- [ ] Retire `/raw` for curve consumers in favour of `/raw/datasets/{id}`. **These are one change,
      not two:** `RawDataChart` owns its own run→dataset→trace selection internally, so it cannot
      fetch narrowly — the fat endpoint is a consequence of the component's shape. Lifting selection
      into `RunMetricPanel` is what makes the per-dataset endpoint possible.
- [ ] Delete `RunSelector` once `DataMemoryPage` migrates (section 6), and remove `DataSetsPage`'s
      commented-out markup — **this is what expires the second item in section 7.**
- [ ] Check `RunMetricPanel:75`: `<Grid xs={12} md={6}>` is the pre-v6 API and the project is on MUI
      v9, which wants `size={{ xs: 12, md: 6 }}`. If so the props are ignored and the panels are not
      going two-up.
- [ ] Remove the remaining `console.log`s (section 2) — only in files that survive this phase.
- [ ] `RawDataChart`'s `undefined` holes (section 1) **resolve by deletion here.** `DatasetChart`
      handles the `cc_half` fit case via `legend.selected` instead of filtering the array, which
      makes that bug structurally unrepresentable rather than fixed.

**1c — chart chrome and layout, applied to the survivors only.** Deliberately after 1b so the chrome
is never extracted from a component that is about to be deleted:

- [ ] `makeChartOptions()` — the chrome-vs-meaning split (section 4). Chrome (dataZoom, toolbox,
      legend placement, grid margins, tooltip) is shared; meaning (axis names, formatters like
      `invSqToD`, series, markLines) stays inline in the component. Prefer a factory over an object
      to spread — a plain spread replaces nested keys like `grid`/`tooltip` wholesale instead of
      merging. This is the ~60 near-identical lines currently duplicated between `DatasetChart` and
      `RawDataChart`.
- [ ] Move sizing out of the charts. Fourteen hardcoded `height: 600` / `width: "35vw"` values
      belong to the container, not the chart; charts take `height: "100%"` and the card decides.
      This is what makes layout rearrangeable later.
- [ ] Establish the loading / error / empty state pattern (section 4). With multi-second responses,
      users cannot currently distinguish slow from broken. Adoption per view follows in phase 4.
- [ ] **Then** the eslint sweep (section 2) — last, once the deletions in phase 0 and 1b have
      shrunk it. Doing it earlier means doing it twice.

### Phase 2 — the cohort table (8.1)

One coherent piece of backend work. Several bugs are batched in because they live in the files you
are already editing, not because they are urgent.

- [ ] Everything in 8.1: the full `xia2-summary.dat` extractor, the metric registry, the `/cohort`
      endpoint, coverage reporting.
- [ ] Rekey results by `(dataset, sample)` — fixes the multi-sample collision bug (section 1). This
      must happen here: a cohort table keyed by dataset would bake the data loss into every new
      feature.
- [ ] Reconcile the `Workspace` Protocol with `LocalWorkspace` (section 4). Moved forward from
      "before the SSH backend" because the rekey requires reasoning carefully about what
      `list_files()` returns — which is exactly what the Protocol misdeclares. Nearly free while you
      are already there.
- [ ] Capture `sanitise`'s output shape backend-side, then delete it (sections 5 and 6).
- [ ] Add `run_exists` checks to all routes (section 1) — and give the new `/cohort` endpoint a
      Pydantic response model (section 4). **New endpoint only; do not retrofit the old ones yet.**
- [ ] Add the `else` branch to `_apache_series_builder` (section 1).
- [ ] One contract test on the cohort shape and the series names (section 4). The series-name
      coupling is the thing most likely to break silently, and phase 4 is about to depend on it.
- [ ] `DatasetSelector` likely becomes a dataset+sample selector here — `7ris` offering one entry
      when it holds two different crystals is wrong.

### Phase 3 — provenance

Small, independent, and a prerequisite in spirit for phase 4.

- [ ] Extract the A and B build hashes from `xia2-debug.txt` and surface them in the run header
      (section 5).
- [ ] Warn when selected runs have differing A builds (section 5). 8.3 plots several runs on shared
      axes, which is misleading until this exists.

### Phase 4 — the views

Section 8's order. Each inherits 1a's tokens and 1c's chrome rather than establishing its own.

- [ ] 8.2 `MetricScatter` — the shared primitive.
- [ ] 8.3 small multiples overview, adopting the loading/error/empty pattern from 1c.
- [ ] 8.5 outlier callouts — nearly free once 8.2 exists.
- [ ] 8.4 dataset detail page and the "what moved" strip.
- [ ] 8.6 comparison basket.
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
      `CC_halfOverallChart`, pulls 1.68 MB to read three scalars that the cohort table will hold.
      Expect to retire the endpoint rather than paginate it — confirm after phase 4.
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

- [ ] **Multi-sample datasets silently lose a sample.** [`_top_dir`](backend/runs/xia2_extractor.py#L150)
      returns the *dataset* name, and both [`_extract_json_files`](backend/runs/xia2_extractor.py#L153)
      and [`_extract_memory_files`](backend/runs/xia2_extractor.py#L190) write `result[dataset][...]`.
      Where a dataset holds two samples the second overwrites the first — no error, no warning.
      Five datasets in run 2700 are affected: `7dkp`, `7ris`, `data_9crw`,
      `frpha_20731_a_vl2-apo_9cwl`, `idp95897_8ew4`. `7ris`'s two samples are *different crystals*
      (`GLVaseHo_21148c5b_1_2_9.001` and `GLVase_Ca_we21108b7b_1_2_2.001`), so this is not a
      harmless duplicate-sweep case. 227 dataset directories hold 232 samples.
      *Fix: key results by `(dataset, sample)`. This rekeys every result dict — see the warning about
      `_top_dir` in CLAUDE.md — so it is best done as part of section 8.1 rather than alone.*

- [ ] **`_apache_series_builder` raises `UnboundLocalError` on unknown filenames.**
      [xia2_processor.py:88-97](backend/runs/xia2_processor.py#L88-L97) — no `else` branch, so
      `name` is unbound if `file` isn't one of the three hardcoded names. Any new source file
      crashes extraction instead of being skipped.

- [ ] **Unknown run returns HTTP 200, not 404.** `curl /runs/DOES_NOT_EXIST/memory` → `200 []`.
      `Path.rglob` on a missing directory yields nothing, so a typo is indistinguishable from an
      empty result. Add existence checks (`RunService.run_exists` already exists and is unused).

- [ ] **`RawDataChart` puts `undefined` holes in the series array.**
      [RawDataChart.jsx:54-66](frontend/src/components/RawDataChart.jsx#L54-L66) — the `cc_half`
      branch maps with no `else`, so non-`fit` traces become `undefined`.

- [ ] **`useListDatasets` has a stale-closure bug.**
      [useListDatasets.js:28](frontend/src/components/data-quality/useListDatasets.js#L28) — uses
      `runId` but has an empty dep array.

- [ ] **No request cancellation anywhere.** No `AbortController` in any hook. Combined with
      StrictMode's double-invoke, switching runs quickly lets a stale response overwrite a newer
      one.

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
- [ ] Remove leftover `console.log`s: [RawDataChart.jsx:56](frontend/src/components/RawDataChart.jsx#L56),
      [DatasetSelector.jsx:19](frontend/src/components/data-quality/DatasetSelector.jsx#L19),
      [useListDatasets.js:13](frontend/src/components/data-quality/useListDatasets.js#L13),
      [DatasetChart.jsx:8,21](frontend/src/components/data-quality/DatasetChart.jsx#L8).
- [x] Two route handlers are both named `get_raw_dataset`
      ([runs.py:37,43](backend/routers/runs.py#L37)). Routing works, but the second shadows the
      first in the module namespace. Also an unused mid-file `import json`.
- [ ] `~35` eslint errors, almost all unused imports. `npm --prefix frontend run lint` is currently
      too noisy to be useful as a signal.

## 3. Performance

- [x] **Blocking event loop** — see section 1; this is the dominant cost.
- [x] **No compression** — see section 2.
- [ ] `/raw` returns all 227 datasets in one 1.68 MB response. No pagination or partial fetch.
      Measured latencies: `/memory` 0.90 s, `/cumulative` 0.88 s, `/raw` 1.51 s.
- [ ] **Residual event-loop stall at response encoding** (found while verifying the `async` fix).
      With the handlers threadpooled, `/ping` now stays at 3–5 ms for the whole of `/raw`'s
      extraction — but spikes once to **312 ms** at the moment `/raw` completes. That is FastAPI
      serialising the 1.68 MB dict to JSON, which happens on the event loop regardless of how the
      handler ran. Down from a sustained 1107 ms, so the fix is real, but not to zero. Dissolves if
      `/raw` is retired (phase 5) — do not chase it before then.
- [ ] Response caching is intentionally deferred (see [CLAUDE.md](CLAUDE.md)), but note the
      combination — no cache, no compression, blocking loop — is what makes exploration sluggish.

## 4. Architecture and design

- [ ] **The `Workspace` Protocol is decorative and would not survive an SSH implementation.**
      [workspace/base.py](backend/workspace/base.py) declares `list_dirs(self)` and
      `list_files(self)` returning `list[str]`; [local.py](backend/workspace/local.py) implements
      `list_dirs(self, path=None)` and `list_files(self, path)` returning `list[Path]` — and
      callers depend on the `Path` behaviour (`.name`, `.parent.name`, `.parts`). Protocols aren't
      runtime-checked so nothing errors today. Reconcile this *before* writing the SSH backend.

- [ ] **No domain model.** The A/B concept is rediscovered in every extractor — sometimes from a
      filename suffix, sometimes from `f.parent.name` — each returning an ad-hoc `{"A": [], "B": []}`.
      There's no type for a run, a dataset, or an A/B pair, so "these two things are comparable" is
      re-asserted by hand in a dozen places.

- [ ] **The API contract is untyped magic strings.** The backend emits `"A - d_min"`; three
      frontend components substring-match it (`CC_halfOverallChart`, `RawDataChart`,
      `DatasetChart`). No Pydantic response models, so FastAPI validates nothing and `/docs` is
      uninformative. A rename produces a blank chart and no error anywhere.

- [ ] **The frontend cannot be deployed.** `http://localhost:8000` is hardcoded in seven files.
      Needs a single API client reading `import.meta.env.VITE_API_URL`. **Blocker for community use.**

- [ ] **Three parallel data-fetching idioms** — `useRunResource`, the `data-quality/use*` hooks, and
      ad-hoc `useEffect`+`fetch` inside `RunSelector`/`MemoryProfilerPlot`/`CumulativeTimeTaken`.
      Consolidate onto one.

- [ ] **No shared chart config — split by *chrome vs meaning*, not by chart.**
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

- [ ] **A/B colour is data encoding, not decoration.** Every chart currently falls through to
      ECharts' default palette, so "A" can be blue in one chart and green in the next. For a
      comparison dashboard that actively misleads. Fix A and B to fixed colours globally — this is
      functionality, not polish, and belongs before any presentation work.

- [x] **No error boundary.** One throwing component blanks the entire page — as `CumulativeTimeTaken`
      demonstrated.

- [ ] **Loading/error/empty states are functionality, not polish.** Currently bare `<p>Loading...</p>`
      or nothing at all. With multi-second responses (section 3), users cannot distinguish slow from
      broken. Charts also hardcode `width: "35vw"`/`"40vw"`, so readability depends on window size.

- [ ] **No tests of any kind**, on a project whose entire value is numerical correctness. The
      series-name coupling above is exactly the kind of thing a small contract test would pin down.

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

- [ ] **Provenance is already on disk, unextracted — this is nearly free.** The convention is that
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

- [ ] **A is not a fixed baseline across runs.** Confirmed with the author: A tracks whatever main
      was at the time the run executed — it is not pinned per campaign. Run 2700's A is
      `1493-gf324578a1`; run 5400's A is `1488-g893c8dfee`.

      Any cross-run comparison is therefore **confounded**: a difference between two runs may be
      baseline drift rather than an effect of B. `CC_halfOverallChart` and `MemoryRankChart` both plot
      multiple runs on shared axes and give no indication of this. Runs months apart are not
      straightforwardly comparable.

      Minimum mitigation: warn when selected runs have differing A builds. Better: show both build
      hashes per run in the legend or run header so the confound is visible rather than implied.

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
- [ ] `RunService.run_exists` — no current caller, but it is the natural fix for the HTTP 200
      -on-unknown-run bug in section 1. Keep and use it.

**Superseded, safe to delete:**

- [x] [`normalizeName`](frontend/src/NameNormalise.js) — was for stripping special characters from
      long series names; that job now happens backend-side in `_apache_series_builder`.
- [x] `chartjs-plugin-zoom` + `react-chartjs-2` in `frontend/package.json` — leftover from a
      pre-ECharts experiment.
- [ ] [`sanitise`](frontend/src/utils/sanitiseMemoryData.js) — the sanitisation role moved to the
      backend extractor/processor. **Capture its output shape into the backend first** (section 5),
      then delete.
- [x] `frontend/src/data.json`, `frontend/src/sigma.json` — caching experiments, to be removed. Confirmed absent from the repo and untracked; nothing to delete.

**Migration in progress:**

- [ ] [`RunSelector`](frontend/src/components/RunSelector.jsx) → superseded by
      [`MultiRunSelector`](frontend/src/components/data-quality/MultiRunSelector.jsx), which is
      correctly separated from its fetch. Delete once `DataMemoryPage` migrates.
- [ ] [`MetricGroupCard`](frontend/src/components/MetricGroupCard.jsx) +
      [`RawDataChart`](frontend/src/components/RawDataChart.jsx) → being replaced by
      `RunMetricPanel` + `RunPanel` + `DatasetChart`. **The replacements still overlap each other**
      and need consolidating before the old pair is removed — `RawDataChart` and `DatasetChart` are
      roughly 80% identical.
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
- The commented-out `MetricGroupCard`/`RunSelector` markup in `DataSetsPage` — the `data-quality`
  migration is in progress.

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

### 8.1 The cohort table — the backbone

- [ ] **Parse the whole of `xia2-summary.dat` into a per-sample record.** Only two fields are read
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

- [ ] **Row granularity must be the sample, not the dataset.** Depends on the collision bug in
      section 1 — a cohort table keyed by dataset would bake that silent data loss into every new
      feature.

- [ ] **Report coverage rather than filtering it.** Measured on `xia2-irrmc-inflate-2700`: 227
      dataset directories → 232 samples, of which 231 have an A summary and 229 a B, giving ~229
      complete pairs. The gaps are the *structurally absent* case from section 5 and must be
      surfaced, not dropped.

- [ ] **A metric registry, backend-owned.** Per metric: key, label, unit, formatter, and
      direction-of-better. CLAUDE.md records that there is no single sign convention across metrics,
      so "did this get better?" needs defining once instead of being re-derived in each chart. This
      is also the domain model section 4 says the project lacks, arriving as a by-product rather
      than as a refactor.

- [ ] **One endpoint — `/runs/{run_id}/cohort`.** Every view below reads it and nothing else. Note
      it is a second large payload alongside `/raw`, which makes section 2's GZip item and section
      1's event-loop item materially more valuable than they are today.

### 8.2 `MetricScatter` — the shared primitive

- [ ] **One scatter component, configured three ways.** Props: x metric, y metric, optional colour
      and size encodings, optional parity line, optional regression fit. Small multiples (8.3) is a
      grid of it with axes pinned to `(A metric, B metric)`; the workbench (8.8) is a single
      instance with those axes exposed as pickers. Because they are the same component, trying the
      workbench costs a dropdown panel rather than a second view.
- [ ] Fix A and B to consistent colours here — section 4 already flags that A/B colour is data
      encoding, not decoration, and this is the component that should establish it.

### 8.3 Small multiples overview — the way in

- [ ] **A grid of B-vs-A parity scatters, one panel per metric, all showing the same ~229 samples.**
      At a glance: which metrics B moved and which it left alone. Click a panel to expand it; click
      a point to open that sample's detail page (8.4). This is the front door for the whole loop —
      a survey, not a hypothesis test.

### 8.4 Dataset detail page and the "what moved" strip

- [ ] **A per-sample page that puts every metric in one place** — the cohort row's scalars, the CC½
      curve, the memory profile and the stage timings, for A and B together. This is the direct
      answer to "not enough context on one dataset": you currently cannot tell whether a memory
      spike coincides with a resolution change.
- [ ] **A "what moved" strip at the top** — a compact row of Δ badges (memory +12%, runtime −3%,
      d_min unchanged) so the answer precedes the charts rather than having to be read out of them.
      Direction-of-better comes from the metric registry (8.1), so a green badge means *better*,
      not *larger*.

### 8.5 Outlier callouts

- [ ] **Auto-label the N points furthest from the parity line** in any `MetricScatter`, so the
      interesting samples name themselves instead of having to be hunted by hover. Falls out of 8.2
      almost for free. Pairs naturally with 8.3: the overview then reads "B moved memory, and these
      four datasets are why".

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
