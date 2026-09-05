/**
 * The gates. `npm run verify`. Each records a pass or a fail and the process
 * exits non-zero if any failed.
 *
 * Every one of these was made to fail on purpose before it was trusted. A gate
 * that has never failed is a gate that was never tested, and the expensive
 * version of that lesson is a checker that was silently passing everything.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

import { records, groups, links, CHANNEL_IDS, CHECKED, STATE, isStated, tally, chainProbe } from '../src/config/register.js';
import { derive, GROUNDS, TOKENS, SOURCES } from '../src/config/palette.js';
import { render as renderTokens, OUT as TOKENS_CSS } from './palette.js';
import { SALT, MAX_N, DIGESTS, normalise } from './deny.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = resolve(ROOT, 'public/index.html');

const rel = (p) => relative(ROOT, p).split(sep).join('/');
const results = [];
const record = (name, ok, detail) => results.push({ name, ok, detail });

const SKIP_DIRS = new Set(['node_modules', '.git']);
const TEXT_EXT = new Set(['.js', '.mjs', '.cjs', '.css', '.html', '.json', '.md', '.txt', '.yml', '.yaml', '']);

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = resolve(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Every text file we are responsible for, including dotfiles at the root. */
function scannedFiles() {
  const dirs = ['src', 'scripts', 'public'].map((d) => resolve(ROOT, d));
  const files = dirs.flatMap((d) => walk(d));
  for (const name of readdirSync(ROOT)) {
    const p = resolve(ROOT, name);
    if (statSync(p).isDirectory()) continue;
    files.push(p);
  }
  return files.filter((p) => TEXT_EXT.has(extname(p).toLowerCase()));
}

/* Gate 1 -------------------------------------------------------------------
   Register integrity. The explicit `state` on a record is convenient to read
   and dangerous to trust, because it is a second thing that can disagree with
   the value beside it. This gate is what makes writing it out safe: state and
   value must agree in both directions, every record must carry both branches of
   its sentence, and the contract record must be first in render order. */
function gateRegisterIntegrity() {
  const bad = [];
  const seen = new Set();

  for (const r of records) {
    const hasValue = r.value !== null;
    const hasSource = r.source !== null;

    if (seen.has(r.id)) bad.push(`${r.id}: duplicate id`);
    seen.add(r.id);

    if (!Object.values(STATE).includes(r.state)) bad.push(`${r.id}: unknown state "${r.state}"`);

    if (r.state === STATE.STATED && !(hasValue && hasSource)) {
      bad.push(`${r.id}: stated without both a value and a source`);
    }
    if (r.state !== STATE.STATED && hasValue) {
      bad.push(`${r.id}: holds a value while not stated, so a renderer could emit it`);
    }
    if (hasValue !== hasSource) {
      bad.push(`${r.id}: ${hasValue ? 'value with no source' : 'source with no value'}`);
    }
    if (r.state === STATE.ABSENT && r.candidate !== null) {
      bad.push(`${r.id}: absent but carries a candidate; that is the unconfirmed state`);
    }
    if (typeof r.absent !== 'string' || r.absent.trim() === '') bad.push(`${r.id}: no absent sentence`);
    if (typeof r.present !== 'function') bad.push(`${r.id}: no present branch`);
    if (!groups.some((g) => g.id === r.group) && r.group !== 'contract') {
      bad.push(`${r.id}: group "${r.group}" is not a declared group`);
    }
  }

  if (!records[0] || records[0].id !== 'contract') {
    bad.push(`render order: records[0] is ${records[0] ? records[0].id : 'missing'}, must be contract`);
  }

  for (const id of CHANNEL_IDS) {
    if (!records.some((r) => r.id === id)) bad.push(`channel "${id}" has no record in the register`);
  }
  for (const [k, v] of Object.entries(links)) {
    if (v !== null && !/^https:\/\//.test(v)) bad.push(`link ${k} is not an absolute https url`);
  }

  const t = tally();
  record(
    'register integrity',
    bad.length === 0,
    bad.length
      ? bad.join('\n    ')
      : `${t.total} records: ${t.stated} stated, ${t.unconfirmed} not confirmed, ${t.absent} not supplied; ` +
          `every record carries both branches; contract is records[0]`
  );
}

/* Gate 2 -------------------------------------------------------------------
   Render coverage and the tally. Every record renders exactly once, nothing
   renders that has no record, and every count on the page is the register's own
   length rather than a number typed next to it. The expected figures here are
   derived from `records`, so this gate cannot drift by holding a literal of its
   own -- there is no number written into it to go stale. */
function gateRenderCoverage() {
  const html = readFileSync(OUT, 'utf8');
  const bad = [];

  const rendered = [...html.matchAll(/data-record="([^"]+)"/g)].map((m) => m[1]);
  const counts = new Map();
  for (const id of rendered) counts.set(id, (counts.get(id) || 0) + 1);

  for (const r of records) {
    const n = counts.get(r.id) || 0;
    if (n !== 1) bad.push(`${r.id}: rendered ${n} time(s), must be exactly 1`);
  }
  for (const id of counts.keys()) {
    if (!records.some((r) => r.id === id)) bad.push(`document renders "${id}", which has no record`);
  }

  const t = tally();

  const counted = `${t.total} fields. ${t.stated} recorded, ${t.open} open.`;
  if (!html.includes(counted)) bad.push(`the count on the page is not the register's own: expected "${counted}"`);

  /* The masthead strip is the register in miniature, so it must have exactly one
     cell per record. A strip that disagreed with the list below it would be a
     figure drawn rather than derived. */
  const cells = (html.match(/class="cell cell--/g) || []).length;
  if (cells !== records.length) bad.push(`the strip shows ${cells} cells for ${records.length} records`);

  const stripLabel = `${t.stated} recorded, ${t.unconfirmed} not confirmed, ${t.absent} not supplied.`;
  if (!html.includes(stripLabel)) bad.push(`the strip's description is not the register's own tally`);

  /* Every sentence the document shows must be the record's own wording, not a
     rewrite at the render site. */
  const escape = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  for (const r of records) {
    if (!isStated(r) && !html.includes(escape(r.absent))) {
      bad.push(`${r.id}: the absent sentence on the page is not the register's own`);
    }
    /* A stated value must show what it rests on. Some values are checked here
       and some come from a statement made about a batch of projects; a bare
       value hides which, and that difference is the whole reason the source is
       recorded. */
    if (isStated(r)) {
      if (!html.includes(escape(String(r.present(r.value))))) {
        bad.push(`${r.id}: stated, but its value does not appear on the page`);
      }
      if (!html.includes(escape(r.source))) {
        bad.push(`${r.id}: stated, but the page does not show the basis it rests on`);
      }
    }
  }

  /* Every record carries the date its state was established, so an absence
     renders as a dated statement rather than an open-ended one, and a row can be
     re-checked on its own without the others claiming to have been.

     Checked per record rather than by counting stamps document-wide: splitting
     on the record attribute gives each record's own region, so a row that lost
     its date cannot be covered for by a stamp somewhere else on the page. */
  const regions = html.split('data-record="').slice(1);
  for (const seg of regions) {
    const id = seg.slice(0, seg.indexOf('"'));
    if (!seg.includes(`<time class="stamp" datetime="${CHECKED}"`)) {
      bad.push(`${id}: renders without a date, so its state reads as open-ended`);
    }
  }

  /* And no date anywhere may be a stale one. */
  const stale = [...html.matchAll(/<time[^>]*datetime="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((d) => d !== CHECKED);
  if (stale.length) bad.push(`${stale.length} date(s) on the page are not ${CHECKED}: ${[...new Set(stale)].join(', ')}`);

  record(
    'render coverage and tally',
    bad.length === 0,
    bad.length
      ? bad.join('\n    ')
      : `${records.length} records, each rendered exactly once and each dated ${CHECKED}; ` +
          `${cells}-cell strip and every count derived from the register's own length`
  );
}

/* Gate 3 -------------------------------------------------------------------
   Contract safety, in two branches.

   While the field is null the document must carry no copy affordance and no
   address-shaped string. Once a value exists, every address the document
   displays must BE that value, and it must have code behind it.

   Deliberately not written as a blanket "no address-shaped string may ever
   appear". That form is correct only while the field is empty, and the day a
   real address arrives it has to be defused with a hardcoded exemption for that
   one string -- at which point the gate is passing by exception rather than by
   rule, and nobody can tell from reading it whether it still checks anything.
   Collecting what the document shows and comparing it against the register
   needs no exemption, because the register is the comparison. */
async function gateContract() {
  const html = readFileSync(OUT, 'utf8');
  const field = records.find((r) => r.id === 'contract');
  const bad = [];
  const notes = [];

  const COPY_SIGNS = [
    /navigator\s*\.\s*clipboard/i,
    /execCommand\(\s*['"]copy/i,
    /data-copy/i,
    /copy[-\s]?to[-\s]?clipboard/i,
    /class="[^"]*\bcopy\b[^"]*"/i,
    /aria-label="[^"]*\bcopy\b[^"]*"/i,
  ];
  const copyHits = COPY_SIGNS.filter((re) => re.test(html)).length;
  const shown = [...new Set(html.match(/0x[0-9a-fA-F]{40}/g) || [])];

  if (!field) {
    bad.push('no contract record in the register');
  } else if (field.value === null) {
    if (copyHits > 0) {
      bad.push(`${copyHits} copy affordance(s) while the address field is null; a control that copies nothing implies an address exists`);
    }
    if (shown.length > 0) {
      bad.push(`${shown.length} address-shaped string(s) in the document while the address field is null`);
    }
    if (!bad.length) {
      notes.push('field is null: 0 copy affordances, 0 address-shaped strings in the emitted document');
    }
  } else {
    const want = String(field.value).toLowerCase();
    if (!shown.some((a) => a.toLowerCase() === want)) {
      bad.push('the address in the register is not the address the document displays');
    }
    for (const a of shown) {
      if (a.toLowerCase() !== want) bad.push(`document displays ${a}, which is not the register value`);
    }
    if (!chainProbe.rpc) {
      bad.push('an address is supplied but chainProbe.rpc is null, so nothing can verify it has code behind it');
    } else if (!chainProbe.expectedChainId) {
      bad.push('an address is supplied and an endpoint is named, but no expected chain id is declared, so nothing pins the endpoint to the right network');
    } else {
      /* Confirm the endpoint is the network we think it is BEFORE reading any
         address from it. eth_getCode answering is not evidence it answered
         about the right chain: a wrong, moved, or redirected endpoint would
         return bytecode for some other network's address and the address check
         below would pass on it. */
      let chainId = null;
      try {
        const res = await fetch(chainProbe.rpc, {
          method: 'POST',
          headers: { 'content-type': 'application/json', connection: 'close' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
        });
        chainId = (await res.json()).result;
      } catch (e) {
        bad.push(`could not reach ${chainProbe.rpc} to confirm the chain: ${e.cause?.code || e.message}`);
      }

      if (chainId && BigInt(chainId) !== BigInt(chainProbe.expectedChainId)) {
        bad.push(
          `${chainProbe.rpc} reports chain ${chainId}, but the register expects ${chainProbe.expectedChainId}`
        );
      } else if (chainId) {
        notes.push(`endpoint confirmed as chain ${chainId}`);
      }

      for (const a of bad.length ? [] : shown) {
        try {
          /* `connection: close` matters. With keep-alive the socket outlives the
             gate, and tearing a live handle down aborts the process before its
             exit code means anything. */
          const res = await fetch(chainProbe.rpc, {
            method: 'POST',
            headers: { 'content-type': 'application/json', connection: 'close' },
            body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getCode', params: [a, 'latest'] }),
          });
          const code = (await res.json()).result;
          if (!code || code === '0x') bad.push(`${a} has no code behind it on the named chain`);
          else notes.push(`${a} has ${(code.length - 2) / 2} bytes of code behind it`);
        } catch (e) {
          bad.push(`could not verify ${a} via ${chainProbe.rpc}: ${e.cause?.code || e.message}`);
        }
      }
    }
  }

  record('contract safety', bad.length === 0, bad.length ? bad.join('\n    ') : notes.join('\n    '));
}

/* Gate 4 -------------------------------------------------------------------
   Link discipline. No href may point anywhere except an in-page fragment or the
   value of a record that is stated. This is what keeps an unconfirmed channel
   from being wired by accident, and it is checked against the register rather
   than against a list of forbidden destinations -- a denylist of services would
   need editing every time a new one came up, and would pass anything nobody
   thought to add. */
function gateLinks() {
  const html = readFileSync(OUT, 'utf8');
  const bad = [];

  const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map((m) => m[1]);
  const allowed = new Set(Object.values(links).filter(Boolean));

  for (const h of hrefs) {
    if (h.startsWith('#')) continue;
    if (!allowed.has(h)) bad.push(`anchor to "${h}", which is not a stated record's value`);
  }

  for (const r of records) {
    if (isStated(r)) continue;
    if (new RegExp(`<a\\b[^>]*data-slot="${r.id}"`).test(html)) {
      bad.push(`${r.id}: rendered as an anchor while not stated`);
    }
  }

  const external = hrefs.filter((h) => !h.startsWith('#'));
  record(
    'link discipline',
    bad.length === 0,
    bad.length
      ? bad.join('\n    ')
      : `${hrefs.length} anchor(s): ${hrefs.length - external.length} in-page, ${external.length} external, ` +
          `${allowed.size} destination(s) permitted by the register`
  );
}

/* Gate 5 -------------------------------------------------------------------
   Channel slots. One element, two states, and the state is the register's. A
   slot renders as a link only when its record is stated and linked; otherwise it
   is inert but still reachable by keyboard, and the reason it shows is the
   record's own sentence rather than a rewrite. The gate fails in both
   directions, so a slot cannot go live early and cannot stay dead late. */
function gateChannelSlots() {
  const html = readFileSync(OUT, 'utf8');
  const bad = [];
  const lines = [];

  const slots = html.match(/<(a|span)\b[^>]*class="slot"[\s\S]*?<\/\1>/g) || [];
  if (slots.length !== CHANNEL_IDS.length) {
    bad.push(`the register declares ${CHANNEL_IDS.length} channel(s) but ${slots.length} slot(s) rendered`);
  }

  const escape = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  for (const id of CHANNEL_IDS) {
    const r = records.find((rec) => rec.id === id);
    const slot = slots.find((s) => s.includes(`data-slot="${id}"`));
    if (!slot) {
      bad.push(`slot ${id}: declared but did not render`);
      continue;
    }

    const isAnchor = slot.startsWith('<a');
    if (isStated(r) && links[id]) {
      if (!isAnchor) bad.push(`slot ${id}: record is stated and linked but the slot is inert`);
      else if (!slot.includes(`href="${links[id]}"`)) bad.push(`slot ${id}: href is not the register's value`);
      else lines.push(`slot ${id}: live, href is the register's own value`);
    } else {
      if (isAnchor) bad.push(`slot ${id}: rendered as a link while its record is not stated`);
      if (!/role="link"/.test(slot)) bad.push(`slot ${id}: inert without role="link"`);
      if (!/aria-disabled="true"/.test(slot)) bad.push(`slot ${id}: inert without aria-disabled`);
      if (!/tabindex="0"/.test(slot)) bad.push(`slot ${id}: inert and unreachable by keyboard`);

      const dm = slot.match(/aria-describedby="([^"]+)"/);
      if (!dm) bad.push(`slot ${id}: inert with no described reason`);
      else if (!html.includes(`id="${dm[1]}"`)) bad.push(`slot ${id}: aria-describedby points at nothing`);

      const tm = slot.match(/title="([^"]*)"/);
      if (!tm) bad.push(`slot ${id}: inert with no hover reason`);
      else if (tm[1] !== escape(r.absent)) bad.push(`slot ${id}: the reason shown is not the register's own sentence`);

      if (!bad.some((b) => b.startsWith(`slot ${id}:`))) {
        lines.push(`slot ${id}: inert, keyboard-reachable, reason is the register's own sentence`);
      }
    }

    /* Marks are checked against the destination, not banned by shape.

       An earlier version of this gate failed any slot containing artwork. That
       was right while no channel was wired and wrong the moment one was: the
       mark on a live control is wayfinding, it says where the button goes, and
       the mark and the destination are the same entity. Banning by shape would
       have rejected a correct change, the same way a blanket address-reject
       rejects a real address. So the rule is a correspondence, not a ban, and
       it fails in both directions:

         live   a mark is allowed, and its host must be the host of the record's
                own value. Any other artwork in the slot fails.
         inert  no mark at all. A platform logo on a control that goes nowhere
                asserts a relationship that has not been established. */
    const svgCount = (slot.match(/<svg\b/gi) || []).length;
    const imgCount = (slot.match(/<img\b/gi) || []).length;
    const declared = slot.match(/data-mark="([^"]+)"/);

    if (isStated(r) && links[id]) {
      let host = null;
      try {
        host = new URL(links[id]).host.replace(/^www\./, '');
      } catch {
        bad.push(`slot ${id}: destination is not a parseable url`);
      }
      if (declared && host && declared[1] !== host) {
        bad.push(`slot ${id}: carries the mark of "${declared[1]}" while pointing at ${host}`);
      } else if (declared && host) {
        lines.push(`slot ${id}: mark "${declared[1]}" is the host of its own destination`);
      }
      if (svgCount > (declared ? 1 : 0) || imgCount > 0) {
        bad.push(`slot ${id}: carries artwork that is not its destination's mark`);
      }
    } else if (svgCount > 0 || imgCount > 0 || declared) {
      bad.push(`slot ${id}: carries a mark while its record is not stated`);
    }
  }

  record('channel slots', bad.length === 0, bad.length ? bad.join('\n    ') : lines.join('\n    '));
}

/* Gate 6 -------------------------------------------------------------------
   Build freshness. Every other gate reads `public/index.html` and grades what
   it finds, so a document older than the sources that produced it would be
   graded happily and the whole suite would report green on work that never
   made it into the output.

   This is not hypothetical. The harness that proves these gates can fail hit
   exactly that: a build crashed, the previous document was still on disk, and a
   gate reported a pass for markup the current source could not produce. The npm
   scripts chain with `&&` so a crashed build stops the chain, but a gate suite
   that is only correct when invoked the right way is a gate suite with a way to
   be wrong. It checks for itself instead. */
function gateFreshness() {
  const sources = [...walk(resolve(ROOT, 'src')), resolve(HERE, 'build.js'), resolve(HERE, 'palette.js')];
  const built = statSync(OUT).mtimeMs;
  const stale = sources.filter((p) => statSync(p).mtimeMs > built);

  record(
    'built document is newer than its sources',
    stale.length === 0,
    stale.length
      ? `${rel(OUT)} is older than ${stale.length} of its source(s); the gates below would grade a stale document\n    ` +
          stale.map(rel).join('\n    ')
      : `${rel(OUT)} is newer than all ${sources.length} source(s)`
  );
}

/* Gate 7 - no comment survives into the shipped document. Read from the file
   that ships, not from the renderer that produced it. */
function gateNoHtmlComments() {
  const html = readFileSync(OUT, 'utf8');
  const n = (html.match(/<!--/g) || []).length;
  record('emitted html comment count is 0', n === 0, `count=${n} in ${rel(OUT)}`);
}

/* Gate 8 - no client javascript ships. */
function gateNoClientJs() {
  const html = readFileSync(OUT, 'utf8');
  const scripts = (html.match(/<script\b/gi) || []).length;
  const handlers = (html.match(/\son[a-z]+\s*=/gi) || []).length;
  const hrefs = (html.match(/href="javascript:/gi) || []).length;
  record(
    'no client javascript',
    scripts + handlers + hrefs === 0,
    `${scripts} script tag(s), ${handlers} inline handler(s), ${hrefs} javascript: url(s)`
  );
}

const hasGit = () => existsSync(resolve(ROOT, '.git'));

const git = (args) => {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
};

/**
 * Commit messages, author and committer identities, across every ref.
 *
 * History is part of the repository but lives in no scanned file, so a trailer
 * in a commit message would pass a file scan while sitting permanently in the
 * thing we are trying to keep clean. Returns '' for a repository with no
 * commits yet, and null when there is no repository at all.
 */
function gitHistory() {
  if (!hasGit()) return null;
  return git(['log', '--all', '--format=%H%n%an <%ae>%n%cn <%ce>%n%B%n--']) ?? '';
}

/* Gate 9 -------------------------------------------------------------------
   Denied terms. Content and path both, because a directory name can be the
   whole fingerprint while the file inside it says nothing. Commit messages and
   identities too, once a repository exists.

   Paths are tested RELATIVE TO THE REPOSITORY ROOT. What sits above the root is
   somebody's local disk layout, it is not shipped, and failing a build over it
   would be a gate reporting on a machine rather than on a repository. */
function gateDeniedTerms() {
  const files = scannedFiles();
  const hits = [];

  const digest = (s) => createHash('sha256').update(`${SALT}:${s}`).digest('hex').slice(0, 32);

  const scan = (text, where) => {
    const words = normalise(text).split(' ').filter(Boolean);
    for (let n = 1; n <= MAX_N; n++) {
      for (let i = 0; i + n <= words.length; i++) {
        const d = digest(words.slice(i, i + n).join(' '));
        if (DIGESTS.has(d)) hits.push(`${where}: denied term, digest ${d}`);
      }
    }
  };

  for (const p of files) {
    scan(rel(p), rel(p));
    scan(readFileSync(p, 'utf8'), rel(p));
  }

  const history = gitHistory();
  if (history) scan(history, 'git history');

  const commits = history ? (history.match(/^--$/gm) || []).length : 0;
  const where =
    history === null
      ? 'no repository yet, so no history to scan'
      : `${commits} commit(s) of history scanned (messages, author and committer identities, all refs)`;

  const dotfiles = files.filter((p) => rel(p).split('/').pop().startsWith('.'));
  record(
    'denied terms absent',
    hits.length === 0,
    hits.length
      ? [...new Set(hits)].join('\n    ')
      : `${files.length} files scanned (${dotfiles.length} dotfile(s)), ${DIGESTS.size} digests, ` +
          `n-grams up to ${MAX_N} words, contents and repo-relative paths, 0 hits; ${where}`
  );
}

/* Gate 12 ------------------------------------------------------------------
   Local git identity.

   `git config` writes to the global file when it is run outside a repository,
   and it does so without complaining. The commits then carry whatever personal
   identity the machine happens to have, and nobody notices until the history is
   somewhere public. Setting a local identity is easy to do and just as easy to
   do in the wrong directory, so it is checked rather than trusted: the gate
   reads what git will ACTUALLY use and fails if that is not the local value. */
function gateGitIdentity() {
  if (!hasGit()) {
    record('local git identity', true, 'no repository yet, so nothing to configure');
    return;
  }

  const bad = [];
  const local = { name: git(['config', '--local', 'user.name']), email: git(['config', '--local', 'user.email']) };
  const effective = { name: git(['config', 'user.name']), email: git(['config', 'user.email']) };

  for (const k of ['name', 'email']) {
    if (!local[k]) bad.push(`user.${k} is not set locally, so commits would fall through to the machine's own identity`);
    else if (effective[k] !== local[k]) {
      bad.push(`git resolves user.${k} to "${effective[k]}" but the local value is "${local[k]}"`);
    }
  }

  record(
    'local git identity',
    bad.length === 0,
    bad.length ? bad.join('\n    ') : `commits will be attributed to ${effective.name} <${effective.email}>, set locally`
  );
}

/* Gate 10 ------------------------------------------------------------------
   Palette provenance. tokens.css is regenerated from the coordinates and diffed
   against what is on disk, and no colour literal may appear anywhere else. */
function gatePalette() {
  const bad = [];
  const onDisk = existsSync(TOKENS_CSS) ? readFileSync(TOKENS_CSS, 'utf8') : null;

  if (onDisk === null) bad.push('tokens.css does not exist');
  else if (onDisk !== renderTokens()) {
    bad.push('tokens.css has drifted from the coordinates in src/config/palette.js');
  }

  const HEX = /#[0-9a-fA-F]{3,8}\b/g;
  const rows = derive();
  const tokenHexes = new Set(rows.map((r) => r.hex.toLowerCase()));
  const tokensCss = resolve(TOKENS_CSS);
  const built = resolve(OUT);

  /* Source may not name a colour outside tokens.css. Build output is a
     different question and needs a different rule: index.html inlines the
     stylesheet, so it necessarily contains every token's hex. Forbidding hexes
     there outright would only be satisfiable by not shipping the palette. What
     matters is that nothing appears which the coordinates did not produce, so
     the emitted document is checked by collecting what it shows and comparing
     against the derived set -- the same shape as the contract gate, and for the
     same reason: a rule that says "none may appear" stops being true the moment
     the real values do. */
  /* Three files may hold a colour, each for a different reason, and each is
     checked against a different set rather than waved through:

       tokens.css   generated. Diffed against its sources above, so anything in
                    it is already accounted for.
       provenance   palette.js and NOTES.md: the record of where colours came
                    from. They have to name the pixels that were sampled, the
                    same way the register has to name the facts it holds, and
                    neither can affect what renders. Permitted hexes are the
                    source values themselves plus the measurements quoted in
                    their provenance -- a stray colour typed into either still
                    fails, so this is a narrowed rule and not an exemption.
       index.html   inlines the stylesheet, so it necessarily contains every
                    token. Checked by collecting what it shows and comparing
                    against what the sources produced.

     Everywhere else, naming a colour at all is the failure. */
  const provenanceFiles = new Set(
    ['src/config/palette.js', 'NOTES.md'].map((p) => resolve(ROOT, p))
  );
  const quoted = Object.values(SOURCES).flatMap((s) => [s.hex, ...(String(s.method).match(HEX) || [])]);
  const provenanceHexes = new Set(quoted.map((h) => h.toLowerCase()));

  for (const p of scannedFiles()) {
    const here = resolve(p);
    if (here === tokensCss) continue;

    const found = readFileSync(p, 'utf8').match(HEX) || [];
    if (found.length === 0) continue;

    const uniq = [...new Set(found.map((h) => h.toLowerCase()))];

    if (here === built) {
      const stray = uniq.filter((h) => !tokenHexes.has(h));
      if (stray.length) bad.push(`${rel(p)} shows ${stray.join(', ')}, which no source produced`);
      continue;
    }

    if (provenanceFiles.has(here)) {
      const stray = uniq.filter((h) => !provenanceHexes.has(h));
      if (stray.length) {
        bad.push(
          `${rel(p)} names ${stray.join(', ')}, which is neither a sampled source nor a measurement quoted in one`
        );
      }
      continue;
    }

    bad.push(`${rel(p)} names a colour (${[...new Set(found)].join(', ')})`);
  }

  /* Provenance: every token must cite a source that was actually sampled, must
     be in gamut, and must not have drifted in hue or chroma from that source.
     Lightness is the only dimension a token is allowed to move in, so this is
     what makes "relit, never re-tinted" a checked property rather than a claim
     in a comment. Tolerance is on the OKLab a-b chord rather than on degrees,
     for the reason recorded in palette.js. */
  const AB_TOLERANCE = 0.002;

  for (const r of rows) {
    if (!onDisk || !onDisk.includes(`--${r.name}: ${r.hex};`)) {
      bad.push(`${r.name}: ${r.hex} is not the value emitted for its coordinate`);
    }
    if (!SOURCES[r.source]) {
      bad.push(`${r.name}: cites source "${r.source}", which was never sampled`);
      continue;
    }
    if (!r.inGamut) bad.push(`${r.name}: ${r.hex} is outside sRGB at its stated coordinate`);
    if (r.driftAB > AB_TOLERANCE) {
      bad.push(
        `${r.name}: drifted ${r.driftAB.toFixed(5)} from source "${r.source}" in the OKLab a-b plane ` +
          `(tolerance ${AB_TOLERANCE}); lightness is the only dimension a token may move in`
      );
    }
    if (!r.relit && r.hex.toLowerCase() !== SOURCES[r.source].hex.toLowerCase()) {
      bad.push(`${r.name}: claims to be unmodified but emits ${r.hex}, not its source's ${SOURCES[r.source].hex}`);
    }
  }

  record(
    'palette provenance',
    bad.length === 0,
    bad.length
      ? bad.join('\n    ')
      : `${TOKENS.length} tokens from ${Object.keys(SOURCES).length} sampled source(s), each citing one and ` +
          `within ${AB_TOLERANCE} of it in the OKLab a-b plane (lightness moved on ` +
          `${rows.filter((r) => r.relit).length}, held on ${rows.filter((r) => !r.relit).length}); ` +
          `tokens.css matches its sources; no source file outside it names a colour; ` +
          `every hex in the built document is one the sources produced`
  );
}

/* Gate 11 - contrast, measured from the byte that actually ships rather than
   from the ideal coordinate, on both painted grounds. */
function gateContrast() {
  const bad = [];
  const lines = [];

  for (const r of derive()) {
    if (r.target === null) {
      lines.push(`${r.name} ${r.hex}: no floor (${r.role.split('.')[0].toLowerCase()})`);
      continue;
    }
    const worst = Math.min(...GROUNDS.map((g) => r.ratios[g]));
    if (worst < r.target) {
      bad.push(`${r.name} ${r.hex}: ${worst.toFixed(2)}:1 against its tightest ground, floor is ${r.target}:1`);
    } else {
      lines.push(
        `${r.name} ${r.hex}: ` +
          GROUNDS.map((g) => `${g} ${r.ratios[g].toFixed(2)}:1`).join(', ') +
          `  floor ${r.target}:1`
      );
    }
  }

  record('contrast on both grounds', bad.length === 0, (bad.length ? bad : lines).join('\n    '));
}

gateRegisterIntegrity();
gateRenderCoverage();
await gateContract();
gateLinks();
gateChannelSlots();
gateFreshness();
gateNoHtmlComments();
gateNoClientJs();
gateDeniedTerms();
gateGitIdentity();
gatePalette();
gateContrast();

let failed = 0;
for (const r of results) {
  process.stdout.write(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}\n    ${r.detail}\n`);
  if (!r.ok) failed++;
}
process.stdout.write(`\n${results.length - failed} passed, ${failed} failed\n`);

/* Set the code and let the loop drain rather than calling process.exit(). The
   contract gate may have opened a socket, and tearing a live handle down mid
   flight aborts the process before its exit code means anything. */
process.exitCode = failed ? 1 : 0;
