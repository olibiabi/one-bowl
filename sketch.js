// ONE BOWL — everyone eats from the same bowl of noodles.
// Chew (open + close your mouth) to eat. Shake your head to fling off toppings you hate.
// Pour chili / vinegar / sugar into the shared soup; hold SPACE to fill a cup of water and pour it to dilute.
// Most noodles in 30 seconds wins.

const W = 960, H = 640;
const ROUND_TIME = 30, CARD_TIME = 2.0, CUP_TIME = 1.2, COOLDOWN = 4;
const SEATS = [240, 400, 560, 720], SEAT_Y = 232, CRITTER_S = 0.9;
const BOWL = { x: 480, y: 404, w: 610, h: 172 };
const FLAVORS = ['spicy', 'sour', 'sweet'];
const FLAVOR_INFO = {
  spicy: { name: 'CHILI', key: '1', col: '#e2452f' },
  sour:  { name: 'VINEGAR', key: '2', col: '#a8662c' },
  sweet: { name: 'SUGAR', key: '3', col: '#f29bbb' },
};
const TOPPINGS = ['cilantro', 'scallion', 'garlic', 'mushroom', 'shrimp', 'egg', 'beef'];
const CARDS = [...TOPPINGS, ...FLAVORS];
const CARD_WORD = { cilantro: 'CILANTRO', scallion: 'SCALLION', garlic: 'GARLIC', mushroom: 'MUSHROOM', shrimp: 'SHRIMP',
                    egg: 'EGG', beef: 'BEEF', spicy: 'SPICY', sour: 'SOUR', sweet: 'SWEET' };
const BOT_NAMES = ['MOMO', 'TOFU', 'BEANS', 'PICKLE', 'NOODLE', 'BAO'];

let S = 1, mode = 'custom', modeT = 0, roundT = 0, sel = 0;
let me, players = [], broth = { spicy: 0, sour: 0, sweet: 0 };
let flying = [], drops = [], toasts = [], cards = [], cardI = 0, cardT = 0;
let myCfg, wallG, tableG, bowlG, nestG, grainG, decor = [];
let spaceLock = false, buttons = [];

// ---------- setup ----------
function setup() {
  const c = createCanvas(10, 10); c.parent('stage');
  fit();
  try { myCfg = JSON.parse(localStorage.getItem('oneBowlCritter')); } catch (e) {}
  if (!myCfg || myCfg.species === undefined) myCfg = { species: 0, fur: 0, pattern: 1, eyes: 0, cheeks: 0 };
  if (myCfg.species >= SPECIES.length) myCfg.species = 0;   // the mouse was retired
  if (myCfg.pattern >= PATTERNS.length) myCfg.pattern = 0;  // so was the eye patch
  if (myCfg.eyeColor === undefined) myCfg.eyeColor = 0;
  bakeScene();
  Face.onBite = () => { if (mode === 'eat') bite(me); };
  Face.onShake = () => { if (mode === 'eat') shake(me); };
  Face.onTilt = d => { if (mode === 'cards') answerCard(d < 0 ? false : true); };
  textFont('Gaegu');
}
function fit() {
  S = Math.min((windowWidth - 24) / W, (windowHeight - 70) / H);
  resizeCanvas(Math.floor(W * S), Math.floor(H * S));
}
function windowResized() { fit(); }
function setMode(m) { mode = m; modeT = 0; }

function bakeScene() {
  wallG = createGraphics(W, 340);
  crayon(wallG, '#2c4fb5', g => g.rect(0, 0, W, 340), { x: 0, y: 0, w: W, h: 340 }, 0.5);
  tableG = createGraphics(W, H - 320);
  crayon(tableG, '#1c1b22', g => g.rect(0, 0, W, H - 320), { x: 0, y: 0, w: W, h: H - 320 }, 0.35);
  // spoon and chopsticks on the table, like the reference picture
  crayon(tableG, '#e3b85c', g => { g.rect(70, 120, 10, 150, 5); g.ellipse(75, 270, 46, 70); }, { x: 50, y: 110, w: 50, h: 200 });
  crayon(tableG, '#e3b85c', g => { g.rect(870, 90, 9, 190, 3); g.rect(890, 90, 9, 190, 3); }, { x: 865, y: 85, w: 40, h: 200 });
  // the bowl body
  bowlG = createGraphics(W, H);
  const bowlShape = g => { g.beginShape(); g.vertex(BOWL.x - BOWL.w / 2, BOWL.y);
    g.bezierVertex(BOWL.x - BOWL.w / 2, BOWL.y + 150, BOWL.x - 160, BOWL.y + 196, BOWL.x - 120, BOWL.y + 200);
    g.vertex(BOWL.x + 120, BOWL.y + 200);
    g.bezierVertex(BOWL.x + 160, BOWL.y + 196, BOWL.x + BOWL.w / 2, BOWL.y + 150, BOWL.x + BOWL.w / 2, BOWL.y); g.endShape(CLOSE);
    g.ellipse(BOWL.x, BOWL.y, BOWL.w, BOWL.h); };
  crayon(bowlG, '#f5f1e8', bowlShape, { x: BOWL.x - BOWL.w / 2, y: BOWL.y - 90, w: BOWL.w, h: 300 }, 0.6);
  crayon(bowlG, '#f5f1e8', g => g.rect(BOWL.x - 110, BOWL.y + 196, 220, 28, 6), { x: BOWL.x - 112, y: BOWL.y + 190, w: 224, h: 36 }, 0.6);
  bowlG.noFill(); bowlG.stroke(INK); bowlG.strokeWeight(3);
  for (let i = 0; i < 30; i++) bowlG.point(BOWL.x - 200 + i * 14, BOWL.y + 100 + Math.sin(i) * 4);   // little dotted rim pattern
  // the nest of noodles in the soup (transparent, drawn over the soup colour)
  nestG = createGraphics(W, H);
  nestG.push(); nestG.beginClip(); nestG.ellipse(BOWL.x, BOWL.y + 4, BOWL.w - 50, BOWL.h - 26); nestG.endClip();
  nestG.noFill();
  for (let i = 0; i < 140; i++) {
    const cx = BOWL.x + random(-260, 260), cy = BOWL.y + random(-60, 64), r = random(30, 90), a0 = random(TAU);
    nestG.stroke('#d9a95f'); nestG.strokeWeight(5); nestG.arc(cx, cy, r * 1.6, r, a0, a0 + random(1.5, 3.5));
    nestG.stroke('#f6dd9f'); nestG.strokeWeight(3); nestG.arc(cx, cy, r * 1.6, r, a0, a0 + random(1.5, 3.5));
  }
  nestG.pop();
  for (let i = 0; i < 16; i++) decor.push({ type: random(TOPPINGS), x: BOWL.x + random(-230, 230), y: BOWL.y + random(-48, 54), r: random(TAU) });
  // paper grain over everything
  grainG = createGraphics(W, H); grainG.noStroke();
  for (let i = 0; i < 9000; i++) { grainG.fill(random() < 0.5 ? 0 : 255, random(8, 22)); grainG.rect(random(W), random(H), 1.5, 1.5); }
}

// ---------- players ----------
function makePlayer(name, cfg, seat, bot) {
  const p = { name, cfg, seat, bot, dislikes: new Set(), eaten: 0, gagT: 0, happyT: 0, boostT: 0,
              cup: 0, cupFull: false, cd: { spicy: 0, sour: 0, sweet: 0 }, phase: random(10), toppings: [],
              live: { mouth: 0, eyesClosed: 0 }, botBite: 0, botCond: random(4, 8), botFill: random(2, 6), shaken: new Set() };
  if (bot) for (const c of CARDS) if (random() < 0.3) p.dislikes.add(c);
  return p;
}
function newGame() {
  const botCfgs = [0, 1, 2].map(() => randomCritter());
  const names = shuffle(BOT_NAMES.slice()).slice(0, 3);
  me = makePlayer('YOU', myCfg, 1, false);
  players = [makePlayer(names[0], botCfgs[0], 0, true), me, makePlayer(names[1], botCfgs[1], 2, true), makePlayer(names[2], botCfgs[2], 3, true)];
  broth = { spicy: 0, sour: 0, sweet: 0 };
  flying = []; drops = []; toasts = [];
  cards = shuffle(CARDS.slice()); cardI = 0; cardT = 0;
}
const mouthPos = p => ({ x: SEATS[p.seat], y: SEAT_Y + (HEAD.y - CH / 2 + MOUTH_Y) * CRITTER_S });
const soupPos = p => ({ x: BOWL.x + (SEATS[p.seat] - BOWL.x) * 0.55, y: BOWL.y + 6 });

// ---------- eating ----------
function biteSize(p) {
  if (p.gagT > 0) return 0;
  let m = p.boostT > 0 ? 1.5 : 1;
  for (const f of FLAVORS) if (p.dislikes.has(f)) m *= 1 - 0.75 * broth[f];
  return 4 * m;
}
function bite(p) {
  const amt = biteSize(p);
  if (amt <= 0) return;
  p.eaten += amt;
  p.phase += 0.4;
  for (const t of p.toppings) t.t += 0.14;
  if (Math.random() < 0.38) p.toppings.push({ type: random(TOPPINGS), t: 0 });
  const done = p.toppings.filter(t => t.t >= 1);
  p.toppings = p.toppings.filter(t => t.t < 1);
  for (const t of done) {
    if (p.dislikes.has(t.type)) { p.gagT = 1.6; if (p === me) { toast(p, 'BLEH! ' + CARD_WORD[t.type], '#8fd46b'); blip(160, 0.25, 'sawtooth'); } }
    else { p.boostT = 3; p.happyT = 1; if (p === me) { toast(p, 'YUM ' + CARD_WORD[t.type], '#ffd34a'); blip(880, 0.08); blip(1175, 0.1, 'square', 0.08); } }
  }
  if (p === me) blip(300 + Math.random() * 60, 0.04, 'triangle');
}
// fling the topping closest to your mouth; half the time it lands on someone else's noodles
function shake(p) {
  const near = p.toppings.filter(t => t.t > 0.3).sort((a, b) => b.t - a.t)[0];
  if (!near) return;
  p.toppings.splice(p.toppings.indexOf(near), 1);
  const at = strandPoint(p, near.t);
  const others = players.filter(o => o !== p);
  const target = Math.random() < 0.5 ? random(others) : null;
  const to = target ? strandPoint(target, 0.25) : { x: BOWL.x + random(-200, 200), y: BOWL.y + random(-40, 40) };
  flying.push({ type: near.type, x: at.x, y: at.y, sx: at.x, sy: at.y, tx: to.x, ty: to.y, k: 0, target, spin: random(-8, 8) });
  if (p === me) { toast(p, 'FLING!', '#ffffff'); blip(600, 0.12, 'square', 0, 220); }
}
function addFlavor(p, f) {
  if (p.cd[f] > 0) return;
  p.cd[f] = COOLDOWN;
  broth[f] = Math.min(1, broth[f] + 0.35);
  const from = mouthPos(p);
  for (let i = 0; i < 18; i++) drops.push({ x: from.x + random(-10, 10), y: 310, vx: (BOWL.x - from.x) * random(0.2, 0.6) + random(-20, 20), vy: random(-80, 0), col: FLAVOR_INFO[f].col, t: 0.9 });
  toast(p, '+ ' + FLAVOR_INFO[f].name, FLAVOR_INFO[f].col);
  if (p === me) blip(f === 'spicy' ? 520 : f === 'sour' ? 440 : 700, 0.1);
}
function pourWater(p) {
  if (!p.cupFull) return;
  p.cupFull = false; p.cup = 0;
  for (const f of FLAVORS) broth[f] *= 0.35;
  const from = mouthPos(p);
  for (let i = 0; i < 22; i++) drops.push({ x: from.x + random(-10, 10), y: 310, vx: (BOWL.x - from.x) * random(0.2, 0.6), vy: random(-60, 0), col: '#bfe6ff', t: 0.9 });
  toast(p, '+ WATER', '#bfe6ff');
  if (p === me) blip(330, 0.18, 'sine', 0, 660);
}
function moodOf(p) {
  if (p.gagT > 0) return 'gag';
  let worst = null, lv = 0.22;
  for (const f of FLAVORS) if (p.dislikes.has(f) && broth[f] > lv) { worst = f; lv = broth[f]; }
  if (worst) return worst;
  return p.happyT > 0 ? 'happy' : '';
}

function updatePlayers(dt) {
  for (const p of players) {
    p.gagT = Math.max(0, p.gagT - dt); p.happyT = Math.max(0, p.happyT - dt); p.boostT = Math.max(0, p.boostT - dt);
    for (const f of FLAVORS) p.cd[f] = Math.max(0, p.cd[f] - dt);
    if (!p.bot) continue;
    // computer players: chew at their own pace, fling what they hate (not always in time), stir trouble
    const slow = p.gagT > 0 ? 0 : biteSize(p) / 4;
    p.botBite -= dt;
    p.live.mouth = Math.max(0, Math.sin(modeT * 9 + p.seat) * 0.9);
    if (p.botBite <= 0) { bite(p); p.botBite = random(0.42, 0.7) / Math.max(0.35, slow); }
    const bad = p.toppings.find(t => t.t > 0.55 && p.dislikes.has(t.type) && !p.shaken.has(t));
    if (bad) { p.shaken.add(bad); if (Math.random() < 0.7) shake(p); }
    p.botCond -= dt;
    if (p.botCond <= 0) { const ok = FLAVORS.filter(f => !p.dislikes.has(f)); if (ok.length) addFlavor(p, random(ok)); p.botCond = random(6, 12); }
    if (!p.cupFull) { p.botFill -= dt; if (p.botFill <= 0) { p.cup += dt / CUP_TIME; if (p.cup >= 1) { p.cupFull = true; p.botFill = random(4, 9); } } }
    if (p.cupFull && FLAVORS.some(f => p.dislikes.has(f) && broth[f] > 0.4)) pourWater(p);
  }
  for (const f of FLAVORS) broth[f] = Math.max(0, broth[f] - 0.008 * dt);
}

// ---------- taste cards ----------
function answerCard(yum) {
  if (mode !== 'cards' || cardI >= cards.length) return;
  if (!yum) me.dislikes.add(cards[cardI]);
  blip(yum ? 760 : 300, 0.06);
  cardI++; cardT = 0;
  if (cardI >= cards.length) setMode('howEat');
}

// ---------- input ----------
function keyPressed() {
  unlockAudio();
  if (mode === 'custom') {
    if (keyCode === UP_ARROW) sel = (sel + PARTS.length) % (PARTS.length + 1);
    else if (keyCode === DOWN_ARROW) sel = (sel + 1) % (PARTS.length + 1);
    else if (keyCode === LEFT_ARROW) changePart(-1);
    else if (keyCode === RIGHT_ARROW) changePart(1);
    else if (key === 'r' || key === 'R') randomizeMe();
    else if (keyCode === ENTER) startGame();
    return false;
  }
  const k = key.toLowerCase();
  if (mode === 'calib' && k === ' ') { setMode('howCards'); return false; }
  if (mode === 'howCards' && (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || k === 'a' || k === 'd' || k === ' ' || keyCode === ENTER)) { setMode('cards'); return false; }
  if (mode === 'howEat' && modeT > 0.5 && (k === ' ' || keyCode === ENTER)) { setMode('count'); return false; }
  if (mode === 'cards') {
    if (keyCode === LEFT_ARROW || k === 'a') answerCard(false);
    if (keyCode === RIGHT_ARROW || k === 'd') answerCard(true);
    return false;
  }
  if (mode === 'eat') {
    if (key === 'j' || key === 'J') bite(me);
    if (key === 'k' || key === 'K') shake(me);
    if (key === '1') addFlavor(me, 'spicy');
    if (key === '2') addFlavor(me, 'sour');
    if (key === '3') addFlavor(me, 'sweet');
    if (key === ' ' && me.cupFull) { pourWater(me); spaceLock = true; }
    return false;
  }
  if (mode === 'done' && modeT > 1 && (keyCode === ENTER || key === ' ')) { startGame(); return false; }
}
function keyReleased() { if (key === ' ') spaceLock = false; }
function mousePressed() {
  unlockAudio();
  const mx = mouseX / S, my = mouseY / S;
  if (mode === 'cards') { answerCard(mx > W / 2); return; }
  if (mode === 'howCards') { setMode('cards'); return; }
  if (mode === 'custom') {
    PARTS.forEach((pt, i) => {
      const y = partY(i);
      if (my > y - 22 && my < y + 22 && mx > 520) { sel = i; if (mx > 630 && mx < 710) changePart(-1); else if (mx > 815 && mx < 905) changePart(1); }   // the < and > arrows
    });
  }
  const b = buttons.find(b => mx > b.x && mx < b.x + b.w && my > b.y && my < b.y + b.h);
  if (b) b.fn();
}
function changePart(d) {
  if (sel >= PARTS.length) return;
  const pt = PARTS[sel];
  myCfg[pt.key] = (myCfg[pt.key] + d + pt.list.length) % pt.list.length;
  saveMe(); blip(d > 0 ? 720 : 560, 0.04);
}
function randomizeMe() { myCfg = randomCritter(); saveMe(); blip(880, 0.05); }
function saveMe() { try { localStorage.setItem('oneBowlCritter', JSON.stringify(myCfg)); } catch (e) {} }
function startGame() {
  newGame();
  if (Face.state === 'off') { Face.start(); Face.resetCalibration(); setMode('calib'); }
  else setMode('howCards');
}

// ---------- draw ----------
function draw() {
  const dt = Math.min(deltaTime / 1000, 0.05);
  modeT += dt;
  buttons = [];
  if (Face.ready()) Face.update();
  if (me && !me.bot) { me.live.mouth = Face.ready() ? Face.mouth : (keyIsDown(74) ? 0.8 : 0); me.live.eyesClosed = Face.ready() ? Face.eyesClosed : 0; }

  if (mode === 'calib') {
    if (Face.state === 'denied') setMode('howCards');
    if (Face.ready()) Face.sampleCalibration();
    if (Face.calibrated() && modeT > 1.5) setMode('howCards');
  }
  if (mode === 'cards' && modeT > 0.8) { cardT += dt; if (cardT >= CARD_TIME) answerCard(true); }
  if (mode === 'count' && modeT > 3) { roundT = 0; setMode('eat'); }
  if (mode === 'eat') {
    roundT += dt;
    updatePlayers(dt);
    // water: hold SPACE to fill one cup; you can't fill while you're holding a full one
    if (keyIsDown(32) && !me.cupFull && !spaceLock) { me.cup += dt / CUP_TIME; if (me.cup >= 1) { me.cupFull = true; spaceLock = true; blip(990, 0.08); } }
    else if (!me.cupFull) me.cup = 0;
    if (roundT >= ROUND_TIME) { setMode('done'); fanfare(); }
  }

  push(); scale(S);
  drawScene(dt);
  if (mode === 'custom') drawCustom();
  if (mode === 'calib') drawCalib();
  if (mode === 'howCards') drawHowCards();
  if (mode === 'cards') drawCards();
  if (mode === 'howEat') drawHowEat();
  if (mode === 'count') bigText(String(3 - Math.floor(modeT)), '#ffffff');
  if (mode === 'eat') drawHud();
  if (mode === 'done') drawDone();
  pop();
}

function drawScene(dt) {
  const t = millis() / 1000;
  image(wallG, 0, 0);
  const inGame = ['howCards', 'cards', 'howEat', 'count', 'eat', 'done'].includes(mode) && players.length;
  if (inGame) for (const p of players) drawCritter(p.cfg, SEATS[p.seat], SEAT_Y, CRITTER_S, p.live, mode === 'eat' ? moodOf(p) : '', t);
  image(tableG, 0, 320);
  image(bowlG, 0, 0);
  // soup colour = clear broth tinted by whatever has been poured in
  let soup = color('#f2cf8e');
  for (const f of FLAVORS) soup = lerpColor(soup, color(FLAVOR_INFO[f].col), broth[f] * 0.75);
  noStroke(); fill(soup); ellipse(BOWL.x, BOWL.y + 4, BOWL.w - 50, BOWL.h - 26);
  image(nestG, 0, 0);
  for (const d of decor) drawTopping(d.type, d.x, d.y, 0.8, d.r);
  stroke(INK); strokeWeight(3); noFill(); ellipse(BOWL.x, BOWL.y, BOWL.w, BOWL.h);
  if (inGame) for (const p of players) drawPaws(p.cfg, SEATS[p.seat], BOWL.y - BOWL.h / 2 + 4, CRITTER_S);
  if (inGame) {
    for (const p of players) drawStrand(p, t);
    for (const p of players) for (const tp of p.toppings) { const q = strandPoint(p, tp.t); drawTopping(tp.type, q.x, q.y, 0.9, tp.t * 4); }
  }
  // flung toppings
  for (const f of flying) {
    f.k += dt * 1.6;
    const k = Math.min(1, f.k);
    f.x = lerp(f.sx, f.tx, k); f.y = lerp(f.sy, f.ty, k) - Math.sin(k * PI) * 160;
    drawTopping(f.type, f.x, f.y, 1, f.k * f.spin);
    if (f.k >= 1 && f.target) f.target.toppings.push({ type: f.type, t: 0.25 });
  }
  flying = flying.filter(f => f.k < 1);
  // drips from condiments
  noStroke();
  for (const d of drops) { d.t -= dt; d.vy += 420 * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (d.y < BOWL.y + 20) { fill(d.col); ellipse(d.x, d.y, 7, 9); } }
  drops = drops.filter(d => d.t > 0);
  if (inGame && mode !== 'custom') drawToasts(dt);
  image(grainG, 0, 0);
}

// a bundle of three wavy noodles from the soup up into the mouth; the waves crawl upward as you eat
function strandPoint(p, t) {
  const a = soupPos(p), b = mouthPos(p);
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
  const w = Math.sin(t * PI * 5 - p.phase * 2) * 9 * Math.sin(PI * t);
  return { x: a.x + dx * t + nx * w, y: a.y + dy * t + ny * w };
}
function drawStrand(p, t) {
  noFill();
  for (const [off, colA, colB] of [[-6, '#d9a95f', '#f6dd9f'], [0, '#d9a95f', '#f8e3aa'], [6, '#d9a95f', '#f6dd9f']]) {
    for (const [col, wgt] of [[colA, 7], [colB, 4.5]]) {
      stroke(col); strokeWeight(wgt);
      beginShape();
      for (let i = 0; i <= 24; i++) { const k = i / 24, q = strandPoint(p, k); vertex(q.x + off * (1 - k * 0.8), q.y); }
      endShape();
    }
  }
}

// toppings drawn as little crayon-ish shapes
function drawTopping(type, x, y, s = 1, r = 0) {
  push(); translate(x, y); rotate(r); scale(s); noStroke();
  switch (type) {
    case 'cilantro': fill('#4f9a3a'); for (let i = 0; i < 3; i++) { push(); rotate(i * 2.1); ellipse(0, -8, 10, 14); pop(); } fill('#7cc25a'); ellipse(0, 0, 8, 8); break;
    case 'scallion': stroke('#5ea83f'); strokeWeight(4); noFill(); ellipse(-6, 0, 12, 12); ellipse(7, 3, 11, 11); break;
    case 'garlic': fill('#f3ecd9'); ellipse(0, 2, 18, 16); triangle(-4, -4, 4, -4, 0, -12); fill('#d9ccb0'); ellipse(0, 4, 4, 9); break;
    case 'mushroom': fill('#8a5a3c'); arc(0, 0, 26, 20, PI, TWO_PI); fill('#efe2c8'); rect(-4, 0, 8, 10, 3); break;
    case 'shrimp': noFill(); stroke('#f0865a'); strokeWeight(7); arc(0, 0, 20, 20, 0.3, PI * 1.5); stroke('#ffd2b8'); strokeWeight(2.5); arc(0, 0, 20, 20, 0.3, PI * 1.5); break;
    case 'egg': fill('#fbf8ef'); ellipse(0, 0, 28, 20); fill('#f4b62a'); ellipse(2, 0, 12, 10); break;
    case 'beef': fill('#6e3a2c'); rect(-12, -6, 24, 12, 4); fill('#8f5240'); rect(-9, -3, 8, 3, 2); break;
  }
  pop();
}

// ---------- screens ----------
function txt(s, x, y, size, col = '#ffffff', align = CENTER) {
  textAlign(align, CENTER); textSize(size); textStyle(BOLD);
  noStroke(); fill(0, 0, 0, 120); text(s, x + 2, y + 3); fill(col); text(s, x, y);
}
function bigText(s, col) { txt(s, W / 2, 120, 110, col); }
function button(x, y, w, h, label, fn, bg = '#ffd34a', fg = INK, size = h * 0.62) {
  noStroke(); fill(0, 0, 0, 90); rect(x + 4, y + 5, w, h, 14);
  fill(bg); rect(x, y, w, h, 14); txt(label, x + w / 2, y + h / 2 - 2, size, fg);
  buttons.push({ x, y, w, h, fn });
}
const partY = i => 142 + i * 56;

function drawCustom() {
  fill(20, 18, 30, 140); noStroke(); rect(0, 0, W, H);
  txt('ONE BOWL', 250, 60, 76, '#ffd34a');
  txt('chew to eat. shake your head to fling.', 250, 112, 26, '#f6f1e7');
  // preview: your animal, copying your face if the camera is on
  // the animal sits inside its frame: everything is clipped to the rounded box
  push();
  beginClip(); rect(70, 150, 360, 330, 24); endClip();
  noStroke(); fill('#2c4fb5'); rect(70, 150, 360, 330);
  drawCritter(myCfg, 250, 340, 1.45, me ? me.live : { mouth: Face.ready() ? Face.mouth : (Math.sin(millis() / 300) > 0.6 ? 0.6 : 0), eyesClosed: 0 }, '', millis() / 1000);
  fill(INK); rect(70, 432, 360, 60);
  pop();
  PARTS.forEach((pt, i) => {
    const y = partY(i), on = sel === i;
    if (on) { fill(255, 255, 255, 30); rect(500, y - 26, 410, 52, 16); }
    txt(pt.label, 516, y, 26, on ? '#ffd34a' : '#c9c3e6', LEFT);
    txt('<', 668, y, 40, on ? '#ffffff' : '#7d76a3');
    txt(pt.list[myCfg[pt.key] || 0], 763, y, 34, '#ffffff');
    txt('>', 858, y, 40, on ? '#ffffff' : '#7d76a3');
  });
  button(500, 490, 150, 60, 'RANDOM', randomizeMe, '#c9b8ff');
  button(670, 490, 240, 60, 'START', startGame, sel === PARTS.length ? '#ffd34a' : '#7fe0a0');
  txt('arrows to dress up · ENTER to start', 480, 600, 24, '#c9c3e6');
}

function drawCalib() {
  fill(20, 18, 30, 170); noStroke(); rect(0, 0, W, H);
  const msg = Face.state === 'asking' ? 'please allow the camera' : Face.state === 'loading' ? 'warming up the kitchen...'
    : !Face.present ? 'show me your face' : 'look here, mouth closed';
  txt(msg, W / 2, 140, 46, '#ffd34a');
  if (Face.video && Face.ready()) { push(); imageMode(CENTER); image(Face.video, W / 2, 330, 240, 180); pop(); }
  const k = Math.min(1, Face.base.n / 20);
  fill(255, 255, 255, 40); rect(W / 2 - 150, 450, 300, 14, 7); fill('#7fe0a0'); rect(W / 2 - 150, 450, 300 * k, 14, 7);
  txt('SPACE = play with the keyboard', W / 2, 520, 26, '#c9c3e6');
}

function drawCards() {
  fill(20, 18, 30, 150); noStroke(); rect(0, 0, W, H);
  if (cardI >= cards.length) return;
  const c = cards[cardI], left = 1 - cardT / CARD_TIME;
  txt('do you eat it?  ' + (cardI + 1) + ' / ' + cards.length, W / 2, 70, 34, '#c9c3e6');
  // the card
  push(); translate(W / 2 + (Face.ready() ? Face.tilt * 30 : 0), 300); rotate(Face.ready() ? Face.tilt * 0.12 : 0);
  noStroke(); fill(0, 0, 0, 90); rect(-150, -170, 300, 340, 26);
  fill('#f6f1e7'); rect(-154, -176, 300, 340, 26);
  if (TOPPINGS.includes(c)) drawTopping(c, -4, -40, 4.2);
  else { fill(FLAVOR_INFO[c].col); ellipse(-4, -40, 150, 150); fill('#ffffff'); textSize(70); textAlign(CENTER, CENTER); text(c === 'spicy' ? '辣' : c === 'sour' ? '酸' : '甜', -4, -44); }
  txt(CARD_WORD[c], -4, 100, 44, INK);
  pop();
  // timer bar
  fill(255, 255, 255, 40); rect(W / 2 - 150, 500, 300, 12, 6); fill(left < 0.35 ? '#e2452f' : '#ffd34a'); rect(W / 2 - 150, 500, 300 * left, 12, 6);
  txt('NOPE', 170, 280, 50, '#ff8f8f'); txt('←  or  A', 170, 330, 28, '#ff8f8f');
  txt('YUM', W - 170, 280, 50, '#7fe0a0'); txt('D  or  →', W - 170, 330, 28, '#7fe0a0');
  txt(Face.ready() ? '(or tilt your head)' : '(or click a side)', W / 2, 560, 26, '#c9c3e6');
}

// ---- instructions: before the cards ----
function panel() { fill(20, 18, 30, 205); noStroke(); rect(0, 0, W, H); }
function keyCap(label, x, y, w = 54) {
  noStroke(); fill(0, 0, 0, 90); rect(x - w / 2 + 3, y - 24, w, 50, 10);
  fill('#f6f1e7'); rect(x - w / 2, y - 27, w, 50, 10); txt(label, x, y - 4, 30, INK);
}
function drawHowCards() {
  panel();
  txt('FIRST: WHAT DO YOU EAT?', W / 2, 70, 54, '#ffd34a');
  txt('10 cards flash by, 2 seconds each. Don\'t think, just answer.', W / 2, 128, 28, '#f6f1e7');
  // a little example card swinging between the two answers
  const swing = Math.sin(modeT * 2.2);
  push(); translate(W / 2 + swing * 40, 300); rotate(swing * 0.12);
  noStroke(); fill(0, 0, 0, 90); rect(-86, -106, 176, 210, 20); fill('#f6f1e7'); rect(-90, -110, 176, 210, 20);
  drawTopping('cilantro', -2, -26, 3); txt('CILANTRO', -2, 66, 30, INK);
  pop();
  keyCap('←', 150, 270); keyCap('A', 220, 270);
  txt('NOPE, I don\'t', 185, 330, 30, '#ff8f8f'); txt('eat it', 185, 362, 30, '#ff8f8f');
  keyCap('D', 740, 270); keyCap('→', 810, 270);
  txt('YUM, I eat it', 775, 330, 30, '#7fe0a0');
  txt(Face.ready() ? 'or tilt your head to the left / right' : 'or click the left / right side', W / 2, 450, 26, '#c9c3e6');
  txt('Your answers are secret. Everyone finds out at the end.', W / 2, 490, 26, '#c9c3e6');
  button(W / 2 - 110, 540, 220, 60, 'GOT IT', () => setMode('cards'));
}

// ---- instructions: before eating ----
function drawHowEat() {
  panel();
  txt('NOW: EAT FROM THE SAME BOWL', W / 2, 62, 50, '#ffd34a');
  txt('Whoever eats the most noodles in ' + ROUND_TIME + ' seconds wins.', W / 2, 112, 28, '#f6f1e7');
  const rows = [
    { draw: (x, y) => { const o = (Math.sin(modeT * 8) + 1) / 2; fill('#f2b39b'); ellipse(x, y, 56, 56); fill('#b8322a'); ellipse(x, y + 8, 18, 4 + o * 18); },
      title: 'CHEW', body: 'open and close your mouth to slurp a bite', keys: 'J' },
    { draw: (x, y) => { push(); translate(x + Math.sin(modeT * 14) * 8, y); fill('#f2b39b'); ellipse(0, 0, 56, 56); pop(); drawTopping('cilantro', x + 40, y - 20, 1.2, modeT * 6); },
      title: 'SHAKE YOUR HEAD', body: 'fling off a topping you hate before it reaches your mouth', keys: 'K' },
    { draw: (x, y) => { ['#e2452f', '#a8662c', '#f29bbb'].forEach((c, i) => { fill(c); ellipse(x - 24 + i * 24, y, 22, 22); }); },
      title: 'MESS UP THE SOUP', body: 'make it spicy, sour or sweet. Haters eat slower.', keys: '1 2 3' },
    { draw: (x, y) => { fill('#f6f1e7'); rect(x - 18, y - 26, 36, 50, 5); fill('#7fc8ff'); const k = (modeT * 0.8) % 1; rect(x - 18, y - 26 + 50 * (1 - k), 36, 50 * k, 5); },
      title: 'WATER CALMS THE SOUP', body: 'hold to fill one cup, press again to pour it in', keys: 'SPACE' },
  ];
  rows.forEach((r, i) => {
    const y = 190 + i * 88;
    noStroke(); fill(255, 255, 255, 18); rect(50, y - 38, 860, 76, 18);
    r.draw(110, y);
    txt(r.title, 170, y - 14, 32, '#ffd34a', LEFT);
    txt(r.body, 170, y + 16, 24, '#f6f1e7', LEFT);
    if (!Face.ready() || i >= 2) keyCap(r.keys, 840, y + 2, r.keys.length > 2 ? 110 : 54);
  });
  if (modeT > 0.5) button(W / 2 - 120, 552, 240, 62, 'LET\'S EAT', () => setMode('count'));
}

function drawHud() {
  const left = Math.max(0, ROUND_TIME - roundT);
  txt(Math.ceil(left) + '', W / 2, 40, 56, left < 10 ? '#ff8f8f' : '#ffffff');
  for (const p of players) {
    const x = SEATS[p.seat];
    txt(p.name, x, 96, 26, p === me ? '#ffd34a' : '#f6f1e7');
    txt(Math.floor(p.eaten) + ' cm', x, 122, 22, '#c9c3e6');
    if (p.cupFull) { noStroke(); fill('#bfe6ff'); rect(x + 52, 108, 16, 20, 3); }
  }
  // condiment buttons
  FLAVORS.forEach((f, i) => {
    const x = 30 + i * 166, y = 560, cd = me.cd[f] / COOLDOWN;
    button(x, y, 154, 52, FLAVOR_INFO[f].key + '  ' + FLAVOR_INFO[f].name, () => addFlavor(me, f), FLAVOR_INFO[f].col, '#ffffff', 26);
    if (cd > 0) { noStroke(); fill(0, 0, 0, 140); rect(x, y, 154 * cd, 52, 14); }
  });
  // cup of water
  const cx = W - 220, cy = 548;
  noStroke(); fill(0, 0, 0, 90); rect(cx + 4, cy + 5, 180, 70, 14); fill('#3b5fc6'); rect(cx, cy, 180, 70, 14);
  fill('#f6f1e7'); rect(cx + 18, cy + 12, 34, 46, 4); fill('#7fc8ff'); const lv = me.cupFull ? 1 : me.cup; rect(cx + 18, cy + 12 + 46 * (1 - lv), 34, 46 * lv, 4);
  txt(me.cupFull ? 'SPACE: pour' : 'hold SPACE', cx + 116, cy + 35, 24, '#ffffff');
  buttons.push({ x: cx, y: cy, w: 180, h: 70, fn: () => pourWater(me) });
  // camera + controls hint
  if (Face.ready() && Face.video) {
    push(); translate(W - 20, 18); scale(-1, 1); image(Face.video, 0, 0, 120, 90); pop();
    noFill(); stroke(Face.mouthOpen ? '#ffd34a' : '#ffffff'); strokeWeight(3); rect(W - 140, 18, 120, 90, 8);
    if (!Face.present) txt('where is your face?', W - 80, 124, 20, '#ffd34a');
  } else txt('J chew · K shake', W - 110, 40, 24, '#c9c3e6');
}

function drawDone() {
  fill(20, 18, 30, 190); noStroke(); rect(0, 0, W, H);
  const rank = players.slice().sort((a, b) => b.eaten - a.eaten);
  txt(rank[0] === me ? 'YOU ATE THE MOST!' : rank[0].name + ' ATE THE MOST', W / 2, 70, 56, '#ffd34a');
  rank.forEach((p, i) => {
    const y = 160 + i * 88;
    drawCritter(p.cfg, 150, y + 26, 0.42, {}, i === 0 ? 'happy' : '', millis() / 1000);
    txt((i + 1) + '. ' + p.name, 230, y, 36, p === me ? '#ffd34a' : '#ffffff', LEFT);
    txt(Math.floor(p.eaten) + ' cm', 470, y, 34, '#ffffff', LEFT);
    const hates = [...p.dislikes].map(d => CARD_WORD[d].toLowerCase());
    txt(hates.length ? 'hates ' + hates.join(', ') : 'eats everything', 230, y + 32, 22, '#c9c3e6', LEFT);
  });
  if (modeT > 1) {
    button(600, 560, 150, 56, 'AGAIN', startGame);
    button(770, 560, 150, 56, 'DRESS UP', () => setMode('custom'), '#c9b8ff');
  }
}

function toast(p, s, col) { toasts.push({ p, s, col, t: 1.2 }); }
// little messages float up from just under each animal's mouth, stacked so they don't overlap
function drawToasts(dt) {
  const stack = new Map();
  for (const k of toasts) {
    k.t -= dt;
    const m = mouthPos(k.p), n = stack.get(k.p) || 0;
    stack.set(k.p, n + 1);
    txt(k.s, m.x, m.y + 46 + n * 24 - (1.2 - k.t) * 16, 24, k.col);
  }
  toasts = toasts.filter(k => k.t > 0);
}

// ---------- tiny sounds ----------
let actx = null;
function unlockAudio() {
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  if (actx && actx.state === 'suspended') actx.resume();
}
function blip(freq, dur, type = 'square', delay = 0, slideTo = 0) {
  if (!actx) return;
  const t0 = actx.currentTime + delay, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.06, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}
function fanfare() { [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.16, 'square', i * 0.13)); }
