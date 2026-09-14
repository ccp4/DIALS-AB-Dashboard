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

> **Resuming? Start here.** Phases 0 through 5 are all complete (backend pipeline, frontend
> plumbing, theme, provenance, the views, user-facing docs — see [ARCHIVE.md](ARCHIVE.md) section
> 0). `MemoryABChart` and `MemoryRankChart` are *not* superseded by 8.3 and both stay — each shows
> all selected runs at once on one page load, which the single-run-scoped `/explore` doesn't do.
> `CC_halfOverallChart` moved off `/resolution` onto its own `GET /runs/{run_id}/cc_half` endpoint
> (section 6), not onto the cohort table as originally planned — see that entry for why. **This left
> `/resolution` (the whole-run route) with zero frontend consumers, but it stays deliberately** —
> kept as a dev/test route rather than retired (see section 7).
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

### Phase 4 — the views. Done — see ARCHIVE.md section 0

Section 8's order. Each inherits 1a's tokens and 1c's chrome rather than establishing its own.
8.2 (`MetricScatter`), 8.3 (`CohortGrid`), 8.5 (outlier callouts), 8.4 (the dataset detail page) and
8.8 (the workbench — built, tried, reverted) are all done; see ARCHIVE.md section 0 phase 4 (and
section 8, for each item's own detailed write-up). `CC_halfOverallChart` also moved off
`/resolution` (section 6), completing this phase.

**Standing note, not a task: `MemoryABChart` and `MemoryRankChart` are not superseded by 8.3 and
both stay.** They first looked redundant with 8.3's per-metric panels (peak memory is one of the 11
registry metrics), but 8.3/`/explore` is scoped to a single run at a time — `MemoryABChart` renders
one parity scatter per selected run in a grid on one page load, and `MemoryRankChart` ranks peak
memory across all selected runs on one shared chart. Both show every selected run at once, which
switching `/explore`'s single-run selector back and forth does not replicate. Do not re-propose
retiring either without addressing this.

### Phase 5 — user-facing docs. Done — see ARCHIVE.md section 0

Delta distributions, cross-filtered linked views, and `/resolution` pagination were all reassessed
and dropped as unnecessary.

---

## 1. Bugs — wrong output or crashes

All items here are resolved — see [ARCHIVE.md](ARCHIVE.md) section 1.

## 2. Quick fixes

Done — see [ARCHIVE.md](ARCHIVE.md) section 2.

## 3. Performance

All resolved — see [ARCHIVE.md](ARCHIVE.md) section 3.

- [ ] Response caching is intentionally deferred (see [CLAUDE.md](CLAUDE.md)) — still true.

## 4. Architecture and design

The `Workspace` Protocol reconciliation, the API client, one fetch idiom, the chrome-vs-meaning
chart config split, A/B colour tokens, the error boundary and loading/error/empty states are all
resolved — see [ARCHIVE.md](ARCHIVE.md) section 4. The domain-model gap is resolved too (a `run_id`
type was considered and dropped — no internal structure to encapsulate), and so is the untyped-API
gap — see ARCHIVE.md section 4 for both.

- [ ] **No tests of any kind**, on a project whose entire value is numerical correctness. The
      `"fit"` series-name coupling (CLAUDE.md's series contract) is exactly the kind of thing a
      small contract test would pin down. Partially addressed: `backend/test_cohort.py` (phase 2,
      section 0) is the first test in the repo, covering `/cohort`'s shape and the
      404-on-unknown-run fix. Everything else — the series contract itself, the numeric extractors,
      the frontend — is still untested.

## 5. Product gaps — what stops this being a useful dashboard

All resolved — see [ARCHIVE.md](ARCHIVE.md) section 5.

## 6. Unused code — status confirmed

Most dispositions here are resolved — see [ARCHIVE.md](ARCHIVE.md) section 6. All items below are
confirmed to have zero callers; dispositions are from the author.

**Migration in progress:**

- [ ] [`ChartCard`](frontend/src/components/ChartCard.jsx) — deferred presentation work. See the
      note in section 4 on which "presentation" concerns are actually functional.

**Outside this repo:** `~/ccp4/data/extract_AB.py`, `extract_data.py`, `full-output.json`,
`sigma.json` — caching experiments and example outputs, to be moved to an `archived/` folder.

## 7. Deliberate — do not "fix"

- The commented-out cache `load()` short-circuit in `RunService.get_xia2_resolution` — deferred by
  choice.
- `/resolution` (the whole-run route) having zero frontend consumers, ever since
  `CC_halfOverallChart` moved onto `GET /runs/{run_id}/cc_half` (section 6). Kept deliberately as a
  dev/test route rather than retired — do not delete it, `service.get_xia2_resolution`, or
  `extract_xia2_resolution` as dead code.
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
shared primitive that 8.3, 8.5 and 8.8 were configurations of. **8.1 through 8.5, 8.7 and 8.8 are
all done** — see [ARCHIVE.md](ARCHIVE.md) section 8 for each item's full write-up. Nothing remains
open in this section.

A fully cross-filtered dashboard (brushing one view filters the others) was considered and dropped
as unnecessary.
