var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// src/normalize.js
var require_normalize = __commonJS({
  "src/normalize.js"(exports2, module2) {
    var MAX_NESTING_DEPTH = 8;
    function isMarkdownLink(text) {
      return /^\[[^\]\n]+\]\([^\)\n]+\)$/.test(text);
    }
    function skipWhitespace(text, index) {
      let cursor = index;
      while (cursor < text.length && /\s/.test(text[cursor])) {
        cursor += 1;
      }
      return cursor;
    }
    function parseMarkdownLinkAt(text, index) {
      let cursor = skipWhitespace(text, index);
      if (text[cursor] !== "[") {
        return null;
      }
      const labelEnd = text.indexOf("]", cursor + 1);
      if (labelEnd === -1 || labelEnd === cursor + 1) {
        return null;
      }
      cursor = labelEnd + 1;
      if (text[cursor] !== "(") {
        return null;
      }
      cursor += 1;
      let depth = 1;
      while (cursor < text.length && depth > 0) {
        if (text[cursor] === "(") {
          depth += 1;
        } else if (text[cursor] === ")") {
          depth -= 1;
        }
        cursor += 1;
      }
      if (depth !== 0) {
        return null;
      }
      return cursor;
    }
    function parseBracketedMarkdownLinkListAt(text, index) {
      if (text[index] !== "[") {
        return null;
      }
      let cursor = parseMarkdownLinkAt(text, index + 1);
      if (cursor === null) {
        return null;
      }
      let itemCount = 1;
      while (true) {
        cursor = skipWhitespace(text, cursor);
        if (text[cursor] === ",") {
          cursor += 1;
          const nextLinkEnd = parseMarkdownLinkAt(text, cursor);
          if (nextLinkEnd === null) {
            return null;
          }
          cursor = nextLinkEnd;
          itemCount += 1;
          continue;
        }
        if (text[cursor] === "]" && itemCount >= 2) {
          return {
            listStart: index + 1,
            listEnd: cursor,
            end: cursor + 1
          };
        }
        return null;
      }
    }
    function unwrapBracketedMarkdownLinkList(text) {
      let result = "";
      let cursor = 0;
      let mutated = false;
      while (cursor < text.length) {
        const parsed = parseBracketedMarkdownLinkListAt(text, cursor);
        if (!parsed) {
          result += text[cursor];
          cursor += 1;
          continue;
        }
        result += text.slice(parsed.listStart, parsed.listEnd).trim();
        cursor = parsed.end;
        mutated = true;
      }
      return mutated ? result : text;
    }
    function detectMaxNestingDepth(text, startIndex) {
      let depth = 0;
      let cursor = startIndex;
      while (cursor < text.length && text[cursor] === "[") {
        depth += 1;
        cursor += 1;
      }
      return depth;
    }
    function classifyBracketedSpan(text, openIndex, closeIndex) {
      if (text[openIndex] !== "[" || text[closeIndex] !== "]") {
        return "unrelated";
      }
      const markdownLinkMatch = parseMarkdownLinkAt(text, openIndex);
      if (markdownLinkMatch === closeIndex + 1) {
        return "valid-markdown";
      }
      const singleLinkEnd = parseMarkdownLinkAt(text, openIndex + 1);
      if (singleLinkEnd === null) {
        return "unrelated";
      }
      if (singleLinkEnd === closeIndex) {
        return "citation-wrapper";
      }
      const listMatch = parseBracketedMarkdownLinkListAt(text, openIndex);
      if (listMatch && listMatch.end === closeIndex + 1) {
        return "citation-wrapper";
      }
      return "unrelated";
    }
    function normalizeBracketedReferences2(text) {
      let normalized = text;
      for (let iteration = 0; iteration < 5; iteration += 1) {
        let hasExcessiveNesting = false;
        for (let i = 0; i < normalized.length; i += 1) {
          if (normalized[i] === "[") {
            const depth = detectMaxNestingDepth(normalized, i);
            if (depth > MAX_NESTING_DEPTH) {
              hasExcessiveNesting = true;
              break;
            }
          }
        }
        if (hasExcessiveNesting) {
          break;
        }
        let result = "";
        let cursor = 0;
        while (cursor < normalized.length) {
          if (normalized[cursor] !== "[") {
            result += normalized[cursor];
            cursor += 1;
            continue;
          }
          let closeIndex = -1;
          let depth = 0;
          for (let i = cursor; i < normalized.length; i += 1) {
            if (normalized[i] === "[") {
              depth += 1;
            } else if (normalized[i] === "]") {
              depth -= 1;
              if (depth === 0) {
                closeIndex = i;
                break;
              }
            }
          }
          if (closeIndex === -1) {
            result += normalized[cursor];
            cursor += 1;
            continue;
          }
          const span = normalized.slice(cursor, closeIndex + 1);
          const classification = classifyBracketedSpan(normalized, cursor, closeIndex);
          if (classification === "citation-wrapper") {
            const inner = span.slice(1, -1);
            result += `\\[${inner}\\]`;
          } else {
            result += span;
          }
          cursor = closeIndex + 1;
        }
        if (result === normalized) {
          break;
        }
        normalized = result;
      }
      return normalized;
    }
    function normalizeBracketedReferencesLegacy(text) {
      let normalized = text;
      for (let iteration = 0; iteration < 5; iteration += 1) {
        const next = unwrapBracketedMarkdownLinkList(normalized).replace(/\[\[([\s\S]+\]\([^\)\n]+\))\]\]/g, (_match, link) => link).replace(/\[\[([\s\S]+\]\([^\)\n]+\))\]/g, (_match, link) => `[${link}`).replace(/\[\[([\s\S]+?)\]\]/g, (_match, reference) => `[${reference}]`);
        if (next === normalized) {
          break;
        }
        normalized = next;
      }
      return normalized;
    }
    function normalizeBracketedSegment(segment) {
      return normalizeBracketedReferences2(segment);
    }
    module2.exports = {
      isMarkdownLink,
      unwrapBracketedMarkdownLinkList,
      normalizeBracketedSegment,
      normalizeBracketedReferences: normalizeBracketedReferences2,
      classifyBracketedSpan,
      normalizeBracketedReferencesLegacy
    };
  }
});

// src/main.js
var { Notice, Plugin } = require("obsidian");
var { normalizeBracketedReferences } = require_normalize();
module.exports = class FixEndNotesPlugin extends Plugin {
  onload() {
    console.log("[fix-endnotes] startup", {
      id: this.manifest.id,
      version: this.manifest.version
    });
    this.addCommand({
      id: "normalize-end-notes-selection",
      name: "Fix end notes",
      editorCallback: (editor) => {
        const selection = editor.getSelection();
        if (selection.length === 0) {
          new Notice("Select some end notes first.");
          return;
        }
        const normalized = normalizeBracketedReferences(selection);
        console.log("[fix-endnotes] normalize-end-notes-selection", {
          before: selection,
          after: normalized
        });
        editor.replaceSelection(normalized);
      }
    });
  }
};
