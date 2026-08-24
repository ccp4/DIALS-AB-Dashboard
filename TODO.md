# Known Issues and Improvements

Findings from a full read of the codebase (2026-08-18), verified against a running instance
with the `xia2-irrmc-inflate-2700` dataset. Ordered within each section by value-to-effort.

**Audience context:** this is intended for the wider community — specialised scientists and
software engineers who are semi-familiar with the domain. That raises the priority of
deployability, provenance, and clear failure reporting well above what a personal tool would need.

**Completed work lives in [ARCHIVE.md](ARCHIVE.md), not here.** This file mirrors ARCHIVE.md's
section numbers exactly — a section with nothing open below is a one-line pointer, so "section 4"
always means the same section 4 in both files. Move an item to the archive verbatim (rationale
intact) once it reaches `[x]` and needs no further action; do not delete history, relocate it.

---

## 0. Order of work

> **Resuming? Start here.** Phases 0 through 3 are complete (backend pipeline, frontend plumbing,
> theme, provenance — see [ARCHIVE.md](ARCHIVE.md) section 0). Phase 4 (the views) is nearly done:
> 8.2, 8.3, 8.4 and 8.5 are live, and 8.8 (the workbench) was built, tried against a real run, and
> reverted after being judged not useful — see ARCHIVE.md section 0, phase 4 and section 8. **The
> next task is moving `CC_halfOverallChart` off `/raw`** onto the cohort table. `MemoryABChart` and
> `MemoryRankChart` are *not* superseded by 8.3 and both stay — each shows all selected runs at once
> on one page load, which the single-run-scoped `/explore` doesn't do.
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

### Phase 0 — free wins, nothing later touches them. Done — see ARCHIVE.md section 0

### Phase 1 — foundations that get more expensive the longer you wait. Done — see ARCHIVE.md section 0

The heart of the ordering principle: each item here was O(1) at the time and would have been O(n)
once the phase-4 views existed. Split into three sub-phases (1a plumbing/tokens, 1b finishing the
in-flight component migration, 1c chart chrome/layout) because they had to happen in that order.

### Phase 2 — the cohort table (8.1). Done — see ARCHIVE.md section 0

### Phase 2b — rekey the old per-dataset extractors by `(dataset, sample)`. Done — see ARCHIVE.md section 0

### Phase 3 — provenance. Done — see ARCHIVE.md section 0

### Phase 4 — the views

Section 8's order. Each inherits 1a's tokens and 1c's chrome rather than establishing its own.
8.2 (`MetricScatter`), 8.3 (`CohortGrid`), 8.5 (outlier callouts), 8.4 (the dataset detail page) and
8.8 (the workbench — built, tried, reverted) are all done; see ARCHIVE.md section 0 phase 4 (and
section 8, for each item's own detailed write-up). One item remains:

- [ ] `CC_halfOverallChart` should move from `/raw` to the cohort table, at which point `/raw` may
      have no consumers left. **Next up.**
      **`MemoryABChart` and `MemoryRankChart` are not superseded by 8.3 and both stay.** They first
      looked redundant with 8.3's per-metric panels (peak memory is one of the 11 registry metrics),
      but 8.3/`/explore` is scoped to a single run at a time — `MemoryABChart` renders one parity
      scatter per selected run in a grid on one page load, and `MemoryRankChart` ranks peak memory
      across all selected runs on one shared chart. Both show every selected run at once, which
      switching `/explore`'s single-run selector back and forth does not replicate.

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

Most items here are resolved — see [ARCHIVE.md](ARCHIVE.md) section 1.

- [ ] **`interpolate` returns silently wrong numbers.**
      [xia2_processor.py:58-66](backend/runs/xia2_processor.py#L58-L66) — `np.interp` requires
      ascending `x`, but the real `cc_half` data is descending (confirmed:
      `0.160222, 0.157991, 0.155688…`). On a toy case this gives `0.1` where the answer is `0.65`.
      The commented-out `arr[::-1]` on line 60 is the intended fix.
      Currently dormant: `/raw/interpolated` has zero frontend callers. Fix before wiring it up.
      **Do not fix standalone** — see phase 5: `/raw/interpolated` is being reworked to *extract*
      the real value rather than interpolate one, which dissolves the bug.

## 2. Quick fixes

Done — see [ARCHIVE.md](ARCHIVE.md) section 2.

## 3. Performance

The blocking event loop, the missing compression, and the `/memory`/`/cumulative`/`/cohort` `rglob`
walk are all resolved — see [ARCHIVE.md](ARCHIVE.md) section 3.

- [ ] `/raw` returns all 227 datasets in one 1.68 MB response. No pagination or partial fetch.
      Measured latencies (superseded by the walk-elimination fix in ARCHIVE.md section 3 for
      `/memory`/`/cumulative`): `/raw` 1.51 s.
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

The `Workspace` Protocol reconciliation, the API client, one fetch idiom, the chrome-vs-meaning
chart config split, A/B colour tokens, the error boundary and loading/error/empty states are all
resolved — see [ARCHIVE.md](ARCHIVE.md) section 4.

- [ ] **No domain model.** The A/B concept is rediscovered in every extractor — sometimes from a
      filename suffix, sometimes from `f.parent.name` — each returning an ad-hoc `{"A": [], "B": []}`.
      There's no type for a run, a dataset, or an A/B pair, so "these two things are comparable" is
      re-asserted by hand in a dozen places.

- [ ] **The API contract is untyped magic strings.** The backend emits `"A - d_min"`; three
      frontend components substring-match it (`CC_halfOverallChart`, `RawDataChart`,
      `DatasetChart`). No Pydantic response models, so FastAPI validates nothing and `/docs` is
      uninformative. A rename produces a blank chart and no error anywhere.

- [ ] **No tests of any kind**, on a project whose entire value is numerical correctness. The
      series-name coupling above is exactly the kind of thing a small contract test would pin down.
      Partially addressed: `backend/test_cohort.py` (phase 2, section 0) is the first test in the
      repo, covering `/cohort`'s shape and the 404-on-unknown-run fix. Everything else — the series
      contract itself, the numeric extractors, the frontend — is still untested.

## 5. Product gaps — what stops this being a useful dashboard

Provenance extraction and the A-not-a-fixed-baseline warning are resolved — see
[ARCHIVE.md](ARCHIVE.md) section 5.

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

Most dispositions here are resolved — see [ARCHIVE.md](ARCHIVE.md) section 6. All items below are
confirmed to have zero callers; dispositions are from the author.

**Planned work, keep:**

- [ ] [`_extract_cc_half_from_raw`](backend/runs/xia2_extractor.py#L169) — to be completed. Moves
      CC½-at-a-threshold lookup (e.g. the value at 0.5) from the frontend to the backend.
- [ ] `/runs/{run_id}/raw/interpolated` — to be reworked alongside the above so it **extracts** the
      real value rather than interpolating one. Rename accordingly (`/cc_half/at/{value}` or
      similar). Note this **dissolves the `np.interp` bug in section 1** rather than requiring a
      fix — just don't reintroduce interpolation over descending `x` without reversing first.
- [ ] [`MemoryOverlayChart`](frontend/src/components/memory/MemoryOverlayChart.jsx) — exploratory but
      considered useful; keep for now.

**Migration in progress:**

- [ ] [`ChartCard`](frontend/src/components/ChartCard.jsx) — deferred presentation work. See the
      note in section 4 on which "presentation" concerns are actually functional.

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
not a replacement.

**The spine: a single cohort table underpins every view.** 8.1 blocked everything else; 8.2 was the
shared primitive that 8.3, 8.5 and 8.8 were configurations of. **8.1 through 8.5, and 8.8, are all
done** — see [ARCHIVE.md](ARCHIVE.md) section 8 for each item's full write-up. One item remains
open:

### 8.7 URL-encoded state

- [ ] **Make every view addressable.** Selected runs, chosen axes and active dataset currently live
      in `useState`, so a finding cannot be sent to a colleague. Section 5
      lists this as a product gap; in an exploration tool it is more than that — it is what turns
      solitary exploration into a shared conversation. Small, and best done early, because
      retrofitting URL state across views built without it is much more work than building with it.

      **Mechanism built in phase 1a** (`src/hooks/useUrlState.js`) and adopted for selected runs on
      both pages. Still on `useState` and still to move: `RunMetricPanel`'s per-run dataset choice
      and sync toggle, `MemoryProfilerPlot`'s dataset, `RawDataChart`/`DatasetChart`'s trace
      selection. Do each as its view is touched in 1b and phase 4 rather than as a sweep. Note both
      pages use the parameter name `runs`, so a link carries selection across the two views.

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
