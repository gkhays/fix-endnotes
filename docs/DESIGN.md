# Fix End Notes Obsidian Plugin

When researching technical issues, AI-assistants frequently provide references to sources. This is valuable information we wish to preserve. However, Gemini and other AI searches can encode citations with an additional decorative set of outer square braces. For properly formatted markdown citation links, we preserve the inner links and escape the outer braces so they render correctly in Markdown and Obsidian.

## 1. Overview

This document defines the requirements for an Obsidian plugin that integrates into the Obsidian Command Palette to reformat end notes into a predictable format.

## 2. Product Goal

Provide a fast, low-friction way to reformat end notes as links from the current Obsidian window.

## 3. Scope

### 3.1 In Scope

1. Trigger the task from the Obsidian command palette.
2. Operate only on the currently selected text in the active editor.
3. For properly formatted markdown citation links wrapped by decorative outer square brackets, escape only the outer brackets while preserving the underlying links.
4. Preserve all non-target text, spacing, and line breaks.
5. Replace the selection in place with the normalized text.

### 3.2 Out of Scope

1. Scanning or modifying the entire note without a selection.
2. Performing broader markdown cleanup beyond end-note bracket normalization.
3. Changing link targets, note names, or destination URLs.
4. Automatically rewriting references outside the current editor selection.

## 4. User Flow

1. The user highlights the text containing end notes or references.
2. The user runs the plugin command from the Obsidian Command Palette.
3. The plugin normalizes the selected text.
4. The plugin updates the selection in place so the user can continue editing.

## 5. Functional Requirements

1. The plugin must register a command that is visible in the Command Palette.
2. The plugin must read the current selection from the active editor.
3. If no text is selected, the plugin must do nothing and show a brief notice to the user.
4. The plugin must normalize citation wrappers by escaping only redundant decorative outer `[]` characters as `\[` and `\]`.
5. The plugin must not modify content outside the selected range.
6. The plugin must preserve the original markdown links inside the outer brackets without changing labels, URLs, ordering, punctuation, spacing, or line breaks.

## 6. Examples

| Input | Output |
| --- | --- |
| `[[1](https://example.com)]` | `\[[1](https://example.com)\]` |
| `[[1](https://a.example), [2](https://b.example)]` | `\[[1](https://a.example), [2](https://b.example)\]` |
| `before [[1](https://a.example), [2](https://b.example)] after` | `before \[[1](https://a.example), [2](https://b.example)\] after` |

## 7. Acceptance Criteria

1. A user can invoke the command from the Command Palette.
2. A non-empty selection is rewritten in place.
3. Decorative outer citation brackets are escaped without altering inner markdown links.
4. Empty selections are handled safely with no edit applied.
5. The plugin does not change unrelated text in the editor.

## 8. Technical Notes

1. The plugin should use Obsidian's active editor APIs to read and replace the selection.
2. The normalization logic should be deterministic and easy to test in isolation.
3. The command handler should be small, with transformation logic separated from UI wiring.

## 9. Normalization Contract (Phase 1)

### 9.1 Citation-Wrapper Pattern (MATCH CONTRACT)

A citation-wrapper in scope is a decorative outer square-bracket wrapper around properly formatted markdown citation links. It must be normalized by escaping only the outer wrapper.

1. **Single citation link wrapper**: `[[1](url)]` → `\[[1](url)\]`
   - Pattern: outer `[` + inner markdown link + outer `]`
   - Inner markdown link is preserved exactly.

2. **Citation link list wrapper**: `[[1](a), [2](b)]` → `\[[1](a), [2](b)\]`
   - Pattern: outer `[` + comma-separated markdown links + outer `]`
   - Inner markdown links are preserved exactly.

3. **Nested URL parentheses are preserved**
   - Example: `[[1](https://example.com/path_(v1))]` → `\[[1](https://example.com/path_(v1))\]`

### 9.2 Preservation Contract (NON-MATCH CONTRACT)

The following constructs must NOT be modified:

1. **Valid markdown links without outer wrapper**: `[link](url)` → unchanged
2. **Valid markdown link lists without outer wrapper**: `[1](a), [2](b)` → unchanged
3. **Already escaped citation wrappers**: `\[[1](a), [2](b)\]` → unchanged
4. **Intentional wiki-links and unrelated bracketed text**: `[[wikilink]]`, `array[0]`, `list[index]` → unchanged
5. **Single square bracket pairs**: `[text]` → unchanged
6. **URLs with nested parentheses**: `[text](url_(v1)_(v2))` → unchanged

### 9.3 Idempotency Requirement

Normalization must be idempotent: running it twice on any text must produce identical output.

- Example: `normalizeBracketedReferences(normalizeBracketedReferences(input)) === normalizeBracketedReferences(input)`
- This ensures repeated operations don't further degrade the text.

### 9.4 Known Limitations of Legacy Approach

The current regex-based iteration approach has these limitations:

1. Cannot reliably distinguish citation wrappers from wiki links (`[[wikilink]]`) in all cases.
2. Relies on iterative global replacements (up to 5 iterations) which can mask ordering issues.
3. Uses broad pattern matching that may overreach unintentionally.
4. Does not explicitly track the three span categories: citation-wrapper (escape), valid markdown/unrelated text (preserve), malformed/unknown (preserve unless in scope).

