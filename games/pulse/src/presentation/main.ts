import "./style.css";
import { PulseController } from "../application/PulseController";
import type { Snapshot } from "../application/ports";
import { angularDistance, TAU } from "../domain/rules";
import { bestStore, BrowserSound, frameClock } from "../infrastructure/browser";

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element ${selector}`);
  return element;
}

const canvas = required<HTMLCanvasElement>("#dial");
const context = canvas.getContext("2d");
if (!context) throw new Error("Canvas 2D unavailable");
const ctx = context;
const actionButton = required<HTMLButtonElement>("#action");
const pauseButton = required<HTMLButtonElement>("#pause");
const resetButton = required<HTMLButtonElement>("#reset");
const soundButton = required<HTMLButtonElement>("#sound");
const scoreLabel = required<HTMLElement>("#score");
const bestLabel = required<HTMLElement>("#best");
const hitsLabel = required<HTMLElement>("#hits");
const statusLabel = required<HTMLElement>("#status");
const feedbackLabel = required<HTMLElement>("#feedback");
const roundLabel = required<HTMLElement>("#round-label");
const sound = new BrowserSound();
const game = new PulseController({
  random: Math.random,
  clock: frameClock,
  store: bestStore,
  effects: sound,
});
let displaySize = 540;
let lastSnapshot = game.snapshot;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function fitCanvas(): void {
  const bounds = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  displaySize = Math.max(1, bounds.width);
  canvas.width = Math.round(displaySize * dpr);
  canvas.height = Math.round(displaySize * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw(lastSnapshot);
}

function arc(
  radius: number,
  from: number,
  to: number,
  width: number,
  color: string,
  glow = 0,
): void {
  ctx.beginPath();
  ctx.arc(0, 0, radius, from, to);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.shadowBlur = glow;
  ctx.shadowColor = color;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function draw(snapshot: Snapshot): void {
  if (!ctx) return;
  const size = displaySize;
  const mid = size / 2;
  const radius = size * 0.342;
  const time = reducedMotion.matches ? 0 : performance.now() / 1000;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(mid, mid);

  const haze = ctx.createRadialGradient(0, 0, 8, 0, 0, size * 0.48);
  haze.addColorStop(0, "#36304670");
  haze.addColorStop(0.65, "#251e3766");
  haze.addColorStop(1, "#11132300");
  ctx.fillStyle = haze;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.48, 0, TAU);
  ctx.fill();

  for (let index = 0; index < 96; index++) {
    const angle = (index / 96) * TAU;
    const long = index % 8 === 0;
    const inner = radius + size * (long ? 0.065 : 0.079);
    const outer = radius + size * 0.092;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.strokeStyle = long ? "#9e8ea94f" : "#776e862a";
    ctx.lineWidth = long ? 1.5 : 1;
    ctx.stroke();
  }
  arc(radius, 0, TAU, size * 0.011, "#6b65775c");
  arc(radius - size * 0.05, 0, TAU, 1, "#b5a6c32d");
  arc(radius + size * 0.034, 0, TAU, 1, "#b5a6c321");

  const targetStart = snapshot.target - snapshot.halfWindow;
  const targetEnd = snapshot.target + snapshot.halfWindow;
  arc(radius, targetStart, targetEnd, size * 0.035, "#e3a85d", 17);
  arc(radius, targetStart, targetEnd, size * 0.015, "#ffe3a1", 17);
  arc(radius + size * 0.031, snapshot.target - 0.026, snapshot.target + 0.026, 2.2, "#fff3cf", 12);
  for (const boundary of [targetStart, targetEnd]) {
    const bx = Math.cos(boundary);
    const by = Math.sin(boundary);
    ctx.beginPath();
    ctx.moveTo(bx * (radius - size * 0.026), by * (radius - size * 0.026));
    ctx.lineTo(bx * (radius + size * 0.026), by * (radius + size * 0.026));
    ctx.strokeStyle = "#ffe0aa8a";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const markerX = Math.cos(snapshot.angle) * radius;
  const markerY = Math.sin(snapshot.angle) * radius;
  const pulse = 1 + (reducedMotion.matches ? 0 : 0.06 * Math.sin(time * 8));
  const active = snapshot.phase !== "lost";
  const markerColor = active ? "#ffebdb" : "#f784aa";
  arc(radius, snapshot.angle - snapshot.direction * 0.25, snapshot.angle, size * 0.012, active ? "#fa90c0" : "#f26b91", 10);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(markerX * 0.85, markerY * 0.85);
  ctx.strokeStyle = active ? "#ffd2ea4a" : "#ffa0bd35";
  ctx.lineWidth = 1.3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(markerX, markerY, size * 0.038 * pulse, 0, TAU);
  ctx.fillStyle = active ? "#ff8ebfb1" : "#ff748ab3";
  ctx.shadowBlur = 24;
  ctx.shadowColor = active ? "#ffc3dd" : "#fb7c9c";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(markerX, markerY, size * 0.017, 0, TAU);
  ctx.fillStyle = markerColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, size * 0.008, 0, TAU);
  ctx.fillStyle = "#fbe8e9";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.16, 0, TAU);
  ctx.strokeStyle = "#a696b021";
  ctx.lineWidth = 1;
  ctx.stroke();

  if (snapshot.phase === "ready" || snapshot.phase === "paused" || snapshot.phase === "lost") {
    ctx.fillStyle = snapshot.phase === "lost" ? "#1a102477" : "#130f2377";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.226, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function describe(snapshot: Snapshot): string {
  if (snapshot.phase === "ready") return "Une touche suffit pour commencer.";
  if (snapshot.phase === "paused") return "En pause. Reprends quand tu veux.";
  if (snapshot.phase === "lost") return "Trop tôt ou trop tard. Rejoue pour battre ton record.";
  if (snapshot.lastResult === "perfect") return "PARFAIT ! +2 points";
  if (snapshot.lastResult === "good") return "BIEN JOUÉ ! +1 point";
  return "Appuie quand la lumière entre dans l'arc.";
}

function render(snapshot: Snapshot): void {
  lastSnapshot = snapshot;
  scoreLabel.textContent = String(snapshot.score);
  bestLabel.textContent = String(snapshot.bestScore);
  hitsLabel.textContent = String(snapshot.hits);
  statusLabel.textContent = ({
    ready: "PRÊT",
    running: "EN JEU",
    paused: "EN PAUSE",
    lost: "TERMINÉ",
  } as const)[snapshot.phase];
  feedbackLabel.textContent = describe(snapshot);
  actionButton.innerHTML = "";
  const label = document.createTextNode(({
    ready: "COMMENCER",
    running: "FRAPPER",
    paused: "REPRENDRE",
    lost: "REJOUER",
  } as const)[snapshot.phase] + " ");
  const arrow = document.createElement("span");
  arrow.textContent = snapshot.phase === "running" ? "◎" : "↗";
  actionButton.append(label, arrow);
  pauseButton.disabled = snapshot.phase === "ready" || snapshot.phase === "lost";
  pauseButton.textContent = snapshot.phase === "paused" ? "▶ Reprendre" : "⏸ Pause";
  roundLabel.textContent = snapshot.phase === "lost"
    ? "ESSAI TERMINÉ · REJOUEZ"
    : `FENÊTRE ${Math.round((snapshot.halfWindow * 360) / Math.PI)}° · VITESSE ${snapshot.speed.toFixed(1)}`;
  canvas.setAttribute("aria-label", "Cadran PULSE. " + describe(snapshot));
  draw(snapshot);
}

game.subscribe(render);
actionButton.addEventListener("click", () => game.action());
canvas.addEventListener("click", () => game.action());
pauseButton.addEventListener("click", () => game.togglePause());
resetButton.addEventListener("click", () => game.restart());
soundButton.addEventListener("click", () => {
  const enabled = sound.toggle();
  soundButton.textContent = enabled ? "♪ Son : oui" : "♪ Son : non";
  soundButton.setAttribute("aria-pressed", String(enabled));
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
  if (event.code === "Space" || (event.code === "Enter" && target === canvas)) {
    event.preventDefault();
    game.action();
  } else if (event.key.toLowerCase() === "p" || event.code === "Escape") {
    event.preventDefault();
    game.togglePause();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) game.suspend();
});
window.addEventListener("blur", () => game.suspend());
window.addEventListener("resize", fitCanvas);
window.addEventListener("pagehide", () => game.destroy(), { once: true });
fitCanvas();
