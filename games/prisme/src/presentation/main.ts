import { GameController } from "../application/GameController";
import { browserRecord } from "../infrastructure/browser";
import {
  bestAim,
  objectiveReady,
  type Controls,
  type Phase,
} from "../domain/rules";
import { MAX_ZONE } from "../domain/map";
import { installFullscreen } from "./fullscreen";
import { geometry, renderArena } from "./renderer";
import "./style.css";

function required<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error("PRISME: missing " + selector);
  return element;
}

const controller = new GameController(browserRecord);
const canvas = required<HTMLCanvasElement>("#board");
const overlay = required<HTMLDivElement>("#overlay");
const title = required<HTMLElement>("#overlay-title");
const copy = required<HTMLElement>("#overlay-copy");
const hint = required<HTMLElement>("#overlay-hint");
const seedBox = required<HTMLElement>("#seed-box");
const seedInput = required<HTMLInputElement>("#seed-input");
const primary = required<HTMLButtonElement>("#primary");
const pause = required<HTMLButtonElement>("#pause");
const health = required<HTMLElement>("#health");
const relays = required<HTMLElement>("#relays");
const enemies = required<HTMLElement>("#enemies");
const sector = required<HTMLElement>("#sector");
const score = required<HTMLElement>("#score");
const heatBar = required<HTMLDivElement>("#heat-bar");
const dashBar = required<HTMLDivElement>("#dash-bar");
const heatValue = required<HTMLElement>("#heat-value");
const dashValue = required<HTMLElement>("#dash-value");
const seedLabel = required<HTMLElement>("#seed-label");
const objective = required<HTMLElement>("#objective");
const announce = required<HTMLElement>("#announce");
const fire = required<HTMLButtonElement>("#fire");
const dash = required<HTMLButtonElement>("#dash");

installFullscreen();
seedInput.value = String(controller.best.lastSeed);

const keys = new Set<string>();
const moves = new Set<string>();
let fireHeld = false;
let aimFromPointer = false;
let pointerAim = { x: 1, y: 0 };
let dashRequested = false;
let previousPhase: Phase | null = null;

function clearControls(): void {
  keys.clear();
  moves.clear();
  fireHeld = false;
  dashRequested = false;
  fire.classList.remove("held");
}

function labels(phase: Phase): {
  heading: string;
  description: string;
  action: string;
} {
  if (phase === "paused") {
    return {
      heading: "Le temps suspendu.",
      description: "La mission est en pause. Reprends quand tu le souhaites.",
      action: "REPRENDRE →",
    };
  }
  if (phase === "lost") {
    return {
      heading: "Signal interrompu.",
      description:
        "Le blindage a cédé. La même graine te donnera exactement la même arène : change de tactique.",
      action: "RÉESSAYER CETTE CARTE ↻",
    };
  }
  if (phase === "cleared") {
    return {
      heading: "Secteur sécurisé.",
      description:
        "Les relais sont synchronisés et la voie d'extraction est ouverte. Un nouveau secteur t'attend.",
      action: "SECTEUR SUIVANT →",
    };
  }
  if (phase === "won") {
    return {
      heading: "Lumière rétablie.",
      description:
        "Quatre secteurs pacifiés. La ville reprend ses couleurs. Rejoue avec une autre graine pour relever le défi.",
      action: "NOUVEL ASSAUT ↻",
    };
  }
  return {
    heading: "La couleur est une arme.",
    description:
      "Trois relais à rallumer. Des sentinelles à désactiver. Une extraction à atteindre. Chaque graine invente un nouveau terrain.",
    action: "DÉMARRER L'ASSAUT →",
  };
}

function updatePhase(phase: Phase): void {
  if (previousPhase === phase) return;
  previousPhase = phase;
  clearControls();
  overlay.hidden = phase === "playing";
  seedBox.hidden = phase !== "ready" && phase !== "won";
  const panel = labels(phase);
  title.textContent = panel.heading;
  copy.textContent = panel.description;
  primary.textContent = panel.action;
  hint.hidden = phase !== "ready";
  pause.disabled = phase !== "playing" && phase !== "paused";
  pause.textContent = phase === "paused" ? "▶ Reprendre" : "Ⅱ Pause";
  if (phase === "cleared" || phase === "lost" || phase === "won") {
    announce.textContent = panel.heading + " " + panel.description;
    primary.focus();
  }
}

controller.subscribe((state) => {
  updatePhase(state.phase);
  health.textContent =
    "♥ ".repeat(state.player.hp) + "♡ ".repeat(6 - state.player.hp);
  relays.textContent =
    state.relays.filter((relay) => relay.charge >= 100).length + " / 3";
  enemies.textContent = String(state.enemies.length).padStart(2, "0");
  sector.textContent =
    String(state.zone).padStart(2, "0") +
    " / " +
    String(MAX_ZONE).padStart(2, "0");
  score.textContent = String(state.score).padStart(5, "0");
  heatBar.style.width = state.player.heat + "%";
  heatValue.textContent = Math.round(state.player.heat) + "%";
  dashBar.style.width = (100 * (120 - state.player.dashCooldown)) / 120 + "%";
  dashValue.textContent =
    state.player.dashCooldown === 0
      ? "PRÊTE"
      : Math.ceil(state.player.dashCooldown / 60) + " s";
  seedLabel.textContent = "SEED " + state.seed + " · ZONE " + state.zone;
  const pending = state.relays.filter((relay) => relay.charge < 100).length;
  objective.textContent =
    state.phase === "ready"
      ? "PRÊT POUR LA MISSION"
      : state.phase === "lost"
        ? "SIGNAL PERDU"
        : objectiveReady(state)
          ? "✦ EXTRACTION DISPONIBLE — REJOINS LE PORTAIL VERT"
          : "✦ " +
            pending +
            " RELAIS À ACTIVER · " +
            state.enemies.length +
            " SENTINELLES";
});

primary.addEventListener("click", () => {
  const phase = controller.state.phase;
  if (phase === "paused") controller.togglePause();
  else if (phase === "cleared") controller.nextZone();
  else if (phase === "lost") controller.restart();
  else {
    const seed = Number(seedInput.value);
    if (!controller.start(seed)) {
      seedInput.setCustomValidity("Choisis un nombre entier de 1 à 999999999.");
      seedInput.reportValidity();
      return;
    }
    seedInput.setCustomValidity("");
  }
  if (controller.state.phase === "playing") canvas.focus();
});

seedInput.addEventListener("input", () => {
  seedInput.setCustomValidity("");
});

pause.addEventListener("click", () => {
  clearControls();
  controller.togglePause();
  if (controller.state.phase === "playing") canvas.focus();
});

function pointerDirection(event: PointerEvent): void {
  const rect = canvas.getBoundingClientRect();
  const coords = geometry(canvas);
  const x = (event.clientX - rect.left - coords.offsetX) / coords.step - 0.5;
  const y = (event.clientY - rect.top - coords.offsetY) / coords.step - 0.5;
  const player = controller.state.player;
  pointerAim = { x: x - player.x, y: y - player.y };
  aimFromPointer = true;
}

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerType === "mouse" || event.buttons) pointerDirection(event);
});
canvas.addEventListener("pointerdown", (event) => {
  if (controller.state.phase !== "playing") return;
  pointerDirection(event);
  fireHeld = true;
  canvas.setPointerCapture(event.pointerId);
  event.preventDefault();
});
canvas.addEventListener("pointerup", () => {
  fireHeld = false;
});
canvas.addEventListener("pointercancel", () => {
  fireHeld = false;
});

const keyMap: Record<string, string> = {
  ArrowUp: "up",
  KeyW: "up",
  KeyZ: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  KeyQ: "left",
  ArrowRight: "right",
  KeyD: "right",
};

document.addEventListener("keydown", (event) => {
  if (event.target === seedInput) return;
  if (event.code === "KeyP" && !event.repeat) {
    controller.togglePause();
    event.preventDefault();
  }
  if (
    event.code in keyMap ||
    event.code === "Space" ||
    event.code === "ShiftLeft" ||
    event.code === "ShiftRight"
  ) {
    event.preventDefault();
    keys.add(event.code);
    if (event.code.startsWith("Shift") && !event.repeat) dashRequested = true;
  }
});
document.addEventListener("keyup", (event) => keys.delete(event.code));

for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-move]",
)) {
  const direction = button.dataset.move;
  if (!direction) continue;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    moves.add(direction);
    button.classList.add("held");
  });
  const release = (): void => {
    moves.delete(direction);
    button.classList.remove("held");
  };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}
fire.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  fire.setPointerCapture(event.pointerId);
  fireHeld = true;
  aimFromPointer = false;
  fire.classList.add("held");
});
for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) {
  fire.addEventListener(name, () => {
    fireHeld = false;
    fire.classList.remove("held");
  });
}
dash.addEventListener("click", () => {
  dashRequested = true;
});

function input(): Controls {
  const moving = (direction: string): boolean =>
    moves.has(direction) || [...keys].some((key) => keyMap[key] === direction);
  const useAutomaticAim =
    !aimFromPointer ||
    (fireHeld && fire.classList.contains("held")) ||
    keys.has("Space");
  const aim = useAutomaticAim ? bestAim(controller.state) : pointerAim;
  const result: Controls = {
    moveX: Number(moving("right")) - Number(moving("left")),
    moveY: Number(moving("down")) - Number(moving("up")),
    aimX: aim.x,
    aimY: aim.y,
    shoot: fireHeld || keys.has("Space"),
    dash: dashRequested,
  };
  dashRequested = false;
  return result;
}

function onInactive(): void {
  clearControls();
  controller.pause();
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) onInactive();
});
window.addEventListener("blur", onInactive);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let previousTime = 0;
let accumulated = 0;
let frame = 0;
let frameRequest = 0;

function loop(now: number): void {
  const elapsed = previousTime === 0 ? 0 : Math.min(100, now - previousTime);
  previousTime = now;
  accumulated = Math.min(100, accumulated + elapsed);
  let steps = 0;
  while (accumulated >= 1000 / 60 && steps < 5) {
    controller.tick(input());
    accumulated -= 1000 / 60;
    steps++;
  }
  frame++;
  renderArena(
    canvas,
    controller.state,
    reducedMotion.matches ? 0 : frame,
    aimFromPointer ? pointerAim : undefined,
  );
  frameRequest = requestAnimationFrame(loop);
}

frameRequest = requestAnimationFrame(loop);
window.addEventListener(
  "pagehide",
  () => {
    cancelAnimationFrame(frameRequest);
    onInactive();
    controller.dispose();
  },
  { once: true },
);
