# Fix End Notes

Fix End Notes is an Obsidian plugin that normalizes selected end notes and references by preserving properly formatted inner markdown citation links and escaping decorative outer square brackets for correct Markdown and Obsidian display.

## Quick Start

1. Open an Obsidian vault.
2. Select the text you want to normalize.
3. Run the command palette action named `Fix end notes`.
4. The selection is rewritten in place.

If nothing is selected, the plugin shows a brief notice and makes no change.

## Local Installation

This repository is already in the format Obsidian expects for a plugin. To install it locally:

1. Find your vault's plugin folder at `.obsidian/plugins/`.
2. Create a folder named `fix-endnotes` inside that directory.
3. Copy these files into the new folder:
   - `main.js`
   - `manifest.json`
4. In Obsidian, go to Settings -> Community plugins.
5. Turn off Restricted mode if needed.
6. Enable `Fix End Notes`.

## Local Development

Run the tests with:

```bash
npm test
```

Build the plugin with:

```bash
npm run build
```

`src/main.js` is the source entrypoint and generated output is written to `main.js` at the project root. `src/normalize.js` contains the transformation logic covered by the test file in `test/`.

## Behavior

In practice, the plugin only changes the decorative outer citation wrapper and leaves inner links untouched.

- `[[1](https://example.com)]` becomes `\[[1](https://example.com)\]`
- `[[1](https://a.example), [2](https://b.example)]` becomes `\[[1](https://a.example), [2](https://b.example)\]`
- Wrapper forms with multiline spacing are preserved internally and escaped at the outer boundary
- Valid markdown links like `[source](https://example.com)` are preserved
- Wiki-links like `[[wikilink]]` and unrelated bracketed text are preserved
- Text outside the selected range is not modified, and running the command repeatedly is idempotent

Before/After example:

```text
Before: See [[1](https://a.example), [2](https://b.example)] for details.
After:  See \[[1](https://a.example), [2](https://b.example)\] for details.
```

Current limitations:

- Extremely deep bracket nesting (more than 8 leading `[` characters) is left unchanged as a safety guard

## Requirements

- Obsidian 1.5.0 or later
- Node.js 18 or later for running the local test suite

## Acknowledgements

Development of this plugin was assisted by GitHub Copilot.