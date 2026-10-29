const BLOCK_TAGS = new Set([
  'address','article','aside','blockquote','dd','div','dl','dt','fieldset','figcaption','figure',
  'footer','form','h1','h2','h3','h4','h5','h6','header','hr','li','main','nav','ol','p','pre',
  'section','table','tr','ul','title'
]);
const SKIP_CONTENT_TAGS = new Set(['script','style','noscript','template','iframe','object','svg','math','head']);
const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '\u00a9', reg: '\u00ae', trade: '\u2122',
  hellip: '\u2026', mdash: '\u2014', ndash: '\u2013', lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d',
  laquo: '\u00ab', raquo: '\u00bb', bull: '\u2022', middot: '\u00b7', euro: '\u20ac', pound: '\u00a3', yen: '\u00a5', cent: '\u00a2',
  deg: '\u00b0', times: '\u00d7', divide: '\u00f7', sect: '\u00a7', para: '\u00b6'
};

function decodeEntities(str) {
  return str.replace(/&(#x[0-9a-f]{1,6}|#[0-9]{1,7}|[a-z][a-z0-9]{1,31});/gi, (m, ent) => {
    if (ent[0] === '#') {
      const code = ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      // reject invalid / surrogate / NUL code points
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return '\ufffd';
      return String.fromCodePoint(code);
    }
    const v = NAMED_ENTITIES[ent.toLowerCase()];
    return v !== undefined ? v : m;
  });
}

/**
 * Converts an HTML string to plain text.
 * - Never evaluates/renders HTML (no DOM, no innerHTML), so it is safe for untrusted input.
 * - Drops <script>, <style>, comments, etc. including their contents.
 * - Linear-time scanning (no backtracking-prone regexes).
 * @param {string} html
 * @param {{ maxLength?: number }} [options]
 * @returns {string}
 */
function htmlToText(html, options = {}) {
  if (html == null) return '';
  const input = String(html);
  const maxLength = (options && typeof options.maxLength === 'number') ? options.maxLength : 1000000;
  const src = input.length > maxLength ? input.slice(0, maxLength) : input;

  const out = [];
  let i = 0;
  const len = src.length;

  while (i < len) {
    const lt = src.indexOf('<', i);
    if (lt === -1) { out.push(src.slice(i)); break; }
    if (lt > i) out.push(src.slice(i, lt));

    // Comments
    if (src.startsWith('<!--', lt)) {
      const end = src.indexOf('-->', lt + 4);
      i = end === -1 ? len : end + 3;
      continue;
    }
    // CDATA -> keep text
    if (src.startsWith('<![CDATA[', lt)) {
      const end = src.indexOf(']]>', lt + 9);
      out.push(src.slice(lt + 9, end === -1 ? len : end));
      i = end === -1 ? len : end + 3;
      continue;
    }
    // Doctype / processing instructions
    if (src[lt + 1] === '!' || src[lt + 1] === '?') {
      const end = src.indexOf('>', lt + 1);
      i = end === -1 ? len : end + 1;
      continue;
    }

    // Tag name
    const m = /^<\/?([a-zA-Z][a-zA-Z0-9:-]*)/.exec(src.slice(lt, lt + 64));
    if (!m) { out.push('<'); i = lt + 1; continue; } // stray '<' is literal text

    const isClosing = src[lt + 1] === '/';
    const name = m[1].toLowerCase();

    // Find end of tag, respecting quoted attribute values
    let j = lt + m[0].length, quote = null;
    for (; j < len; j++) {
      const c = src[j];
      if (quote) { if (c === quote) quote = null; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '>') break;
    }
    i = j >= len ? len : j + 1;

    if (!isClosing && SKIP_CONTENT_TAGS.has(name)) {
      // Skip everything up to the matching closing tag (case-insensitive)
      const re = new RegExp('</' + name + '\\s*>', 'ig');
      re.lastIndex = i;
      const close = re.exec(src);
      i = close ? close.index + close[0].length : len;
      continue;
    }

    if (name === 'br') out.push('\n');
    else if (name === 'td' || name === 'th') { if (isClosing) out.push('\t'); }
    else if (name === 'li') { if (!isClosing) out.push('\n\u2022 '); }
    else if (BLOCK_TAGS.has(name)) out.push('\n');
  }

  const text = decodeEntities(out.join(''))
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // control chars
    .replace(/[ \t\u00a0]+/g, m => (m.includes('\t') ? '\t' : ' '))
    .replace(/ *[\r\n\u0085\u2028\u2029]+ */g, '') // remove all line breaks (and spaces around them)
    .trim();
  return text.replace(/\\n/g, '');
}

module.exports = { htmlToText, decodeEntities };