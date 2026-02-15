const canvas = document.getElementById("race");
const ctx = canvas.getContext("2d");

const statusEl = document.getElementById("status");
const speedEl = document.getElementById("speed");
const timeEl = document.getElementById("time");
const pizzasEl = document.getElementById("pizzas");
const pizzasLillaEl = document.getElementById("pizzas-lilla");
const pizzasRamonEl = document.getElementById("pizzas-ramon");

const road = {
  centerX: canvas.width / 2,
  width: 220,
  startY: 2200,
  endY: -200,
};

const finishZone = { x: road.centerX, y: -80, r: 60 };

const dogs = [
  {
    name: "Leo",
    color: "#e7d3b3",
    img: "assets/leo.png",
    x: road.centerX,
    y: 2000,
    speed: 0,
    maxSpeed: 4.8,
    accel: 0.14,
    pizzas: 0,
    ai: false,
    finished: false,
  },
  {
    name: "Lilla",
    color: "#c8c6c3",
    img: "assets/lilla.png",
    x: road.centerX - 60,
    y: 2040,
    speed: 0,
    maxSpeed: 2.4,
    accel: 0.07,
    pizzas: 0,
    ai: true,
    finished: false,
  },
  {
    name: "Ramon Chocho",
    color: "#f2c07f",
    img: "assets/ramon.png",
    x: road.centerX + 60,
    y: 2060,
    speed: 0,
    maxSpeed: 2.3,
    accel: 0.07,
    pizzas: 0,
    ai: true,
    finished: false,
  },
];

const images = new Map();
const keys = new Set();
let lastTime = 0;
let started = false;
let gameOver = false;
let elapsed = 0;
let cameraY = 0;
let finishOrder = [];

const pizzaCount = 22;
let pizzas = [];
let palms = [];

function generatePizzas() {
  pizzas = [];
  for (let i = 0; i < pizzaCount; i += 1) {
    const t = (i + 1) / (pizzaCount + 1);
    const y = road.startY + (road.endY - road.startY) * t;
    const laneOffset = (i % 3 - 1) * 70;
    pizzas.push({
      x: road.centerX + laneOffset,
      y,
      collected: false,
    });
  }
}

function generatePalms() {
  palms = [];
  for (let y = road.startY + 100; y > road.endY - 200; y -= 180) {
    palms.push({ x: road.centerX - road.width / 2 - 70, y });
    palms.push({ x: road.centerX + road.width / 2 + 70, y: y - 80 });
  }
}

function resetGame() {
  dogs[0].x = road.centerX;
  dogs[0].y = 2000;
  dogs[1].x = road.centerX - 60;
  dogs[1].y = 2040;
  dogs[2].x = road.centerX + 60;
  dogs[2].y = 2060;
  dogs.forEach((dog) => {
    dog.speed = 0;
    dog.pizzas = 0;
    dog.finished = false;
  });
  finishOrder = [];
  elapsed = 0;
  started = false;
  gameOver = false;
  generatePizzas();
  generatePalms();
  statusEl.textContent = "Pronto. Premi FRECCIA SU per partire.";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isOnRoad(x) {
  return Math.abs(x - road.centerX) <= road.width / 2;
}

function controlPlayer(dog) {
  if (dog.finished) return;

  if (keys.has("ArrowUp")) {
    dog.speed = Math.min(dog.maxSpeed, dog.speed + dog.accel);
    started = true;
  } else if (keys.has("ArrowDown")) {
    dog.speed = Math.max(0, dog.speed - dog.accel * 1.4);
    started = true;
  } else {
    dog.speed *= 0.985;
  }

  const sideStep = 7.5;
  if (keys.has("ArrowLeft")) {
    dog.x -= sideStep;
  }
  if (keys.has("ArrowRight")) {
    dog.x += sideStep;
  }

  dog.x = clamp(dog.x, road.centerX - road.width / 2 + 18, road.centerX + road.width / 2 - 18);
}

function controlAI(dog) {
  if (dog.finished) return;

  const targetPizza = pizzas.find((pizza) => !pizza.collected);
  const targetX = targetPizza ? targetPizza.x : road.centerX;

  if (dog.speed < dog.maxSpeed * 0.92) {
    dog.speed += dog.accel * 0.9;
  } else {
    dog.speed *= 0.995;
  }

  const diff = clamp(targetX - dog.x, -4, 4);
  dog.x += diff;
  dog.x = clamp(dog.x, road.centerX - road.width / 2 + 18, road.centerX + road.width / 2 - 18);
}

function updateDog(dog) {
  dog.y -= dog.speed;
  if (!isOnRoad(dog.x)) {
    dog.speed *= 0.92;
  }
}

function checkPizzas(dog) {
  pizzas.forEach((pizza) => {
    if (pizza.collected) return;
    const distance = Math.hypot(dog.x - pizza.x, dog.y - pizza.y);
    if (distance < 28) {
      pizza.collected = true;
      dog.pizzas += 1;
    }
  });
}

function checkFinish(dog) {
  if (dog.finished) return;
  const distance = Math.hypot(dog.x - finishZone.x, dog.y - finishZone.y);
  if (distance <= finishZone.r && dog.speed < 0.8) {
    dog.finished = true;
    dog.speed = 0;
    finishOrder.push(dog);
  }
}

function drawMiamiBackground() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.arc(140 + i * 140, 90 + (i % 2) * 18, 32, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.arc(220 + i * 150, 40 + (i % 2) * 20, 22, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPalm(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#3b8452";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, 40);
  ctx.lineTo(-6, -40);
  ctx.stroke();

  ctx.fillStyle = "#4ac77a";
  ctx.beginPath();
  ctx.ellipse(-18, -48, 30, 14, -0.6, 0, Math.PI * 2);
  ctx.ellipse(12, -58, 30, 14, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRoad() {
  ctx.lineWidth = road.width + 60;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(road.centerX, road.startY - cameraY);
  ctx.lineTo(road.centerX, road.endY - cameraY);
  ctx.stroke();

  ctx.lineWidth = road.width;
  ctx.strokeStyle = "#2d2a38";
  ctx.beginPath();
  ctx.moveTo(road.centerX, road.startY - cameraY);
  ctx.lineTo(road.centerX, road.endY - cameraY);
  ctx.stroke();

  ctx.lineWidth = road.width - 20;
  ctx.strokeStyle = "#3b3848";
  ctx.beginPath();
  ctx.moveTo(road.centerX, road.startY - cameraY);
  ctx.lineTo(road.centerX, road.endY - cameraY);
  ctx.stroke();

  ctx.setLineDash([24, 18]);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#f5d86a";
  ctx.beginPath();
  ctx.moveTo(road.centerX, road.startY - cameraY);
  ctx.lineTo(road.centerX, road.endY - cameraY);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawFinish() {
  const y = finishZone.y - cameraY;
  ctx.fillStyle = "rgba(255, 107, 107, 0.9)";
  ctx.beginPath();
  ctx.arc(finishZone.x, y, finishZone.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff5d6";
  ctx.beginPath();
  ctx.arc(finishZone.x, y, finishZone.r - 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#502446";
  ctx.font = "bold 16px 'Trebuchet MS'";
  ctx.textAlign = "center";
  ctx.fillText("TRAGUARDO", finishZone.x, y + 6);
}

function drawPizza(pizza) {
  if (pizza.collected) return;
  const y = pizza.y - cameraY;
  if (y < -40 || y > canvas.height + 40) return;
  ctx.save();
  ctx.translate(pizza.x, y);
  ctx.fillStyle = "#f2c94c";
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e67e22";
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d35400";
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.arc(Math.cos(i) * 6, Math.sin(i) * 6, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDog(dog) {
  const y = dog.y - cameraY;
  if (y < -60 || y > canvas.height + 60) return;

  ctx.save();
  ctx.translate(dog.x, y);
  const img = images.get(dog.name);
  if (img && img.complete && img.naturalWidth > 0) {
    const size = 62;
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
  } else {
    ctx.fillStyle = dog.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2b1d11";
    ctx.beginPath();
    ctx.arc(0, -6, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = "#1f1b2a";
  ctx.font = "bold 14px 'Trebuchet MS'";
  ctx.textAlign = "center";
  ctx.fillText(dog.name, dog.x, y - 36);

  if (finishOrder[0] === dog) {
    drawCrown(dog.x, y - 44);
  }
}

function drawCrown(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#f4d35e";
  ctx.strokeStyle = "#c79b2f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-22, 10);
  ctx.lineTo(-14, -12);
  ctx.lineTo(-4, 6);
  ctx.lineTo(8, -14);
  ctx.lineTo(22, 8);
  ctx.lineTo(22, 22);
  ctx.lineTo(-22, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ff6b6b";
  ctx.beginPath();
  ctx.arc(-8, 4, 4, 0, Math.PI * 2);
  ctx.arc(6, 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHUD() {
  speedEl.textContent = Math.abs(dogs[0].speed).toFixed(1);
  timeEl.textContent = elapsed.toFixed(1);
  pizzasEl.textContent = dogs[0].pizzas;
  pizzasLillaEl.textContent = dogs[1].pizzas;
  pizzasRamonEl.textContent = dogs[2].pizzas;
}

function updateStatus() {
  if (gameOver) return;
  if (!started) {
    statusEl.textContent = "Pronto. Premi FRECCIA SU per partire.";
    return;
  }

  const finishedCount = dogs.filter((dog) => dog.finished).length;
  if (finishedCount === dogs.length) {
    const ranking = finishOrder.map((dog, idx) => `${idx + 1}. ${dog.name}`);
    statusEl.textContent = `Arrivo completato! Classifica: ${ranking.join(" - ")}.`;
    gameOver = true;
  } else {
    statusEl.textContent = "Corri dritto, raccogli pizze e arriva al traguardo!";
  }
}

function updateCamera() {
  const target = dogs[0].y - 560;
  cameraY = clamp(target, road.endY - 200, road.startY - canvas.height + 200);
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
  dogs.forEach(checkPizzas);
  dogs.forEach(checkFinish);

  updateCamera();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMiamiBackground();
  drawRoad();
  palms.forEach((palm) => {
    const y = palm.y - cameraY;
    if (y > -120 && y < canvas.height + 120) {
      drawPalm(palm.x, y);
    }
  });
  pizzas.forEach(drawPizza);
  drawFinish();
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

dogs.forEach((dog) => {
  const img = new Image();
  img.src = dog.img;
  images.set(dog.name, img);
});

resetGame();
requestAnimationFrame(tick);
