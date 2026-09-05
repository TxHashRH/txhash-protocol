/**
 * The renderer.
 *
 * It holds no facts. Every string it emits about the outside world comes from
 * the register, and every count it prints is measured from the register's own
 * length. If a field is not in the register it has no way to reach the page.
 *
 * THE DESIGN, briefly, because the reasoning is not visible in the markup.
 *
 * This page has almost nothing to say: most of its fields have no value. The
 * usual answer is to fill the space with claims. The answer here is to give
 * absence its actual extent. A field with no value renders as a measured empty
 * slot with a rule under it, the same size the value would have been, so
 * reading down the page you see filled and unfilled as physical facts rather
 * than as a status word you have to parse. The largest element on the page is
 * the contract field, and it is blank.
 *
 * An empty slot is not a placeholder. A placeholder stands in for content that
 * is coming; this is a field that has no value, shown at its true size, next to
 * a sentence saying exactly what was checked and what came back.
 *
 * State is carried three ways and none of them is colour: the word, whether the
 * slot is filled, and the shape of the field's cell in the masthead strip. The
 * strip is the register in miniature, in register order, so the ratio of known
 * to unknown is legible before a single row is read.
 *
 * There is no motion. The subject is a state of record, and animating it would
 * perform an activity the project does not have.
 */
import {
  records,
  groups,
  links,
  CHANNEL_IDS,
  CHECKED,
  STATE,
  isStated,
  tally,
} from '../config/register.js';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** The word a state carries. Never a colour, and never only a shape. */
const WORD = {
  [STATE.STATED]: 'recorded',
  [STATE.UNCONFIRMED]: 'not confirmed',
  [STATE.ABSENT]: 'not supplied',
};

/**
 * Platform marks, drawn as paths rather than pulled from an icon set, so the
 * page makes no third-party request for them.
 *
 * Keyed by host. A mark is only ever selected by the host of the record's own
 * destination, so the glyph on a control and the place that control goes are
 * the same entity by construction. A mark is wayfinding: it says where the
 * button leads. It is not an affiliation claim, and it is only permitted on a
 * control that actually leads somewhere, which is why a slot that is not
 * `stated` renders no mark at all. The channel-slot gate checks both
 * directions.
 */
const MARKS = {
  'x.com': {
    name: 'X',
    path:
      'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  'github.com': {
    name: 'GitHub',
    path:
      'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
};

const hostOf = (url) => {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return null;
  }
};

const markFor = (url) => {
  const host = hostOf(url);
  return host && MARKS[host] ? { host, ...MARKS[host] } : null;
};

const sentenceId = (r) => `note-${r.id}`;

/** Each record is independently dated: a row can be re-checked on its own. */
const stamp = () => `<time class="stamp" datetime="${esc(CHECKED)}">${esc(CHECKED)}</time>`;

const state = (r) => `<span class="state" data-state="${esc(r.state)}">${esc(WORD[r.state])}</span>`;

/**
 * The value, or the space where a value would be.
 *
 * The empty branch emits a slot of the same height as a filled one with a rule
 * beneath it, so the two read as the same field in two conditions rather than
 * as a present thing and a missing thing.
 */
const value = (r, extra = '') =>
  isStated(r)
    ? `<p class="value${extra}">${esc(r.present(r.value))}</p>`
    : `<p class="value value--empty${extra}" aria-hidden="true"></p>`;

/** What a recorded value rests on. Absent records carry their reason instead. */
const basis = (r) =>
  isStated(r) ? `<p class="basis">Basis: ${esc(r.source)}.</p>` : '';

const note = (r) =>
  isStated(r) ? '' : `<p class="note" id="${esc(sentenceId(r))}">${esc(r.absent)}</p>`;

/**
 * One channel control, in one of two conditions, from one function.
 *
 * Live: an anchor carrying the platform mark and the derived name.
 * Inert: a span with the same geometry, keyboard reachable, no href, no mark,
 * described by the record's own sentence. Geometry and position are identical,
 * so the two cannot drift apart in layout.
 */
function slot(r) {
  const href = links[r.id];
  const live = isStated(r) && href;
  const mark = live ? markFor(href) : null;

  const glyph = mark
    ? `<svg class="mark" data-mark="${esc(mark.host)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">` +
      `<path d="${esc(mark.path)}"/></svg>`
    : '';

  const name = live ? esc(r.present(r.value)) : esc(r.label);

  /* A slot with a mark carries the mark alone: press and go. The text it drops
     moves into the accessible name rather than disappearing, so the destination
     is still reachable without sight, and the name is the record's own derived
     value -- the same string the href points at.

     A slot with no visible text leans harder on the mark being correct, not
     less, since the glyph is now the only thing a sighted reader has to go on.
     The mark-matches-destination check is unchanged, and a second check makes
     sure the accessible name is present and is the register's own value.

     Domain keeps its label. It is not a mark, and there is no icon for "domain"
     that would not have to be invented. */
  if (live && mark) {
    return (
      `<li class="slot-item slot-item--icon">` +
      `<a class="slot slot--icon" data-slot="${esc(r.id)}" href="${esc(href)}"` +
      ` rel="noopener noreferrer" aria-label="${name} on ${esc(mark.name)}">` +
      glyph +
      `</a></li>`
    );
  }

  if (live) {
    return (
      `<li class="slot-item"><a class="slot" data-slot="${esc(r.id)}" href="${esc(href)}" rel="noopener noreferrer">` +
      `<span class="slot-name">${name}</span></a></li>`
    );
  }

  /* No wrapper element inside the inert branch. It carries no mark, so it needs
     none, and a nested span here would make the slot impossible to extract with
     a non-recursive match -- the gate would silently grade a truncated slot. */
  return (
    `<li class="slot-item"><span class="slot" data-slot="${esc(r.id)}" role="link" aria-disabled="true"` +
    ` tabindex="0" aria-describedby="${esc(sentenceId(r))}" title="${esc(r.absent)}">${name}</span></li>`
  );
}

/**
 * The register in miniature: one cell per record, in register order.
 *
 * Shape carries the state, so the strip is readable without colour and without
 * the legend. It is generated from the register, so it cannot show a different
 * number of fields than the page below it.
 */
function strip(t) {
  const CELL = 18;
  const GAP = 6;
  const w = records.length * CELL + (records.length - 1) * GAP;

  const cells = records
    .map((r, i) => {
      const x = i * (CELL + GAP);
      const box = `<rect class="cell cell--${r.state}" x="${x + 0.75}" y="0.75" width="${CELL - 1.5}" height="${CELL - 1.5}"/>`;
      if (r.state !== STATE.UNCONFIRMED) return box;
      /* Not confirmed reads as a hatched cell: neither the solid of a recorded
         field nor the plain outline of one that was never supplied. */
      return (
        box +
        `<line class="hatch" x1="${x + 1.5}" y1="${CELL - 1.5}" x2="${x + CELL - 1.5}" y2="1.5"/>` +
        `<line class="hatch" x1="${x + 1.5}" y1="${CELL / 2}" x2="${x + CELL / 2}" y2="1.5"/>` +
        `<line class="hatch" x1="${x + CELL / 2}" y1="${CELL - 1.5}" x2="${x + CELL - 1.5}" y2="${CELL / 2}"/>`
      );
    })
    .join('');

  const label =
    `Register state, in order: ${t.stated} recorded, ` +
    `${t.unconfirmed} not confirmed, ${t.absent} not supplied.`;

  return (
    `<svg class="strip" viewBox="0 0 ${w} ${CELL}" role="img" aria-label="${esc(label)}">${cells}</svg>`
  );
}

function row(r, index) {
  return (
    `<li class="row" data-record="${esc(r.id)}">` +
    `<span class="idx">${String(index).padStart(2, '0')}</span>` +
    `<div class="field">` +
    `<div class="head"><h3 class="label">${esc(r.label)}</h3>${state(r)}${stamp()}</div>` +
    value(r) +
    basis(r) +
    note(r) +
    `</div>` +
    `</li>`
  );
}

export function render() {
  const t = tally();
  const lead = records.find((r) => r.id === 'contract');
  const indexOf = new Map(records.map((r, i) => [r.id, i + 1]));

  const channelSlots = CHANNEL_IDS.map((id) => records.find((r) => r.id === id))
    .filter(Boolean)
    .map(slot)
    .join('');

  const body = groups
    .map((g) => {
      const rows = records.filter((r) => r.group === g.id);
      if (rows.length === 0) return '';
      return (
        `<section class="group" aria-labelledby="g-${esc(g.id)}">` +
        `<h2 class="group-title" id="g-${esc(g.id)}">${esc(g.title)}</h2>` +
        `<ol class="rows">${rows.map((r) => row(r, indexOf.get(r.id))).join('')}</ol>` +
        `</section>`
      );
    })
    .join('');

  const description =
    `A register of ${t.total} fields for this project. ${t.stated} recorded, ` +
    `${t.unconfirmed} not confirmed, ${t.absent} not supplied, as of ${CHECKED}.`;

  return {
    description,
    tally: t,
    html:
      `<!doctype html>` +
      `<html lang="en">` +
      `<head>` +
      `<meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width, initial-scale=1">` +
      `<title>TxHash</title>` +
      `<meta name="description" content="${esc(description)}">` +
      `<meta name="color-scheme" content="dark">` +
      `<style>__STYLES__</style>` +
      `</head>` +
      `<body>` +
      `<a class="skip" href="#register">Skip to the register</a>` +
      `<div class="sheet">` +
      `<header class="rail">` +
      `<div class="rail-in">` +
      `<h1 class="wordmark">TxHash</h1>` +
      strip(t) +
      `<p class="count">${t.total} fields. ${t.stated} recorded, ${t.open} open.</p>` +
      `<ul class="key">` +
      `<li><span class="kc kc--stated"></span>recorded</li>` +
      `<li><span class="kc kc--unconfirmed"></span>not confirmed</li>` +
      `<li><span class="kc kc--absent"></span>not supplied</li>` +
      `</ul>` +
      `<ul class="slots" aria-label="Channels">${channelSlots}</ul>` +
      `<p class="asof">Checked ${stamp()}</p>` +
      `</div>` +
      `</header>` +
      `<main class="register" id="register">` +
      /* The lead runs through the same two-branch helpers as every other row.
         An earlier version hardcoded the empty slot and the absent sentence
         here, because the field happened to be empty when it was written. That
         is the failure this whole register is built to prevent: the day an
         address arrived, the most important block on the page would have shown
         a blank rule and gone on saying no address had been given. */
      `<section class="lead" aria-labelledby="lead-h" data-record="${esc(lead.id)}">` +
      `<div class="head"><h2 class="label" id="lead-h">${esc(lead.label)}</h2>` +
      `${state(lead)}${stamp()}</div>` +
      value(lead, ' value--lead') +
      basis(lead) +
      note(lead) +
      `</section>` +
      body +
      `<footer class="colophon">` +
      `<p>Every line above is one record in a single register. A record carries ` +
      `a value only after it has been checked. Until then it carries the sentence ` +
      `saying what was checked and what came back.</p>` +
      `<p>Counts, dates and the strip are read from that register when this page ` +
      `is built. Nothing here is inferred from the project name, from the domain, ` +
      `or from any other site.</p>` +
      `</footer>` +
      `</main>` +
      `</div>` +
      `</body>` +
      `</html>`,
  };
}
