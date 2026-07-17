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
 * Classify a bracketed span [content] into one of three categories:
 * - 'citation-wrapper': Transform (remove outer brackets)
 * - 'valid-markdown': Preserve (valid markdown link or link list)
 * - 'unrelated': Preserve (not a markdown construct)
 */
function classifyBracketedSpan(text, openIndex, closeIndex) {
  if (text[openIndex] !== "[" || text[closeIndex] !== "]") {
    return "unrelated";
  }

  // Must start with [[ to be a citation-wrapper
  if (text[openIndex + 1] !== "[") {
    // Could still be a valid markdown link: [label](url)
    const markdownLinkMatch = parseMarkdownLinkAt(text, openIndex);
    if (markdownLinkMatch === closeIndex + 1) {
      return "valid-markdown";
    }
    return "unrelated";
  }

  // Starts with [[, so check what patterns it matches
  
  // Check if it's a bracketed markdown link list: [[links...]]
  const listMatch = parseBracketedMarkdownLinkListAt(text, openIndex);
  if (listMatch && listMatch.end === closeIndex + 1) {
    return "citation-wrapper";
  }

  // Check if it's wrapped markdown link: [[link](url)]] or [[link](url)]
  // Note: parseMarkdownLinkAt checks starting from a given position, but we need
  // to account for the [[ prefix. Test if there's a markdown link after [[
  const innerStart = openIndex + 2;
  const linkEnd = parseMarkdownLinkAt(text, innerStart);
  
  if (linkEnd !== null && (linkEnd === closeIndex || linkEnd === closeIndex + 1)) {
    // We have [[link](url)]] (linkEnd at closeIndex+1) 
    // or [[link](url)] (linkEnd at closeIndex)
    return "citation-wrapper";
  }

  // Check if it's a simple wrapped reference: [[text]]
  // Fallback: if it starts with [[ and ends with ]], it's a citation-wrapper
  if (text[closeIndex - 1] === "]") {
    return "citation-wrapper";
  }

  return "unrelated";
}

// Phase 4: Switched default to parser-guided normalization

/**
 * Parser-guided iterative normalization. (DEFAULT AS OF PHASE 4)
 * Runs multiple passes, classifying and transforming citation-wrappers each time.
 * This matches the legacy iterative approach but with explicit classification.
 */
function normalizeBracketedReferences(text) {
  let normalized = text;
  
  // Run up to 5 passes to handle nested wrappers
  for (let iteration = 0; iteration < 5; iteration += 1) {
    // First pass: unwrap bracketed markdown link lists
    let afterListUnwrap = unwrapBracketedMarkdownLinkList(normalized);
    
    // Second pass: scan for citation-wrappers and transform them
    let result = "";
    let cursor = 0;

    while (cursor < afterListUnwrap.length) {
      if (afterListUnwrap[cursor] !== "[") {
        result += afterListUnwrap[cursor];
        cursor += 1;
        continue;
      }

      // Find matching closing bracket
      let closeIndex = -1;
      let depth = 0;

      for (let i = cursor; i < afterListUnwrap.length; i += 1) {
        if (afterListUnwrap[i] === "[") {
          depth += 1;
        } else if (afterListUnwrap[i] === "]") {
          depth -= 1;
          if (depth === 0) {
            closeIndex = i;
            break;
          }
        }
      }

      if (closeIndex === -1) {
        // Unclosed bracket, leave as is
        result += afterListUnwrap[cursor];
        cursor += 1;
        continue;
      }

      // Classify and transform if needed
      const span = afterListUnwrap.slice(cursor, closeIndex + 1);
      const classification = classifyBracketedSpan(afterListUnwrap, cursor, closeIndex);

      if (classification === "citation-wrapper") {
        // Apply transformations only for wrapped patterns
        // [[text]] → [text]
        // [[link](url)]] → [link](url)
        // [[link1, link2]] → [link1, link2]
        
        if (span.startsWith("[[")) {
          let inner = span.slice(2); // Remove opening [[
          
          // Remove closing ]] if present
          if (inner.endsWith("]]")) {
            inner = inner.slice(0, -2) + "]";
          } else if (inner.endsWith("]") && !inner.endsWith("]]")) {
            // Single ] case - just keep as is (already has one ])
          }
          
          result += "[" + inner;
        } else {
          result += span;
        }
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