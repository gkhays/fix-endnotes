const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeBracketedSegment,
  normalizeBracketedReferences,
} = require("../src/normalize");

test("normalizes a simple bracketed reference", () => {
  assert.equal(normalizeBracketedSegment("[[reference]]"), "[reference]");
});

test("removes redundant wrappers around a markdown link", () => {
  assert.equal(
    normalizeBracketedSegment("[[[source](https://example.com)]]"),
    "[source](https://example.com)"
  );
});

test("removes a single outer wrapper around a markdown link", () => {
  assert.equal(
    normalizeBracketedSegment("[[source](https://example.com)]"),
    "[source](https://example.com)"
  );
});

test("normalizes bracketed references inside surrounding text", () => {
  assert.equal(
    normalizeBracketedReferences("before [[note]] after"),
    "before [note] after"
  );
});

test("preserves non-target text and line breaks", () => {
  assert.equal(
    normalizeBracketedReferences("first line\n[[reference]]\nthird line"),
    "first line\n[reference]\nthird line"
  );
});

test("leaves text without bracketed references unchanged", () => {
  assert.equal(
    normalizeBracketedReferences("plain text without targets"),
    "plain text without targets"
  );
});

test("removes a single outer wrapper around a markdown link list", () => {
  assert.equal(
    normalizeBracketedReferences(
      "[[1](https://a.example), [2](https://b.example), [3](https://c.example)]"
    ),
    "[1](https://a.example), [2](https://b.example), [3](https://c.example)"
  );
});

test("removes outer wrapper in surrounding text for markdown link lists", () => {
  assert.equal(
    normalizeBracketedReferences(
      "See [[1](https://a.example), [2](https://b.example)] for details"
    ),
    "See [1](https://a.example), [2](https://b.example) for details"
  );
});

test("normalizes a citation after leading image markdown", () => {
  assert.equal(
    normalizeBracketedReferences(
      "![Folder](https://example.com/folder.png) Step 2: Initialize Your Plugin Folder [[1](https://github.com/laantorchaweb/clone-vault)]"
    ),
    "![Folder](https://example.com/folder.png) Step 2: Initialize Your Plugin Folder [1](https://github.com/laantorchaweb/clone-vault)"
  );
});

test("normalizes the exact citation sample from test.md", () => {
  assert.equal(
    normalizeBracketedReferences(
      "To write an Obsidian plugin, you must use **JavaScript or TypeScript** to interact with Obsidian's API, build your code into a single file using a bundler like `esbuild`, and place it inside your vault's hidden plugins directory. [[1](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin), [2](https://www.reddit.com/r/ObsidianMD/comments/1l0yb50/completely_unqualified_but_want_to_learn_to_make/), [3](https://johnwhiles.com/posts/obsidian-plugins)]"
    ),
    "To write an Obsidian plugin, you must use **JavaScript or TypeScript** to interact with Obsidian's API, build your code into a single file using a bundler like `esbuild`, and place it inside your vault's hidden plugins directory. [1](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin), [2](https://www.reddit.com/r/ObsidianMD/comments/1l0yb50/completely_unqualified_but_want_to_learn_to_make/), [3](https://johnwhiles.com/posts/obsidian-plugins)"
  );
});

test("normalizes wrapped link lists with multiline spacing and nested URL parentheses", () => {
  assert.equal(
    normalizeBracketedReferences(
      "Refs: [\n  [1](https://example.com/path_(nested)),\n  [2](https://example.com/other)\n]"
    ),
    "Refs: [1](https://example.com/path_(nested)),\n  [2](https://example.com/other)"
  );
});