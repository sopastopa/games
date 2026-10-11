import {
  CampaignController,
  type View,
} from "../application/CampaignController";
import { browserCampaign } from "../infrastructure/browser";
import { directionBetween, tideIsHigh } from "../domain/rules";
import { distance } from "../domain/generation";
import { ROLES, SECTORS } from "../domain/sectors";
import {
  MAX_ENERGY,
  SIZE,
  type Direction,
  type Expedition,
  type Role,
  type Terrain,
} from "../domain/types";
import { installFullscreen } from "./fullscreen";
import "./style.css";

function required<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`VEILLE: missing ${id}`);
  return element as T;
}

const game = new CampaignController(browserCampaign);
const board = required<HTMLDivElement>("board");
const tiles: HTMLButtonElement[] = [];
const launchPanel = required<HTMLElement>("launch-panel");
const gameplayPanel = required<HTMLElement>("gameplay-panel");
const outcome = required<HTMLElement>("outcome");
const resultTitle = required<HTMLElement>("result-title");
const resultText = required<HTMLElement>("result-text");
const launchButton = required<HTMLButtonElement>("launch");
const retryButton = required<HTMLButtonElement>("retry");
const nextButton = required<HTMLButtonElement>("next");
const newButton = required<HTMLButtonElement>("new-expedition");
const sectorSelect = required<HTMLSelectElement>("sector-select");
const roleSelect = required<HTMLSelectElement>("role-select");
const seedInput = required<HTMLInputElement>("seed");
const roleDescription = required<HTMLElement>("role-description");
const narrative = required<HTMLElement>("narrative");
const archiveList = required<HTMLOListElement>("archive-list");
const missionTitle = required<HTMLElement>("mission-title");
const missionRegion = required<HTMLElement>("mission-region");
const signal = required<HTMLElement>("signal");
const hull = required<HTMLElement>("hull");
const energy = required<HTMLElement>("energy");
const turn = required<HTMLElement>("turn");
const archive = required<HTMLElement>("archive");
const tide = required<HTMLElement>("tide");
const status = required<HTMLElement>("game-status");
const chapterProgress = required<HTMLElement>("chapter-progress");
const best = required<HTMLElement>("best-score");
const scanButton = required<HTMLButtonElement>("scan");
const pulseButton = required<HTMLButtonElement>("pulse");
const waitButton = required<HTMLButtonElement>("wait");
const dashToggle = required<HTMLButtonElement>("dash-toggle");
const announce = required<HTMLElement>("announce");
let dashArmed = false;
let lastSector = -1;

const icons: Record<Terrain, string> = {
  floor: "",
  wall: "",
  tide: "≈",
  core: "✦",
  battery: "+",
  beacon: "◈",
  archive: "◇",
  exit: "⬡",
};
const names: Record<Terrain, string> = {
  floor: "sol",
  wall: "mur infranchissable",
  tide: "courant de marée",
  core: "fragment de signal",
  battery: "cellule d'énergie",
  beacon: "station de recharge",
  archive: "archive optionnelle",
  exit: "point d'extraction",
};

for (let index = 0; index < SIZE * SIZE; index++) {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "cell cell-unknown";
  tile.dataset.testid = `tile-${index}`;
  tile.setAttribute(
    "aria-label",
    `Case ${(index % SIZE) + 1}, ${Math.floor(index / SIZE) + 1}, à explorer`,
  );
  tile.addEventListener("click", () => {
    const run = game.view.run;
    if (!run) return;
    const direction = directionBetween(run.position, index);
    if (direction) perform(direction, false);
    else
      announce.textContent = "Choisis une case voisine ou utilise les flèches.";
  });
  board.append(tile);
  tiles.push(tile);
}

function showMissions(view: View): void {
  if (lastSector === view.campaign.unlocked) return;
  lastSector = view.campaign.unlocked;
  sectorSelect.replaceChildren();
  for (let i = 0; i <= view.campaign.unlocked; i++) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = `${String(i + 1).padStart(2, "0")} · ${SECTORS[i]!.title}${view.campaign.completed.includes(i) ? " ✓" : ""}`;
    sectorSelect.append(option);
  }
}

function paint(run: Expedition | null): void {
  for (let index = 0; index < tiles.length; index++) {
    const tile = tiles[index]!;
    const explored = run?.revealed[index] ?? false;
    const type = explored ? run!.terrain[index]! : "unknown";
    const drone = run?.drones.some(
      (item) => item.position === index && item.stunned === 0 && explored,
    );
    const stunned = run?.drones.some(
      (item) => item.position === index && item.stunned > 0 && explored,
    );
    const player = run?.position === index;
    tile.className = `cell cell-${type}${player ? " is-player" : ""}${drone ? " has-drone" : ""}${stunned ? " has-stunned" : ""}${type === "tide" && tideIsHigh(run!.turn) ? " is-high" : ""}`;
    tile.textContent = player
      ? "◆"
      : drone
        ? "✺"
        : stunned
          ? "✳"
          : explored
            ? icons[run!.terrain[index]!]
            : "";
    tile.setAttribute(
      "aria-label",
      player
        ? `Explorateur, case ${index}`
        : drone
          ? `Sentinelle, case ${index}`
          : explored
            ? `${names[run!.terrain[index]!]}; case ${index}`
            : `Case ${index} inconnue`,
    );
    tile.disabled =
      !run ||
      run.phase !== "playing" ||
      (!player && distance(run.position, index) !== 1);
    tile.setAttribute("aria-current", player ? "location" : "false");
  }
}

function writeChronicle(view: View): void {
  const found = view.campaign.discoveries;
  archiveList.replaceChildren();
  const recent = found.slice(-5).reverse();
  for (const id of recent) {
    const [sectorText, fragmentText] = id.split(":");
    const sector = SECTORS[Number(sectorText)]!;
    const item = document.createElement("li");
    const fragment = Number(fragmentText);
    item.textContent = `${sector.title} · ${fragment === 1 ? sector.clue : fragment === 2 ? sector.chronicle : "Le journal confirme que l'histoire continue au-delà des ruines."}`;
    archiveList.append(item);
  }
  if (recent.length === 0) {
    const item = document.createElement("li");
    item.textContent =
      "Explore les symboles ◇ pour retrouver les journaux perdus.";
    archiveList.append(item);
  }
  archive.textContent = String(found.length);
}

function render(view: View): void {
  const run = view.run;
  showMissions(view);
  paint(run);
  launchPanel.hidden = Boolean(run);
  gameplayPanel.hidden = !run;
  outcome.hidden = !run || run.phase === "playing";
  chapterProgress.textContent = `${view.campaign.completed.length} / ${SECTORS.length} secteurs explorés`;
  writeChronicle(view);
  if (!run) {
    missionTitle.textContent = "Préparer une descente";
    missionRegion.textContent = "LES ARCHIVES SOUS LA MER";
    narrative.textContent =
      "La cité de VEILLE ne répond plus. Des signaux circulent pourtant sous l'eau. Choisis une spécialité, puis lance une expédition.";
    status.textContent = "Prêt à explorer";
    return;
  }
  const sector = SECTORS[run.sector]!;
  document.documentElement.style.setProperty("--sector-accent", sector.accent);
  missionTitle.textContent = sector.title;
  missionRegion.textContent = `${sector.region} · SECTEUR ${String(run.sector + 1).padStart(2, "0")}`;
  narrative.textContent = sector.clue;
  signal.textContent = `${run.cores} / ${run.required}`;
  hull.textContent = `${run.hull} / ${run.maxHull}`;
  energy.textContent = `${run.energy} / ${MAX_ENERGY}`;
  turn.textContent = String(run.turn).padStart(2, "0");
  best.textContent = view.campaign.bestTurns[String(run.sector)]
    ? `${view.campaign.bestTurns[String(run.sector)]} tours`
    : "—";
  tide.textContent = tideIsHigh(run.turn)
    ? "HAUTE · zone dangereuse"
    : "BASSE · passage possible";
  tide.classList.toggle("danger", tideIsHigh(run.turn));
  status.textContent = run.log;
  announce.textContent = run.log;
  const running = run.phase === "playing";
  scanButton.disabled = !running || run.energy < ROLES[run.role].scanCost;
  pulseButton.disabled =
    !running ||
    run.energy < 2 ||
    !run.drones.some((item) => distance(item.position, run.position) <= 2);
  waitButton.disabled = !running;
  dashToggle.disabled = !running || run.energy < 2;
  if (!running) {
    dashArmed = false;
    dashToggle.setAttribute("aria-pressed", "false");
  }
  if (run.phase === "won") {
    resultTitle.textContent = "Signal rétabli";
    resultText.textContent = `${sector.chronicle} L'expédition a duré ${run.turn} tours. ${run.archives}/3 archives retrouvées. Tu peux rejouer ce secteur pour découvrir d'autres itinéraires.`;
    nextButton.hidden = run.sector === SECTORS.length - 1;
  } else if (run.phase === "lost") {
    resultTitle.textContent = "Descente interrompue";
    resultText.textContent =
      "La coque ne tient plus. Les archives découvertes restent dans ton journal. Réessaie avec une autre route ou une autre spécialité.";
    nextButton.hidden = true;
  }
}

function perform(direction: Direction, dash: boolean): void {
  const usedDash = dash || dashArmed;
  const success = game.act({ kind: usedDash ? "dash" : "move", direction });
  dashArmed = false;
  dashToggle.setAttribute("aria-pressed", "false");
  if (!success)
    announce.textContent = "Passage bloqué ou énergie insuffisante.";
}

function launch(): void {
  const sector = Number(sectorSelect.value);
  const role = roleSelect.value as Role;
  const seed =
    seedInput.value.trim() === "" ? undefined : Number(seedInput.value);
  const success = game.launch(sector, role, seed);
  if (!success)
    announce.textContent =
      "Graine invalide. Entre un nombre entier entre 1 et 999999999.";
}

launchButton.addEventListener("click", launch);
roleSelect.addEventListener("change", () => {
  roleDescription.textContent = ROLES[roleSelect.value as Role].description;
});
scanButton.addEventListener("click", () => game.act({ kind: "scan" }));
pulseButton.addEventListener("click", () => game.act({ kind: "pulse" }));
waitButton.addEventListener("click", () => game.act({ kind: "wait" }));
dashToggle.addEventListener("click", () => {
  dashArmed = !dashArmed;
  dashToggle.setAttribute("aria-pressed", String(dashArmed));
});
retryButton.addEventListener("click", () => game.retry());
nextButton.addEventListener("click", () => game.next());
newButton.addEventListener("click", () => {
  dashArmed = false;
  game.abandon();
});
for (const button of document.querySelectorAll<HTMLButtonElement>(
  "[data-direction]",
)) {
  button.addEventListener("click", () =>
    perform(button.dataset.direction as Direction, false),
  );
}

document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    target.closest("input, select, textarea, [contenteditable]")
  )
    return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const mappings: Record<string, Direction> = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  };
  const direction = mappings[event.key] ?? mappings[event.key.toLowerCase()];
  if (direction) {
    event.preventDefault();
    perform(direction, event.shiftKey);
  } else if (event.key === "1") game.act({ kind: "scan" });
  else if (event.key === "2") game.act({ kind: "pulse" });
  else if (event.key === ".") game.act({ kind: "wait" });
});
window.addEventListener("pagehide", () => game.dispose(), { once: true });
game.subscribe(render);
installFullscreen();
