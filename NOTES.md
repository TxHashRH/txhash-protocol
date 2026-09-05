# TxHash — working notes

Internal. Nothing in this file is rendered. Anything here that is unconfirmed
stays out of the document until it is confirmed in writing.

## State of the register

Seven records. Three recorded, one not confirmed, three not supplied. The page
derives those figures from the register, so this paragraph can go stale without
the document going stale with it.

Two records changed state on 2026-09-06 that had failed the day before. Nothing
here is carried forward on trust; every check is re-run and re-dated.

## What was checked, and what came back

All dates are the register's `CHECKED` constant, 2026-09-06.

- **x.com/TxHashRH — recorded.** Opened logged out: the profile renders, joined
  September 2026. **It returned 404 on 2026-09-05**, so this was re-checked
  rather than carried forward. A handle known not to exist was opened in the
  same session and returned 404, which is what makes the positive reading mean
  anything: without it, a page rendering proves only that the session renders
  pages.
- **x.com/TxHash — not ours, and worth keeping written down.** An unrelated
  account that joined **August 2017**, 274 followers, pointing at a different
  domain. It was the shorter and cleaner-looking of the two candidates and it is
  the wrong one. Recorded here and in the X record's basis so nobody wires it by
  mistake later.
- **github.com/TxHashRH/txhash-protocol — recorded.** 200 **without following
  redirects**; a 200 reached through a redirect would only have proved that
  something answers. Confirmed present in the account's public repository list,
  and the owner casing on the page is the API's own `full_name`, not the
  spelling we were sent. Account created 2026-09-05 13:42Z, repo one minute
  later.
- **txhash.xyz — registered, and not serving.** Yesterday every query returned
  NXDOMAIN. Today an A record resolves to 162.255.119.14, HTTP answers 302 to a
  www host, HTTPS **resets the connection**, and NS times out from two
  resolvers. A name that resolves is not a site. The record stays unconfirmed
  and nothing links to it; linking would send people to a dead handshake.
- **Chain — recorded**, on the client's statement of 2026-09-02, given for the
  project batch rather than for this site individually. That wording is the
  record's source and is printed on the page as its basis, so the batch-level
  derivation stays visible. Endpoint re-confirmed 2026-09-06: `eth_chainId`
  0x1237, block 0x34b9ca7.
- **Contract — not supplied.** The format is known: 0x form, EVM. A known format
  is not a value. No address, no copy control, no wording implying a token
  exists.
- **What this is — not supplied.** The X account's bio describes a product. It
  is **not** lifted onto this page. A bio is something the client wrote on
  somebody else's platform, not a description given to us, and copying it would
  turn an unverified marketing line into a fact this page asserts.
- **Discord — raised, then ruled out.** Listed rather than dropped: a channel
  that was discussed and has no confirmed address is a known absence, and a
  reader is better served seeing it was considered than finding a gap.

## The design

The page has almost nothing to say. Most fields have no value. The usual answer
in this sector is to fill that space with claims; the answer here is to give
absence its actual extent and let the ratio be the subject.

**The blank is the device.** A field with no value renders as a measured empty
slot with a broken rule under it, at the size the value would have been. Reading
down the page, filled and unfilled are physical facts rather than a status word
you have to parse. The largest element on the page is the contract field, and it
is blank — that is the page's whole argument, so it is set first and given the
room a value would have needed.

An empty slot is not a placeholder. A placeholder stands in for content that is
coming. This is a field that has no value, shown at true size, beside a sentence
saying exactly what was checked and what came back.

**No hero.** There is no headline, no tagline, no standfirst selling anything.
The masthead is a data block: the name, a seven-cell strip, the count, a legend,
the channels, the date. The only sentence in the masthead is a count derived
from the register.

**The strip is the register in miniature** — one cell per record, in register
order, shape carrying state. Filled is recorded, hatched is not confirmed,
outline is not supplied. The ratio is legible before a single row is read, and a
gate checks the strip has exactly one cell per record so it cannot become a
figure drawn rather than derived.

**State is carried three ways, none of them colour:** the word, whether the slot
is filled, and the cell shape. The broken-versus-solid language is consistent —
a blank field and an inert control are both dashed.

**Type.** No webfont ships and none is loaded. There is no licensed face in this
repository to self-host or subset, and shipping one would mean taking a face we
have no right to, so two system stacks are used with distinct jobs: monospace
for everything that is data, the system sans for running prose. The register
reads as an instrument; the sentences read as writing. That split is the main
typographic device.

**Composition.** Asymmetric: a rail carrying identity and state, a wider column
carrying the register, one hairline between them. The rail sticks so the ratio
stays in view while the register scrolls past. The register is capped at 872px
rather than filling the grid column — a measure that sprawls to 1400px is not a
measure, and space left at the right edge is not waste on a page about what is
missing. Rows are ruled and continuous, because a register is one list; boxing
each entry would imply the entries stand alone.

**Mobile is designed for 360, not squeezed into it.** The index column stays,
narrower, because it is what makes this read as a register rather than a stack
of headings. The label takes its own line so the state and date sit under it
instead of fighting for the same row. Everything else gives width back to the
measure.

**No motion.** The subject is a state of record; animating it would perform an
activity the project does not have. The only transitions are on hover and focus,
and they are switched off under `prefers-reduced-motion`.

### The platform marks

Both marks are drawn as inline SVG paths. No icon library, no third-party
request, nothing fetched.

A mark here is **wayfinding**: it says where a control goes. The mark and the
destination are the same entity, and the account is one the client owns and we
verified. That is different from putting a company's logo on a page to suggest a
relationship, which is an affiliation claim and is not what these are.

Because a mark only makes sense on a control that leads somewhere, a slot whose
record is not `stated` renders **no mark at all** — a platform logo on a control
that goes nowhere asserts a relationship that has not been established.

The gate checks a **correspondence, not a shape**: a mark is permitted only on a
stated, linked slot, and its `data-mark` must be the host of the record's own
value. An earlier version failed any slot containing artwork, which was right
while nothing was wired and wrong the moment something was — the same defect as
a blanket address-reject. Both directions are proven.

### `ch` does not measure what it says

Widths were originally written in `ch`. `28ch` computed to **187px** while 28
zeros in the same resolved font measure **262px** — `ch` resolved against a
different font than the one that paints, so every width in `ch` came out about
29% narrower than intended. All of them are in `rem` now. A unit that does not
measure what it claims to is worse than an arbitrary one.

## Palette

Artwork arrived **2026-09-05 at 22:44**, after the first palette was set and
without being mentioned. The ramp was re-cut from it. An earlier revision used
formula-derived neutrals at chroma 0, correctly, because at that point there was
nothing to sample.

**Every colour is traceable to a pixel in a supplied file.** Sampling method:
**per-element dominant colour, cross-checked against the per-channel median.**
Not k-means — the artwork is a two-element lockup, a mark and its ground, not a
distribution to cluster, and clustering would have invented intermediate colours
no pixel holds.

Two files, two roles, both needed:

- The master, colourtype 6 with real alpha. **Its alpha ceiling is 254, not
  255.** Only 84 of its 4,000,000 pixels are fully opaque, and they are a fringe
  artefact measuring `#f6f5ef` that disagrees with the body of the mark.
  Sampling at `alpha == 255` would have taken the whole ramp from 84 stray
  pixels. The body is the **340,578 px at alpha >= 254**, where dominant and
  per-channel median agree exactly: `#eae9e3`.
- The flattened copy, colourtype 2, no alpha. Useless for compositing and never
  shipped, but the **only** file in which the ground exists as colour at all; in
  the master that area is transparency. **86.24%** of it is one solid value,
  `#0c2b1c`.

They cross-validate: the mark reads `#eae9e3` in the master and `#e9e8e2` in the
flattened copy, one 8-bit step apart. Neither file alone gives both halves.

**The ground is dark because the mark is white-only.** A white mark needs a dark
ground to be legible as supplied, and recolouring a client's artwork is not ours
to do. The page follows the artwork.

There is **no accent**, because the artwork does not contain one. That is a
finding, not a limitation.

Hue and chroma are inherited from the source; where a floor could not be met,
**lightness only** was moved. Five tokens are re-lit, two are exactly as
sampled. Drift is measured as displacement in the **OKLab a-b plane, not degrees
of hue**: the ink tokens sit at chroma 0.008, where one 8-bit step swings the
angle nearly 8 degrees while moving the colour imperceptibly. Gating on degrees
would either fail on quantisation noise or need a tolerance loose enough to pass
a real re-tint at high chroma. Maximum observed drift 0.00124 against a
tolerance of 0.002.

Contrast is measured from the **emitted hex**, not the ideal coordinate. On the
earlier light ramp that distinction put a token at 13.99:1 against its own 14:1
floor while the shipped colour cleared it.

### The artwork is not committed

All three supplied files carry `eXIf`, `iTXt` or XMP, which fingerprints the
client's editor and account. They are listed in `.git/info/exclude` and stay on
disk: samplable, never in history. The provenance lives in
`src/config/palette.js`, which records which file and which pixels each colour
came from, so it survives even though the sources do not.

Nothing in `brand/` is shipped or referenced. If a mark is ever placed on the
page, images must be derived and stripped to `IHDR`/`IDAT`/`IEND`, and a
shipped-image-metadata gate added — there is none today because no image ships.

## Gates

`npm run verify` — twelve gates, each exits 1 on failure.

| gate | fails when |
| --- | --- |
| register integrity | a value without a source, a value held while not stated, a missing sentence branch, an undeclared group, or `contract` not first |
| render coverage and tally | a record renders zero or twice, something renders with no record, a record carries no date, a date is not the checked date, a stated record hides its value or its basis, the strip disagrees with the register's length, or a count is not the register's own |
| contract safety | while null: a copy affordance or an address-shaped string. Once stated: an endpoint reporting the wrong chain, no expected chain id to pin it, an address the document does not show, an address the register does not hold, no way to verify, or no code behind it |
| link discipline | an href points anywhere but an in-page fragment or a stated record's value |
| channel slots | a slot links while not stated, sits inert while stated and linked, loses keyboard reach, shows wording other than the register's own, carries a mark while not stated, or carries a mark that is not its own destination's host |
| built document is newer than its sources | the document being graded is older than the source that produced it |
| emitted html comment count is 0 | any comment survives into the shipped document |
| no client javascript | a script tag, an inline handler, or a `javascript:` url ships |
| denied terms absent | a denied term appears in file contents, in a repo-relative path, or in commit messages and identities across all refs |
| local git identity | `user.name` or `user.email` is not set locally, or git resolves either to something other than the local value |
| palette provenance | tokens.css drifts from its sources, a token cites a source never sampled, a token drifts in hue or chroma from its source, a token claims to be unmodified while emitting something else, a stray colour is typed into the provenance record, a source file names a colour at all, or the built document shows a hex no source produced |
| contrast on both grounds | a token misses its floor against either painted ground |

Thirty cases prove these can fail, run on throwaway copies so the repository is
never left broken. Every one was made to fail on purpose before being trusted.

### What the proof suite caught in the redesign

The lead block hardcoded the empty slot and the absent sentence, because the
contract field happened to be empty when it was written. The day an address
arrived, the most important block on the page would have shown a blank rule and
gone on saying no address had been given. It now runs through the same
two-branch helpers as every other row.

It also caught two of its own tests testing nothing: a mutation pinned to a
palette value that no longer existed, so the edit silently no-opped and the case
reported a pass for a file it had not touched; and a mark mutation that forced a
variable the inert branch never interpolated.

### The contract gate, and why it is written this way

It is **not** "no address-shaped string may appear". That form is only correct
while the field is empty. The day a real address arrives it has to be defused
with a hardcoded exemption for that one string, and from then on the gate passes
by exception rather than by rule. This one collects every address the document
shows and compares the set against the register, so no exemption is ever needed,
because the register *is* the comparison.

The endpoint is pinned to a chain id before any address is read. `eth_getCode`
answering is not evidence it answered about the right network.

### Denied terms

`scripts/deny.js` holds salted digests, not words. Source text is normalised,
cut into word n-grams, hashed and looked up, so matches are whole-token by
construction and a failure prints a digest rather than the term. **History is
scanned too** — commit messages and author and committer identities across all
refs. A trailer in a commit message is in the repository permanently but is in
no file, so a file-only scan would report clean.

Paths are tested **relative to the repository root**. What sits above the root is
somebody's local disk layout; failing a build over it would be a gate reporting
on a machine rather than on a repository.

The co-author trailer is held in both its two-part and three-part forms, and
both are proven separately. The list previously held only vendor names and one
long phrase ending in a vendor name, which meant the trailer construct was never
checked at all: a trailer naming anybody else passed. Because matching runs over
a token sequence rather than a substring, the shorter form also fires inside the
longer one, and collapsing runs of separators makes every punctuation spelling
reduce to the same tokens; separator-less spellings collapse to a single token
and are held on their own.

Writing that explanation is what made the file fail its own scan: an earlier
draft spelled three separator variants out as examples, and the gate caught it,
correctly, since a list of forbidden spellings is the forbidden thing. The
comment was rewritten rather than exempted.

The network the chain runs on was also denied here while the chain record was
absent, to stop the value being picked up from the site whose structure was
discussed during design. When the client named the chain, that denial started
rejecting a legitimate value. The digests were **removed, not exempted**.

The honest limit: a digest list is not a secret. It resists casual reading, and
the salt defeats a precomputed table. It does not resist someone who already
holds a candidate list and wants to confirm a guess. What it buys is that the
file cannot be *read* as a list.

## Measured

Every width measured on the built document, per element rather than by document
`scrollWidth`: an element can sit at a negative left and never widen the
document, so `overflowX === false` proves nothing about what is offscreen.

| viewport | doc overflow | elements offscreen | min tap target | scripts | third-party requests |
| --- | --- | --- | --- | --- | --- |
| 360 | no | 0 | 44 | 0 | 0 |
| 390 | no | 0 | 44 | 0 | 0 |
| 430 | no | 0 | 44 | 0 | 0 |
| 768 | no | 0 | 44 | 0 | 0 |
| 1366 | no | 0 | 44 | 0 | 0 |
| 1440 | no | 0 | 44 | 0 | 0 |

The skip link is the one element deliberately outside the viewport until
focused. `:focus` cannot be triggered while the pane is not focused, so it is
measured by applying its own focus declarations as a probe: 166 x 50 at left 12,
fully on screen.

## Git

Local only. Nothing pushed, no remote.

Initialised on `main`. Identity set **locally and after entering the
repository**, because `git config` run outside a working tree writes to the
global file without complaining and the commits then carry whatever personal
identity the machine has. The effective values are read back rather than
assumed, and a gate checks that what git will actually use is the local value.

**Identity and authorship are provisional.** They are corrected from the
client's own initial commit once a remote exists; `txhash-wip` is a placeholder
and is not intended to survive into the published history.

`.gitattributes` sets `* text=auto eol=lf` with per-type text and binary
markers. `.git/info/exclude` holds the project-specific excludes and is treated
as a shredder rather than a drawer: entries are paths that must never enter
history at all. It never leaves this machine.

## Open with the client

- **A contract address**, if and when one exists. Setting `value` and `source`
  on that record is the whole edit; the chain and endpoint are already in place,
  and the gate pins the chain and then requires real bytecode before it ships.
- **A description of what this is.** The only description we have is a bio on a
  third-party platform, which is not the same as being told.
- **The domain**, once it serves over HTTPS.
- **A wordmark**, if one exists. "TxHash" is set in the system mono stack; the
  supplied files are a symbol lockup, not type.
- **Confirmation that this project is in the 2026-09-02 batch.** The chain rests
  on that statement rather than on anything said about this site.
