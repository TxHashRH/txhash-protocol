/**
 * The renderer.
 *
 * It holds no facts. Every string it emits about the outside world comes from
 * the register, and every count it prints is measured from the register's own
 * length. If a field is not in the register it has no way to reach the page.
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

/**
 * The word a chip carries, per state. State is signalled by this word and by
 * the element being a span rather than an anchor -- never by colour, which is
 * why the ramp has no hue to spend on it.
 */
const CHIP = {
  [STATE.STATED]: 'stated',
  [STATE.UNCONFIRMED]: 'not confirmed',
  [STATE.ABSENT]: 'not supplied',
};

/**
 * Every chip carries the date its state was established, so an absence renders
 * as a dated statement rather than as an open-ended one. The date comes from
 * the register, not from a literal here, so one edit re-dates the whole page and
 * no entry can hold a stale date while its neighbour holds a fresh one.
 */
const chip = (r) => `<span class="chip">${esc(CHIP[r.state])} &middot; ${esc(CHECKED)}</span>`;

const sentenceId = (r) => `sentence-${r.id}`;

/**
 * The sentence for a record: its `present` branch once stated, its own `absent`
 * branch until then. The absent branch is never rewritten at the render site,
 * so the wording on the page and the wording in the register are the same words
 * by construction.
 */
const sentence = (r) => (isStated(r) ? esc(r.present(r.value)) : esc(r.absent));

/**
 * What a stated record rests on, printed under its value.
 *
 * A value with no visible basis reads as though it were checked here, and not
 * every stated value was: some rest on a statement made about a batch of
 * projects rather than about this one. Printing the source verbatim is what
 * keeps that difference legible after everyone has forgotten it, and it means an
 * exception in the batch shows up as a wrong basis rather than as a bare value
 * nobody can trace. Non-stated records carry their reason in the sentence
 * already, so they get no second line.
 */
const basis = (r) => (isStated(r) ? `<p class="basis">Basis: ${esc(r.source)}.</p>` : '');

/**
 * One channel slot, in one of two states, from one function.
 *
 * A slot goes live only when its record is stated AND `links[id]` is set. Until
 * then it is a span with role="link" and aria-disabled, still reachable by
 * keyboard but with no href to follow, and described by the record's own
 * sentence. Geometry and position are identical in both branches, so a disabled
 * slot and a live one cannot drift apart.
 */
function slot(r) {
  const href = links[r.id];
  const live = isStated(r) && href;
  const name = live ? esc(r.present(r.value)) : esc(r.label);

  if (live) {
    return (
      `<li><a class="slot" data-slot="${esc(r.id)}" href="${esc(href)}"` +
      ` rel="noopener noreferrer">${name}</a></li>`
    );
  }

  return (
    `<li><span class="slot" data-slot="${esc(r.id)}" role="link" aria-disabled="true"` +
    ` tabindex="0" aria-describedby="${esc(sentenceId(r))}"` +
    ` title="${esc(r.absent)}">${name}</span></li>`
  );
}

function entry(r, index) {
  return (
    `<li class="entry" data-record="${esc(r.id)}">` +
    `<span class="index">${String(index).padStart(2, '0')}</span>` +
    `<span class="entry-head"><span class="label">${esc(r.label)}</span>${chip(r)}</span>` +
    `<p class="sentence" id="${esc(sentenceId(r))}">${sentence(r)}</p>` +
    basis(r) +
    `</li>`
  );
}

export function render() {
  const t = tally();
  const lead = records.find((r) => r.id === 'contract');

  /* Render order is register order. Numbering runs across the whole register,
     including the lifted-out lead, so the indices a reader sees are positions in
     the register rather than positions in whichever list they happen to sit in. */
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
        `<section class="group" aria-labelledby="group-${esc(g.id)}">` +
        `<h2 id="group-${esc(g.id)}">${esc(g.title)}</h2>` +
        `<ul class="docket">` +
        rows.map((r) => entry(r, indexOf.get(r.id))).join('') +
        `</ul></section>`
      );
    })
    .join('');

  /* The description is derived too, so it cannot claim a different number of
     open questions than the document below it shows. */
  const description =
    `A register of what is and is not known about this project. ` +
    `${t.total} records, ${t.stated} stated, ${t.unconfirmed} not confirmed, ` +
    `${t.absent} not supplied, as of ${CHECKED}.`;

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
      `<a class="skip" href="#docket">Skip to the register</a>` +
      `<div class="wrap">` +
      `<header class="masthead">` +
      `<h1 class="wordmark">TxHash</h1>` +
      `<p class="tally">${t.total} records &middot; ${t.stated} stated &middot; ` +
      `${t.unconfirmed} not confirmed &middot; ${t.absent} not supplied</p>` +
      `<ul class="slots" aria-label="Channels">${channelSlots}</ul>` +
      `</header>` +
      `<main id="docket">` +
      `<section class="lead" aria-labelledby="lead-heading" data-record="${esc(lead.id)}">` +
      `<span class="lead-head">` +
      /* The lead carries its register index like every other entry. Without it
         the docket below appears to start at 02 and a reader is left looking
         for a missing first item. */
      `<span class="index">${String(indexOf.get(lead.id)).padStart(2, '0')}</span>` +
      `<h2 id="lead-heading">${esc(lead.label)}</h2>${chip(lead)}` +
      `</span>` +
      `<p id="${esc(sentenceId(lead))}">${sentence(lead)}</p>` +
      basis(lead) +
      `</section>` +
      body +
      `</main>` +
      `<footer class="colophon">` +
      `<p>Every statement above is one record in a single register. A record ` +
      `carries a value only once it has been checked, and until then it carries ` +
      `the sentence explaining what was checked and what was found. Nothing on ` +
      `this page is inferred from the project name or from any other site.</p>` +
      `<p>Counts, dates and channel states are read from that register when this ` +
      `document is built, so they describe the register as it stood on ` +
      `${esc(CHECKED)} rather than a figure typed alongside it.</p>` +
      `</footer>` +
      `</div>` +
      `</body>` +
      `</html>`,
  };
}
