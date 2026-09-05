# TxHash — working notes

Internal. Nothing in this file is rendered. Anything here that is unconfirmed
stays out of the document until it is confirmed in writing.

## State of the register

Seven records. One is stated, two are unconfirmed, four were never supplied.
The page says so and derives the figures from the register, so this paragraph
can go stale without the document going stale with it.

## What was checked, and what came back

All four external facts were checked on 2026-09-05. None of them can be
published yet.

- **x.com/TxHash** — opened logged out. It resolves, and it is somebody else's:
  an account that joined in **August 2017**, carries 274 followers, describes
  itself as blockchain-as-a-service, and links a `.com` domain that is not the
  one we were given. It is not this project and must not be linked.
- **x.com/TxHashRH** — opened logged out. **404**, no such profile.
- Neither handle is usable, and the second is not usable *because* it is free.
  An unregistered handle can be taken by anyone between now and launch, so
  "available" is not a state we can publish. The client should register the one
  they want and confirm it, and only then does the record get a value.
- **txhash.xyz** — A, AAAA, NS and TXT to 8.8.8.8 all returned **NXDOMAIN**.
  NXDOMAIN at the NS level means the name is not delegated, so it is not
  registered or not yet live.
- **Chain** — **stated**, on the client's own statement of **2026-09-02**. That
  statement was made about the project batch, not about this site individually,
  and the record says so in those words rather than being written up as though
  the chain had been named for us specifically. The distinction is not
  pedantry: a batch-level statement is an inference from a set to a member, and
  it holds only while this project really belongs to that set. If the batch ever
  turns out to have an exception, the record shows what it rested on instead of
  presenting a bare value nobody can trace.

  The basis is the client statement and nothing else. The site whose structure
  was discussed during design happens to run on the same network; that is not
  evidence and was not used. It was actively denied as a source while this
  record was absent, precisely so the value could not be picked up from there,
  and the value arrived from the client instead.

  Endpoint verified live on 2026-09-05: `eth_chainId` → `0x1237`, `net_version`
  → `4663`, block `0x349ad0c`. The expected chain id is recorded on the probe
  and checked before any address is read.
- **Contract** — still not supplied, and still absent. The format is known —
  `0x` form, EVM, not a pump.fun-style address — but a known format is not a
  value, and nothing is rendered for it. No address, no copy control, and no
  wording implying a token exists. The gate keeps both branches live.

## Discord

Raised by the client only to rule it out. It is a record rather than a gap: a
channel that was discussed and has no confirmed address is a known absence, and
the register's contract is that a raised channel is listed in the absent state
rather than silently dropped. Nothing links there.

## Structure

A docket, not a landing page.

The site given as the structural reference turned out not to be a marketing page
at all. It is a working transfer console — connect a wallet, pick a
denomination, deposit, watch a pool, withdraw through a relayer. Its information
architecture *is* its functionality; there are no sections to restructure.
Rebuilding that shell here would have asserted a working pool, a deployed
contract and a named network, none of which exist. That was raised with the
client before anything was written, and the docket was chosen instead.

So the page is a numbered list of open questions: index, label, sentence, state.
No hero, no summary tile, no status ornament, and no element that would need a
figure nobody has given us. Entries are ruled rather than boxed, because a
docket is a continuous list and cards would imply each entry stands alone.

The contract record is lifted out of the list and set first in its own panel,
because it is the entry that will matter on launch night. It has its own group
id so that lifting it out cannot render it twice, and a gate checks every record
appears exactly once.

## Palette

Artwork arrived on **2026-09-05 at 22:44**, after the first palette was set and
without being mentioned. The ramp was re-cut from it. An earlier revision used
formula-derived neutrals at chroma 0, correctly, because at that point there was
nothing to sample; that is no longer the situation and the files no longer say
it is.

**Every colour is now traceable to a pixel in a supplied file.**
`src/config/palette.js` holds the sampled sources and `tokens.css` is generated
from them. Sampling method: **per-element dominant colour, cross-checked against
the per-channel median.** Not k-means — the artwork is a two-element lockup, a
mark and its ground, not a distribution to cluster, and clustering would have
invented intermediate colours no pixel holds.

Two files, two roles, and both are needed:

- `LOGO TXHASH PNG...png` — colourtype 6, real alpha. The master. **Its alpha
  ceiling is 254, not 255.** Only 84 of its 4,000,000 pixels are fully opaque,
  and they are a fringe artefact measuring `#f6f5ef` that disagrees with the
  body of the mark. Sampling at `alpha == 255` would have taken the whole ramp
  from 84 stray pixels. The body is the **340,578 px at alpha >= 254**, where
  the dominant colour and the per-channel median agree exactly: `#eae9e3`.
- `LOGO TXHASH PNG.png` — colourtype 2, no alpha, flattened onto its ground.
  Useless for compositing and never shipped, but it is the **only** file in
  which the ground exists as colour at all; in the master that area is
  transparency. **86.24%** of it (3,450,196 px) is one solid value, `#0c2b1c`.

The two cross-validate: the mark reads `#eae9e3` in the master and `#e9e8e2` in
the flattened copy, one 8-bit step apart. Neither file alone gives both halves.

**The ground is dark because the mark is white-only.** A white mark needs a dark
ground to be legible as supplied, and recolouring a client's artwork is not ours
to do. The page follows the artwork rather than the artwork following the page.

Hue and chroma are inherited from the source; where a floor could not be met,
**lightness only** was moved. Five tokens are re-lit, two are exactly as
sampled. The gate re-derives hue and chroma from the emitted hex and fails on
drift, so a token can be re-lit but never re-tinted.

Drift is measured as displacement in the **OKLab a-b plane, not in degrees of
hue**. Hue is an angle about the neutral axis, so near neutral it stops meaning
anything: the two ink tokens sit at chroma 0.008, where one 8-bit step swings
the angle by nearly 8 degrees while moving the colour imperceptibly. Gating on
degrees would either fail the build over quantisation noise or need a tolerance
so loose it would pass a real re-tint at high chroma. The chord between the two
`(a, b)` points behaves correctly in both regimes. Observed maximum drift is
0.00124 against a tolerance of 0.002.

Contrast is measured from the **emitted hex**, not the ideal coordinate. On the
previous light ramp that distinction put `ink-1` at 13.99:1 against its own 14:1
floor while the shipped colour cleared it; the 8-bit quantisation moves the
ratio, and a floor checked against a number the browser never paints is not a
floor.

State is carried by a word and by the element being a `span` rather than an `a`.
Never by colour: the two hues here are the client's mark and its ground, and
neither is spent on signalling.

### The artwork is not committed

All three supplied files carry `eXIf`, `iTXt` or XMP, which fingerprints the
client's editor and account. They are listed in `.git/info/exclude` and stay on
disk: samplable, never in history. The colours derived from them live in
`src/config/palette.js`, which records which file and which pixels each came
from, so the provenance survives even though the sources do not.

Nothing in `brand/` is shipped or referenced by the page. If a mark is ever
placed on the page, images must be derived and stripped to `IHDR`/`IDAT`/`IEND`,
and a shipped-image-metadata gate added — there is no such gate today because
no image ships today.

## Gates

`npm run verify` — twelve gates, each exits 1 on failure.

| gate | fails when |
| --- | --- |
| register integrity | a value without a source, a value held while not stated, a missing sentence branch, an undeclared group, or `contract` not first |
| render coverage and tally | a record renders zero or twice, something renders with no record, a chip carries no date, a stated record hides its value or the basis it rests on, or a count on the page is not the register's own length |
| contract safety | while null: a copy affordance or an address-shaped string. Once stated: an endpoint that reports the wrong chain or no expected chain id to pin it, an address the document does not show, an address the register does not hold, no way to verify, or no code behind it |
| link discipline | an href points anywhere but an in-page fragment or a stated record's value |
| channel slots | a slot links while not stated, sits inert while stated and linked, loses keyboard reach, shows wording other than the register's own, or ships a brand mark |
| built document is newer than its sources | the document being graded is older than the source that produced it |
| emitted html comment count is 0 | any comment survives into the shipped document |
| no client javascript | a script tag, an inline handler, or a `javascript:` url ships |
| denied terms absent | a denied term appears in file contents, in a repo-relative path, or in commit messages and identities across all refs |
| local git identity | `user.name` or `user.email` is not set locally, or git resolves either to something other than the local value |
| palette provenance | tokens.css drifts from its sources, a token cites a source never sampled, a token drifts in hue or chroma from the source it cites, a token claims to be unmodified while emitting something else, a stray colour is typed into the sampled record, a source file names a colour at all, or the built document shows a hex no source produced |
| contrast on both grounds | a token misses its floor against either painted ground |

### The contract gate, and why it is written this way

It is **not** "no address-shaped string may appear". That form is only correct
while the field is empty. The day a real address arrives it has to be defused
with a hardcoded exemption for that one string, and from then on the gate passes
by exception rather than by rule — nobody reading it can tell whether it still
checks anything. This one collects every address the document shows and compares
the set against the register, so no exemption is ever needed, because the
register *is* the comparison.

Both branches were proven before being trusted. With a real address supplied and
an endpoint to ask, the gate **passes** and reports the code size; with an
address the document does not show, an address with no code behind it, or an
address-shaped string while the field is null, it fails. A gate that has never
failed is a gate that was never tested.

The endpoint is pinned to a chain id before any address is read. `eth_getCode`
answering is not evidence that it answered about the right network: a wrong,
moved or redirected endpoint would return real bytecode for some other chain's
address, and the address check would pass on it.

### The chain term, and a gate that was rejecting a fact

While the chain record was absent, `scripts/deny.js` denied the network's name
along with the reference site's, so the value could not be picked up from there.
When the client named the chain, that denial started rejecting a legitimate
value — the same defect as an absolute address-reject gate, arriving from a
different direction: a rule written while a field was empty, still being applied
after the field became real.

The two digests were **removed**, not exempted. An exemption would have left the
list passing by exception, and a reader could no longer tell whether it still
checked anything. The reference site's own name stays denied, because the reason
for that one has not changed.

### Build freshness

Added after the proof harness caught it doing the wrong thing: a build crashed,
the previous document was still on disk, and a gate cheerfully reported a pass
for markup the current source could not produce. The npm scripts chain with
`&&`, so a crashed build stops the chain — but a suite that is only correct when
invoked the right way has a way to be wrong, so it checks for itself.

### Denied terms

`scripts/deny.js` holds salted digests, not words. Source text is normalised,
cut into word n-grams, hashed and looked up, so matches are whole-token by
construction and a failure prints a digest rather than the term. Terms are added
with a generator kept outside this repository, so no plaintext term is ever
committed here, and the file passes its own scan without needing an exemption —
an exemption is the hole.

Paths are tested **relative to the repository root**. What sits above the root is
somebody's local disk layout; it is not shipped, and failing a build over it
would be a gate reporting on a machine rather than on a repository.

**History is scanned too.** Commit messages and the author and committer
identities on every ref go through the same matcher. A trailer in a commit
message is in the repository permanently but is in no file, so a file-only scan
would have reported clean while the thing being guarded against sat in the log.
Proven with a commit carrying a trailer and every working file clean.

**The co-author trailer.** This list previously held the vendor names and one
long phrase ending in a vendor name, which meant the trailer *construct* was
never checked: a trailer naming anybody else passed. Both forms are now held,
the 2-part and the 3-part, and both are proven separately. Because matching runs
over a token sequence rather than a substring, the 2-part term also fires inside
the 3-part form, and collapsing runs of separators makes every punctuation
spelling reduce to the same tokens; the separator-less spellings collapse to a
single token instead and are held on their own. This is deliberately strict
enough to deny *any* co-author trailer, not only a machine's — nothing in a
source file has a legitimate reason to carry one.

Writing that explanation is what made this file fail its own scan: an earlier
draft spelled three separator variants out as examples, and the gate caught it,
correctly, since a list of forbidden spellings is the forbidden thing. The
comment was rewritten rather than exempted.

## Git

Local only. Nothing has been pushed and there is no remote.

Initialised on `main`. The identity is set **locally and after entering the
repository**, because `git config` run outside a working tree writes to the
global file without complaining, and the commits then carry whatever personal
identity the machine has:

```
local user.name      : txhash-wip
local user.email     : noreply@localhost
effective user.name  : txhash-wip
effective user.email : noreply@localhost
git config --show-origin user.name  -> file:.git/config
```

The effective values are read back rather than assumed, and a gate now checks
that what git will actually use is the local value. This machine does carry a
real personal global identity, which is exactly the thing that must not end up
on these commits.

**Identity and authorship are provisional.** They get corrected from the
client's own initial commit once a remote exists; `txhash-wip` is a placeholder
and is not intended to survive into the published history.

`.gitattributes` sets `* text=auto eol=lf` with per-type text and binary
markers. The working tree was already LF throughout, so it changed nothing here,
but it fixes the endings for anyone cloning on another platform. Gates and the
full proof suite were re-run after writing it rather than carried forward.

`.git/info/exclude` holds the project-specific excludes and is treated as a
shredder rather than a drawer: entries are paths that must never enter history
at all, not things set aside to deal with later. It never leaves this machine,
so nothing in it is communicated to anyone who clones the repository.

The honest limit: a digest list is not a secret. It resists casual reading, and
the salt defeats a precomputed table. It does not resist someone who already
holds a candidate list and wants to confirm a guess. What it buys is that the
file cannot be *read* as a list.

## Open with the client

- **A confirmed X account.** Register the handle you want, then send it. The
  record takes a URL and derives the displayed handle from it, so wiring it is
  one edit.
- **The domain.** `txhash.xyz` needs to resolve before it is published.
- **Confirmation that the artwork was meant for us.** It appeared in the project
  folder unannounced on 2026-09-05 and the palette was re-cut from it on that
  basis. If it was a stray drop, the palette is the thing to revisit.
- **A wordmark**, if one exists. "TxHash" is currently set in the system stack;
  the supplied files are a symbol lockup, not type.
- **A contract address**, if and when one exists. Setting `value` and `source`
  on that record is the whole edit; the chain and endpoint are already in place,
  and the gate will check the endpoint's chain id and then require real bytecode
  behind the address before it will ship.
- **Confirmation that this project is in the 2026-09-02 batch.** The chain rests
  on that statement rather than on anything said about this site. If it is ever
  an exception, this is the record to revisit first.
