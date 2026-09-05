/**
 * Denied terms, as salted digests rather than as words.
 *
 * What this covers: attribution strings that must not appear in this repository
 * or in its history, the names of other engagements, and the name of the site
 * this page's structure was discussed against. That last one matters most: a
 * name sitting in a file is how a fact nobody gave us ends up looking like a
 * fact we were given.
 *
 * The network that reference site runs on was ALSO denied here while our own
 * chain record was absent, for exactly that reason. The client has since named
 * the chain in a dated statement, so the term became a legitimate value and the
 * denial was rejecting a fact rather than protecting one. Those two digests were
 * REMOVED rather than exempted. An exemption would have left this list passing
 * by exception, and a reader could no longer tell whether it still checked
 * anything -- the same defect that makes an absolute address-reject gate
 * worthless the day a real address arrives.
 *
 * Matching runs the other way round. Source text is normalised, cut into word
 * n-grams up to MAX_N, and each n-gram is hashed and looked up, so a match is
 * whole-token by construction -- a denied word cannot be triggered by a longer
 * word that merely contains it -- and a failure prints a digest rather than the
 * term it caught.
 *
 * THE CO-AUTHOR TRAILER. This list previously held the AI vendor names and a
 * single long phrase ending in one of them, which meant the trailer CONSTRUCT
 * was never checked at all: a trailer naming anything else passed. Both forms
 * are now held, the 2-part and the 3-part. Because matching is over a token
 * sequence rather than a substring, the 2-part term also matches inside the
 * 3-part form, and `normalise` collapses runs of hyphens and dots so every
 * separator spelling reduces to the same tokens. The separator-less spellings
 * collapse to a single token instead and are held separately. Both directions
 * are proven by the gate-proof harness rather than assumed; a check that has
 * only ever been green is a check nobody has tested.
 *
 * This is intentionally strict: it denies ANY co-author trailer, not only ones
 * naming a machine. Nothing in a source file has a legitimate reason to carry
 * one, and authorship on this project is corrected from the client's own commit
 * once a remote exists.
 *
 * Terms are added with a generator kept outside this repository, so no plaintext
 * term is ever committed here. This file passes its own scan for the same
 * reason, and does so without an exemption; an exemption is the hole.
 *
 * The honest limit, stated rather than glossed: a digest list is not a secret.
 * It resists casual reading, and the salt defeats a precomputed table. It does
 * not resist someone who already holds a candidate list and wants to confirm a
 * guess. The property being bought is that this file cannot be READ as a list.
 */

export const SALT = '1aa4b860b262f71fed80beb6a974d674';

/** Longest denied term, in words. Bounds the n-gram window at the call site. */
export const MAX_N = 4;

export const DIGESTS = new Set([
  '0aed2b55870d1dd1a8976c98da07ec31',
  '21ccff78d74c9bae281a5c7f5a7996f3',
  '26f9e4cacdb1bf910412739423608069',
  '2bbd6db58aefb63fec194bc758209814',
  '2c19d73e06e91a94857744a7a5edd6fd',
  '3ba89c68b8b666c995868b00520586d9',
  '4803d66aaaffad62e6baf9e1fef8fc90',
  '4e0eec50b15954bdb177422388eb1d7a',
  '5321c7a6b8aa2bfef40e47a22959d83f',
  '809382bcde3584f5dd5f6c7fa448ffe2',
  '82f2ea07d7e5a8f1b260b0d9c87cb03a',
  '8930fd640e6e7d8ee4b306dc2a391131',
  '8ee2d39c980c61e56bdd0f1d6588142e',
  'b424f6217fbb1bb979e54296fc581bad',
  'cf708b176703721406955c03c52ead28',
  'cfa14357ec9e2f4b0dc8712142267662',
  'd080880b3a8a196f017f8a14055ae5c0',
  'd1b7a160b03275e69e4de8adc41913ce',
  'eaf1b6b3efbba30bb4375260113a4021',
  'ff62bc96433ea26474cb678f44523bd9',
]);

/**
 * Lowercase, then collapse every run of non-alphanumerics to one space.
 *
 * Collapsing the RUN, rather than replacing each character, is what makes the
 * separator spellings of a multi-word term equivalent: single or repeated
 * hyphens, dots, or a mix of them all reduce to the same token sequence, so one
 * entry covers every punctuation variant instead of needing one apiece.
 *
 * The variants are described here rather than written out. An earlier draft
 * spelled three of them literally as examples, and this file promptly failed its
 * own scan -- correctly, since a list of the forbidden spellings is itself the
 * thing being forbidden. The comment was rewritten rather than exempted, which
 * is the only fix that leaves the check meaning what it says.
 */
export const normalise = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
