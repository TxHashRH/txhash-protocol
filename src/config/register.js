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
 *                Only this state may render a value, a link, or a mark.
 *   unconfirmed  the client supplied something and it did not verify, or has
 *                not verified yet. `candidate` holds what we were given. It is
 *                rendered as text inside the sentence that reports the check,
 *                never as a destination.
 *   absent       nothing was supplied. `value` and `candidate` are both null.
 *
 * `state` is written out rather than inferred so it can be read at a glance,
 * and the register-integrity gate fails the build if it disagrees with the
 * fields beside it. An explicit state that can drift from its own value is
 * worse than no state at all, so the gate is what makes writing it safe.
 *
 * `value: null` is the honest unknown. It is never an empty string, a zero, a
 * dash, or an ellipsis. A renderer handed a non-stated record emits that
 * record's `absent` sentence and its state. It never emits an href, a copy
 * control, a platform mark, a number, or any glyph that could be mistaken for a
 * real value that happens to be short.
 *
 * Order in this array is render order. `contract` is first deliberately, and a
 * gate enforces it.
 */

export const STATE = {
  STATED: 'stated',
  UNCONFIRMED: 'unconfirmed',
  ABSENT: 'absent',
};

/**
 * The date every check on this page was last run.
 *
 * Sentences and sources are dated from here rather than from a literal typed
 * into each one, so a re-check is a single edit and no entry can carry a stale
 * date while its neighbour carries a fresh one. Two records changed state on
 * this date; one of them had failed the day before, which is the whole reason
 * nothing here is carried forward on trust.
 */
export const CHECKED = '2026-09-06';

/**
 * How a contract address is checked if one is supplied.
 *
 * Re-confirmed on 2026-09-06: eth_chainId returned 0x1237 and the endpoint was
 * at block 0x34b9ca7. The chain id is checked before any address is read,
 * because an endpoint answering is not evidence it answered about the right
 * network.
 */
export const chainProbe = {
  rpc: 'https://rpc.mainnet.chain.robinhood.com',
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
       register into a block of its own, so giving it a group nothing else
       shares is what keeps it from rendering twice. The render-coverage gate
       checks every record appears exactly once. */
    group: 'contract',
    state: STATE.ABSENT,
    value: null,
    candidate: null,
    source: null,
    absent:
      'No address has been given to us, and whether one exists is unknown rather than assumed either way. Nothing is shown here, and this document contains no control for copying an address.',
    present: (v) => v,
  },

  {
    id: 'chain',
    label: 'Chain',
    group: 'subject',
    /* The reference site whose structure was discussed during design also runs
       on this network. That is not the basis and is not evidence: the term was
       denied as a source while this record was absent, precisely so the value
       could not be picked up from there, and it arrived from the client
       instead. */
    state: STATE.STATED,
    value: 'Robinhood Chain',
    candidate: null,
    source:
      'client statement of 2026-09-02, given for the project batch rather than for this site individually',
    absent:
      'No network has been named. None is named here, and none is inferred from the project name, from the domain, or from any site this one was compared against during its design.',
    present: (v) => v,
  },

  {
    id: 'product',
    label: 'What this is',
    group: 'subject',
    /* The X account's bio describes a product. It is not lifted here. A bio is
       something the client wrote on somebody else's platform, not a description
       given to us, and copying it would turn an unverified marketing line into
       a fact this page asserts. */
    state: STATE.ABSENT,
    value: null,
    candidate: null,
    source: null,
    absent:
      'What this project does has not been described to us. Nothing on this page describes it, and nothing here is inferred from the name or from anything written elsewhere.',
    present: (v) => v,
  },

  {
    id: 'domain',
    label: 'Domain',
    group: 'channels',
    state: STATE.UNCONFIRMED,
    value: null,
    candidate: 'https://txhash.xyz',
    source: null,
    absent:
      'Registered, and not serving. Yesterday every query returned NXDOMAIN. Today an A record resolves to 162.255.119.14, HTTP answers 302 to a www host, and HTTPS resets the connection without returning anything. A name that resolves is not a site, so nothing links here until it answers.',
    present: hostFrom,
  },

  {
    id: 'x',
    label: 'X account',
    group: 'channels',
    /* One field. The URL is stored and the handle a reader sees is derived from
       it, so the two cannot drift. This returned 404 on 2026-09-05 and was
       re-checked rather than carried forward. */
    state: STATE.STATED,
    value: 'https://x.com/TxHashRH',
    candidate: null,
    source: `client, and opened logged out on ${CHECKED}: the profile renders and joined September 2026. A handle known not to exist returned 404 in the same session, so the reading distinguishes a live account from a dead one. The other handle put forward, x.com/TxHash, is an unrelated account from August 2017`,
    absent:
      'No account has been confirmed as belonging to this project, so none is linked. A name that resolves is not evidence that it is the right one.',
    present: handleFrom,
  },

  {
    id: 'repo',
    label: 'Source repository',
    group: 'channels',
    state: STATE.STATED,
    value: 'https://github.com/TxHashRH/txhash-protocol',
    candidate: null,
    source: `client, and checked on ${CHECKED}: 200 without following redirects, listed among the account's public repositories, and the owner casing above is the API's own full_name rather than the spelling we were sent`,
    absent: 'No repository has been given, and none is assumed to exist.',
    present: repoFrom,
  },

  /* A channel the client does not have does not belong here, not even in the
     absent state. Deleting the record is the whole edit: nothing counts records
     for itself, so the tally, the strip, the page description and every gate
     follow from this array's length on their own.

     Which channels have been discussed and dropped is recorded in NOTES.md.
     That is our record of the engagement and it belongs there, not as a comment
     keeping a deleted record half-alive in the file it was deleted from. */
];

export const groups = [
  { id: 'subject', title: 'Subject' },
  { id: 'channels', title: 'Channels' },
];

/** Only a stated record may render a value, an href, a mark, or a control. */
export const isStated = (r) => r.state === STATE.STATED;

/**
 * Link destinations, derived from the register rather than stored beside it.
 *
 * A second object holding the same URLs would be two places to edit and one of
 * them can go stale. The destination is read back out of the record's own
 * `value`, so a channel cannot be linked without being stated, and a stated
 * channel cannot point somewhere other than what the page displays.
 */
export const CHANNEL_IDS = ['domain', 'x', 'repo'];

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
