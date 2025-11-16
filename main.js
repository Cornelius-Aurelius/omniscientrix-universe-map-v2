/* ---------------------------------------------------------
   Omniscientrix vΩ Engine — Phase 2 (Clean Build)
   Cosmic Node System + Popup UI + Orbital Motion
---------------------------------------------------------- */

const canvas = document.getElementById("universe");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// STARFIELD ------------------------------------------------
const STAR_COUNT = 700;
const stars = [];
for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * canvas.width
  });
}

function drawStars() {
  for (let i = 0; i < STAR_COUNT; i++) {
    const star = stars[i];

    star.z -= 0.7;
    if (star.z <= 0) star.z = canvas.width;

    const k = 128 / star.z;
    const x = star.x * k + canvas.width / 2;
    const y = star.y * k + canvas.height / 2;

    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

    const size = (1 - star.z / canvas.width) * 2;
    ctx.fillStyle = "#00A7FF";
    ctx.fillRect(x, y, size, size);
  }
}

// POPUP ----------------------------------------------------
const popup = document.createElement("div");
popup.style.position = "fixed";
popup.style.maxWidth = "260px";
popup.style.padding = "12px";
popup.style.fontSize = "12px";
popup.style.background = "rgba(0,0,0,0.82)";
popup.style.border = "1px solid #00A7FF";
popup.style.borderRadius = "10px";
popup.style.color = "#fff";
popup.style.backdropFilter = "blur(10px)";
popup.style.display = "none";
popup.style.zIndex = "10";
document.body.appendChild(popup);

function showPopup(x, y, content) {
  popup.innerHTML = content;
  popup.style.left = x + 10 + "px";
  popup.style.top = y + 10 + "px";
  popup.style.display = "block";
}

function hidePopup() {
  popup.style.display = "none";
}

// DATA -----------------------------------------------------
let nodes = [], laws = [], frequencies = [], tiers = [];

async function loadData() {
  const n = await fetch("data/nodes.json").then(r => r.json());
  const l = await fetch("data/laws.json").then(r => r.json());
  const f = await fetch("data/frequencies.json").then(r => r.json());
  const t = await fetch("data/tiers.json").then(r => r.json());

  nodes = n.nodes;
  laws = l.laws;
  frequencies = f.frequencies;
  tiers = t.tiers;

  for (let node of nodes) {
    node.angle = Math.random() * Math.PI * 2;
    node.radius = Math.sqrt(node.x * node.x + node.y * node.y);
    node.speed = 0.0007 + Math.random() * 0.0015;
  }

  animate();
}
loadData();

// GEOMETRY -------------------------------------------------
function drawCircle(x, y, size, color) {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawTriangle(x, y, size, color) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x - size, y + size);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawDiamond(x, y, size, color) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawHexStar(x, y, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;

  const angle = Math.PI / 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    ctx.lineTo(
      x + size * Math.cos(angle * i),
      y + size * Math.sin(angle * i)
    );
  }
  ctx.closePath();
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// DRAW NODES ----------------------------------------------
function drawNode(node) {
  let x = canvas.width / 2 + Math.cos(node.angle) * node.radius;
  let y = canvas.height / 2 + Math.sin(node.angle) * node.radius;

  node.currentX = x;
  node.currentY = y;

  const color = node.color || "#00A7FF";

  if (node.type === "central") drawHexStar(x, y, node.size, color);
  if (node.type === "tier") drawCircle(x, y, node.size, color);
  if (node.type === "frequency") drawTriangle(x, y, node.size, color);
  if (node.type === "law") drawDiamond(x, y, node.size, color);

  node.angle += node.speed;
}

// CLICK EVENTS --------------------------------------------
canvas.addEventListener("click", function (e) {
  const mx = e.clientX;
  const my = e.clientY;

  for (let node of nodes) {
    const dx = mx - node.currentX;
    const dy = my - node.currentY;
    if (Math.sqrt(dx * dx + dy * dy) < node.size + 8) {

      if (node.type === "law") {
        const law = laws.find(l => l.id === node.lawId);
        showPopup(mx, my, `
          <b>${law.title}</b><br><br>
          <i>${law.formula}</i><br><br>
          ${law.summary}
        `);
      }

      if (node.type === "frequency") {
        const fr = frequencies.find(f => f.id === node.frequencyId);
        showPopup(mx, my, `
          <b>${fr.name}</b><br><br>
          Range: ${fr.range}<br><br>
          <i>${fr.formula}</i><br><br>
          ${fr.description}
        `);
      }

      if (node.type === "tier") {
        const tr = tiers.find(t => t.id === node.tier);
        showPopup(mx, my, `
          <b>${tr.name}</b><br><br>
          ${tr.description}
        `);
      }

      if (node.type === "central") {
        showPopup(mx, my, `
          <b>Omniscientrix Core</b><br><br>
          vΩ Universal Informational Engine
        `);
      }

      return;
    }
  }

  hidePopup();
});

// ANIMATION ------------------------------------------------
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawStars();

  for (let node of nodes) {
    drawNode(node);
  }

  requestAnimationFrame(animate);
}
