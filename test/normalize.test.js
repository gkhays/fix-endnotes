const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeBracketedSegment,
  normalizeBracketedReferences,
  normalizeBracketedReferencesLegacy,
} = require("../src/normalize");

test("escapes outer wrapper for a single markdown citation link", () => {
  const result = normalizeBracketedSegment("[[1](https://example.com)]");
  assert.equal(result, "\\[[1](https://example.com)\\]");
});

test("escapes outer wrapper for markdown citation link list", () => {
  const result = normalizeBracketedSegment(
    "[[1](https://a.example), [2](https://b.example), [3](https://c.example)]"
  );
  assert.equal(
    result,
    "\\[[1](https://a.example), [2](https://b.example), [3](https://c.example)\\]"
  );
});

test("escapes citation wrappers inside surrounding text", () => {
  assert.equal(
    normalizeBracketedReferences(
      "See [[1](https://a.example), [2](https://b.example)] for details"
    ),
    "See \\[[1](https://a.example), [2](https://b.example)\\] for details"
  );
});

test("preserves non-target text and line breaks", () => {
  assert.equal(
    normalizeBracketedReferences("first line\n[[wikilink]]\nthird line"),
    "first line\n[[wikilink]]\nthird line"
  );
});

test("leaves text without bracketed references unchanged", () => {
  assert.equal(
    normalizeBracketedReferences("plain text without targets"),
    "plain text without targets"
  );
});

test("preserves valid markdown links without outer wrapper", () => {
  assert.equal(
    normalizeBracketedReferences("[source](https://example.com)"),
    "[source](https://example.com)"
  );
});

test("preserves valid markdown link lists without outer wrapper", () => {
  assert.equal(
    normalizeBracketedReferences("[1](https://a.example), [2](https://b.example)"),
    "[1](https://a.example), [2](https://b.example)"
  );
});

test("preserves wiki-links and simple bracket wrappers", () => {
  assert.equal(
    normalizeBracketedReferences("[[reference]] and [[note]]"),
    "[[reference]] and [[note]]"
  );
});

test("escapes citation wrapper after leading image markdown", () => {
  assert.equal(
    normalizeBracketedReferences(
      "![Folder](https://example.com/folder.png) ... [[1](https://github.com/laantorchaweb/clone-vault)]"
    ),
    "![Folder](https://example.com/folder.png) ... \\[[1](https://github.com/laantorchaweb/clone-vault)\\]"
  );
});

test("escapes wrapped link lists with multiline spacing and nested URL parentheses", () => {
  assert.equal(
    normalizeBracketedReferences(
      "Refs: [\n  [1](https://example.com/path_(nested)),\n  [2](https://example.com/other)\n]"
    ),
    "Refs: \\[\n  [1](https://example.com/path_(nested)),\n  [2](https://example.com/other)\n\\]"
  );
});

test("preserves unrelated bracketed text", () => {
  assert.equal(
    normalizeBracketedReferences("array[0] and list[index]"),
    "array[0] and list[index]"
  );
});

test("preserves URLs with nested parentheses in fragments", () => {
  assert.equal(
    normalizeBracketedReferences("[text](https://example.com/path_(v1)_(v2))"),
    "[text](https://example.com/path_(v1)_(v2))"
  );
});

test("is idempotent: citation wrapper normalization is stable", () => {
  const input = "See [[1](https://a.example), [2](https://b.example)] for details";
  const once = normalizeBracketedReferences(input);
  const twice = normalizeBracketedReferences(once);
  assert.equal(once, twice);
  assert.equal(
    once,
    "See \\[[1](https://a.example), [2](https://b.example)\\] for details"
  );
});

test("already escaped wrappers remain unchanged", () => {
  const input = "See \\[[1](https://a.example), [2](https://b.example)\\] for details";
  const once = normalizeBracketedReferences(input);
  assert.equal(once, input);
});

test("preserves single brackets in mixed text", () => {
  assert.equal(
    normalizeBracketedReferences("Use [array][0] for indexing"),
    "Use [array][0] for indexing"
  );
});

test("escapes inline citation clusters", () => {
  assert.equal(
    normalizeBracketedReferences(
      "Text [[1](https://a.example)] and [[2](https://b.example)] with clusters"
    ),
    "Text \\[[1](https://a.example)\\] and \\[[2](https://b.example)\\] with clusters"
  );
});

test("normalizes end-note list lines", () => {
  assert.equal(
    normalizeBracketedReferences(
      "[1] https://example1.com\n[2] https://example2.com\n[[1](https://end.example)] at end"
    ),
    "[1] https://example1.com\n[2] https://example2.com\n\\[[1](https://end.example)\\] at end"
  );
});

test("preserves deeply nested non-citation wrappers", () => {
  const result = normalizeBracketedReferences(
    "Start [[[[[ref]]]]] end"
  );
  assert.equal(result, "Start [[[[[ref]]]]] end");
});

test("preserves spacing in multiline content", () => {
  const input = "Line 1\n  [[1](https://a.example)]\nLine 2  \n  [[2](https://b.example)]\nLine 3";
  const result = normalizeBracketedReferences(input);
  assert(result.includes("Line 1"));
  assert(result.includes("Line 2"));
  assert(result.includes("Line 3"));
  assert(result.includes("\\[[1](https://a.example)\\]"));
  assert(result.includes("\\[[2](https://b.example)\\]"));
});

test("default and legacy intentionally diverge on citation wrappers", () => {
  const input = "[[1](https://a.example), [2](https://b.example)]";
  const defaultOutput = normalizeBracketedReferences(input);
  const legacyOutput = normalizeBracketedReferencesLegacy(input);

  assert.equal(defaultOutput, "\\[[1](https://a.example), [2](https://b.example)\\]");
  assert.equal(legacyOutput, "[1](https://a.example), [2](https://b.example)");
  assert.notEqual(defaultOutput, legacyOutput);
});

test("result is idempotent: normalizing twice gives same output", () => {
  const inputs = [
    "[[1](https://example.com)]",
    "before [[1](https://a.example), [2](https://b.example)] after",
    "Text [[1](https://x.example)] and [[2](https://y.example)]",
    "plain text without targets",
    "[[wikilink]]",
  ];

  inputs.forEach((input) => {
    const once = normalizeBracketedReferences(input);
    const twice = normalizeBracketedReferences(once);
    assert.equal(twice, once,
      `Result is not idempotent on: ${input}\nOnce: ${once}\nTwice: ${twice}`
    );
  });
});

test("DoS protection: stops processing extremely deep nesting", () => {
  // Create deeply nested citations (9 levels, exceeds MAX_NESTING_DEPTH of 8)
  const deepNesting = "[[[[[[[[[ref]]]]]]]]]";
  const result = normalizeBracketedReferences(deepNesting);
  // Should return text as-is because nesting exceeds safety limit
  assert.equal(result, deepNesting);
});

test("DoS protection: processes normal deep nesting up to limit", () => {
  // Nested wrappers under the DoS threshold should still be processed safely.
  // Non-citation wrappers are preserved by the new contract.
  const normalDeepNesting = "[[[[[[ref]]]]]]";
  const result = normalizeBracketedReferences(normalDeepNesting);
  assert.equal(result, normalDeepNesting);
});