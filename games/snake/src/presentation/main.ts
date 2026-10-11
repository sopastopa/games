import { installFullscreen } from "./fullscreen";
import "./style.css";
import { SnakeController } from "../application/SnakeController";
import { browserBestScore, browserClock } from "../infrastructure/browser";
import type { Snapshot } from "../application/ports";
import type { Direction } from "../domain/types";

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}
const canvas = requireElement<HTMLCanvasElement>("#board");
const context = canvas.getContext("2d");
if (!context) throw new Error("Canvas 2D not supported");
const ctx = context;
const score = requireElement<HTMLElement>("#score");
const bestScore = requireElement<HTMLElement>("#best-score");
const status = requireElement<HTMLElement>("#game-status");
const startButton = requireElement<HTMLButtonElement>("#start");
const pauseButton = requireElement<HTMLButtonElement>("#pause");
const restartButton = requireElement<HTMLButtonElement>("#restart");
const controller = new SnakeController({
  clock: browserClock,
  store: browserBestScore,
  random: Math.random,
});
const labels = {
  ready: "Prêt à jouer",
  running: "En cours",
  paused: "En pause",
  lost: "Partie terminée",
  won: "Victoire !",
} as const;

function roundedRect(
  x: number,
  y: number,
  size: number,
  color: string,
  radius: number,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.fill();
}
function render(snapshot: Snapshot): void {
  score.textContent = String(snapshot.score);
  bestScore.textContent = String(snapshot.bestScore);
  status.textContent = labels[snapshot.status];
  startButton.hidden =
    snapshot.status === "running" ||
    snapshot.status === "lost" ||
    snapshot.status === "won";
  startButton.textContent =
    snapshot.status === "paused" ? "Reprendre" : "Démarrer";
  pauseButton.disabled =
    snapshot.status !== "running" && snapshot.status !== "paused";
  pauseButton.textContent =
    snapshot.status === "paused" ? "Reprendre" : "Pause";
  const size = canvas.width / snapshot.columns;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#101d2c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#ffffff09";
  ctx.lineWidth = 1;
  for (let i = 0; i <= snapshot.columns; i++) {
    ctx.beginPath();
    ctx.moveTo(i * size, 0);
    ctx.lineTo(i * size, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i <= snapshot.rows; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * size);
    ctx.lineTo(canvas.width, i * size);
    ctx.stroke();
  }
  if (snapshot.food) {
    const { x, y } = snapshot.food;
    roundedRect(x * size + 5, y * size + 5, size - 10, "#fa6a75", 9);
    ctx.fillStyle = "#ffc4c8";
    ctx.fillRect(x * size + size * 0.55, y * size + 5, 3, 6);
  }
  snapshot.snake.forEach((segment, index) => {
    roundedRect(
      segment.x * size + 2,
      segment.y * size + 2,
      size - 4,
      index === 0 ? "#b4ff79" : "#64bf80",
      8,
    );
    if (index === 0) {
      ctx.fillStyle = "#152c1b";
      ctx.beginPath();
      ctx.arc(
        segment.x * size + size * 0.66,
        segment.y * size + size * 0.33,
        2.6,
        0,
        2 * Math.PI,
      );
      ctx.fill();
    }
  });
  if (
    snapshot.status === "paused" ||
    snapshot.status === "lost" ||
    snapshot.status === "won"
  ) {
    ctx.fillStyle = "#09101ecc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f3f7ff";
    ctx.textAlign = "center";
    ctx.font = "bold 38px system-ui";
    ctx.fillText(labels[snapshot.status], canvas.width / 2, canvas.height / 2);
  }
}
controller.subscribe(render);
startButton.addEventListener("click", () => controller.start());
pauseButton.addEventListener("click", () => controller.pause());
restartButton.addEventListener("click", () => controller.restart());
const mapping: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  a: "left",
  s: "down",
  d: "right",
};
document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  )
    return;
  if (event.code === "Space") {
    event.preventDefault();
    if (controller.snapshot.status === "ready") controller.start();
    else controller.pause();
  } else {
    const direction = mapping[event.key] ?? mapping[event.key.toLowerCase()];
    if (direction) {
      event.preventDefault();
      controller.turn(direction);
    }
  }
});
for (const element of document.querySelectorAll<HTMLButtonElement>(
  "[data-direction]",
)) {
  element.addEventListener("click", () =>
    controller.turn(element.dataset.direction as Direction),
  );
}
window.addEventListener("pagehide", () => controller.destroy(), { once: true });

installFullscreen();
