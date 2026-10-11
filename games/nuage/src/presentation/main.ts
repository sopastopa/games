import { NuageController } from "../application/NuageController";
import { CHAPTERS } from "../domain/chapters";
import { WORLD, narrative } from "../domain/rules";
import type { View } from "../domain/types";
import { animationClock, browserStore } from "../infrastructure/browser";
import { drawWorld } from "./renderer";
import "./style.css";

function required<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error("NUAGE: missing element " + id);
  return element as T;
}

const canvas = required<HTMLCanvasElement>("world");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D unavailable");
const painting = ctx;
const game = new NuageController({ store: browserStore, clock: animationClock });
const place = required<HTMLElement>("place");
const chapterTitle = required<HTMLElement>("chapter-title");
const chapterIndex = required<HTMLElement>("chapter-index");
const progress = required<HTMLElement>("scene-progress");
const journeyFill = required<HTMLElement>("journey-fill");
const journeyDot = required<HTMLElement>("journey-dot");
const storyLabel = required<HTMLElement>("story-label");
const storyText = required<HTMLElement>("story");
const sparkLabel = required<HTMLElement>("story-sparks");
const status = required<HTMLElement>("story-status");
const jumpButton = required<HTMLButtonElement>("jump");
const jumpLabel = required<HTMLElement>("jump-label");
const pauseButton = required<HTMLButtonElement>("pause");
const restartButton = required<HTMLButtonElement>("restart");
const ending = required<HTMLElement>("ending");
const endingTitle = required<HTMLElement>("ending-title");
const endingText = required<HTMLElement>("ending-text");
const nextButton = required<HTMLButtonElement>("next");
const finishedCount = required<HTMLElement>("finished-count");
const chapterSelect = required<HTMLSelectElement>("chapter-select");
const chapterDots = required<HTMLElement>("chapter-dots");
const promenade = required<HTMLInputElement>("promenade");
const paletteLabel = required<HTMLElement>("palette-label");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let menuSignature = "";

function text(element: HTMLElement, value: string): void {
  if (element.textContent !== value) element.textContent = value;
}

function updateChapterMenu(view: View): void {
  const signature = String(view.progress.unlocked);
  if (menuSignature === signature) {
    if (chapterSelect.value !== String(view.chapterIndex))
      chapterSelect.value = String(view.chapterIndex);
    return;
  }
  menuSignature = signature;
  chapterSelect.replaceChildren();
  CHAPTERS.forEach((chapter, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent =
      chapter.number +
      " · " +
      chapter.title +
      (index > view.progress.unlocked ? " · à découvrir" : "");
    option.disabled = index > view.progress.unlocked;
    chapterSelect.append(option);
  });
  chapterSelect.value = String(view.chapterIndex);
}

function updateDots(view: View): void {
  if (chapterDots.childElementCount !== CHAPTERS.length) {
    for (const chapter of CHAPTERS) {
      const dot = document.createElement("span");
      dot.title = chapter.title;
      chapterDots.append(dot);
    }
  }
  const colors = [
    "#f9669e", "#ffad4f", "#f6d75b", "#6bdb9e", "#6bc8f9",
    "#aa80eb", "#ff8acc",
  ];
  [...chapterDots.children].forEach((dot, index) => {
    const element = dot as HTMLElement;
    element.style.setProperty("--dot-color", colors[index]!);
    element.classList.toggle(
      "achieved",
      view.progress.finished.includes(CHAPTERS[index]!.id),
    );
    element.classList.toggle("active", index === view.chapterIndex);
  });
}

function render(view: View): void {
  const { run, chapter } = view;
  document.documentElement.style.setProperty("--scene-accent", chapter.palette.sky);
  text(place, chapter.place);
  text(chapterTitle, chapter.title);
  text(chapterIndex, chapter.number + " / 07");
  text(paletteLabel, chapter.colorName.toUpperCase());
  const percentage = Math.round((run.x / chapter.endX) * 100);
  text(progress, percentage + " % DU VOYAGE");
  journeyFill.style.width = percentage + "%";
  journeyDot.style.left = percentage + "%";
  text(
    storyLabel,
    run.beat === "opening"
      ? "LE DÉBUT DE L'HISTOIRE"
      : run.beat === "middle"
        ? "UNE NOUVELLE PAGE"
        : "LA FIN DE CE CHAPITRE",
  );
  text(storyText, narrative(run, chapter));
  text(
    sparkLabel,
    "✳ " + run.sparks.length + " / " + chapter.sparks.length + " souvenirs lumineux",
  );
  text(
    status,
    run.phase === "ready"
      ? "PRÊT À PARTIR"
      : run.phase === "paused"
        ? "EN PAUSE"
        : run.phase === "complete"
          ? "CHAPITRE TERMINÉ"
          : "EN ROUTE" + (run.tries > 0 ? " · " + run.tries + " REPRISES" : ""),
  );
  text(
    jumpLabel,
    run.phase === "ready"
      ? "Commencer l'aventure"
      : run.phase === "paused"
        ? "Reprendre l'aventure"
        : run.phase === "complete"
          ? "Chapitre terminé"
          : "SAUTER · maintenir pour planer",
  );
  jumpButton.disabled = run.phase === "complete";
  pauseButton.disabled = run.phase === "ready" || run.phase === "complete";
  text(pauseButton, run.phase === "paused" ? "▶ Reprendre" : "Ⅱ Pause");
  ending.hidden = run.phase !== "complete";
  text(
    endingTitle,
    view.chapterIndex === CHAPTERS.length - 1
      ? "Le ciel appartient à tous."
      : "Une couleur de plus dans le monde.",
  );
  text(endingText, chapter.ending);
  nextButton.hidden = !view.canContinue;
  if (promenade.checked !== view.progress.promenade)
    promenade.checked = view.progress.promenade;
  text(finishedCount, String(view.finishedCount).padStart(2, "0"));
  updateChapterMenu(view);
  updateDots(view);
  painting.save();
  painting.setTransform(canvas.width / WORLD.width, 0, 0, canvas.height / WORLD.height, 0, 0);
  drawWorld(painting, view, !reducedMotion.matches);
  painting.restore();
}

function resizeCanvas(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(WORLD.width * dpr);
  canvas.height = Math.round(WORLD.height * dpr);
  render(game.state);
}

jumpButton.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();
  game.setHolding(true);
  game.action();
  jumpButton.setPointerCapture(event.pointerId);
});
jumpButton.addEventListener("pointerup", () => {
  game.setHolding(false);
});
jumpButton.addEventListener("pointercancel", () => {
  game.setHolding(false);
});
jumpButton.addEventListener("lostpointercapture", () => {
  game.setHolding(false);
});
jumpButton.addEventListener("click", (event) => {
  if (event.detail === 0) game.action();
});
pauseButton.addEventListener("click", () => game.togglePause());
restartButton.addEventListener("click", () => game.restart());
nextButton.addEventListener("click", () => game.next());
chapterSelect.addEventListener("change", () => {
  game.select(Number(chapterSelect.value));
});
promenade.addEventListener("change", () => {
  game.setPromenade(promenade.checked);
});

function fromInteractive(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest("button, a, input, select, textarea") !== null
  );
}

document.addEventListener("keydown", (event) => {
  if (fromInteractive(event.target)) return;
  if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
    event.preventDefault();
    game.setHolding(true);
    if (!event.repeat) game.action();
  } else if (event.code === "KeyP" || event.code === "Escape") {
    game.togglePause();
  }
});
document.addEventListener("keyup", (event) => {
  if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
    game.setHolding(false);
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) game.hide();
});
window.addEventListener("blur", () => {
  game.setHolding(false);
});
window.addEventListener("pagehide", () => game.dispose(), { once: true });

game.subscribe(render);
resizeCanvas();
