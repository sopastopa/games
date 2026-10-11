import { installFullscreen } from "./fullscreen";
import "./style.css";
import { GameController } from "../application/GameController";

const counter = document.querySelector<HTMLElement>("#count");
const button = document.querySelector<HTMLButtonElement>("#increment");
if (!counter || !button) throw new Error("Missing UI elements");
const game = new GameController();
button.addEventListener("click", () => {
  counter.textContent = String(game.play());
});

installFullscreen();
