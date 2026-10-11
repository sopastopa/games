import { TorsionController } from "../application/TorsionController";
import { browserStore } from "../infrastructure/browser";
import { STAGES } from "../domain/levels";
import { canTurn, rotate, square } from "../domain/rules";
import type { GameView } from "../domain/types";
import "./style.css";

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error("Missing TORSION element: " + id);
  return node as T;
}

const board = element<HTMLDivElement>("board");
const chapter = element<HTMLElement>("chapter");
const title = element<HTMLElement>("stage-title");
const indexLabel = element<HTMLElement>("stage-index");
const lesson = element<HTMLElement>("lesson");
const insight = element<HTMLElement>("insight");
const turns = element<HTMLElement>("turns");
const status = element<HTMLElement>("status");
const statusDetail = element<HTMLElement>("status-detail");
const completed = element<HTMLElement>("completed");
const fill = element<HTMLDivElement>("progress-fill");
const best = element<HTMLElement>("best");
const select = element<HTMLSelectElement>("stage-select");
const undo = element<HTMLButtonElement>("undo");
const restart = element<HTMLButtonElement>("restart");
const next = element<HTMLButtonElement>("next");
const result = element<HTMLElement>("result");
const solvedPanel = element<HTMLDivElement>("solved-panel");

const game = new TorsionController(browserStore);

function paintHover(anchor: number | null, size: number): void {
  const selected = anchor === null ? [] : square(size, anchor) ?? [];
  for (const cell of board.querySelectorAll<HTMLElement>("[data-cell]")) {
    cell.classList.toggle(
      "preview",
      selected.includes(Number(cell.dataset.cell)),
    );
  }
}

function renderBoard(view: GameView): void {
  const { stage, puzzle } = view;
  board.style.setProperty("--size", String(stage.size));
  board.setAttribute(
    "aria-label",
    "Grille de " +
      stage.size +
      " lignes et colonnes. Tourner avec les boutons entre les cases.",
  );
  const cells = document.createElement("div");
  cells.className = "cells";
  cells.setAttribute("aria-hidden", "true");
  puzzle.tiles.forEach((piece, cell) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.cell = String(cell);
    if (stage.rocks.includes(cell)) {
      tile.classList.add("rock");
      tile.textContent = "✕";
    } else {
      const goalIndex = stage.goals.indexOf(cell);
      if (goalIndex >= 0) {
        const target = document.createElement("span");
        target.className = "target";
        target.textContent = String(goalIndex + 1);
        tile.append(target);
      }
      if (piece > 0) {
        const token = document.createElement("span");
        token.className = "piece piece-" + ((piece - 1) % 5);
        token.textContent = String(piece);
        tile.append(token);
        if (goalIndex + 1 === piece) tile.classList.add("correct");
      }
    }
    cells.append(tile);
  });
  const pivots = document.createElement("div");
  pivots.className = "pivots";
  for (let row = 0; row < stage.size - 1; row++) {
    for (let col = 0; col < stage.size - 1; col++) {
      const anchor = row * stage.size + col;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pivot";
      button.style.left = (100 * (col + 1)) / stage.size + "%";
      button.style.top = (100 * (row + 1)) / stage.size + "%";
      button.textContent = "↻";
      button.dataset.testid = "pivot-" + anchor;
      const legal = canTurn(stage, anchor);
      const effective =
        legal && rotate(puzzle.tiles, stage, anchor) !== puzzle.tiles;
      button.disabled = !effective || puzzle.phase === "solved";
      button.setAttribute(
        "aria-label",
        legal
          ? "Tourner le bloc ligne " +
              (row + 1) +
              ", colonne " +
              (col + 1)
          : "Rotation bloquée par un rocher",
      );
      if (!legal) button.classList.add("blocked");
      button.addEventListener("click", () => {
        game.turn(anchor);
      });
      button.addEventListener("pointerenter", () => {
        paintHover(anchor, stage.size);
      });
      button.addEventListener("pointerleave", () => {
        paintHover(null, stage.size);
      });
      button.addEventListener("focus", () => {
        paintHover(anchor, stage.size);
      });
      button.addEventListener("blur", () => {
        paintHover(null, stage.size);
      });
      pivots.append(button);
    }
  }
  board.replaceChildren(cells, pivots);
}

function render(view: GameView): void {
  const { stage, puzzle } = view;
  chapter.textContent = stage.chapter;
  title.textContent = stage.title;
  indexLabel.textContent =
    String(view.stageIndex + 1).padStart(2, "0") + " / " + STAGES.length;
  lesson.textContent = stage.lesson;
  insight.textContent = stage.insight;
  turns.textContent =
    String(puzzle.moves).padStart(2, "0") +
    (puzzle.moves === 1 ? " TOUR" : " TOURS");
  completed.textContent = String(view.completed).padStart(2, "0");
  fill.style.width = (100 * view.completed) / STAGES.length + "%";
  best.textContent = view.best === null ? "—" : view.best + " tours";
  status.textContent =
    puzzle.phase === "solved" ? "ATELIER RÉSOLU" : "À TOI DE JOUER";
  statusDetail.textContent =
    puzzle.phase === "solved"
      ? "Toutes les pièces sont à leur place. Tu peux continuer ou améliorer ton parcours."
      : "Choisis un ↻ entre quatre cases. Chaque rotation est réversible avec Annuler.";
  solvedPanel.hidden = puzzle.phase !== "solved";
  result.textContent =
    "Résolu en " +
    puzzle.moves +
    (puzzle.moves === 1 ? " tour. " : " tours. ") +
    "Référence de construction : " +
    stage.scramble.length +
    " tours (pas nécessairement le minimum).";
  next.hidden = view.stageIndex === STAGES.length - 1;
  undo.disabled = !view.canUndo;

  const selected = document.activeElement === select;
  select.replaceChildren();
  STAGES.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent =
      String(index + 1).padStart(2, "0") +
      " · " +
      item.title +
      (index > view.unlocked ? " · verrouillé" : "");
    option.disabled = index > view.unlocked;
    select.append(option);
  });
  select.value = String(view.stageIndex);
  if (selected) select.focus();
  renderBoard(view);
}

select.addEventListener("change", () => {
  game.select(Number(select.value));
});
undo.addEventListener("click", () => {
  game.undo();
});
restart.addEventListener("click", () => {
  game.restart();
});
next.addEventListener("click", () => {
  game.next();
});

game.subscribe(render);
