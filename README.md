# Fix End Notes

Fix End Notes is an Obsidian plugin that normalizes selected end notes and references by removing redundant outer square brackets while preserving the inner text.

## Quick Start

1. Open an Obsidian vault.
2. Select the text you want to normalize.
3. Run the command palette action named `Normalize end notes in selection`.
4. The selection is rewritten in place.

If nothing is selected, the plugin shows a brief notice and makes no change.

## Local Installation

This repository is already in the format Obsidian expects for a plugin. To install it locally:

1. Find your vault's plugin folder at `.obsidian/plugins/`.
2. Create a folder named `fix-endnotes` inside that directory.
3. Copy these files into the new folder:
   - `dist/main.js` (as `dist/main.js`)
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

`src/main.js` is the source entrypoint and generated output is written to `dist/main.js`. `src/normalize.js` contains the transformation logic covered by the test file in `test/`.

## Behavior

- `[[reference]]` becomes `[reference]`
- `[[[source](https://example.com)]]` becomes `[source](https://example.com)`
- Text outside the selected range is not modified

## Requirements

- Obsidian 1.5.0 or later
- Node.js 18 or later for running the local test suite