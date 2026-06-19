# Fix End Notes Obsidian Plugin

When researching technical issues, AI-assistants frequently provide references to sources. This is valuable information we wish to preserve. However, Gemini and other AI searches encode notes or references with an additional set of outer square braces. We wish to remove these.

## 1. Overview

This document defines the requirements for an Obsidian plugin that integrates into the Obsidian Command Palette to reformat end notes into a predictable format.

## 2. Product Goal

Provide a fast, low-friction way to reformat end notes as links from the current Obsidian window.

## 3. Scope

### 3.1 In Scope

1. Trigger the task from the Obsidian command palette.
2. Operate only on the currently selected text in the active editor.
3. Remove redundant outer square brackets from end notes and references while preserving the underlying link target or reference text.
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
4. The plugin must normalize bracketed references by removing only redundant outer `[]` characters.
5. The plugin must not modify content outside the selected range.
6. The plugin must preserve the original link text or reference text inside the outer brackets.

## 6. Examples

| Input | Output |
| --- | --- |
| `[[reference]]` | `[reference]` |
| `[[[source](https://example.com)]]` | `[source](https://example.com)` |
| `before [[note]] after` | `before [note] after` |

## 7. Acceptance Criteria

1. A user can invoke the command from the Command Palette.
2. A non-empty selection is rewritten in place.
3. Excess bracket nesting is removed without altering the inner reference.
4. Empty selections are handled safely with no edit applied.
5. The plugin does not change unrelated text in the editor.

## 8. Technical Notes

1. The plugin should use Obsidian's active editor APIs to read and replace the selection.
2. The normalization logic should be deterministic and easy to test in isolation.
3. The command handler should be small, with transformation logic separated from UI wiring.

