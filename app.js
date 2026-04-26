import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const root = document.getElementById("gameRoot");
const canvas = document.getElementById("gameCanvas");
const startButton = document.getElementById("startButton");
const retryButton = document.getElementById("retryButton");
const scoreDisplay = document.getElementById("scoreDisplay");
const timeDisplay = document.getElementById("timeDisplay");
const bestDisplay = document.getElementById("bestDisplay");
const gameOverPanel = document.getElementById("gameOverPanel");
const finalScore = document.getElementById("finalScore");
const resultCopy = document.getElementById("resultCopy");
const shareButton = document.getElementById("shareButton");
const jsonPreview = document.getElementById("jsonPreview");
const promptPreview = document.getElementById("promptPreview");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 100);
camera.position.set(0, 7, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const keyLight = new THREE.PointLight(0x00f5ff, 28, 30);
keyLight.position.set(-4, 7, 6);
scene.add(keyLight);
const pinkLight = new THREE.PointLight(0xff2eea, 20, 24);
pinkLight.position.set(5, 5, -5);
scene.add(pinkLight);

const laneLimit = 5.2;
const depthLimit = 4.2;
const clock = new THREE.Clock();
const keys = new Set();
const touchVector = new THREE.Vector2();
const objects = [];
const sparks = [];
let score = 0;
let best = Number(localStorage.getItem("kgninja4komaBest") || 0);
let timeLeft = 30;
let playing = false;
let spawnTimer = 0;
let hazardTimer = 0;
let playerVelocity = new THREE.Vector2();
let dragPointer = null;

bestDisplay.textContent = String(best);

const floor = new THREE.GridHelper(14, 18, 0x00f5ff, 0xff2eea);
floor.material.transparent = true;
floor.material.opacity = 0.34;
scene.add(floor);

const player = new THREE.Group();
const playerCore = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.42, 1),
  new THREE.MeshStandardMaterial({ color: 0xb6ff33, emissive: 0x4cff00, emissiveIntensity: 1.1, roughness: 0.22 })
);
const playerRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.62, 0.045, 8, 36),
  new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: 0x00b9ff, emissiveIntensity: 1.4 })
);
playerRing.rotation.x = Math.PI / 2;
player.add(playerCore, playerRing);
scene.add(player);

const particleGeometry = new THREE.BufferGeometry();
const particleCount = 90;
const particlePositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  particlePositions[i * 3] = (Math.random() - 0.5) * 14;
  particlePositions[i * 3 + 1] = Math.random() * 4 + 0.4;
  particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}
particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
const particles = new THREE.Points(
  particleGeometry,
  new THREE.PointsMaterial({ color: 0xffd23f, size: 0.06, transparent: true, opacity: 0.75 })
);
scene.add(particles);

function makeCollectible() {
  const group = new THREE.Group();
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.52, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: 0x008dff, emissiveIntensity: 1.3 })
  );
  const gem = new THREE.Mesh(
    new THREE.TetrahedronGeometry(0.28),
    new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xff7a00, emissiveIntensity: 1.4 })
  );
  gem.position.y = 0.38;
  group.add(panel, gem);
  group.userData = { type: "good", radius: 0.72, spin: 2.8 + Math.random() * 2 };
  resetObject(group, 7.5 + Math.random() * 3);
  scene.add(group);
  objects.push(group);
}

function makeHazard() {
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.52, 0),
    new THREE.MeshStandardMaterial({ color: 0xff304f, emissive: 0xff0033, emissiveIntensity: 1.6, roughness: 0.35 })
  );
  mesh.userData = { type: "bad", radius: 0.78, spin: -4 - Math.random() * 2 };
  resetObject(mesh, 7.8 + Math.random() * 3.5);
  scene.add(mesh);
  objects.push(mesh);
}

function resetObject(object, z = -depthLimit) {
  object.position.set((Math.random() - 0.5) * laneLimit * 2, 0.55, -z);
  object.userData.speed = 3.8 + Math.random() * 3.2;
}

function burst(position, color) {
  for (let i = 0; i < 10; i++) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshBasicMaterial({ color })
    );
    spark.position.copy(position);
    spark.userData.life = 0.55;
    spark.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 5, Math.random() * 3, (Math.random() - 0.5) * 5);
    scene.add(spark);
    sparks.push(spark);
  }
}

function updateOutput() {
  const panels = score < 80
    ? ["悩み", "ミス", "気づき", "保存したくなる結論"]
    : ["強い共感", "意外な失敗", "AIで逆転", "行動CTA"];
  jsonPreview.textContent = JSON.stringify({ format: "4koma", score, panels, tone: "SNS向け" });
  promptPreview.textContent = `prompt: ${panels.join(" -> ")} / ネオン調 / 短文セリフ`;
}

function resize() {
  const box = canvas.getBoundingClientRect();
  const width = Math.max(240, Math.floor(box.width));
  const height = Math.max(220, Math.floor(box.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function setShareLink() {
  const text = `4コマJSONラッシュで${score}点！SNS漫画JSONの種を30秒で回収した #KGNINJA`;
  shareButton.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function resetGame() {
  score = 0;
  timeLeft = 30;
  spawnTimer = 0;
  hazardTimer = 0;
  player.position.set(0, 0.58, 2.7);
  playerVelocity.set(0, 0);
  objects.forEach((object) => scene.remove(object));
  objects.length = 0;
  sparks.forEach((spark) => scene.remove(spark));
  sparks.length = 0;
  for (let i = 0; i < 8; i++) makeCollectible();
  for (let i = 0; i < 5; i++) makeHazard();
  scoreDisplay.textContent = "0";
  timeDisplay.textContent = "30.0";
  gameOverPanel.hidden = true;
  startButton.disabled = true;
  startButton.textContent = "プレイ中";
  playing = true;
  clock.start();
  updateOutput();
  setShareLink();
}

function endGame() {
  playing = false;
  startButton.disabled = false;
  startButton.textContent = "スタート";
  best = Math.max(best, score);
  localStorage.setItem("kgninja4komaBest", String(best));
  bestDisplay.textContent = String(best);
  finalScore.textContent = String(score);
  resultCopy.textContent = score >= 120 ? "その構成力、投稿量産に使えます。" : "もう少しでバズ漫画JSONが揃う。";
  setShareLink();
  gameOverPanel.hidden = false;
}

function inputVector() {
  const v = new THREE.Vector2();
  if (keys.has("arrowleft") || keys.has("a")) v.x -= 1;
  if (keys.has("arrowright") || keys.has("d")) v.x += 1;
  if (keys.has("arrowup") || keys.has("w")) v.y -= 1;
  if (keys.has("arrowdown") || keys.has("s")) v.y += 1;
  v.add(touchVector);
  if (v.lengthSq() > 1) v.normalize();
  return v;
}

function updateGame(delta) {
  if (playing) {
    timeLeft = Math.max(0, timeLeft - delta);
    timeDisplay.textContent = timeLeft.toFixed(1);
    if (timeLeft <= 0) endGame();
  }

  const v = inputVector();
  playerVelocity.lerp(v.multiplyScalar(7.5), 0.18);
  player.position.x = THREE.MathUtils.clamp(player.position.x + playerVelocity.x * delta, -laneLimit, laneLimit);
  player.position.z = THREE.MathUtils.clamp(player.position.z + playerVelocity.y * delta, -depthLimit, depthLimit);
  player.rotation.y += delta * 3;
  playerRing.rotation.z -= delta * 4;
  floor.position.z = (floor.position.z + delta * 2.2) % 1;
  particles.rotation.y += delta * 0.06;

  spawnTimer += delta;
  hazardTimer += delta;
  if (playing && spawnTimer > 1.15 && objects.filter((o) => o.userData.type === "good").length < 12) {
    makeCollectible();
    spawnTimer = 0;
  }
  if (playing && hazardTimer > 1.7 && objects.filter((o) => o.userData.type === "bad").length < 9) {
    makeHazard();
    hazardTimer = 0;
  }

  for (const object of objects) {
    object.position.z += object.userData.speed * delta;
    object.rotation.y += object.userData.spin * delta;
    object.rotation.x += object.userData.spin * 0.45 * delta;
    if (object.position.z > 6.6) resetObject(object, 8 + Math.random() * 4);

    if (playing && object.position.distanceTo(player.position) < object.userData.radius) {
      if (object.userData.type === "good") {
        score += 10;
        burst(object.position, 0xb6ff33);
      } else {
        score = Math.max(0, score - 18);
        timeLeft = Math.max(0, timeLeft - 1.8);
        burst(object.position, 0xff304f);
      }
      scoreDisplay.textContent = String(score);
      updateOutput();
      resetObject(object, 8 + Math.random() * 4);
    }
  }

  for (let i = sparks.length - 1; i >= 0; i--) {
    const spark = sparks[i];
    spark.userData.life -= delta;
    spark.position.addScaledVector(spark.userData.velocity, delta);
    spark.material.opacity = Math.max(0, spark.userData.life);
    if (spark.userData.life <= 0) {
      scene.remove(spark);
      sparks.splice(i, 1);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  resize();
  updateGame(Math.min(clock.getDelta(), 0.04));
  renderer.render(scene, camera);
}

window.addEventListener("keydown", (event) => keys.add(event.key.toLowerCase()));
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

document.querySelectorAll(".touch-pad button").forEach((button) => {
  const dir = button.dataset.dir;
  const set = (on) => {
    const value = on ? 1 : 0;
    if (dir === "left") touchVector.x = -value;
    if (dir === "right") touchVector.x = value;
    if (dir === "up") touchVector.y = -value;
    if (dir === "down") touchVector.y = value;
  };
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    set(true);
  });
  button.addEventListener("pointerup", () => set(false));
  button.addEventListener("pointercancel", () => set(false));
  button.addEventListener("pointerleave", () => set(false));
});

canvas.addEventListener("pointerdown", (event) => {
  dragPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragPointer || dragPointer.id !== event.pointerId) return;
  touchVector.set(
    THREE.MathUtils.clamp((event.clientX - dragPointer.x) / 56, -1, 1),
    THREE.MathUtils.clamp((event.clientY - dragPointer.y) / 56, -1, 1)
  );
});

canvas.addEventListener("pointerup", () => {
  dragPointer = null;
  touchVector.set(0, 0);
});
canvas.addEventListener("pointercancel", () => {
  dragPointer = null;
  touchVector.set(0, 0);
});

startButton.addEventListener("click", resetGame);
retryButton.addEventListener("click", resetGame);
window.addEventListener("resize", resize);

for (let i = 0; i < 7; i++) makeCollectible();
for (let i = 0; i < 4; i++) makeHazard();
updateOutput();
setShareLink();
resize();
animate();
