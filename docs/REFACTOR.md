# End-Notes Normalization Refactor Plan

## Purpose

This document defines a migration-safe refactor of end-note normalization from a brute-force, regex-heavy approach to a parser-guided and deterministic transformation.

## Current Problem Summary

The current normalization flow in `src/normalize.js` relies on iterative global replacements and broad pattern captures. This has three major issues:

1. It assumes nested brackets should always be progressively unwrapped.
2. It may overreach and rewrite constructs outside the intended malformed citation-wrapper scope.
3. Behavior can depend on iteration order and broad regex matching instead of explicit syntax classification.

## Refactor Goals

1. Replace iterative brute-force rewriting with a parser-guided one-pass normalization strategy.
2. Transform only verified malformed citation-wrapper patterns.
3. Preserve valid markdown links, wiki links, and unrelated bracketed text.
4. When properly formatted markdown citation links are enclosed by decorative outer square brackets, preserve the inner links and escape only the outer brackets (`\[` and `\]`) for correct Markdown/Obsidian display.
5. Ensure deterministic and idempotent behavior.
6. Deliver the new approach through a smooth migration with clear rollback safety during transition.

## Scope and Non-Goals

### In Scope

1. Refactor normalization logic used by selected-text command flow.
2. Expand and tighten tests for both positive and negative pattern coverage.
3. Document behavior changes and intentional divergences from legacy behavior.

### Out of Scope

1. Whole-note normalization mode.
2. Broader markdown cleanup unrelated to end-note malformed wrappers.
3. Changing URLs, link labels, or destination semantics.

## Migration Strategy (Phased)

### Phase 0: Baseline and Characterization

1. Freeze current behavior with characterization tests in `test/normalize.test.js`.
2. Add explicit negative tests for non-target constructs that must remain unchanged.
3. Document known risks/caveats of legacy behavior in design notes.

Exit criteria:

1. Existing behavior is fully represented by tests.
2. Safety boundaries are captured as failing/guard tests where appropriate.

### Phase 1: Contract Definition

1. Define strict match contract for what qualifies as a malformed citation-wrapper.
2. Define strict non-match contract for content that must not change.
3. Define idempotency requirement: repeated normalization must produce identical output.
4. Define escaped-wrapper contract: `[[1](url), [2](url)]` normalizes to `\[[1](url), [2](url)\]` with no inner-link mutation.

Exit criteria:

1. Contract examples are documented in `docs/END-NOTES.md` and/or `docs/DESIGN.md`.
2. Tests reflect both positive and negative contracts.

### Phase 2: Parser-Guided Path (Parallel Introduction)

1. Introduce a new parser-guided normalization path alongside legacy path.
2. Classify spans into three categories:
   - citation-wrapper (transform)
   - valid markdown/wikilink/unrelated bracketed text (preserve)
   - malformed/unknown (preserve unless explicitly in scope)
3. Apply targeted transformation only to spans classified as citation-wrapper.

Exit criteria:

1. New path passes contract tests.
2. New path is deterministic and one-pass.

### Phase 3: Dual-Run Validation

1. Validate outputs from legacy vs new logic on a curated corpus.
2. Record intentional divergences where legacy behavior was over-aggressive.
3. Confirm no regressions in preserved content areas.

Exit criteria:

1. Divergence list is reviewed and accepted.
2. No unresolved high-risk mismatches remain.

### Phase 4: Default Cutover

1. Switch default normalization to parser-guided logic.
2. Keep legacy logic as temporary fallback during stabilization window.
3. Expand regression tests for:
   - inline citation clusters
   - end-note list lines
   - nested URL parentheses
   - multiline spacing

Exit criteria:

1. Default path is parser-guided.
2. Test suite remains green.

### Phase 5: Legacy Removal and Cleanup

1. Remove iterative brute-force loop and broad wrapper-peeling regex path.
2. Simplify normalization API to a single deterministic path.
3. Update docs to reflect final behavior and migration completion.

Exit criteria:

1. No dead legacy code remains.
2. Documentation and tests are aligned with final behavior.

## Test Plan

### Required Positive Cases

1. Malformed wrapper around markdown citation list is normalized correctly.
2. End-note list lines (`[1] https://...`) are preserved or normalized only per contract.
3. Nested URL parentheses remain intact after normalization.
4. Multiline citation wrapper formatting normalizes without damaging inner links.
5. Properly formatted citation links inside decorative outer brackets are preserved and emitted with escaped outer brackets.

### Required Negative Cases

1. Valid markdown links are unchanged.
2. Non-citation bracketed prose is unchanged.
3. Intentional wiki-links are unchanged unless explicitly covered by contract.
4. Already-normalized text remains unchanged.
5. Already escaped outer citation wrappers remain unchanged.

### Behavioral Guarantees

1. Selection boundaries are respected (no external edits).
2. Non-target text, spacing, and line breaks are preserved.
3. Re-running normalization is a no-op.
4. Escaped-wrapper normalization is idempotent (no double escaping).

## Risks and Mitigations

1. Risk: New parser misses legacy edge cases.
   - Mitigation: Characterization tests + dual-run divergence review.
2. Risk: Over-constraining patterns leads to under-normalization.
   - Mitigation: Expand corpus from real examples in docs and tests.
3. Risk: Temporary complexity with dual paths.
   - Mitigation: Time-box fallback window and remove legacy path in Phase 5.

## Rollout and Validation Checklist

1. Characterization tests added.
2. Contract tests added.
3. Parser-guided path implemented.
4. Dual-run comparison completed.
5. Default switched to parser-guided path.
6. Legacy path removed.
7. Documentation updated.
8. Full test suite passing.

## No-Code Update Plan (Current Request)

1. Documentation alignment
   - Update `docs/END-NOTES.md` to define the preservation rule: keep inner markdown links intact and escape only outer decorative citation brackets.
   - Update `docs/REFACTOR.md` contracts and test expectations to include the escaped-wrapper behavior.
2. Contract examples to lock expected behavior
   - Add explicit before/after examples for single-link and multi-link wrapper cases.
   - Add explicit non-goals: no URL/label mutation, no spacing changes, no wiki-link rewrites.
3. Test design (for next implementation step, no code in this phase)
   - Positive contract cases for `[[1](url)]` and `[[1](a), [2](b)]` -> `\[[1](url)\]` and `\[[1](a), [2](b)\]`.
   - Negative/idempotency cases for standalone links, already escaped wrappers, and unrelated bracketed prose.
4. Implementation plan (next phase)
   - Update normalization classifier to detect outer decorative citation wrappers containing valid markdown link items.
   - Apply a targeted transform that escapes only wrapper boundaries.
   - Keep one-pass deterministic behavior and preserve existing selection boundaries.
5. Validation and rollout
   - Run characterization and contract tests.
   - Compare legacy vs new output on curated examples and document intentional divergences.
   - Cut over after green tests and accepted divergence review.

## Ownership and File Touch Plan

1. `src/normalize.js`: parser-guided normalization, classification, and final cutover.
2. `test/normalize.test.js`: characterization, contract, regression, and idempotency coverage.
3. `docs/END-NOTES.md`: user-facing examples and pattern contract.
4. `docs/DESIGN.md`: architecture notes and migration rationale.
5. `docs/REFACTOR.md`: this migration plan and completion status.
