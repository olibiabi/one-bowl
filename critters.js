// Little animals around the bowl, drawn in code so every part can be swapped.
// Style: flat crayon-filled shapes, dot or ^^ eyes, bold colours (see the picture-book references).

const SPECIES = ['BUNNY', 'KITTY', 'PUPPY', 'BEAR'];
// c = fur, a = the hood / spots colour: white and black swap with each other, every other fur gets a deeper tone of itself
const FURS = [
  { name: 'SNOW',  c: '#f6f1e7', a: '#2f2b36' },   // white with black
  { name: 'INK',   c: '#3a3542', a: '#f6f1e7' },   // black with white
  { name: 'PEACH', c: '#f2b39b', a: '#d9775c' },   // terracotta
  { name: 'HONEY', c: '#e8b04a', a: '#b9763a' },   // toffee
  { name: 'COCOA', c: '#8b5a3c', a: '#5e3a28' },   // dark chocolate
  { name: 'BLUSH', c: '#f4a6bb', a: '#d9708f' },   // raspberry
  { name: 'SKY',   c: '#93b8ea', a: '#5f86c9' },   // deep blue
  { name: 'MOSS',  c: '#9cc37a', a: '#6c9a4c' },   // leaf green
];
const PATTERNS = ['PLAIN', 'HOOD', 'SPOTS'];
const EYES = ['HAPPY', 'DOTS', 'SLEEPY', 'BIG'];
// eye colours: d is used on light fur, l (a lighter version of the same colour) on dark fur
const EYE_COLORS = [
  { name: 'BLACK',  d: '#25222b', l: '#f6f1e7' },
  { name: 'BROWN',  d: '#5a3422', l: '#e8c49a' },
  { name: 'BLUE',   d: '#2a4aa8', l: '#a8c8ff' },
  { name: 'GREEN',  d: '#2e6b3a', l: '#aee6a6' },
  { name: 'PURPLE', d: '#5b3290', l: '#d6bcff' },
  { name: 'RED',    d: '#a8283c', l: '#ffa8b4' },
];
const CHEEKS = ['PINK', 'NONE', 'FRECKLES'];
const PARTS = [
  { label: 'ANIMAL', key: 'species', list: SPECIES },
  { label: 'FUR', key: 'fur', list: FURS.map(f => f.name) },
  { label: 'PATTERN', key: 'pattern', list: PATTERNS },
  { label: 'EYES', key: 'eyes', list: EYES },
  { label: 'EYE COLOR', key: 'eyeColor', list: EYE_COLORS.map(e => e.name) },
  { label: 'CHEEKS', key: 'cheeks', list: CHEEKS },
];
const INK = '#25222b', CREAM = '#f6f1e7', EAR_PINK = '#f4a7b9', BLUSH = '#f28aa0';

// only really dark colours (like INK) count as dark; mid browns still get dark eyes and a dark patch
const isDark = hex => { const c = color(hex); return red(c) * 0.3 + green(c) * 0.59 + blue(c) * 0.11 < 75; };
const furCol = cfg => FURS[cfg.fur].c;
const patchCol = cfg => FURS[cfg.fur].a;

function randomCritter() {
  return { species: floor(random(SPECIES.length)), fur: floor(random(FURS.length)), pattern: floor(random(PATTERNS.length)),
           eyes: floor(random(EYES.length)), eyeColor: floor(random(EYE_COLORS.length)), cheeks: floor(random(CHEEKS.length)) };
}

// ---- crayon fill: flat colour, then lots of short strokes of nearby shades, clipped to the shape ----
function shade(hex, amt) {
  const c = color(hex);
  return color(constrain(red(c) + amt, 0, 255), constrain(green(c) + amt, 0, 255), constrain(blue(c) + amt, 0, 255));
}
function crayon(g, col, shapeFn, box, density = 1) {
  g.push();
  g.noStroke(); g.fill(col); shapeFn(g);
  g.beginClip(); shapeFn(g); g.endClip();
  const n = Math.floor(box.w * box.h / 28 * density);
  g.strokeWeight(1.4);
  for (let i = 0; i < n; i++) {
    const x = box.x + Math.random() * box.w, y = box.y + Math.random() * box.h, a = -0.9 + Math.random() * 0.5, l = 3 + Math.random() * 6;
    const s = shade(col, Math.random() < 0.5 ? -18 - Math.random() * 14 : 10 + Math.random() * 14);
    s.setAlpha(120); g.stroke(s);
    g.line(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l);
  }
  g.pop();
}


// ---- the body and head are baked once per look; faces are drawn live on top ----
// Proportions follow the picture-book references: a wide soft head melting into a round body.
const CW = 180, CH = 210, HEAD = { x: 90, y: 118, w: 124, h: 100 };
const MOUTH_Y = 24;                     // mouth, below the head centre
const _bake = new Map();
function critterBody(cfg) {
  const key = JSON.stringify(cfg);
  if (_bake.has(key)) return _bake.get(key);
  const g = createGraphics(CW, CH);
  const fur = furCol(cfg), patch = patchCol(cfg), sp = SPECIES[cfg.species], pat = PATTERNS[cfg.pattern];
  const earCol = pat === 'HOOD' ? patch : fur;
  const ell = (x, y, w, h, r = 0) => gg => { gg.push(); gg.translate(x, y); gg.rotate(r); gg.ellipse(0, 0, w, h); gg.pop(); };
  const box = (x, y, w, h) => ({ x: x - w / 2 - 4, y: y - h / 2 - 4, w: w + 8, h: h + 8 });
  const X = HEAD.x;

  // body (the lower part hides behind the table)
  crayon(g, fur, ell(X, 212, 164, 136), box(X, 212, 164, 136));
  // ears behind the head
  const ears = {
    BUNNY: () => { for (const s of [-1, 1]) {
      // tops stay inside the drawing (y >= 6) so the rounded tips aren't cut off
      crayon(g, earCol, ell(X + s * 24, 52, 34, 88, s * 0.08), box(X + s * 24, 52, 40, 92));
      crayon(g, EAR_PINK, ell(X + s * 24, 58, 14, 58, s * 0.08), box(X + s * 24, 58, 18, 60), 0.6); } },
    // soft, curved cat ears whose base follows the top of the head, so they grow out of it
    KITTY: () => { for (const s of [-1, 1]) {
      const ear = (inX, inY, tipX, tipY, outX, outY, bulge) => gg => {
        gg.beginShape(); gg.vertex(X + s * inX, inY);
        gg.quadraticVertex(X + s * (inX + 8), tipY + 14, X + s * tipX, tipY);
        gg.quadraticVertex(X + s * (outX + bulge), tipY + 22, X + s * outX, outY);
        gg.quadraticVertex(X + s * (inX + outX) / 2, (inY + outY) / 2 + 14, X + s * inX, inY);
        gg.endShape(CLOSE);
      };
      crayon(g, earCol, ear(4, 86, 46, 26, 60, 108, 8), box(X + s * 32, 66, 66, 88));
      crayon(g, EAR_PINK, ear(18, 84, 44, 42, 50, 94, 4), box(X + s * 34, 68, 40, 56), 0.6); } },
    BEAR: () => { for (const s of [-1, 1]) {
      crayon(g, earCol, ell(X + s * 46, 78, 42, 40), box(X + s * 46, 78, 42, 40));
      crayon(g, EAR_PINK, ell(X + s * 46, 80, 20, 18), box(X + s * 46, 80, 20, 18), 0.6); } },
  };
  if (ears[sp]) ears[sp]();
  // head
  const head = ell(HEAD.x, HEAD.y, HEAD.w, HEAD.h);
  crayon(g, fur, head, box(HEAD.x, HEAD.y, HEAD.w, HEAD.h));
  // patterns, clipped to the head
  const clipHead = fn => { g.push(); g.beginClip(); head(g); g.endClip(); fn(); g.pop(); };
  if (pat === 'HOOD') clipHead(() => crayon(g, patch, gg => gg.rect(0, 0, CW, HEAD.y - 6), { x: 20, y: 60, w: 140, h: 56 }));
  if (pat === 'SPOTS') clipHead(() => { for (const [dx, dy, r] of [[30, -26, 22], [-34, -24, 15], [44, 14, 12], [2, -42, 11]]) crayon(g, patch, ell(HEAD.x + dx, HEAD.y + dy, r, r), box(HEAD.x + dx, HEAD.y + dy, r, r)); });
  // floppy puppy ears hang over the sides of the head
  if (sp === 'PUPPY') {
    const pc = patch;   // floppy ears always wear the accent colour
    for (const s of [-1, 1]) crayon(g, pc, ell(X + s * 60, 116, 36, 80, -s * 0.25), box(X + s * 60, 116, 46, 84));
  }
  _bake.set(key, g);
  return g;
}

// mood: '' | 'spicy' | 'sour' | 'sweet' | 'gag' | 'happy'
// live: { mouth 0..1, eyesClosed 0..1 } — the player's real face, or a bot's fake one
function drawCritter(cfg, x, y, s, live = {}, mood = '', t = 0) {
  push();
  translate(x, y); scale(s);
  if (mood === 'sour') translate(Math.sin(t * 60) * 1.5, 0);           // shiver
  imageMode(CENTER);
  image(critterBody(cfg), 0, 0);
  translate(HEAD.x - CW / 2, HEAD.y - CH / 2);                          // now (0,0) = head centre
  const fur = furCol(cfg);
  const faceDark = isDark(fur);                                        // the eyes sit below the hood, on the fur
  const ink = faceDark ? CREAM : INK;

  // mood tints wash over the lower face, inside the head
  const tint = { spicy: [235, 45, 45, 110], gag: [95, 185, 75, 120], sweet: [150, 95, 205, 105] }[mood];
  if (tint) {
    push(); beginClip(); ellipse(0, 0, HEAD.w, HEAD.h); endClip();
    noStroke(); fill(...tint); ellipse(0, 22, HEAD.w + 10, 70);
    pop();
  }

  // cheeks
  noStroke();
  const ck = CHEEKS[cfg.cheeks];
  if (ck === 'PINK' || mood === 'spicy') { fill(mood === 'spicy' ? '#e8323c' : BLUSH); ellipse(-36, 17, 20, 11); ellipse(36, 17, 20, 11); }
  if (ck === 'FRECKLES') { fill(faceDark ? '#cfa98a' : '#b9734f'); for (const sx of [-1, 1]) for (const [a, b] of [[34, 13], [40, 18], [30, 19]]) ellipse(sx * a, b, 3.5, 3.5); }
  if (mood === 'gag') { fill(150, 210, 110); ellipse(-30, 20, 24, 20); ellipse(30, 20, 24, 20); }   // puffed cheeks

  // eyes
  // eyes take a colour that shows up on the fur
  const closed = (live.eyesClosed || 0) > 0.55;
  const ey = 4, ex = 19;
  const style = EYES[cfg.eyes];
  for (const sx of [-1, 1]) {
    const under = fur, ec = EYE_COLORS[cfg.eyeColor || 0];
    const eyeInk = isDark(under) ? ec.l : ec.d, cx = sx * ex;
    stroke(eyeInk); strokeWeight(3.6); strokeCap(ROUND); noFill();
    if (mood === 'sour' || mood === 'gag') { line(cx + sx * 5, ey - 6, cx - sx * 4, ey); line(cx + sx * 5, ey + 6, cx - sx * 4, ey); }   // > <
    else if (mood === 'sweet') { arc(cx, ey, 13, 13, 0, PI * 1.5); arc(cx + 1, ey, 6, 6, PI, PI * 2.6); }                          // dizzy swirls
    else if (closed || style === 'SLEEPY') line(cx - 6, ey + 1, cx + 6, ey + 1);
    else if (mood === 'happy' || style === 'HAPPY') arc(cx, ey + 4, 15, 13, PI, TWO_PI);
    else if (style === 'DOTS') { noStroke(); fill(eyeInk); ellipse(cx, ey, 8, 10); }
    else {
      // big eyes: a coloured pupil with a white shine; on dark fur it sits inside a light rim so it still reads
      noStroke();
      if (isDark(under)) { fill(CREAM); ellipse(cx, ey, 18, 20); fill(ec.d); ellipse(cx, ey, 12, 14); }
      else { fill(eyeInk); ellipse(cx, ey, 14, 16); }
      fill('#ffffff'); ellipse(cx + 3, ey - 3, 5, 5);
    }
  }

  // nose: tiny, like the references
  noStroke();
  const sp = SPECIES[cfg.species];
  fill(sp === 'PUPPY' || sp === 'BEAR' ? (faceDark ? CREAM : INK) : '#e8788f');
  ellipse(0, 15, sp === 'PUPPY' ? 10 : 7, sp === 'PUPPY' ? 7 : 5);

  // mouth: follows how open the real (or fake) mouth is
  const open = constrain(live.mouth || 0, 0, 1);
  if (open > 0.12) {
    fill('#b8322a'); ellipse(0, MOUTH_Y, 12 + open * 10, 5 + open * 18);
    fill('#f08a8a'); ellipse(0, MOUTH_Y + 2 + open * 5, 8 + open * 5, 2 + open * 6);
  } else if (mood === 'sour' || mood === 'sweet') {
    noFill(); stroke(ink); strokeWeight(2.6); beginShape(); for (let i = -8; i <= 8; i += 2) vertex(i, MOUTH_Y - 2 + Math.sin(i + t * 30) * 1.5); endShape();
  } else {
    noFill(); stroke(ink); strokeWeight(2.6);
    arc(-4, 19, 8, 7, 0, PI); arc(4, 19, 8, 7, 0, PI);   // little "w"
  }

  // sweat and steam for spicy, sparkles for happy
  noStroke();
  if (mood === 'spicy') {
    fill('#7fc8ff');
    for (const [dx, ph] of [[-46, 0], [48, 0.5], [-36, 0.25]]) { const k = (t * 1.6 + ph) % 1; const yy = -24 + k * 28; ellipse(dx, yy, 7, 10); triangle(dx - 3.5, yy - 2, dx + 3.5, yy - 2, dx, yy - 10); }
    stroke('#ffffff'); strokeWeight(2.4); noFill();
    for (const sx of [-1, 1]) { const k = (t * 2) % 1; arc(sx * 56, -46 - k * 12, 12, 12, PI, TWO_PI); }
  }
  if (mood === 'happy') {
    fill('#ffd34a');
    for (const [dx, dy, ph] of [[-62, -34, 0], [60, -44, 0.4], [54, 6, 0.7]]) { const k = 0.6 + 0.4 * Math.sin(t * 10 + ph * 6); push(); translate(dx, dy); scale(k); beginShape(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 3 : 9, a = i * PI / 4; vertex(Math.cos(a) * r, Math.sin(a) * r); } endShape(CLOSE); pop(); }
  }
  pop();
}

// two little paws resting on the bowl's rim (drawn after the bowl so they sit on top of it)
function drawPaws(cfg, x, y, s) {
  const fur = furCol(cfg);
  push(); translate(x, y); scale(s);
  for (const sx of [-1, 1]) {
    noStroke(); fill(0, 0, 0, 40); ellipse(sx * 38, 6, 34, 16);
    fill(fur); ellipse(sx * 38, 0, 34, 24);
    stroke(isDark(fur) ? '#5a5566' : '#c9bfae'); strokeWeight(2); strokeCap(ROUND);
    for (const d of [-6, 0, 6]) line(sx * 38 + d, -2, sx * 38 + d, 6);
  }
  pop();
}
