import YAML from 'yaml';

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Split a Markdown document into YAML frontmatter and body.
 * Returns { data, body, error } — never throws.
 */
export function parseFrontmatter(text) {
  const m = FM_RE.exec(text);
  if (!m) return { data: null, body: text, error: 'missing YAML frontmatter' };
  try {
    const data = YAML.parse(m[1]);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { data: null, body: text.slice(m[0].length), error: 'frontmatter is not a mapping' };
    }
    return { data, body: text.slice(m[0].length), error: null };
  } catch (err) {
    return { data: null, body: text.slice(m[0].length), error: `invalid YAML: ${err.message.split('\n')[0]}` };
  }
}

export function stringifyFrontmatter(data, body) {
  return `---\n${YAML.stringify(data, { lineWidth: 0 }).trimEnd()}\n---\n\n${body.replace(/^\n+/, '')}`;
}

/** Return the list of `## ` headings in a Markdown body, ignoring fenced code blocks. */
export function h2Headings(body) {
  const out = [];
  let fenced = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const m = /^##\s+(?:\d+\.\s+)?(.+?)\s*$/.exec(line);
    if (m && !line.startsWith('###')) out.push(m[1]);
  }
  return out;
}
