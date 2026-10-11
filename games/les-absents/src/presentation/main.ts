import { installFullscreen } from "./fullscreen";
import "./style.css";
import { AbsentsController } from "../application/AbsentsController";
import type { Snapshot } from "../application/AbsentsController";
import { levels } from "../domain/levels";
import { browserProgress } from "../infrastructure/browserStore";
import type { Edge, Node } from "../domain/types";

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing UI element: ${selector}`);
  return element;
}

const nodeLayer = required<HTMLDivElement>("#node-layer");
const haloLayer = required<SVGGElement>("#connections-halo");
const threadLayer = required<SVGGElement>("#connections");
const budgetLabel = required<HTMLElement>("#budget");
const receiverLabel = required<HTMLElement>("#receivers");
const dangerLabel = required<HTMLElement>("#danger");
const statusLabel = required<HTMLElement>("#status");
const chapterLabel = required<HTMLElement>("#chapter");
const titleLabel = required<HTMLElement>("#level-title");
const subtitleLabel = required<HTMLElement>("#level-subtitle");
const levelIndexLabel = required<HTMLElement>("#level-index");
const progressLabel = required<HTMLElement>("#progress-text");
const progressFill = required<HTMLElement>("#progress-fill");
const hintMessage = required<HTMLElement>("#hint-message");
const undoButton = required<HTMLButtonElement>("#undo");
const redoButton = required<HTMLButtonElement>("#redo");
const resetButton = required<HTMLButtonElement>("#reset");
const hintButton = required<HTMLButtonElement>("#hint");
const completion = required<HTMLElement>("#completion");
const nextButton = required<HTMLButtonElement>("#next");
const levelSelect = required<HTMLSelectElement>("#level-select");
const controller = new AbsentsController(levels, browserProgress);
let renderedLevelId = "";
let highlightedId: string | null = null;
const elements = new Map<string, HTMLElement>();

function makePath(edge: Edge, nodes: Map<string, Node>): SVGPathElement {
  const from = nodes.get(edge.from)!;
  const to = nodes.get(edge.to)!;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const bending = (((edge.from.length + edge.to.length) % 3) - 1) * 1.1;
  const controlX = (from.x + to.x) / 2 - (dy * bending) / 20;
  const controlY = (from.y + to.y) / 2 + (dx * bending) / 20;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`,
  );
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-linecap", "round");
  return path;
}

function drawLinks(snapshot: Snapshot): void {
  const nodes = new Map(snapshot.level.nodes.map((node) => [node.id, node]));
  const halos: SVGPathElement[] = [];
  const threads: SVGPathElement[] = [];
  for (const edge of snapshot.analysis.edges) {
    const powered = snapshot.analysis.energized.has(edge.from);
    const unsafe =
      powered &&
      (nodes.get(edge.from)?.role === "hazard" ||
        nodes.get(edge.to)?.role === "hazard");
    const halo = makePath(edge, nodes);
    halo.setAttribute(
      "class",
      `thread-halo ${powered ? "lit" : "unlit"} ${unsafe ? "unsafe" : ""}`,
    );
    const thread = makePath(edge, nodes);
    thread.setAttribute(
      "class",
      `thread ${powered ? "lit" : "unlit"} ${unsafe ? "unsafe" : ""}`,
    );
    halos.push(halo);
    threads.push(thread);
  }
  haloLayer.replaceChildren(...halos);
  threadLayer.replaceChildren(...threads);
}

function labelFor(node: Node, removed: boolean): string {
  if (node.role === "source") return "Source d'énergie";
  if (node.role === "receiver")
    return `Récepteur ${node.id === "target-a" ? "A" : "B"}`;
  if (node.role === "hazard") return "Zone de danger";
  return `Nœud ${node.id.slice(1)} — ${removed ? "restaurer" : "retirer"}`;
}

function buildBoard(snapshot: Snapshot): void {
  elements.clear();
  nodeLayer.replaceChildren();
  for (const node of snapshot.level.nodes) {
    const element = document.createElement(
      node.role === "neutral" ? "button" : "div",
    );
    element.className = `node node-${node.role}`;
    element.style.left = `${node.x}%`;
    element.style.top = `${node.y}%`;
    element.setAttribute("aria-label", labelFor(node, false));
    element.title = labelFor(node, false);
    if (node.role === "neutral") {
      const button = element as HTMLButtonElement;
      button.type = "button";
      button.dataset.nodeId = node.id;
      button.addEventListener("click", () => {
        if (controller.toggle(node.id)) {
          highlightedId = null;
          hintMessage.textContent = "Le réseau se réorganise à chaque absence.";
        }
      });
    } else {
      element.setAttribute("role", "img");
    }
    const shape = document.createElement("span");
    shape.className = "node-body";
    shape.setAttribute("aria-hidden", "true");
    element.append(shape);
    nodeLayer.append(element);
    elements.set(node.id, element);
  }
}

function drawNodes(snapshot: Snapshot): void {
  for (const node of snapshot.level.nodes) {
    const element = elements.get(node.id)!;
    const removed = snapshot.removed.includes(node.id);
    const energized = snapshot.analysis.energized.has(node.id);
    element.classList.toggle("absent", removed);
    element.classList.toggle("energized", energized);
    element.classList.toggle("hinted", highlightedId === node.id && !removed);
    element.classList.toggle("unsafe", energized && node.role === "hazard");
    element.setAttribute("aria-label", labelFor(node, removed));
    element.title = labelFor(node, removed);
    if (node.role === "neutral") {
      element.setAttribute("aria-pressed", String(removed));
      element.toggleAttribute("data-testid", false);
      if (highlightedId === node.id && !removed)
        element.setAttribute("data-testid", "hint-node");
    }
  }
}

function updateLevelSelect(snapshot: Snapshot): void {
  levelSelect.replaceChildren(
    ...levels.map((level, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.disabled = index > snapshot.unlocked;
      option.textContent = `${String(index + 1).padStart(2, "0")} — ${level.title}${
        snapshot.completed.includes(level.id)
          ? " ✓"
          : index > snapshot.unlocked
            ? " · verrouillé"
            : ""
      }`;
      return option;
    }),
  );
  levelSelect.value = String(snapshot.levelIndex);
}

function render(snapshot: Snapshot): void {
  if (renderedLevelId !== snapshot.level.id) {
    renderedLevelId = snapshot.level.id;
    highlightedId = null;
    buildBoard(snapshot);
    hintMessage.textContent =
      "Touchez un point blanc pour le retirer. Touchez son empreinte pour le restaurer.";
  }
  drawLinks(snapshot);
  drawNodes(snapshot);
  levelIndexLabel.textContent = `${String(snapshot.levelIndex + 1).padStart(2, "0")} / ${snapshot.levelCount}`;
  chapterLabel.textContent = snapshot.level.chapter.toUpperCase();
  titleLabel.textContent = snapshot.level.title;
  subtitleLabel.textContent = snapshot.level.subtitle;
  budgetLabel.textContent = `${snapshot.movesLeft} retrait${snapshot.movesLeft !== 1 ? "s" : ""} disponible${snapshot.movesLeft !== 1 ? "s" : ""}`;
  receiverLabel.textContent = `${snapshot.analysis.receiversPowered} / ${snapshot.analysis.receiversTotal}`;
  dangerLabel.textContent = snapshot.analysis.hazardPowered
    ? "ALIMENTÉE"
    : "ISOLÉE";
  dangerLabel.classList.toggle("warning", snapshot.analysis.hazardPowered);
  statusLabel.textContent = snapshot.analysis.solved
    ? "ÉQUILIBRE"
    : snapshot.movesLeft === 0
      ? "À RÉVISER"
      : "À COMPLÉTER";
  statusLabel.classList.toggle("good", snapshot.analysis.solved);
  undoButton.disabled = !snapshot.canUndo;
  redoButton.disabled = !snapshot.canRedo;
  hintButton.disabled = snapshot.analysis.solved;
  completion.hidden = !snapshot.analysis.solved;
  nextButton.hidden = snapshot.levelIndex === snapshot.levelCount - 1;
  const completedCount = snapshot.completed.length;
  progressLabel.textContent = `${completedCount} / ${snapshot.levelCount}`;
  progressFill.style.width = `${(100 * completedCount) / snapshot.levelCount}%`;
  updateLevelSelect(snapshot);
}

controller.subscribe(render);

undoButton.addEventListener("click", () => {
  highlightedId = null;
  controller.undo();
});
redoButton.addEventListener("click", () => {
  highlightedId = null;
  controller.redo();
});
resetButton.addEventListener("click", () => {
  highlightedId = null;
  controller.reset();
  hintMessage.textContent = "La constellation est revenue à son état initial.";
});
hintButton.addEventListener("click", () => {
  highlightedId = controller.hint();
  if (highlightedId) {
    hintMessage.textContent = `Indice : le nœud ${highlightedId.slice(1)} peut être retiré. Il est entouré de lumière.`;
  } else {
    hintMessage.textContent =
      "Cette configuration n'a plus de solution. Annulez un retrait pour continuer.";
  }
  drawNodes(controller.snapshot);
});
nextButton.addEventListener("click", () => controller.nextLevel());
levelSelect.addEventListener("change", () => {
  highlightedId = null;
  controller.selectLevel(Number(levelSelect.value));
});
document.addEventListener("keydown", (event) => {
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  )
    return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    if (event.shiftKey) controller.redo();
    else controller.undo();
  } else if (
    event.key.toLowerCase() === "h" &&
    !event.ctrlKey &&
    !event.metaKey
  ) {
    event.preventDefault();
    hintButton.click();
  }
});

installFullscreen();
