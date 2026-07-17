// TODO: Consider making this a user-configurable option in settings
const MAX_NESTING_DEPTH = 8;

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
        end: cursor + 1,
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

/**
 * Detect the maximum nesting depth of brackets at the start of a span.
 * Returns the number of consecutive opening brackets: "[[[text]]" → 3
 */
function detectMaxNestingDepth(text, startIndex) {
  let depth = 0;
  let cursor = startIndex;
  while (cursor < text.length && text[cursor] === "[") {
    depth += 1;
    cursor += 1;
  }
  return depth;
}

/**
 * Classify a bracketed span [content] into one of three categories:
 * - 'citation-wrapper': Transform (escape outer brackets)
 * - 'valid-markdown': Preserve (valid markdown link or link list)
 * - 'unrelated': Preserve (not a markdown construct)
 */
function classifyBracketedSpan(text, openIndex, closeIndex) {
  if (text[openIndex] !== "[" || text[closeIndex] !== "]") {
    return "unrelated";
  }

  // Preserve valid markdown links: [label](url)
  const markdownLinkMatch = parseMarkdownLinkAt(text, openIndex);
  if (markdownLinkMatch === closeIndex + 1) {
    return "valid-markdown";
  }

  // Citation-wrapper in scope: outer [ ... ] where inner content starts with a markdown link.
  // Example: [[1](url)] or [[1](a), [2](b)]
  const singleLinkEnd = parseMarkdownLinkAt(text, openIndex + 1);

  if (singleLinkEnd === null) {
    return "unrelated";
  }

  // Single wrapped markdown link: [[1](url)]
  if (singleLinkEnd === closeIndex) {
    return "citation-wrapper";
  }

  // Wrapped markdown link list: [[1](a), [2](b)]
  const listMatch = parseBracketedMarkdownLinkListAt(text, openIndex);
  if (listMatch && listMatch.end === closeIndex + 1) {
    return "citation-wrapper";
  }

  return "unrelated";
}

// Phase 4: Switched default to parser-guided normalization

/**
 * Parser-guided iterative normalization. (DEFAULT AS OF PHASE 4)
 * Runs multiple passes, classifying and transforming citation-wrappers each time.
 * This matches the legacy iterative approach but with explicit classification.
 * 
 * DoS Protection: Detects deeply nested citations (>8 levels) and stops processing
 * to avoid unbounded iteration. Extremely deep nesting is unusual for normal citations.
 */
function normalizeBracketedReferences(text) {
  let normalized = text;
  
  // Run up to 5 passes to handle nested wrappers
  for (let iteration = 0; iteration < 5; iteration += 1) {
    // Check for denial-of-service: extremely deep nesting
    // Scan for any position where nesting exceeds the safety limit
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
      // Stop processing to prevent DoS; return text as-is
      break;
    }
    // Scan for citation-wrappers and transform them
    let result = "";
    let cursor = 0;

    while (cursor < normalized.length) {
      if (normalized[cursor] !== "[") {
        result += normalized[cursor];
        cursor += 1;
        continue;
      }

      // Find matching closing bracket
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
        // Unclosed bracket, leave as is
        result += normalized[cursor];
        cursor += 1;
        continue;
      }

      // Classify and transform if needed
      const span = normalized.slice(cursor, closeIndex + 1);
      const classification = classifyBracketedSpan(normalized, cursor, closeIndex);

      if (classification === "citation-wrapper") {
        // Escape only outer wrapper brackets: [[1](a), [2](b)] -> \[[1](a), [2](b)\]
        const inner = span.slice(1, -1);
        result += `\\[${inner}\\]`;
      } else {
        // Keep as is for valid-markdown or unrelated
        result += span;
      }

      cursor = closeIndex + 1;
    }

    // Check if we made progress
    if (result === normalized) {
      break;
    }

    normalized = result;
  }

  return normalized;
}

/**
 * Legacy regex-based iterative normalization. (KEPT FOR REFERENCE/COMPARISON)
 * Use normalizeBracketedReferences() as the default; this is for comparison only.
 * @deprecated Use normalizeBracketedReferences() instead.
 */
function normalizeBracketedReferencesLegacy(text) {
  let normalized = text;

  for (let iteration = 0; iteration < 5; iteration += 1) {
    const next = unwrapBracketedMarkdownLinkList(normalized)
      .replace(/\[\[([\s\S]+\]\([^\)\n]+\))\]\]/g, (_match, link) => link)
      .replace(/\[\[([\s\S]+\]\([^\)\n]+\))\]/g, (_match, link) => `[${link}`)
      .replace(/\[\[([\s\S]+?)\]\]/g, (_match, reference) => `[${reference}]`);

    if (next === normalized) {
      break;
    }

    normalized = next;
  }

  return normalized;
}

/**
 * Normalize a bracketed segment in isolation.
 * Used for testing single segments.
 * This is kept for backward compatibility but should prefer normalizeBracketedReferences().
 */
function normalizeBracketedSegment(segment) {
  return normalizeBracketedReferences(segment);
}

module.exports = {
  isMarkdownLink,
  unwrapBracketedMarkdownLinkList,
  normalizeBracketedSegment,
  normalizeBracketedReferences,
  classifyBracketedSpan,
  normalizeBracketedReferencesLegacy,
};