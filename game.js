const canvas = document.getElementById("race");
const ctx = canvas.getContext("2d");

const statusEl = document.getElementById("status");
const speedEl = document.getElementById("speed");
const timeEl = document.getElementById("time");

const arena = {
  x: 60,
  y: 60,
  width: canvas.width - 120,
  height: canvas.height - 120,
};

const finishZone = {
  x: arena.x + arena.width - 160,
  y: arena.y + 80,
  r: 48,
};

const dogs = [
  {
    name: "Leo",
    color: "#e7d3b3",
    img: "assets/leo.png",
    x: arena.x + 100,
    y: arena.y + arena.height - 140,
    angle: -Math.PI / 2,
    speed: 0,
    maxSpeed: 4.5,
    accel: 0.12,
    turn: 0.045,
    finished: false,
    time: 0,
    ai: false,
  },
  {
    name: "Lilla",
    color: "#c8c6c3",
    img: "assets/lilla.png",
    x: arena.x + 220,
    y: arena.y + arena.height - 140,
    angle: -Math.PI / 2,
    speed: 0,
    maxSpeed: 4.2,
    accel: 0.1,
    turn: 0.04,
    finished: false,
    time: 0,
    ai: true,
  },
  {
    name: "Ramon Chocho",
    color: "#f2c07f",
    img: "assets/ramon.png",
    x: arena.x + 340,
    y: arena.y + arena.height - 140,
    angle: -Math.PI / 2,
    speed: 0,
    maxSpeed: 4.0,
    accel: 0.1,
    turn: 0.04,
    finished: false,
    time: 0,
    ai: true,
  },
];

const images = new Map();

dogs.forEach((dog) => {
  const img = new Image();
  img.src = dog.img;
  images.set(dog.name, img);
});

const keys = new Set();
let lastTime = 0;
let started = false;
let gameOver = false;
let elapsed = 0;

const finishText = (order) => `Arrivo! Podio: ${order.join(", ")}. Premi R per riprovare.`;

function resetGame() {
  const baseY = arena.y + arena.height - 140;
  [0, 1, 2].forEach((i) => {
    const dog = dogs[i];
    dog.x = arena.x + 100 + i * 120;
    dog.y = baseY;
    dog.angle = -Math.PI / 2;
    dog.speed = 0;
    dog.finished = false;
    dog.time = 0;
  });
  started = false;
  gameOver = false;
  elapsed = 0;
  statusEl.textContent = "Pronto. Premi FRECCIA SU per partire.";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function keepInBounds(dog) {
  dog.x = clamp(dog.x, arena.x + 25, arena.x + arena.width - 25);
  dog.y = clamp(dog.y, arena.y + 25, arena.y + arena.height - 25);
}

function controlPlayer(dog) {
  if (dog.finished) return;

  if (keys.has("ArrowUp")) {
    dog.speed = Math.min(dog.maxSpeed, dog.speed + dog.accel);
    started = true;
  } else if (keys.has("ArrowDown")) {
    dog.speed = Math.max(-dog.maxSpeed / 2, dog.speed - dog.accel * 1.2);
    started = true;
  } else {
    dog.speed *= 0.97;
  }

  if (keys.has("ArrowLeft")) {
    dog.angle -= dog.turn * (dog.speed >= 0 ? 1 : -1);
  }

  if (keys.has("ArrowRight")) {
    dog.angle += dog.turn * (dog.speed >= 0 ? 1 : -1);
  }

  dog.speed *= 0.995;
}

function controlAI(dog) {
  if (dog.finished) return;

  const dx = finishZone.x - dog.x;
  const dy = finishZone.y - dog.y;
  const targetAngle = Math.atan2(dy, dx);
  const diff = Math.atan2(Math.sin(targetAngle - dog.angle), Math.cos(targetAngle - dog.angle));
  dog.angle += clamp(diff, -dog.turn, dog.turn);

  const distance = Math.hypot(dx, dy);
  const targetSpeed = distance < 90 ? 1.2 : dog.maxSpeed * 0.9;

  if (dog.speed < targetSpeed) {
    dog.speed += dog.accel * 0.9;
  } else {
    dog.speed *= 0.98;
  }
}

function updateDog(dog) {
  dog.x += Math.cos(dog.angle) * dog.speed;
  dog.y += Math.sin(dog.angle) * dog.speed;
  keepInBounds(dog);
}

function checkFinish(dog) {
  if (dog.finished) return;
  const distance = Math.hypot(dog.x - finishZone.x, dog.y - finishZone.y);
  if (distance <= finishZone.r && Math.abs(dog.speed) < 0.9) {
    dog.finished = true;
    dog.speed = 0;
    dog.time = elapsed;
  }
}

function drawTrack() {
  ctx.fillStyle = "#d6c7b2";
  ctx.fillRect(arena.x, arena.y, arena.width, arena.height);

  ctx.strokeStyle = "#8a6f4a";
  ctx.lineWidth = 6;
  ctx.strokeRect(arena.x, arena.y, arena.width, arena.height);

  ctx.setLineDash([14, 10]);
  ctx.strokeStyle = "rgba(79, 60, 34, 0.4)";
  ctx.lineWidth = 3;
  ctx.strokeRect(arena.x + 22, arena.y + 22, arena.width - 44, arena.height - 44);
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(182, 76, 42, 0.85)";
  ctx.beginPath();
  ctx.arc(finishZone.x, finishZone.y, finishZone.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff7e3";
  ctx.beginPath();
  ctx.arc(finishZone.x, finishZone.y, finishZone.r - 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#6a4a2b";
  ctx.font = "bold 16px 'Trebuchet MS'";
  ctx.textAlign = "center";
  ctx.fillText("TRAGUARDO", finishZone.x, finishZone.y + 6);

  ctx.fillStyle = "#6a4a2b";
  ctx.fillRect(arena.x + 60, arena.y + arena.height - 80, 180, 10);
  ctx.fillStyle = "#fff7e3";
  ctx.fillRect(arena.x + 60, arena.y + arena.height - 80, 180, 4);
  ctx.fillStyle = "#6a4a2b";
  ctx.font = "bold 14px 'Trebuchet MS'";
  ctx.textAlign = "left";
  ctx.fillText("PARTENZA", arena.x + 60, arena.y + arena.height - 90);
}

function drawDog(dog) {
  ctx.save();
  ctx.translate(dog.x, dog.y);
  ctx.rotate(dog.angle + Math.PI / 2);
  const img = images.get(dog.name);
  if (img && img.complete && img.naturalWidth > 0) {
    const size = 64;
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
  } else {
    ctx.fillStyle = dog.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3d2e1c";
    ctx.beginPath();
    ctx.arc(0, -6, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = "#2b2417";
  ctx.font = "bold 14px 'Trebuchet MS'";
  ctx.textAlign = "center";
  ctx.fillText(dog.name, dog.x, dog.y - 38);
}

function drawHUD() {
  speedEl.textContent = Math.abs(dogs[0].speed).toFixed(1);
  timeEl.textContent = elapsed.toFixed(1);
}

function updateStatus() {
  if (gameOver) return;
  if (!started) {
    statusEl.textContent = "Pronto. Premi FRECCIA SU per partire.";
    return;
  }

  const finishedCount = dogs.filter((dog) => dog.finished).length;
  if (finishedCount === dogs.length) {
    const order = [...dogs]
      .sort((a, b) => a.time - b.time)
      .map((dog) => `${dog.name} (${dog.time.toFixed(1)}s)`);
    statusEl.textContent = finishText(order);
    gameOver = true;
  } else {
    statusEl.textContent = "Guida e fermati nel traguardo!";
  }
}

function tick(timestamp) {
  const delta = (timestamp - lastTime) / 1000 || 0;
  lastTime = timestamp;
  if (started && !gameOver) {
    elapsed += delta;
  }

  controlPlayer(dogs[0]);
  controlAI(dogs[1]);
  controlAI(dogs[2]);

  dogs.forEach(updateDog);
  dogs.forEach(checkFinish);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawTrack();
  dogs.forEach(drawDog);
  drawHUD();
  updateStatus();

  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
    keys.add(event.key);
  }

  if (event.key.toLowerCase() === "r") {
    resetGame();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

resetGame();
requestAnimationFrame(tick);
