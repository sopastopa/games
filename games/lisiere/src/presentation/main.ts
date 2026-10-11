import "./style.css";
import { LisiereController } from "../application/LisiereController";
import type { Snapshot } from "../application/LisiereController";
import { browserPorts } from "../infrastructure/browser";
import { HOMES, TOTAL_CELLS } from "../domain/stages";
import { winnerLabel } from "../domain/rules";
import { stages } from "../domain/stages";

function element<T extends Element>(selector: string): T {
  const value = document.querySelector<T>(selector);
  if (!value) throw new Error(`Missing UI element ${selector}`);
  return value;
}

const board = element<HTMLDivElement>("#board");
const playerScore = element<HTMLElement>("#player-score");
const aiScore = element<HTMLElement>("#ai-score");
const turnLabel = element<HTMLElement>("#turn-count");
const chapter = element<HTMLElement>("#chapter");
const title = element<HTMLElement>("#stage-title");
const subtitle = element<HTMLElement>("#stage-subtitle");
const stageNumber = element<HTMLElement>("#stage-index");
const status = element<HTMLElement>("#game-status");
const statusDetail = element<HTMLElement>("#status-detail");
const statusIcon = element<HTMLElement>("#status-icon");
const outcome = element<HTMLElement>("#outcome");
const outcomeEyebrow = element<HTMLElement>("#outcome-eyebrow");
const outcomeTitle = element<HTMLElement>("#outcome-title");
const outcomeDetail = element<HTMLElement>("#outcome-detail");
const nextButton = element<HTMLButtonElement>("#next");
const undoButton = element<HTMLButtonElement>("#undo");
const restartButton = element<HTMLButtonElement>("#restart");
const select = element<HTMLSelectElement>("#stage-select");
const completedCount = element<HTMLElement>("#completed-count");
const campaignProgress = element<HTMLElement>("#campaign-progress");
const controller = new LisiereController(browserPorts, stages);
const tiles: HTMLButtonElement[] = [];
let lastStage = "";

function createBoard(): void {
  for (let index = 0; index < TOTAL_CELLS; index++) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tile";
    button.dataset.testid = `cell-${index}`;
    button.dataset.cell = String(index);
    button.addEventListener("click", () => controller.move(index));
    board.append(button);
    tiles.push(button);
  }
}

function nameFor(index: number, snapshot: Snapshot): string {
  const row = Math.floor(index / 6) + 1;
  const column = (index % 6) + 1;
  const coords = `ligne ${row}, colonne ${column}`;
  if (snapshot.stage.rocks.includes(index))
    return `Falaise inaccessible, ${coords}`;
  if (index === HOMES.player) return `Ta capitale, ${coords}`;
  if (index === HOMES.ai) return `Capitale adverse, ${coords}`;
  const owner = snapshot.match.owners[index];
  const sanctuary = snapshot.stage.sanctuaries.includes(index);
  if (owner)
    return `${owner === "player" ? "Ton territoire" : "Territoire adverse"}${sanctuary ? ", sanctuaire" : ""}, ${coords}`;
  if (snapshot.available.includes(index))
    return `Conquérir ${sanctuary ? "le sanctuaire" : "la case"}, ${coords}`;
  return `Case libre${sanctuary ? ", sanctuaire" : ""}, ${coords}`;
}

function paintTiles(snapshot: Snapshot): void {
  const rocks = new Set(snapshot.stage.rocks);
  const hubs = new Set(snapshot.stage.sanctuaries);
  const options = new Set(snapshot.available);
  const captures = new Set(snapshot.match.captured);
  for (let index = 0; index < tiles.length; index++) {
    const tile = tiles[index]!;
    const owner = snapshot.match.owners[index];
    const rock = rocks.has(index);
    const sanctuary = hubs.has(index);
    const legal = options.has(index);
    const isHome = index === HOMES.player || index === HOMES.ai;
    tile.className = [
      "tile",
      owner ? `tile-${owner}` : "tile-neutral",
      rock ? "tile-rock" : "",
      sanctuary ? "tile-sanctuary" : "",
      legal ? "tile-legal" : "",
      isHome ? "tile-home" : "",
      snapshot.match.lastMove === index ? "tile-last" : "",
      captures.has(index) ? "tile-captured" : "",
    ]
      .filter(Boolean)
      .join(" ");
    tile.disabled = !legal;
    tile.setAttribute("aria-label", nameFor(index, snapshot));
    tile.title = nameFor(index, snapshot);
    tile.replaceChildren();
    const mark = document.createElement("span");
    mark.className = "tile-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = rock
      ? "▰"
      : owner === "player"
        ? "✳"
        : owner === "ai"
          ? "✦"
          : sanctuary
            ? "◇"
            : "";
    tile.append(mark);
    if (isHome) {
      const badge = document.createElement("span");
      badge.className = "capital-badge";
      badge.textContent = "CAP";
      badge.setAttribute("aria-hidden", "true");
      tile.append(badge);
    }
    if (sanctuary) {
      const marker = document.createElement("span");
      marker.className = "sanctuary-mark";
      marker.textContent = "◆";
      marker.setAttribute("aria-hidden", "true");
      tile.append(marker);
    }
  }
}

function updateSelection(snapshot: Snapshot): void {
  select.replaceChildren(
    ...stages.map((stage, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.disabled = index > snapshot.unlocked;
      option.textContent = `${String(index + 1).padStart(2, "0")} — ${stage.title}${
        snapshot.wins.includes(stage.id)
          ? " ✓"
          : index > snapshot.unlocked
            ? " · verrouillée"
            : ""
      }`;
      return option;
    }),
  );
  select.value = String(snapshot.index);
}

function render(snapshot: Snapshot): void {
  if (lastStage !== snapshot.stage.id) {
    lastStage = snapshot.stage.id;
    board.dataset.stage = snapshot.stage.id;
  }
  paintTiles(snapshot);
  chapter.textContent = snapshot.stage.chapter;
  title.textContent = snapshot.stage.title;
  subtitle.textContent = snapshot.stage.subtitle;
  stageNumber.textContent = `${String(snapshot.index + 1).padStart(2, "0")} / ${snapshot.count}`;
  turnLabel.textContent = `COUP ${String(snapshot.match.moveCount + 1).padStart(2, "0")}`;
  playerScore.textContent = String(snapshot.scores.player);
  aiScore.textContent = String(snapshot.scores.ai);
  completedCount.textContent = String(snapshot.wins.length).padStart(2, "0");
  campaignProgress.style.width = `${(snapshot.wins.length * 100) / snapshot.count}%`;
  undoButton.disabled = !snapshot.canUndo;
  updateSelection(snapshot);

  if (snapshot.match.phase === "playing") {
    outcome.hidden = true;
    statusIcon.textContent = snapshot.thinking ? "⌛" : "◎";
    status.textContent = snapshot.thinking
      ? "L'ENCRE RÉFLÉCHIT…"
      : "À TOI DE JOUER";
    statusDetail.textContent = snapshot.thinking
      ? "Observe la frontière. Le prochain mouvement peut tout changer."
      : snapshot.match.captured.length
        ? `${snapshot.match.captured.length} territoire(s) ont changé de camp. Choisis une case lumineuse.`
        : "Choisis une case lumineuse voisine de tes terres.";
  } else {
    outcome.hidden = false;
    const victory = snapshot.match.phase === "won";
    status.textContent = winnerLabel(snapshot.match.phase).toUpperCase();
    statusIcon.textContent = victory
      ? "✳"
      : snapshot.match.phase === "draw"
        ? "◇"
        : "✦";
    statusDetail.textContent = `Score final : ${snapshot.scores.player} contre ${snapshot.scores.ai}.`;
    outcomeEyebrow.textContent = victory
      ? "TERRITOIRE CONQUIS"
      : snapshot.match.phase === "draw"
        ? "ÉQUILIBRE"
        : "L'ENCRE A GAGNÉ";
    outcomeTitle.textContent = victory
      ? "La frontière t'appartient."
      : snapshot.match.phase === "draw"
        ? "Personne ne cède."
        : "Il reste d'autres stratégies.";
    outcomeDetail.textContent = victory
      ? "Tu contrôles plus de points. Une nouvelle région est ouverte."
      : "Rejoue cette carte et explore un autre chemin.";
    nextButton.hidden = !snapshot.canContinue;
  }
}

createBoard();
controller.subscribe(render);
undoButton.addEventListener("click", () => controller.undo());
restartButton.addEventListener("click", () => controller.restart());
nextButton.addEventListener("click", () => controller.next());
select.addEventListener("change", () =>
  controller.select(Number(select.value)),
);
window.addEventListener("pagehide", () => controller.destroy(), { once: true });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) controller.suspend();
  else controller.resume();
});
