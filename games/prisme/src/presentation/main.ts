import { GameController } from "../application/GameController";
import { browserRecord } from "../infrastructure/browser";
import {
  availableGate,
  bestAim,
  canOpenGate,
  objectiveReady,
  type Controls,
  type Phase,
  type Weapon,
} from "../domain/rules";
import { MAX_ZONE, type Point } from "../domain/map";
import { installFullscreen } from "./fullscreen";
import { mapPointer, renderArena, renderMap, screenToWorld } from "./renderer";
import "./style.css";

function required<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error("PRISME: missing " + selector);
  return element;
}

const game = new GameController(browserRecord);
const canvas = required<HTMLCanvasElement>("#board");
const minimap = required<HTMLCanvasElement>("#minimap");
const planMap = required<HTMLCanvasElement>("#plan-map");
const overlay = required<HTMLElement>("#overlay");
const planning = required<HTMLElement>("#planning");
const title = required<HTMLElement>("#overlay-title");
const copy = required<HTMLElement>("#overlay-copy");
const hint = required<HTMLElement>("#overlay-hint");
const seedBox = required<HTMLElement>("#seed-box");
const seedInput = required<HTMLInputElement>("#seed-input");
const primary = required<HTMLButtonElement>("#primary");
const pause = required<HTMLButtonElement>("#pause");
const plan = required<HTMLButtonElement>("#plan");
const health = required<HTMLElement>("#health");
const armor = required<HTMLElement>("#armor");
const relays = required<HTMLElement>("#relays");
const enemies = required<HTMLElement>("#enemies");
const sector = required<HTMLElement>("#sector");
const weapon = required<HTMLElement>("#weapon");
const score = required<HTMLElement>("#score");
const heatBar = required<HTMLElement>("#heat-bar");
const dashBar = required<HTMLElement>("#dash-bar");
const heatValue = required<HTMLElement>("#heat-value");
const dashValue = required<HTMLElement>("#dash-value");
const seedLabel = required<HTMLElement>("#seed-label");
const objective = required<HTMLElement>("#objective");
const keysLabel = required<HTMLElement>("#keys");
const radarLabel = required<HTMLElement>("#scan-charges");
const announce = required<HTMLElement>("#announce");
const fire = required<HTMLButtonElement>("#fire");
const dash = required<HTMLButtonElement>("#dash");
const scan = required<HTMLButtonElement>("#scan");
const interact = required<HTMLButtonElement>("#interact");
const moveZone = required<HTMLElement>("#move-zone");
const fireZone = required<HTMLElement>("#fire-zone");
const moveDisc = required<HTMLElement>("#move-stick");

installFullscreen();
seedInput.value = String(game.best.lastSeed);

const keys = new Set<string>();
let pointerFire = false;
let pointerAim: Point | null = null;
let joystickAim: Point | null = null;
let moveAxis: Point = { x: 0, y: 0 };
let dashRequested = false;
let interactRequested = false;
let scanRequested = false;
let lastPhase: Phase | null = null;

function clearControls(): void {
  keys.clear();
  pointerFire = false;
  pointerAim = null;
  joystickAim = null;
  moveAxis = { x: 0, y: 0 };
  dashRequested = false;
  interactRequested = false;
  scanRequested = false;
  moveDisc.classList.remove("active");
  fire.classList.remove("active");
}

function displayPhase(phase: Phase): void {
  if (phase === lastPhase) return;
  lastPhase = phase;
  clearControls();
  const active = phase === "playing";
  overlay.hidden = active || phase === "planning";
  planning.hidden = phase !== "planning";
  seedBox.hidden = phase !== "ready" && phase !== "won";
  hint.hidden = phase !== "ready";
  pause.disabled = !active && phase !== "paused";
  plan.disabled = !active && phase !== "planning";
  plan.textContent = phase === "planning" ? "◈ Reprendre" : "◈ Plan";
  pause.textContent = phase === "paused" ? "▶ Reprendre" : "Ⅱ Pause";
  const messages: Record<Exclude<Phase, "playing" | "planning">, [string, string, string]> = {
    ready: [
      "La couleur est une arme.",
      "Explore 16 salles sur une carte à seed. Récupère deux badges, ouvre les portes, capture les relais et atteins le noyau. L'exploration et l'armement comptent autant que les réflexes.",
      "DÉMARRER L'EXPÉDITION →",
    ],
    paused: [
      "Opération en pause.",
      "Ton monde, ta seed et ton exploration sont conservés pendant cette pause.",
      "REPRENDRE →",
    ],
    lost: [
      "Signal interrompu.",
      "Tu peux rejouer le même terrain, apprendre les positions des portes et choisir un autre parcours.",
      "RÉESSAYER CETTE CARTE ↻",
    ],
    cleared: [
      "District pacifié.",
      "Les trois relais sont actifs et toutes les menaces sont neutralisées. Prêt à changer de carte ?",
      "SECTEUR SUIVANT →",
    ],
    won: [
      "Couleurs restaurées.",
      "Quatre expéditions terminées. Une autre seed révélera une nouvelle disposition de salles, de couvertures et de bonus.",
      "NOUVELLE EXPÉDITION ↻",
    ],
  };
  if (phase !== "playing" && phase !== "planning") {
    const [heading, description, action] = messages[phase];
    title.textContent = heading;
    copy.textContent = description;
    primary.textContent = action;
    if (phase === "won" || phase === "lost" || phase === "cleared") {
      announce.textContent = heading + " " + description;
      primary.focus();
    }
  }
  if (phase === "planning") {
    renderMap(planMap, game.state, true);
    required<HTMLButtonElement>("#close-plan").focus();
  }
}

const labels: Record<Weapon, string> = {
  pulse: "IMPULSION",
  scatter: "TRIANGLE ×3",
  rail: "LANCE ⚡",
};

game.subscribe((state) => {
  displayPhase(state.phase);
  health.textContent = "♥".repeat(Math.max(0, state.player.hp)) +
    "♡".repeat(Math.max(0, 6 - state.player.hp));
  armor.textContent = state.player.armor > 0 ? "◈" + state.player.armor : "";
  sector.textContent = String(state.zone).padStart(2, "0") +
    " / " + String(MAX_ZONE).padStart(2, "0");
  relays.textContent = state.relays.filter((relay) => relay.charge === 100).length + " / 3";
  enemies.textContent = String(state.enemies.length).padStart(2, "0");
  weapon.textContent = labels[state.player.weapon];
  score.textContent = String(state.score).padStart(5, "0");
  heatBar.style.width = state.player.heat + "%";
  heatValue.textContent = Math.round(state.player.heat) + "%";
  dashBar.style.width = ((120 - state.player.dashCooldown) / 120) * 100 + "%";
  dashValue.textContent = state.player.dashCooldown === 0
    ? "PRÊTE"
    : Math.ceil(state.player.dashCooldown / 60) + "s";
  seedLabel.textContent = "SEED " + state.seed + " • " + state.zone;
  keysLabel.textContent = "BADGES : " + (
    state.keys.length === 0 ? "—" : state.keys.map((key) => key.toUpperCase()).join(" · ")
  );
  radarLabel.textContent = "RADAR : " + state.player.scanCharges;
  scan.disabled = state.phase !== "playing" || state.player.scanCharges === 0;
  const gate = availableGate(state);
  interact.disabled = state.phase !== "playing";
  interact.setAttribute("aria-label", gate
    ? (canOpenGate(state, gate) ? "Ouvrir porte " : "Porte verrouillée ") + gate
    : "Ouvrir une porte à proximité");
  interact.style.borderColor = gate ? "#ffef8f" : "";
  const remaining = state.relays.filter((relay) => relay.charge < 100).length;
  let message: string;
  if (state.phase === "ready") message = "PRÊT POUR LA MISSION";
  else if (state.notice && state.tick < state.noticeUntil) message = state.notice;
  else if (objectiveReady(state)) message = "✦ EXTRACTION OUVERTE — REJOINS LE NOYAU";
  else if (!state.keys.includes("rose") || !state.keys.includes("cyan")) {
    message = "◆ EXPLORE L'ATELIER ET RÉCUPÈRE LES BADGES";
  } else if (!state.opened.includes("rose") || !state.opened.includes("cyan")) {
    message = "◇ OUVRE LES PORTES COLORÉES : TOUCHE E / PORTE";
  } else if (remaining === 3) {
    message = "✦ CAPTURE LES RELAIS À L'EST ET AU SUD";
  } else {
    message = "✦ " + remaining + " RELAIS · " + state.enemies.length + " MENACES • M POUR PLANIFIER";
  }
  objective.textContent = message;
});

primary.addEventListener("click", () => {
  const phase = game.state.phase;
  if (phase === "paused") game.togglePause();
  else if (phase === "cleared") game.nextZone();
  else if (phase === "lost") game.restart();
  else {
    const seed = Number(seedInput.value);
    if (!game.start(seed)) {
      seedInput.setCustomValidity("Nombre entier de 1 à 999999999 requis.");
      seedInput.reportValidity();
      return;
    }
    seedInput.setCustomValidity("");
  }
  if (game.state.phase === "playing") canvas.focus();
});

seedInput.addEventListener("input", () => seedInput.setCustomValidity(""));

function togglePlan(): void {
  if (game.state.phase !== "playing" && game.state.phase !== "planning") return;
  clearControls();
  game.togglePlan();
  if (game.state.phase === "playing") canvas.focus();
}
plan.addEventListener("click", togglePlan);
required<HTMLButtonElement>("#minimap-button").addEventListener("click", togglePlan);
required<HTMLButtonElement>("#close-plan").addEventListener("click", togglePlan);

planMap.addEventListener("click", (event) => {
  const cell = mapPointer(planMap, event.clientX, event.clientY);
  if (game.setWaypoint(cell)) {
    announce.textContent = "Repère placé. Reprends la mission pour suivre ton itinéraire.";
    renderMap(planMap, game.state, true);
  }
});

pause.addEventListener("click", () => {
  clearControls();
  game.togglePause();
  if (game.state.phase === "playing") canvas.focus();
});

const movement: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  KeyW: { x: 0, y: -1 },
  KeyZ: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  KeyA: { x: -1, y: 0 },
  KeyQ: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

document.addEventListener("keydown", (event) => {
  if (event.target === seedInput) return;
  const code = event.code;
  if (!event.repeat && code === "KeyM") {
    event.preventDefault();
    togglePlan();
    return;
  }
  if (!event.repeat && code === "KeyP") {
    event.preventDefault();
    game.togglePause();
    return;
  }
  if (code === "Escape" && game.state.phase === "planning" && !document.fullscreenElement) {
    event.preventDefault();
    togglePlan();
    return;
  }
  if (code in movement || ["Space", "ShiftLeft", "ShiftRight", "KeyE", "KeyR"].includes(code)) {
    event.preventDefault();
    keys.add(code);
    if (!event.repeat && code.startsWith("Shift")) dashRequested = true;
    if (!event.repeat && code === "KeyE") interactRequested = true;
    if (!event.repeat && code === "KeyR") scanRequested = true;
  }
});
document.addEventListener("keyup", (event) => keys.delete(event.code));
dash.addEventListener("click", () => { dashRequested = true; });
scan.addEventListener("click", () => { scanRequested = true; });
interact.addEventListener("click", () => { interactRequested = true; });

canvas.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse") return;
  const point = screenToWorld(canvas, game.state, event.clientX, event.clientY);
  pointerAim = { x: point.x - game.state.player.x, y: point.y - game.state.player.y };
});
canvas.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || game.state.phase !== "playing") return;
  canvas.setPointerCapture(event.pointerId);
  const point = screenToWorld(canvas, game.state, event.clientX, event.clientY);
  pointerAim = { x: point.x - game.state.player.x, y: point.y - game.state.player.y };
  pointerFire = true;
  event.preventDefault();
});
canvas.addEventListener("pointerup", () => { pointerFire = false; });
canvas.addEventListener("pointercancel", () => { pointerFire = false; });

interface Stick {
  zone: HTMLElement;
  disc: HTMLElement;
  radius: number;
  activePointer: number | null;
  origin: Point;
  value: Point;
}
function createStick(zone: HTMLElement, disc: HTMLElement, radius: number): Stick {
  const stick: Stick = {
    zone, disc, radius, activePointer: null,
    origin: { x: 0, y: 0 },
    value: { x: 0, y: 0 },
  };
  function reset(): void {
    stick.activePointer = null;
    stick.value = { x: 0, y: 0 };
    disc.style.left = "50%";
    disc.style.top = "55%";
    disc.classList.remove("active");
    if (zone === moveZone) moveAxis = { x: 0, y: 0 };
    else {
      joystickAim = null;
      pointerFire = false;
    }
  }
  zone.addEventListener("pointerdown", (event) => {
    if (game.state.phase !== "playing" || stick.activePointer !== null) return;
    event.preventDefault();
    zone.setPointerCapture(event.pointerId);
    stick.activePointer = event.pointerId;
    const rect = zone.getBoundingClientRect();
    stick.origin = {
      x: Math.max(45, Math.min(rect.width - 45, event.clientX - rect.left)),
      y: Math.max(45, Math.min(rect.height - 45, event.clientY - rect.top)),
    };
    disc.style.left = stick.origin.x + "px";
    disc.style.top = stick.origin.y + "px";
    disc.classList.add("active");
    if (zone === fireZone) {
      pointerFire = true;
      joystickAim = null;
    }
  });
  zone.addEventListener("pointermove", (event) => {
    if (stick.activePointer !== event.pointerId) return;
    const rect = zone.getBoundingClientRect();
    const dx = event.clientX - rect.left - stick.origin.x;
    const dy = event.clientY - rect.top - stick.origin.y;
    const length = Math.hypot(dx, dy);
    const amount = Math.min(1, length / radius);
    const dead = amount < 0.15;
    stick.value = dead ? { x: 0, y: 0 } : {
      x: (dx / length) * amount,
      y: (dy / length) * amount,
    };
    const nub = disc.querySelector<HTMLElement>(".stick-nub");
    if (nub) nub.style.transform = "translate(" +
      stick.value.x * (radius * 0.47) + "px, " +
      stick.value.y * (radius * 0.47) + "px)";
    if (zone === moveZone) moveAxis = stick.value;
    else joystickAim = dead ? null : stick.value;
  });
  for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"]) {
    zone.addEventListener(eventName, (event) => {
      if (event instanceof PointerEvent && stick.activePointer !== event.pointerId) return;
      const nub = disc.querySelector<HTMLElement>(".stick-nub");
      if (nub) nub.style.transform = "";
      reset();
    });
  }
  return stick;
}
createStick(moveZone, moveDisc, 50);
createStick(fireZone, fire, 50);

function currentInput(): Controls {
  let moveX = moveAxis.x;
  let moveY = moveAxis.y;
  for (const code of keys) {
    const vector = movement[code];
    if (vector) {
      moveX += vector.x;
      moveY += vector.y;
    }
  }
  const aim = joystickAim ?? (
    keys.has("Space") || !pointerAim ? bestAim(game.state) : pointerAim
  );
  const controls: Controls = {
    moveX,
    moveY,
    aimX: aim.x,
    aimY: aim.y,
    shoot: pointerFire || keys.has("Space"),
    dash: dashRequested,
    interact: interactRequested,
    scan: scanRequested,
  };
  dashRequested = false;
  interactRequested = false;
  scanRequested = false;
  return controls;
}

function onInactive(): void {
  clearControls();
  game.pause();
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) onInactive();
});
window.addEventListener("blur", onInactive);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let request = 0;
let previousTime = 0;
let accumulator = 0;
let frame = 0;
function render(now: number): void {
  const elapsed = previousTime === 0 ? 0 : Math.min(100, now - previousTime);
  previousTime = now;
  accumulator = Math.min(100, accumulator + elapsed);
  let steps = 0;
  while (accumulator >= 1000 / 60 && steps < 5) {
    if (game.state.phase === "playing") game.tick(currentInput());
    accumulator -= 1000 / 60;
    steps++;
  }
  frame++;
  renderArena(
    canvas, game.state, reducedMotion.matches ? 0 : frame,
    joystickAim ?? pointerAim ?? undefined,
  );
  if (frame % 6 === 0) renderMap(minimap, game.state);
  if (game.state.phase === "planning" && frame % 12 === 0)
    renderMap(planMap, game.state, true);
  request = requestAnimationFrame(render);
}
request = requestAnimationFrame(render);
window.addEventListener("pagehide", () => {
  cancelAnimationFrame(request);
  onInactive();
  game.dispose();
}, { once: true });
