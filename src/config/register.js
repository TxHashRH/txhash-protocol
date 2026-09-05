/**
 * The register.
 *
 * Every external fact this page could state is one record in this array, and
 * no fact is written as prose anywhere else in the codebase. The entries, the
 * tally, the channel slots and the document description are all derived from
 * this file, so a sentence written today cannot survive as a falsehood once a
 * value arrives.
 *
 * A record carries an explicit `state`, one of:
 *
 *   stated       a value exists, a source is recorded, and it was verified.
 *                Only this state may render a value, a link, or a control.
 *   unconfirmed  the client supplied something and it did not verify, or has
 *                not verified yet. `candidate` holds what we were given. It is
 *                rendered as text inside the sentence that reports the check,
 *                never as a destination.
 *   absent       nothing was supplied. `value` and `candidate` are both null.
 *
 * `state` is written out rather than inferred so that it can be read at a
 * glance, and the register-integrity gate fails the build if it disagrees with
 * the fields beside it. An explicit state that can drift from its own value is
 * worse than no state at all, so the gate is what makes writing it safe.
 *
 * `value: null` is the honest unknown. It is never an empty string, a zero, a
 * dash, or an ellipsis. A renderer handed a non-stated record emits that
 * record's `absent` sentence and its state chip. It never emits an href, a
 * copy control, a number, or any glyph that could be mistaken for a real value
 * that happens to be short.
 *
 * Order in this array is render order. `contract` is first deliberately, and a
 * gate enforces it.
 */

/** Provenance of a value. A record with a value but no source cannot be stated. */
export const SOURCE = {
  CLIENT: 'client, for this project specifically',
  /**
   * A statement the client made about a batch of projects rather than about
   * this one.
   *
   * It is a separate source from CLIENT on purpose. Both are the client's own
   * words and both are good enough to state a value, but they do not rest on
   * the same thing: a batch-level statement is an inference from a set to a
   * member, and it is only as good as this project actually belonging to that
   * set. Collapsing the two would hide that, and if the batch ever turns out to
   * have an exception, the record would give no way to see what it rested on.
   * Written out in full so the page can show the basis rather than paraphrase it.
   */
  CLIENT_BATCH:
    'client statement of 2026-09-02, given for the project batch rather than for this site individually',
  DNS: 'resolved from dns',
  HTTP: 'read over http',
  ONCHAIN: 'read from chain',
  NONE: null,
};

export const STATE = {
  STATED: 'stated',
  UNCONFIRMED: 'unconfirmed',
  ABSENT: 'absent',
};

/**
 * The date every check on this page was last run. Absent and unconfirmed
 * sentences are dated from here rather than from a literal typed into each
 * one, so a re-check is a single edit and no entry can carry a stale date
 * while its neighbour carries a fresh one.
 */
export const CHECKED = '2026-09-05';

/**
 * How a contract address would be checked if one were supplied.
 *
 * `rpc` stays null while no chain is named, because there is no network to ask.
 * The contract gate treats an address with no way to verify it as a build
 * failure rather than as something to display and hope about, so filling in
 * `value` without also naming a chain and an endpoint cannot ship.
 */
export const chainProbe = {
  rpc: 'https://rpc.mainnet.chain.robinhood.com',
  /**
   * The chain the endpoint above must actually be. Checked before any address
   * is read, because `eth_getCode` answering is not evidence it answered about
   * the right network -- a wrong or redirected endpoint would return bytecode
   * for some other chain's address and the gate would happily pass it.
   *
   * Verified live on 2026-09-05: eth_chainId returned 0x1237, net_version
   * returned 4663, and the endpoint was at block 0x349ad0c.
   */
  expectedChainId: '0x1237',
  expectCode: true,
};

/**
 * Display derivations. Each takes the record's single stored URL and produces
 * the text a reader sees, so the name on the page and the address a control
 * navigates to are the same string by construction and cannot drift.
 */
const handleFrom = (url) => `@${url.split('/').filter(Boolean).pop()}`;
const repoFrom = (url) => url.replace(/^https:\/\/[^/]+\//, '');
const hostFrom = (url) => url.replace(/^https:\/\//, '').replace(/\/$/, '');

export const records = [
  {
    id: 'contract',
    label: 'Contract address',
    /* Its own group, not `subject`. The contract record is lifted out of the
       docket into a panel of its own directly under the masthead, so giving it
       a group nothing else shares is what keeps it from rendering twice. The
       render-coverage gate checks every record appears exactly once. */
    group: 'contract',
    state: STATE.ABSENT,
    value: null,
    candidate: null,
    source: SOURCE.NONE,
    absent:
      'Not supplied. No address has been given to us, and whether one exists is unknown rather than assumed either way. No address is shown here, and this document contains no control for copying one.',
    present: (v) => v,
  },

  {
    id: 'chain',
    label: 'Chain',
    group: 'subject',
    /* Stated on the client's own statement of 2026-09-02, which covered the
       project batch rather than this site individually. That distinction is
       carried in the source and rendered as the basis, so the record shows what
       it rests on and an exception in the batch would be visible rather than
       buried.

       The reference site this page's structure was discussed against also runs
       on this network. That is not the basis and is not evidence: it was denied
       as a source while this record was absent precisely so the value could not
       be picked up from there, and the value arrived from the client instead. */
    state: STATE.STATED,
    value: 'Robinhood Chain',
    candidate: null,
    source: SOURCE.CLIENT_BATCH,
    absent:
      'Not supplied. No network has been named. None is named here, and none is inferred from the project name, from the domain, or from any site this one was compared against during its design.',
    present: (v) => v,
  },

  {
    id: 'product',
    label: 'What this is',
    group: 'subject',
    state: STATE.ABSENT,
    value: null,
    candidate: null,
    source: SOURCE.NONE,
    absent:
      'Not supplied. What this project does has not been described to us. Nothing on this page describes it, and nothing here is inferred from the name.',
    present: (v) => v,
  },

  {
    id: 'domain',
    label: 'Domain',
    group: 'channels',
    state: STATE.UNCONFIRMED,
    value: null,
    /* Supplied by the client. Held as a candidate, not a value: it is rendered
       as text inside the sentence reporting the check and is never linked. */
    candidate: 'https://txhash.xyz',
    source: SOURCE.NONE,
    absent:
      'Supplied by the client as txhash.xyz, and it does not resolve. A, AAAA, NS and TXT queries to 8.8.8.8 all returned NXDOMAIN. NXDOMAIN at the NS level means the name is not delegated, so the domain is not registered or not yet live. Nothing links here until it answers.',
    present: hostFrom,
  },

  {
    id: 'x',
    label: 'X account',
    group: 'channels',
    state: STATE.UNCONFIRMED,
    /* One field. When this becomes stated the canonical URL is stored here and
       the handle a reader sees is derived from it by `present`, so the two
       cannot drift. Neither candidate below is promoted to a value: one is
       someone else's account and the other does not exist. */
    value: null,
    candidate: null,
    source: SOURCE.NONE,
    absent:
      'Two handles were put forward and neither is usable. x.com/TxHash opens logged out to an unrelated account that joined in August 2017 and points at a different domain; it is not this project. x.com/TxHashRH returns a 404 and does not exist. An unregistered handle is not a safe one, since anyone may take it before launch, so no account is linked until one is confirmed to belong to this project.',
    present: handleFrom,
  },

  {
    id: 'repo',
    label: 'Source repository',
    group: 'channels',
    state: STATE.ABSENT,
    value: null,
    candidate: null,
    source: SOURCE.NONE,
    absent:
      'Not supplied. No repository has been given, and none is assumed to exist.',
    present: repoFrom,
  },

  {
    id: 'discord',
    label: 'Discord',
    group: 'channels',
    state: STATE.ABSENT,
    value: null,
    candidate: null,
    source: SOURCE.NONE,
    /* The client raised this channel only to rule it out. It is listed rather
       than dropped: a channel that was discussed and has no confirmed address
       is a known absence, and a reader is better served by seeing that it was
       considered than by finding a gap they cannot interpret. */
    absent:
      'Raised, then ruled out. No invite has been confirmed, so none is published. A stale or wrong invite is worse than none, because it sends people somewhere this project does not control.',
    present: (v) => v,
  },
];

export const groups = [
  { id: 'subject', title: 'Subject' },
  { id: 'channels', title: 'Channels' },
];

/** Only a stated record may render a value, an href, or a control. */
export const isStated = (r) => r.state === STATE.STATED;

/**
 * Link destinations, derived from the register rather than stored beside it.
 *
 * A second object holding the same URLs would be two places to edit and one of
 * them can go stale. The destination is read back out of the record's own
 * `value`, so a channel cannot be linked without being stated, and a stated
 * channel cannot point somewhere other than what the page displays.
 *
 * This list also drives the channel slots and the count the gate checks, so
 * adding a channel is adding an id here and a record above. Nothing may be
 * rendered for an id that has no record.
 */
export const CHANNEL_IDS = ['domain', 'x', 'repo', 'discord'];

export const links = Object.fromEntries(
  CHANNEL_IDS.map((id) => {
    const r = records.find((rec) => rec.id === id);
    return [id, r && isStated(r) ? r.value : null];
  })
);

/** Every tally on the page comes from here. No count is written as a literal. */
export const tally = (rows = records) => {
  const stated = rows.filter((r) => r.state === STATE.STATED).length;
  const unconfirmed = rows.filter((r) => r.state === STATE.UNCONFIRMED).length;
  const absent = rows.filter((r) => r.state === STATE.ABSENT).length;
  return { stated, unconfirmed, absent, total: rows.length, open: rows.length - stated };
};
