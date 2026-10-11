import "./style.css";
import { RebondController } from "../application/RebondController";
import type { Snapshot } from "../application/RebondController";
import { progressStore, frameClock } from "../infrastructure/browser";
import { BALL_RADIUS, WORLD, estimateTrajectory } from "../domain/physics";
import type { Vec2 } from "../domain/types";
import { levels } from "../domain/levels";

function element<T extends Element>(selector: string): T {
  const selected = document.querySelector<T>(selector);
  if (!selected) throw new Error(`Missing element: ${selector}`);
  return selected;
}

const canvas = element<HTMLCanvasElement>("#board");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D is required");
const context = ctx;
const angleInput = element<HTMLInputElement>("#angle");
const powerInput = element<HTMLInputElement>("#power");
const angleValue = element<HTMLOutputElement>("#angle-value");
const powerValue = element<HTMLOutputElement>("#power-value");
const shootButton = element<HTMLButtonElement>("#shoot");
const retryButton = element<HTMLButtonElement>("#retry");
const resetButton = element<HTMLButtonElement>("#reset");
const nextButton = element<HTMLButtonElement>("#next");
const selector = element<HTMLSelectElement>("#level-select");
const phaseLabel = element<HTMLElement>("#phase");
const feedbackLabel = element<HTMLElement>("#feedback");
const attemptsLabel = element<HTMLElement>("#attempts");
const bestLabel = element<HTMLElement>("#best");
const indexLabel = element<HTMLElement>("#level-index");
const titleLabel = element<HTMLElement>("#level-title");
const subtitleLabel = element<HTMLElement>("#level-subtitle");
const chapterLabel = element<HTMLElement>("#chapter");
const completion = element<HTMLElement>("#completion");
const starsLabel = element<HTMLElement>("#stars");

const game = new RebondController(
  { clock: frameClock, store: progressStore },
  levels,
);
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
let snapshot = game.snapshot;
let scale = 1;
let dragging = false;
let dragStart: Vec2 = { x: 0, y: 0 };
let dragEnd: Vec2 = { x: 0, y: 0 };
let activePointer: number | null = null;
let lastLevelId = "";
let lastPhase = snapshot.phase;
const trail: Vec2[] = [];

function resize(): void {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  scale = (bounds.width || 900) / WORLD.width;
  canvas.width = Math.round((bounds.width || 900) * pixelRatio);
  canvas.height = Math.round((bounds.height || 600) * pixelRatio);
  context.setTransform(
    canvas.width / WORLD.width,
    0,
    0,
    canvas.height / WORLD.height,
    0,
    0,
  );
  draw(snapshot);
}
function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
): void {
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.strokeStyle = color;
  context.lineWidth = width;
  context.stroke();
}
function circle(
  x: number,
  y: number,
  r: number,
  color: string,
  blur = 0,
): void {
  context.beginPath();
  context.arc(x, y, r, 0, Math.PI * 2);
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = blur;
  context.fill();
  context.shadowBlur = 0;
}
function label(
  text: string,
  x: number,
  y: number,
  font = "12px system-ui",
  color = "#719294",
): void {
  context.font = font;
  context.fillStyle = color;
  context.fillText(text, x, y);
}
function draw(snapshotValue: Snapshot): void {
  const { level, phase, ball } = snapshotValue;
  const t = prefersReducedMotion.matches ? 0 : performance.now() * 0.001;
  context.clearRect(0, 0, WORLD.width, WORLD.height);
  const background = context.createLinearGradient(
    0,
    0,
    WORLD.width,
    WORLD.height,
  );
  background.addColorStop(0, "#eaf1e9");
  background.addColorStop(1, "#dcece7");
  context.fillStyle = background;
  context.fillRect(0, 0, WORLD.width, WORLD.height);
  for (let x = 65; x <= WORLD.width; x += 42) {
    for (let y = 65; y <= WORLD.floor; y += 42) circle(x, y, 1, "#7aa5a342");
  }
  context.strokeStyle = "#7aaca957";
  context.lineWidth = 1;
  context.setLineDash([6, 9]);
  context.strokeRect(
    WORLD.margin,
    WORLD.margin,
    WORLD.width - 2 * WORLD.margin,
    WORLD.floor - WORLD.margin,
  );
  context.setLineDash([]);
  line(45, WORLD.floor, WORLD.width - 45, WORLD.floor, "#73a4a5", 3);
  line(45, WORLD.floor + 6, WORLD.width - 45, WORLD.floor + 6, "#9cc9c4", 1);

  for (const bumper of level.bumpers) {
    circle(bumper.x, bumper.y, bumper.radius + 12, "#f79c7b25", 28);
    circle(bumper.x, bumper.y, bumper.radius + 3, "#d57c5d");
    circle(bumper.x, bumper.y, bumper.radius - 4, "#fcaa87");
    circle(
      bumper.x - bumper.radius * 0.23,
      bumper.y - bumper.radius * 0.29,
      bumper.radius * 0.27,
      "#ffe9d9",
    );
    context.beginPath();
    context.arc(bumper.x, bumper.y, bumper.radius + 8, 0, Math.PI * 2);
    context.strokeStyle = "#b65c4e44";
    context.lineWidth = 1.5;
    context.stroke();
  }

  const { goal } = level;
  const breathe = 1 + Math.sin(t * 2.2) * 0.06;
  circle(goal.x, goal.y, level.goalRadius * 1.15 * breathe, "#85d8a42c", 27);
  context.beginPath();
  context.arc(goal.x, goal.y, level.goalRadius * breathe, 0, Math.PI * 2);
  context.strokeStyle = "#268f7e";
  context.lineWidth = 7;
  context.shadowColor = "#63d7a3";
  context.shadowBlur = 17;
  context.stroke();
  context.shadowBlur = 0;
  context.beginPath();
  context.arc(goal.x, goal.y, level.goalRadius * 0.6, 0, Math.PI * 2);
  context.strokeStyle = "#8abfaf";
  context.lineWidth = 1.5;
  context.stroke();
  circle(goal.x, goal.y, 4, "#4bad91");

  // At rest we reveal only the opening section of the physically simulated shot.
  if (phase === "ready") {
    const preview = estimateTrajectory(
      level,
      snapshotValue.angle,
      snapshotValue.speed,
      0.75,
    );
    for (let i = 0; i < preview.length; i++) {
      const point = preview[i]!;
      circle(
        point.x,
        point.y,
        Math.max(1.6, 3.4 - i * 0.08),
        `rgba(47,116,123,${Math.max(0.14, 0.7 - i * 0.025)})`,
      );
    }
    const angle = (snapshotValue.angle * Math.PI) / 180;
    const arrowX = level.source.x + Math.cos(angle) * 50;
    const arrowY = level.source.y - Math.sin(angle) * 50;
    line(level.source.x, level.source.y, arrowX, arrowY, "#0b7f8188", 2);
    label(
      "POINT DE DÉPART",
      level.source.x - 85,
      level.source.y + 47,
      "bold 11px system-ui",
    );
  }

  if (trail.length > 1 && !prefersReducedMotion.matches) {
    context.beginPath();
    trail.forEach((p, i) => {
      if (i === 0) context.moveTo(p.x, p.y);
      else context.lineTo(p.x, p.y);
    });
    context.strokeStyle = "#5bb0be77";
    context.lineWidth = 4;
    context.lineCap = "round";
    context.stroke();
    trail.forEach((p, i) => {
      if (i % 6 === 0) circle(p.x, p.y, 2, "#ffffff96");
    });
  }

  circle(ball.x + 4, ball.y + 9, BALL_RADIUS * 1.05, "#264f5760", 9);
  circle(ball.x, ball.y, BALL_RADIUS + 5, "#acdff7b5", 21);
  circle(ball.x, ball.y, BALL_RADIUS, "#287c9b");
  circle(ball.x - 3, ball.y - 4, 4.4, "#e7fbff");
  context.beginPath();
  context.arc(ball.x, ball.y, BALL_RADIUS + 7, 0, Math.PI * 2);
  context.strokeStyle = "#1d849257";
  context.lineWidth = 1;
  context.stroke();

  if (dragging && phase === "ready") {
    const dx = dragEnd.x - dragStart.x;
    const dy = dragEnd.y - dragStart.y;
    const length = Math.min(220, Math.hypot(dx, dy));
    const lengthActual = Math.hypot(dx, dy) || 1;
    const pulledX = level.source.x + (dx / lengthActual) * length;
    const pulledY = level.source.y + (dy / lengthActual) * length;
    line(level.source.x, level.source.y, pulledX, pulledY, "#b27764", 4);
    circle(pulledX, pulledY, 7, "#ea9775");
    context.beginPath();
    context.arc(
      level.source.x,
      level.source.y,
      length / 2 + 21,
      0,
      Math.PI * 2,
    );
    context.strokeStyle = "#ecb3952b";
    context.lineWidth = 2;
    context.stroke();
  }

  if (phase === "solved") {
    context.fillStyle = "#1b806d11";
    context.fillRect(0, 0, WORLD.width, WORLD.height);
    label(
      "✓ TRAJECTOIRE RÉUSSIE",
      WORLD.width / 2 - 115,
      45,
      "bold 17px system-ui",
      "#23866f",
    );
  }
}

function updateSelector(value: Snapshot): void {
  selector.replaceChildren(
    ...levels.map((level, i) => {
      const option = document.createElement("option");
      option.value = String(i);
      option.disabled = i > value.unlocked;
      const record = value.best[level.id];
      option.textContent = `${String(i + 1).padStart(2, "0")} · ${level.title}${record ? ` · ${record} essai(s)` : i > value.unlocked ? " · fermé" : ""}`;
      return option;
    }),
  );
  selector.value = String(value.index);
}

function render(value: Snapshot): void {
  if (lastLevelId !== value.level.id) {
    lastLevelId = value.level.id;
    trail.length = 0;
    dragging = false;
    feedbackLabel.textContent = "Glisse en arrière pour viser, puis relâche.";
  }
  if (lastPhase !== value.phase) {
    if (value.phase === "ready") trail.length = 0;
    lastPhase = value.phase;
  }
  if (value.phase === "flying" && !prefersReducedMotion.matches) {
    const tip = trail[trail.length - 1];
    if (!tip || Math.hypot(tip.x - value.ball.x, tip.y - value.ball.y) > 7) {
      trail.push({ x: value.ball.x, y: value.ball.y });
      if (trail.length > 65) trail.shift();
    }
  }
  snapshot = value;
  chapterLabel.textContent = value.level.chapter;
  titleLabel.textContent = value.level.title;
  subtitleLabel.textContent = value.level.subtitle;
  indexLabel.textContent = `${String(value.index + 1).padStart(2, "0")} / ${value.count}`;
  bestLabel.textContent = value.best[value.level.id]
    ? `${value.best[value.level.id]} tir(s)`
    : "—";
  attemptsLabel.textContent = String(value.attempts).padStart(2, "0");
  angleInput.value = String(value.angle);
  powerInput.value = String(value.speed);
  angleValue.textContent = `${Math.round(value.angle)}°`;
  powerValue.textContent = String(Math.round(value.speed));
  const ready = value.phase === "ready";
  angleInput.disabled = !ready;
  powerInput.disabled = !ready;
  shootButton.disabled = !ready;
  shootButton.textContent = ready ? "LANCER LA BILLE ↗" : "BILLE EN MOUVEMENT";
  retryButton.disabled = value.phase === "ready";
  completion.hidden = value.phase !== "solved";
  nextButton.hidden = !value.canContinue;
  starsLabel.textContent =
    "★".repeat(value.starCount) + "☆".repeat(3 - value.starCount);
  phaseLabel.textContent = (
    {
      ready: "PRÊT À LANCER",
      flying: "EN VOL",
      solved: "CIBLE ATTEINTE",
      missed: "À RETENTER",
    } as const
  )[value.phase];
  if (value.phase === "solved")
    feedbackLabel.textContent = "Superbe ricochet ! La cible est atteinte.";
  else if (value.phase === "missed")
    feedbackLabel.textContent =
      "La trajectoire n'a pas atteint la cible. Ajuste ton tir et recommence.";
  else if (value.phase === "flying")
    feedbackLabel.textContent =
      "Observe le mouvement. Chaque tentative enseigne quelque chose.";
  updateSelector(value);
  draw(value);
}

game.subscribe(render);
angleInput.addEventListener("input", () =>
  game.aim(Number(angleInput.value), Number(powerInput.value)),
);
powerInput.addEventListener("input", () =>
  game.aim(Number(angleInput.value), Number(powerInput.value)),
);
shootButton.addEventListener("click", () => game.shoot());
retryButton.addEventListener("click", () => game.retry());
resetButton.addEventListener("click", () => game.restart());
nextButton.addEventListener("click", () => game.next());
selector.addEventListener("change", () =>
  game.selectLevel(Number(selector.value)),
);

function position(event: PointerEvent): Vec2 {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / (rect.width || 1)) * WORLD.width,
    y: ((event.clientY - rect.top) / (rect.height || 1)) * WORLD.height,
  };
}
canvas.addEventListener("pointerdown", (event) => {
  if (snapshot.phase !== "ready") return;
  event.preventDefault();
  activePointer = event.pointerId;
  dragging = true;
  dragStart = position(event);
  dragEnd = dragStart;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!dragging || activePointer !== event.pointerId) return;
  dragEnd = position(event);
  const dx = dragEnd.x - dragStart.x;
  const dy = dragEnd.y - dragStart.y;
  const length = Math.hypot(dx, dy);
  if (length > 12 && dx < -6 && dy > 6) {
    const angle = (Math.atan2(dy, -dx) * 180) / Math.PI;
    const power = 420 + Math.min(215, length) * 1.81;
    game.aim(angle, power);
  }
  draw(snapshot);
});
canvas.addEventListener("pointerup", (event) => {
  if (!dragging || activePointer !== event.pointerId) return;
  dragEnd = position(event);
  dragging = false;
  activePointer = null;
  const dx = dragEnd.x - dragStart.x;
  const dy = dragEnd.y - dragStart.y;
  const length = Math.hypot(dx, dy);
  if (length > 18 && dx < -6 && dy > 6) {
    game.aim(
      (Math.atan2(dy, -dx) * 180) / Math.PI,
      420 + Math.min(215, length) * 1.81,
    );
    game.shoot();
  } else {
    feedbackLabel.textContent =
      "Tire vers le bas-gauche, comme un lance-pierre.";
    draw(snapshot);
  }
});
canvas.addEventListener("pointercancel", () => {
  dragging = false;
  activePointer = null;
  draw(snapshot);
});

document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName))
  )
    return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    game.adjust(-2, 0);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    game.adjust(2, 0);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    game.adjust(0, 20);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    game.adjust(0, -20);
  } else if (event.code === "Space" || event.code === "Enter") {
    event.preventDefault();
    if (snapshot.phase === "ready") game.shoot();
    else if (snapshot.phase === "missed") game.retry();
    else if (snapshot.canContinue) game.next();
  } else if (event.key.toLowerCase() === "r" || event.key === "Escape") {
    event.preventDefault();
    game.retry();
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) game.suspend();
});
window.addEventListener("blur", () => game.suspend());
window.addEventListener("resize", resize);
window.addEventListener("pagehide", () => game.destroy(), { once: true });
resize();
