// Webcam + MediaPipe Face Landmarker -> eating with your face.
//   bite   : open your mouth, then close it (one chew = one bite)
//   shake  : shake your head left-right to fling a topping off your noodles
//   tilt   : tilt your head left / right to answer the taste cards
// Also exposes how open your mouth is and whether your eyes are closed, so your animal copies you.

const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

const Face = {
  state: 'off',            // off | asking | loading | on | denied
  video: null, landmarker: null, points: null, present: false,
  mouth: 0,                // jaw open 0..1
  eyesClosed: 0,           // 0..1, both eyes
  yaw: 0, roll: 0,         // head turn and tilt (roughly -1..1 and degrees)
  mouthOpen: false,
  tilt: 0,                 // -1 tilted to your left, 1 to your right, 0 upright
  base: { M: 0, yaw: 0, roll: 0, n: 0 },
  onBite: null, onShake: null, onTilt: null,
  _yawHist: [], _lastShake: 0, _lastTime: -1,

  async start() {
    if (this.state !== 'off') return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { this.state = 'denied'; return; }
    this.state = 'asking';
    try {
      const probe = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      probe.getTracks().forEach(t => t.stop());
    } catch (e) { this.state = 'denied'; return; }
    this.state = 'loading';
    this.video = createCapture({ video: { width: 320, height: 240 }, audio: false }, { flipped: true });
    this.video.size(320, 240);
    this.video.hide();
    try {
      const vision = await import(MP + '/vision_bundle.mjs');
      const files = await vision.FilesetResolver.forVisionTasks(MP + '/wasm');
      const opts = delegate => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true });
      try { this.landmarker = await vision.FaceLandmarker.createFromOptions(files, opts('GPU')); }
      catch (e) { this.landmarker = await vision.FaceLandmarker.createFromOptions(files, opts('CPU')); }
      this.state = 'on';
    } catch (e) { console.error('Face Landmarker failed to load', e); this.state = 'denied'; }
  },

  update() {
    const v = this.video && this.video.elt;
    if (!this.landmarker || !v || v.readyState < 2 || v.currentTime === this._lastTime) return;
    this._lastTime = v.currentTime;
    const r = this.landmarker.detectForVideo(v, performance.now());
    if (!r.faceLandmarks || !r.faceLandmarks.length) { this.present = false; this.points = null; return; }
    this.present = true;
    const p = this.points = r.faceLandmarks[0];
    const s = {};
    r.faceBlendshapes[0].categories.forEach(c => { s[c.categoryName] = c.score; });
    this.mouth = s.jawOpen;
    this.eyesClosed = Math.min(s.eyeBlinkLeft, s.eyeBlinkRight);

    // head turn: where the nose sits between the two cheeks (raw camera image, so flip the sign
    // to match the mirrored picture: positive = turned to the screen's right)
    const L = p[234], R = p[454], nose = p[1];
    const mid = (L.x + R.x) / 2, w = Math.max(0.01, Math.abs(R.x - L.x));
    this.yaw = -((nose.x - mid) / w) * 2 - this.base.yaw;
    // head tilt: the line between the outer eye corners. Positive = tilted to your left.
    this.roll = Math.atan2(p[263].y - p[33].y, p[263].x - p[33].x) * 180 / Math.PI - this.base.roll;

    // bite = mouth opens past the line, then closes again
    const openAt = Math.max(0.22, this.base.M + 0.16), shutAt = openAt - 0.1;
    if (!this.mouthOpen && this.mouth > openAt) this.mouthOpen = true;
    else if (this.mouthOpen && this.mouth < shutAt) { this.mouthOpen = false; if (this.onBite) this.onBite(); }

    // shake = the head swings back and forth at least twice within 0.7 s
    const now = performance.now();
    this._yawHist.push({ t: now, y: this.yaw });
    this._yawHist = this._yawHist.filter(h => now - h.t < 700);
    let swings = 0, dir = 0, from = this._yawHist[0] ? this._yawHist[0].y : 0;
    for (const h of this._yawHist) {
      const d = h.y - from;
      if (Math.abs(d) > 0.18) { const nd = Math.sign(d); if (nd !== dir) { swings++; dir = nd; } from = h.y; }
    }
    if (swings >= 3 && now - this._lastShake > 600) { this._lastShake = now; this._yawHist = []; if (this.onShake) this.onShake(); }

    // tilt for the cards (with a little dead zone)
    const t = this.roll > 12 ? -1 : this.roll < -12 ? 1 : 0;
    if (t !== this.tilt) { this.tilt = t; if (t !== 0 && this.onTilt) this.onTilt(t); }
  },

  resetCalibration() { this.base = { M: 0, yaw: 0, roll: 0, n: 0 }; },
  sampleCalibration() {
    if (!this.present || this.points === this._lastSample) return;
    this._lastSample = this.points;
    const b = this.base, rawYaw = this.yaw + b.yaw, rawRoll = this.roll + b.roll;
    b.n++;
    b.M += (this.mouth - b.M) / b.n;
    b.yaw += (rawYaw - b.yaw) / b.n;
    b.roll += (rawRoll - b.roll) / b.n;
  },
  calibrated() { return this.base.n >= 20; },
  ready() { return this.state === 'on'; },
};
