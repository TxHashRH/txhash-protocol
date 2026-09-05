/**
 * Palette sources and the derivation that turns them into colour.
 *
 * PROVENANCE. Every colour here is traceable to a pixel in a file the client
 * supplied. Nothing is invented and nothing is formula-derived any more: an
 * earlier revision of this file used stated OKLCH coordinates at chroma 0,
 * because at that point no artwork existed to sample. Artwork arrived on
 * 2026-09-05 and the ramp was re-cut from it.
 *
 * SAMPLING METHOD: per-element dominant colour, cross-checked against the
 * per-channel median, over the two supplied PNGs. No k-means: the artwork is a
 * two-element lockup, a mark and its ground, not a photograph with a
 * distribution to cluster. Clustering would have invented intermediate colours
 * that no pixel actually holds.
 *
 * The mark is white-only, so the ground has to be dark for it to be legible as
 * supplied. Recolouring a client's artwork is not ours to do, so the page
 * follows the artwork rather than the artwork following the page.
 *
 * TWO FILES, TWO ROLES, AND WHY BOTH ARE NEEDED:
 *
 *   `LOGO TXHASH PNG...png`  colourtype 6, real alpha. The master. Its ALPHA
 *   CEILING IS 254, not 255: only 84 of its 4,000,000 pixels are fully opaque,
 *   and those are a fringe artefact whose colour disagrees with the body of the
 *   mark. Sampling at alpha == 255 would have taken the ramp from 84 stray
 *   pixels. The real body is the 340,578 pixels at alpha >= 254, where the
 *   dominant colour and the per-channel median agree exactly. The measured
 *   values are on the source below rather than repeated here, because the gate
 *   checks colours against the provenance record and prose is not that record.
 *
 *   `LOGO TXHASH PNG.png`  colourtype 2, no alpha, flattened onto its ground.
 *   Useless for compositing and never shipped, but it is the ONLY file that
 *   carries the ground colour, since in the master that ground is transparency.
 *   86.24% of it is one solid value.
 *
 * The two files cross-validate: the mark reads #eae9e3 in the master's opaque
 * body and #e9e8e2 in the flattened copy, one 8-bit step apart. Neither file
 * alone would have given both halves of the lockup.
 *
 * Where a sampled colour could not carry a contrast floor, LIGHTNESS ONLY was
 * moved. Hue and chroma are held from the source and both are recorded on the
 * token, and the palette gate re-derives hue and chroma from the emitted hex
 * and fails the build on drift. So a token can be re-lit but never re-tinted.
 *
 * `src/styles/tokens.css` is generated from this table and is the only file in
 * the project permitted to name a colour.
 */

/** sRGB gamma encode and decode, per IEC 61966-2-1. */
const encode = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const decode = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/** OKLCH to sRGB. Returns the emitted bytes and whether the colour was in gamut. */
export function oklchToRgb(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const inGamut = lin.every((v) => v >= -1e-6 && v <= 1 + 1e-6);
  const rgb = lin.map((v) => Math.max(0, Math.min(255, Math.round(encode(Math.max(0, Math.min(1, v))) * 255))));
  return { rgb, inGamut };
}

/** sRGB bytes back to OKLCH, so a token can be checked against its own source. */
export function rgbToOklch(R, G, B) {
  const r = decode(R / 255);
  const g = decode(G / 255);
  const b = decode(B / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  let H = (Math.atan2(Bb, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C: Math.hypot(A, Bb), H };
}

export const hexOf = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
export const luminance = ([r, g, b]) => 0.2126 * decode(r / 255) + 0.7152 * decode(g / 255) + 0.0722 * decode(b / 255);

export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The sampled sources. A token may only cite one of these, and the palette gate
 * fails if it cites anything else.
 */
export const SOURCES = {
  ground: {
    hex: '#0c2b1c',
    L: 0.2608,
    C: 0.0466,
    H: 159.5,
    from: 'brand/LOGO TXHASH PNG.png',
    method:
      'dominant colour of the flattened master: 3,450,196 of 4,000,000 px (86.24%) hold this exact value. Taken from the flattened file because the master carries this area as transparency, so it is the only file in which the ground exists as colour at all.',
  },
  ink: {
    hex: '#eae9e3',
    L: 0.9331,
    C: 0.0081,
    H: 98.9,
    from: 'brand/LOGO TXHASH PNG...png',
    method:
      'dominant colour of the mark body, and identical to its per-channel median, over the 340,578 px at alpha >= 254. The alpha ceiling in this file is 254; the 84 px at alpha 255 are a fringe artefact measuring #f6f5ef, which disagrees with the body, and were excluded rather than trusted. Cross-checks against #e9e8e2 in the flattened copy, one 8-bit step away.',
  },
};

/** The two painted grounds. Every text token is solved against both. */
export const GROUNDS = ['ground', 'raised'];

/**
 * The ramp.
 *
 * `source` names the sampled colour whose hue and chroma this token inherits.
 * `L` is the lightness actually used; where it differs from the source's own,
 * `relit` records that lightness was moved and nothing else. `target` is the
 * contrast floor the token was solved against, measured on the tighter ground.
 */
export const TOKENS = [
  {
    name: 'ground',
    source: 'ground',
    L: 0.2608,
    relit: false,
    target: null,
    role: 'page ground, exactly as sampled',
  },
  {
    name: 'raised',
    source: 'ground',
    L: 0.32,
    relit: true,
    target: null,
    role: 'raised panel ground; the tighter of the two grounds for every text token',
  },
  {
    name: 'rule',
    source: 'ground',
    L: 0.42,
    relit: true,
    target: null,
    role:
      'hairline separator between docket entries. Decorative and carries no meaning on its own, so no contrast floor applies; the entries it separates are also numbered and spaced.',
  },
  {
    name: 'chip-edge',
    source: 'ground',
    L: 0.5812,
    relit: true,
    target: 3,
    role: 'boundary of a state chip. Carries meaning, so it meets the 3:1 non-text floor.',
  },
  {
    name: 'ink-3',
    source: 'ink',
    L: 0.6903,
    relit: true,
    target: 4.5,
    role: 'the absence sentence, the basis line, and every other supporting line',
  },
  {
    name: 'ink-2',
    source: 'ink',
    L: 0.8552,
    relit: true,
    target: 8,
    role: 'labels, the tally, entry indices',
  },
  {
    name: 'ink-1',
    source: 'ink',
    L: 0.9331,
    relit: false,
    target: 10,
    role: 'headings, entry labels, the focus ring. The mark colour, exactly as sampled.',
  },
];

const rgbOf = (t) => oklchToRgb(t.L, SOURCES[t.source].C, SOURCES[t.source].H).rgb;

export const groundRgb = Object.fromEntries(
  GROUNDS.map((g) => [g, rgbOf(TOKENS.find((t) => t.name === g))])
);

/**
 * The full derivation. One row per token, carrying its coordinate, its emitted
 * hex, its measured ratio on both grounds, and how far the emitted colour drifts
 * in hue and chroma from the source it claims.
 */
export function derive() {
  return TOKENS.map((t) => {
    const src = SOURCES[t.source];
    const { rgb, inGamut } = oklchToRgb(t.L, src.C, src.H);
    const back = rgbToOklch(...rgb);
    let dH = Math.abs(back.H - src.H) % 360;
    if (dH > 180) dH = 360 - dH;

    /* Drift is gated on displacement in the OKLab a-b plane, not on degrees of
       hue.

       Hue is an angle about the neutral axis, so as chroma approaches zero it
       stops meaning anything: one 8-bit step on a near-neutral swings it by
       degrees while moving the colour imperceptibly. Two of these tokens sit at
       chroma 0.008, and gating them on degrees would either fail the build over
       quantisation noise or need a tolerance so wide it would let a genuine
       re-tint through at high chroma. The chord between the two (a, b) points is
       the same measurement in both regimes: it is small when the colour has
       barely moved, whatever the angle did. */
    const ab = (C, H) => [C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)];
    const [sa, sb] = ab(src.C, src.H);
    const [ma, mb] = ab(back.C, back.H);

    return {
      ...t,
      rgb,
      inGamut,
      hex: hexOf(rgb),
      measured: back,
      driftH: dH,
      driftC: Math.abs(back.C - src.C),
      driftAB: Math.hypot(ma - sa, mb - sb),
      ratios: Object.fromEntries(GROUNDS.map((g) => [g, contrast(rgb, groundRgb[g])])),
    };
  });
}
