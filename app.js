import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const PAYMENT_URL = "https://buy.stripe.com/test_eVqdRacod35kdu8e8n2cg01";
const GAME_SECONDS = 30;

const canvas = document.getElementById("gameCanvas");
const startButton = document.getElementById("startButton");
const retryButton = document.getElementById("retryButton");
const startPanel = document.getElementById("startPanel");
const gameOverPanel = document.getElementById("gameOverPanel");
const scoreDisplay = document.getElementById("scoreDisplay");
const timeDisplay = document.getElementById("timeDisplay");
const bestDisplay = document.getElementById("bestDisplay");
const supportLink = document.getElementById("supportLink");
const shareButton = document.getElementById("shareButton");
const jsonOutput = document.getElementById("jsonOutput");
const promptOutput = document.getElementById("promptOutput");
const resultLine = document.getElementById("resultLine");

supportLink.href = PAYMENT_URL;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 100);
camera.position.set(0, 6.8, 9.5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true
});
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const clock = new THREE.Clock();
const keys = new Set();
const objects = [];
const particles = [];
let player;
let score = 0;
let timeLeft = GAME_SECONDS;
let running = false;
let gameEnded = false;
let spawnTimer = 0;
let bestScore = Number(localStorage.getItem("kgninjaBestScore") || 0);

bestDisplay.textContent = String(bestScore);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(13, 13, 18, 18),
  new THREE.MeshBasicMaterial({
    color: 0x0b173d,
    transparent: true,
    opacity: 0.34,
    wireframe: true
  })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const ambient = new THREE.AmbientLight(0xffffff, 0.9);
const pulseLight = new THREE.PointLight(0xff2bd6, 5, 24);
pulseLight.position.set(0, 5, 4);
scene.add(ambient, pulseLight);

const laneMaterial = new THREE.MeshBasicMaterial({
  color: 0x14f7ff,
  transparent: true,
  opacity: 0.38
});

for (let i = -2; i <= 2; i += 1) {
  const lane = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 13), laneMaterial);
  lane.position.set(i * 1.8, 0.015, 0);
  scene.add(lane);
}

function createPlayer() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.48, 1.05, 4),
    new THREE.MeshStandardMaterial({
      color: 0x14f7ff,
      emissive: 0x063cff,
      metalness: 0.45,
      roughness: 0.28
    })
  );
  body.rotation.y = Math.PI / 4;
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 20, 20),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x6dff5f,
      emissiveIntensity: 1.4
    })
  );
  core.position.y = 0.22;
  group.add(body, core);
  group.position.set(0, 0.55, 3.2);
  return group;
}

player = createPlayer();
scene.add(player);

function makeCollectible() {
  const good = Math.random() > 0.28;
  const geometry = good ? new THREE.BoxGeometry(0.58, 0.58, 0.58) : new THREE.OctahedronGeometry(0.48);
  const material = new THREE.MeshStandardMaterial({
    color: good ? (Math.random() > 0.5 ? 0x6dff5f : 0x14f7ff) : 0xff3d42,
    emissive: good ? 0x0bd35c : 0x9b0008,
    emissiveIntensity: good ? 1.2 : 1.6,
    metalness: 0.25,
    roughness: 0.18
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set((Math.random() - 0.5) * 8.2, 0.55, -6.3);
  mesh.userData = {
    type: good ? "json" : "bug",
    speed: good ? 3.6 + Math.random() * 1.4 : 4.6 + Math.random() * 1.8,
    spin: (Math.random() + 0.8) * (good ? 2.2 : -3.2)
  };
  scene.add(mesh);
  objects.push(mesh);
}

function burst(position, color) {
  for (let i = 0; i < 12; i += 1) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.88 })
    );
    particle.position.copy(position);
    particle.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 4,
      Math.random() * 2.8,
      (Math.random() - 0.5) * 4
    );
    particle.userData.life = 0.55;
    scene.add(particle);
    particles.push(particle);
  }
}

function buildComicJson(finalScore) {
  const tone = finalScore >= 180 ? "強気でテンポの速い" : finalScore >= 90 ? "親しみやすい" : "ゆるく共感を取る";
  return {
    title: "AI投稿クリエイターの締切突破",
    target: "SNSで投稿を量産したい個人クリエイター",
    format: "4コマ漫画",
    score: finalScore,
    panels: [
      { panel: 1, scene: "机の前でネタ出しに詰まる", caption: "今日も投稿ネタが決まらない" },
      { panel: 2, scene: "AIに雑な依頼をして漫画が崩れる", caption: "プロンプトが甘いと全部ブレる" },
      { panel: 3, scene: "JSONでキャラ・構図・オチを固定する", caption: "型に入れると一気に安定" },
      { panel: 4, scene: "完成した4コマをSNSに投稿する", caption: "量産するなら設計を先に作る" }
    ],
    style: `${tone} SNS向け、ネオン配色、読みやすい日本語セリフ`,
    call_to_action: "保存して次の投稿テンプレに使う"
  };
}

function buildPrompt(finalScore) {
  return `次のJSONを厳密に守り、日本語SNS向け4コマ漫画を生成してください。スコア${finalScore}相当の勢いで、各コマの構図、表情、セリフ、オチを崩さず、スマホ画面で読みやすくしてください。 #KGNINJA`;
}

function updateOutputs(finalScore = score) {
  const comic = buildComicJson(finalScore);
  jsonOutput.textContent = JSON.stringify(comic, null, 2);
  promptOutput.textContent = buildPrompt(finalScore);
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(240, Math.floor(rect.width));
  const height = Math.max(220, Math.floor(rect.height));
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function resetGame() {
  score = 0;
  timeLeft = GAME_SECONDS;
  spawnTimer = 0;
  running = true;
  gameEnded = false;
  player.position.set(0, 0.55, 3.2);
  objects.splice(0).forEach((object) => scene.remove(object));
  particles.splice(0).forEach((particle) => scene.remove(particle));
  scoreDisplay.textContent = "0";
  timeDisplay.textContent = GAME_SECONDS.toFixed(1);
  gameOverPanel.hidden = true;
  startPanel.hidden = true;
  updateOutputs(0);
  for (let i = 0; i < 8; i += 1) makeCollectible();
}

function endGame() {
  running = false;
  gameEnded = true;
  const finalScore = Math.max(0, Math.round(score));
  if (finalScore > bestScore) {
    bestScore = finalScore;
    localStorage.setItem("kgninjaBestScore", String(bestScore));
  }
  scoreDisplay.textContent = String(finalScore);
  bestDisplay.textContent = String(bestScore);
  resultLine.textContent = `スコア ${finalScore} / 最高 ${bestScore}`;
  updateOutputs(finalScore);
  const shareText = `4コマJSON NINJAで${finalScore}点！SNS漫画JSONとpromptを生成した #KGNINJA`;
  shareButton.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  gameOverPanel.hidden = false;
}

function movePlayer(delta) {
  const direction = new THREE.Vector3();
  if (keys.has("ArrowLeft") || keys.has("KeyA") || keys.has("left")) direction.x -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD") || keys.has("right")) direction.x += 1;
  if (keys.has("ArrowUp") || keys.has("KeyW") || keys.has("up")) direction.z -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS") || keys.has("down")) direction.z += 1;
  if (direction.lengthSq() > 0) {
    direction.normalize().multiplyScalar(5.6 * delta);
    player.position.add(direction);
  }
  player.position.x = THREE.MathUtils.clamp(player.position.x, -4.6, 4.6);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -4.2, 4.4);
  player.rotation.y += (direction.x * 3 - player.rotation.y) * 0.12;
}

function updateObjects(delta) {
  spawnTimer -= delta;
  if (spawnTimer <= 0 && running) {
    makeCollectible();
    spawnTimer = 0.22 + Math.random() * 0.28;
  }

  for (let i = objects.length - 1; i >= 0; i -= 1) {
    const object = objects[i];
    object.position.z += object.userData.speed * delta;
    object.rotation.x += object.userData.spin * delta;
    object.rotation.y += object.userData.spin * 1.3 * delta;

    if (running && object.position.distanceTo(player.position) < 0.78) {
      if (object.userData.type === "json") {
        score += 10;
        burst(object.position, 0x6dff5f);
      } else {
        score = Math.max(0, score - 18);
        timeLeft = Math.max(0, timeLeft - 1.2);
        burst(object.position, 0xff3d42);
      }
      scoreDisplay.textContent = String(Math.round(score));
      scene.remove(object);
      objects.splice(i, 1);
      continue;
    }

    if (object.position.z > 6.4) {
      scene.remove(object);
      objects.splice(i, 1);
    }
  }
}

function updateParticles(delta) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.userData.life -= delta;
    particle.position.addScaledVector(particle.userData.velocity, delta);
    particle.userData.velocity.y -= 4.5 * delta;
    particle.material.opacity = Math.max(0, particle.userData.life / 0.55);
    if (particle.userData.life <= 0) {
      scene.remove(particle);
      particles.splice(i, 1);
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  floor.rotation.z = Math.sin(elapsed * 0.55) * 0.035;
  pulseLight.intensity = 4.2 + Math.sin(elapsed * 5) * 1.6;
  player.rotation.x = Math.sin(elapsed * 6) * 0.08;
  player.position.y = 0.58 + Math.sin(elapsed * 7) * 0.07;

  if (running) {
    timeLeft = Math.max(0, timeLeft - delta);
    timeDisplay.textContent = timeLeft.toFixed(1);
    movePlayer(delta);
    updateObjects(delta);
    if (timeLeft <= 0) endGame();
  } else if (!gameEnded) {
    updateObjects(delta * 0.55);
  }

  updateParticles(delta);
  renderer.render(scene, camera);
}

startButton.addEventListener("click", resetGame);
retryButton.addEventListener("click", resetGame);

window.addEventListener("keydown", (event) => {
  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

document.querySelectorAll(".pad").forEach((button) => {
  const dir = button.dataset.dir;
  const press = (event) => {
    event.preventDefault();
    keys.add(dir);
  };
  const release = (event) => {
    event.preventDefault();
    keys.delete(dir);
  };
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

window.addEventListener("resize", resize);
resize();
updateOutputs(0);
for (let i = 0; i < 10; i += 1) makeCollectible();
animate();
