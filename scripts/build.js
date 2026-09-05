/**
 * Emits `public/index.html`.
 *
 * Stylesheets are inlined so the document is one file with no subresource to
 * fetch, and their comments are stripped on the way in. The provenance notes in
 * `tokens.css` are for whoever maintains this repository; they are not for the
 * shipped document, and a build that carries internal notes into public output
 * is a build that will eventually carry the wrong one.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '../src/render/page.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
export const OUT = resolve(ROOT, 'public/index.html');

const STYLESHEETS = ['src/styles/tokens.css', 'src/styles/page.css'];

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const collapse = (css) =>
  stripComments(css)
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();

const styles = STYLESHEETS.map((p) => collapse(readFileSync(resolve(ROOT, p), 'utf8'))).join('');

const { html, description, tally } = render();
const out = html.replace('__STYLES__', styles);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out, 'utf8');

process.stdout.write(`wrote ${OUT}\n`);
process.stdout.write(`${out.length} bytes, ${styles.length} of them inlined css\n`);
process.stdout.write(
  `register: ${tally.total} records, ${tally.stated} stated, ` +
    `${tally.unconfirmed} not confirmed, ${tally.absent} not supplied\n`
);
process.stdout.write(`description: ${description}\n`);
