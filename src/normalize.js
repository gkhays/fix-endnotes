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

function normalizeBracketedSegment(segment) {
  const unwrappedList = unwrapBracketedMarkdownLinkList(segment);

  if (unwrappedList !== segment) {
    return unwrappedList;
  }

  if (!segment.startsWith("[[") || (!segment.endsWith("]]" ) && !segment.endsWith("]"))) {
    return segment;
  }

  const wrappedMarkdownLink = segment.match(/^\[\[([\s\S]+\]\([^\)\n]+\))\]\]$/);

  if (wrappedMarkdownLink) {
    return wrappedMarkdownLink[1];
  }

  const singlyWrappedMarkdownLink = segment.match(/^\[\[([\s\S]+\]\([^\)\n]+\))\]$/);

  if (singlyWrappedMarkdownLink) {
    return `[${singlyWrappedMarkdownLink[1]}`;
  }

  const wrappedReference = segment.match(/^\[\[([\s\S]+?)\]\]$/);

  if (wrappedReference) {
    return `[${wrappedReference[1]}]`;
  }

  return segment;
}

function normalizeBracketedReferences(text) {
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

module.exports = {
  isMarkdownLink,
  unwrapBracketedMarkdownLinkList,
  normalizeBracketedSegment,
  normalizeBracketedReferences,
};