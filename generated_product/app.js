import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const GAME_SECONDS = 30.0;
const STORAGE_BEST_KEY = "kgninja_visibility_best_v1";

const dom = {
  gameRoot: document.getElementById("gameRoot"),
  mount: document.getElementById("gameCanvas"),
  startButton: document.getElementById("startButton"),
  retryButton: document.getElementById("retryButton"),
  scoreDisplay: document.getElementById("scoreDisplay"),
  timeDisplay: document.getElementById("timeDisplay"),
  bestDisplay: document.getElementById("bestDisplay"),
  gameOverPanel: document.getElementById("gameOverPanel"),
  shareButton: document.getElementById("shareButton"),
  finalScore: document.getElementById("finalScore"),
  finalVis: document.getElementById("finalVis"),
  veil: document.getElementById("veilLayer"),
};

let renderer, scene, camera;
let rafId = 0;

let isRunning = false;
let timeLeft = GAME_SECONDS;
let score = 0;
let best = 0;

let visibility = 1.0; // 0..1 (1=clear)
let player, playerGlow;
let clock;

const objects = [];
const hazards = [];
const particles = [];

const input = {
  left: false,
  right: false,
  pointerActive: false,
  pointerId: null,
  pointerX: 0,
  targetX: 0,
};

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function nowMs() {
  return performance.now();
}

function readBest() {
  const raw = localStorage.getItem(STORAGE_BEST_KEY);
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function writeBest(n) {
  try {
    localStorage.setItem(STORAGE_BEST_KEY, String(n));
  } catch {
    // ignore
  }
}

function setHud() {
  dom.scoreDisplay.textContent = String(score);
  dom.timeDisplay.textContent = timeLeft.toFixed(1);
  dom.bestDisplay.textContent = String(best);
}

function setGameOverUI(show) {
  dom.gameOverPanel.hidden = !show;
}

function setStartEnabled(enabled) {
  dom.startButton.disabled = !enabled;
  dom.startButton.style.opacity = enabled ? "1" : "0.65";
}

function updateVeil() {
  // "veil" represents how much the canvas layer is obscuring the CSS background.
  // Keep it visibly present but never opaque.
  const obscurity = 1.0 - visibility; // 0..1
  const alpha = clamp(0.08 + obscurity * 0.27, 0.08, 0.35);
  dom.veil.style.background = `rgba(0,0,0,${alpha.toFixed(3)})`;
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(dom.mount.clientWidth, dom.mount.clientHeight, false);
  renderer.setClearColor(0x000000, 0); // fully transparent
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  dom.mount.appendChild(renderer.domElement);
}

function createScene() {
  scene = new THREE.Scene();

  const w = dom.mount.clientWidth;
  const h = dom.mount.clientHeight;
  camera = new THREE.PerspectiveCamera(60, Math.max(1e-6, w / h), 0.1, 200);
  camera.position.set(0, 6.5, 15);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.25);
  key.position.set(8, 14, 10);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x00f5ff, 0.85);
  rim.position.set(-10, 6, -12);
  scene.add(rim);

  // Neon "depth" grid — transparent so background stays visible.
  const grid = new THREE.GridHelper(60, 60, 0x00f5ff, 0xff2bd6);
  grid.position.y = -0.01;
  grid.material.opacity = 0.20;
  grid.material.transparent = true;
  scene.add(grid);

  const fog = new THREE.FogExp2(0x05060a, 0.035);
  scene.fog = fog;
}

function createPlayer() {
  const bodyGeo = new THREE.CapsuleGeometry(0.45, 0.65, 8, 16);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x00f5ff,
    emissive: 0x001822,
    metalness: 0.25,
    roughness: 0.25,
    transparent: true,
    opacity: 0.88,
  });
  player = new THREE.Mesh(bodyGeo, bodyMat);
  player.position.set(0, 0.65, 4.0);
  scene.add(player);

  const glowGeo = new THREE.SphereGeometry(0.9, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffe600,
    transparent: true,
    opacity: 0.18,
  });
  playerGlow = new THREE.Mesh(glowGeo, glowMat);
  playerGlow.position.copy(player.position);
  scene.add(playerGlow);
}

function makeCollectible() {
  const g = new THREE.BoxGeometry(0.65, 0.65, 0.65);
  const m = new THREE.MeshStandardMaterial({
    color: 0xffe600,
    emissive: 0x221a00,
    metalness: 0.2,
    roughness: 0.2,
    transparent: true,
    opacity: 0.9,
  });
  const mesh = new THREE.Mesh(g, m);
  const laneX = (Math.random() * 2 - 1) * 7.5;
  mesh.position.set(laneX, 0.9 + Math.random() * 2.4, -30 - Math.random() * 25);
  mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
  mesh.userData = { v: 12 + Math.random() * 7, kind: "good" };
  scene.add(mesh);
  objects.push(mesh);
}

function makeHazard() {
  const g = new THREE.IcosahedronGeometry(0.75, 0);
  const m = new THREE.MeshStandardMaterial({
    color: 0xff395a,
    emissive: 0x22000c,
    metalness: 0.1,
    roughness: 0.25,
    transparent: true,
    opacity: 0.82,
  });
  const mesh = new THREE.Mesh(g, m);
  const laneX = (Math.random() * 2 - 1) * 7.8;
  mesh.position.set(laneX, 1.2 + Math.random() * 2.6, -32 - Math.random() * 28);
  mesh.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
  mesh.userData = { v: 13 + Math.random() * 9, kind: "bad" };
  scene.add(mesh);
  hazards.push(mesh);
}

function spawnBurst(at, color, count) {
  for (let i = 0; i < count; i++) {
    const g = new THREE.SphereGeometry(0.06 + Math.random() * 0.08, 8, 8);
    const m = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const p = new THREE.Mesh(g, m);
    p.position.copy(at);
    p.userData = {
      vx: (Math.random() * 2 - 1) * 6,
      vy: (Math.random() * 2 - 1) * 4,
      vz: 6 + Math.random() * 8,
      life: 0.35 + Math.random() * 0.35,
      t: 0,
    };
    scene.add(p);
    particles.push(p);
  }
}

function resetWorld() {
  for (const m of [...objects, ...hazards, ...particles]) {
    scene.remove(m);
  }
  objects.length = 0;
  hazards.length = 0;
  particles.length = 0;

  score = 0;
  timeLeft = GAME_SECONDS;
  visibility = 1.0;
  updateVeil();

  player.position.set(0, 0.65, 4.0);
  playerGlow.position.copy(player.position);

  // Pre-warm spawns for immediate motion.
  for (let i = 0; i < 10; i++) makeCollectible();
  for (let i = 0; i < 7; i++) makeHazard();

  setHud();
  setGameOverUI(false);
  setStartEnabled(false);
}

function onResize() {
  if (!renderer || !camera) return;
  const w = dom.mount.clientWidth;
  const h = dom.mount.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = Math.max(1e-6, w / h);
  camera.updateProjectionMatrix();
}

function setRunning(r) {
  isRunning = r;
}

function tryStart() {
  if (isRunning) return;
  resetWorld();
  setRunning(true);
  setStartEnabled(false);
  dom.startButton.textContent = "プレイ中";
  clock = new THREE.Clock();
}

function endGame() {
  if (!isRunning) return;
  setRunning(false);
  dom.startButton.textContent = "スタート";
  setStartEnabled(true);

  const visPct = Math.round(visibility * 100);
  dom.finalScore.textContent = String(score);
  dom.finalVis.textContent = String(visPct);
  setGameOverUI(true);

  if (score > best) {
    best = score;
    writeBest(best);
  }
  setHud();
  updateShareLink();
}

function updateShareLink() {
  const visPct = Math.round(visibility * 100);
  const text = `可視性チェックで ${score}点！(可視性${visPct}%) #KGNINJA`;
  const url = location.href.replace(/#.*$/, "");
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  dom.shareButton.href = shareUrl;
}

function handleKeyboard(e, down) {
  const k = (e.key || "").toLowerCase();
  if (k === "arrowleft" || k === "a") input.left = down;
  if (k === "arrowright" || k === "d") input.right = down;
}

function onPointerDown(e) {
  // Do not preventDefault on button/link taps.
  if (e.target && (e.target.closest("button") || e.target.closest("a"))) return;
  input.pointerActive = true;
  input.pointerId = e.pointerId ?? null;
  input.pointerX = e.clientX ?? 0;
}
function onPointerMove(e) {
  if (!input.pointerActive) return;
  if (input.pointerId != null && e.pointerId != null && e.pointerId !== input.pointerId) return;
  input.pointerX = e.clientX ?? input.pointerX;
}
function onPointerUp(e) {
  if (input.pointerId != null && e.pointerId != null && e.pointerId !== input.pointerId) return;
  input.pointerActive = false;
  input.pointerId = null;
}

function wireControls() {
  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", (e) => handleKeyboard(e, true));
  window.addEventListener("keyup", (e) => handleKeyboard(e, false));

  dom.gameRoot.addEventListener("pointerdown", onPointerDown, { passive: true });
  dom.gameRoot.addEventListener("pointermove", onPointerMove, { passive: true });
  dom.gameRoot.addEventListener("pointerup", onPointerUp, { passive: true });
  dom.gameRoot.addEventListener("pointercancel", onPointerUp, { passive: true });

  // Mobile Safari compatibility: also listen for touch end on buttons.
  const startHandler = () => tryStart();
  dom.startButton.addEventListener("click", startHandler);
  dom.startButton.addEventListener("pointerup", startHandler);
  dom.startButton.addEventListener("touchend", startHandler, { passive: true });

  const retryHandler = () => {
    setGameOverUI(false);
    tryStart();
  };
  dom.retryButton.addEventListener("click", retryHandler);
  dom.retryButton.addEventListener("pointerup", retryHandler);
  dom.retryButton.addEventListener("touchend", retryHandler, { passive: true });

  dom.shareButton.addEventListener("click", () => updateShareLink());
}

function updateInput(dt) {
  let dx = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;

  if (input.pointerActive) {
    const rect = dom.gameRoot.getBoundingClientRect();
    const nx = clamp((input.pointerX - rect.left) / Math.max(1, rect.width), 0, 1);
    const worldX = (nx * 2 - 1) * 8.5;
    input.targetX = worldX;
  } else {
    input.targetX = player.position.x + dx * 8.0;
  }

  player.position.x = THREE.MathUtils.lerp(player.position.x, input.targetX, 1 - Math.pow(0.0001, dt));
  player.position.x = clamp(player.position.x, -9, 9);
  playerGlow.position.copy(player.position);
}

function stepSpawns(dt) {
  const want = isRunning ? 1 : 0;
  if (!want) return;

  // Maintain counts; add new ones as they pass player.
  while (objects.length < 12) makeCollectible();
  while (hazards.length < 9) makeHazard();
}

function recycleIfPast(arr, zLimit) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const m = arr[i];
    if (m.position.z > zLimit) {
      scene.remove(m);
      arr.splice(i, 1);
    }
  }
}

function distance2(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

function applyCollisions() {
  const p = player.position;
  const p2 = p.clone();
  p2.y += 0.25;
  const hitR2 = 1.05 * 1.05;

  for (let i = objects.length - 1; i >= 0; i--) {
    const m = objects[i];
    if (distance2(m.position, p2) < hitR2) {
      score += 10;
      visibility = clamp(visibility + 0.07, 0, 1);
      updateVeil();
      spawnBurst(m.position, 0xffe600, 10);
      scene.remove(m);
      objects.splice(i, 1);
    }
  }

  for (let i = hazards.length - 1; i >= 0; i--) {
    const m = hazards[i];
    if (distance2(m.position, p2) < hitR2) {
      score = Math.max(0, score - 8);
      visibility = clamp(visibility - 0.16, 0, 1);
      updateVeil();
      spawnBurst(m.position, 0xff395a, 14);
      scene.remove(m);
      hazards.splice(i, 1);
    }
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    const u = p.userData;
    u.t += dt;
    p.position.x += u.vx * dt;
    p.position.y += u.vy * dt;
    p.position.z += u.vz * dt;
    const left = 1 - u.t / u.life;
    p.material.opacity = clamp(left, 0, 1) * 0.85;
    if (u.t >= u.life) {
      scene.remove(p);
      particles.splice(i, 1);
    }
  }
}

function animate() {
  rafId = requestAnimationFrame(animate);

  const t = nowMs() * 0.001;
  const dt = clock ? Math.min(0.033, clock.getDelta()) : 0.016;

  // Idle animation even before start (must show animated 3D scene immediately).
  player.rotation.y = Math.sin(t * 1.6) * 0.25;
  playerGlow.material.opacity = 0.12 + 0.10 * (0.5 + 0.5 * Math.sin(t * 3.2));

  for (const m of objects) {
    m.rotation.x += dt * 1.7;
    m.rotation.y += dt * 1.2;
  }
  for (const m of hazards) {
    m.rotation.x += dt * 1.4;
    m.rotation.z += dt * 1.1;
  }

  if (isRunning) {
    timeLeft = Math.max(0, timeLeft - dt);

    // Motion toward player (positive z).
    for (const m of objects) {
      m.position.z += m.userData.v * dt;
      m.position.y += Math.sin(t * 2.1 + m.position.x) * dt * 0.6;
    }
    for (const m of hazards) {
      m.position.z += m.userData.v * dt;
      m.position.y += Math.cos(t * 2.5 + m.position.x) * dt * 0.7;
    }

    // Passive "drift" toward obscurity unless you keep collecting.
    visibility = clamp(visibility - dt * 0.010, 0, 1);
    updateVeil();

    updateInput(dt);
    stepSpawns(dt);
    applyCollisions();
    recycleIfPast(objects, 10);
    recycleIfPast(hazards, 10);
    updateParticles(dt);

    setHud();
    if (timeLeft <= 0.0001) endGame();
  } else {
    // Keep HUD stable when stopped.
    updateParticles(dt);
    recycleIfPast(particles, 30);
  }

  renderer.render(scene, camera);
}

function init() {
  best = readBest();
  setHud();
  updateShareLink();

  createRenderer();
  createScene();
  createPlayer();

  // Seed objects so there's always motion even before starting.
  for (let i = 0; i < 8; i++) makeCollectible();
  for (let i = 0; i < 6; i++) makeHazard();

  wireControls();
  onResize();

  setStartEnabled(true);
  setGameOverUI(false);
  updateVeil();

  // Ensure requestAnimationFrame loop is active immediately.
  clock = null;
  cancelAnimationFrame(rafId);
  animate();
}

init();

/* OpenClaw agent runtime shim v2 */
(() => {
  const bootTs = performance.now();
  const trace = [];
  let loadedReplay = [];
  let failureState = null;
  const maxTrace = 4000;
  const q = (sel) => document.querySelector(sel);
  const n = (value, fallback = 0) => {
    const parsed = Number.parseFloat(String(value ?? '').replace(/[^0-9.+-]/g, ''));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const pushTrace = (type, data = {}) => {
    const event = { t: Math.round(performance.now() - bootTs), type, ...data };
    trace.push(event);
    if (trace.length > maxTrace) trace.shift();
  };
  const parseTrace = (input) => {
    const errors = [];
    const events = [];
    const raw = Array.isArray(input) ? input : String(input || '').split('\n').map((line) => line.replace(/\r$/, '')).filter(Boolean);
    raw.forEach((item, index) => {
      try {
        const event = typeof item === 'string' ? JSON.parse(item) : item;
        if (!event || typeof event !== 'object') throw new Error('event is not object');
        if (typeof event.type !== 'string') throw new Error('missing type');
        events.push(event);
      } catch (err) {
        errors.push({ index, error: String(err && err.message ? err.message : err) });
      }
    });
    return { events, errors };
  };
  const readState = () => {
    const timeText = q('#timeDisplay')?.textContent || '';
    const remaining = n(timeText, 0);
    const survival = Math.max(0, Math.round(performance.now() - bootTs));
    const gameOverEl = q('#gameOverPanel');
    const gameOver = Boolean(gameOverEl && !gameOverEl.hidden && getComputedStyle(gameOverEl).display !== 'none');
    const score = n(q('#scoreDisplay')?.textContent, 0);
    if (gameOver && !failureState) failureState = remaining <= 0 ? 'timeout' : 'player_dead';
    return { score, hp: failureState === 'player_dead' ? 0 : 1, survival_time_ms: survival, game_over: gameOver, objective_complete: score > 0 || gameOver || remaining <= 0, remaining_time_s: remaining, best: n(q('#bestDisplay')?.textContent, 0), runtime_state_available: true, trace_event_count: trace.length, loaded_replay_event_count: loadedReplay.length, failure_state: failureState, updated_at_ms: Math.round(performance.now()) };
  };
  window.agentState = readState();
  window.exportMetrics = () => {
    const s = readState();
    return { score: s.score, accuracy: s.score > 0 ? 1 : 0, reaction_ms: 0, survival_time_ms: s.survival_time_ms, objective_complete: s.objective_complete, success: s.objective_complete && !s.failure_state, failure_state: s.failure_state, trace_event_count: s.trace_event_count, runtime_state_available: s.runtime_state_available, payment_required_false: true };
  };
  window.exportTrace = () => trace.map((e) => JSON.stringify(e)).join('\n');
  window.loadTrace = (input) => {
    const parsed = parseTrace(input);
    loadedReplay = parsed.events;
    if (parsed.errors.length) failureState = 'invalid_trace';
    pushTrace('trace_loaded', { event_count: loadedReplay.length, error_count: parsed.errors.length });
    window.agentState = readState();
    return { ok: parsed.errors.length === 0, event_count: loadedReplay.length, errors: parsed.errors };
  };
  window.resetAgentTrace = () => { trace.length = 0; loadedReplay = []; failureState = null; pushTrace('trace_reset'); window.agentState = readState(); };
  ['keydown', 'keyup', 'click', 'pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach((type) => {
    window.addEventListener(type, (event) => {
      const target = event.target && event.target.id ? `#${event.target.id}` : (event.target && event.target.tagName ? event.target.tagName.toLowerCase() : 'unknown');
      pushTrace(type, { key: event.key || undefined, target });
    }, { passive: true, capture: true });
  });
  setInterval(() => { window.agentState = readState(); pushTrace('state_tick', window.agentState); }, 100);
})();

