import { SIZE } from "../domain/map";
import {
  bestAim,
  objectiveReady,
  type GameState,
  type Relay,
} from "../domain/rules";

const COLORS = ["#4ef6f3", "#fb6fad", "#ffd367"];
const BACKGROUNDS = ["#0b122e", "#140e30", "#101b33", "#201029"];

export interface Geometry {
  step: number;
  offsetX: number;
  offsetY: number;
}

export function geometry(canvas: HTMLCanvasElement): Geometry {
  const step = Math.max(
    1,
    Math.min(canvas.clientWidth / SIZE, canvas.clientHeight / SIZE),
  );
  return {
    step,
    offsetX: (canvas.clientWidth - SIZE * step) / 2,
    offsetY: (canvas.clientHeight - SIZE * step) / 2,
  };
}

function pixel(value: number, offset: number, step: number): number {
  return offset + (value + 0.5) * step;
}

function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function diamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
}

function relayRing(
  ctx: CanvasRenderingContext2D,
  relay: Relay,
  index: number,
  frame: number,
  geometry: Geometry,
): void {
  const { step, offsetX, offsetY } = geometry;
  const x = pixel(relay.x, offsetX, step);
  const y = pixel(relay.y, offsetY, step);
  const color = COLORS[index];
  circle(ctx, x, y, step * 0.52, color + "18");
  ctx.strokeStyle = color + "60";
  ctx.lineWidth = Math.max(1, step * 0.04);
  ctx.beginPath();
  ctx.arc(
    x,
    y,
    step * (0.4 + Math.sin(frame / 20 + index) * 0.03),
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = step * 0.095;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(
    x,
    y,
    step * 0.31,
    -Math.PI / 2,
    -Math.PI / 2 + (Math.PI * 2 * relay.charge) / 100,
  );
  ctx.stroke();
  ctx.shadowBlur = step * 0.5;
  ctx.shadowColor = color;
  diamond(ctx, x, y, step * 0.17);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowBlur = 0;
  if (relay.charge >= 100) {
    circle(ctx, x, y, step * 0.08, "#fff");
  }
}

export function renderArena(
  canvas: HTMLCanvasElement,
  game: GameState,
  frame: number,
  aim?: { x: number; y: number },
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const physicalWidth = Math.max(1, Math.round(width * dpr));
  const physicalHeight = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
    canvas.width = physicalWidth;
    canvas.height = physicalHeight;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const { step, offsetX, offsetY } = geometry(canvas);
  ctx.fillStyle = BACKGROUNDS[(game.zone - 1) % BACKGROUNDS.length];
  ctx.fillRect(0, 0, width, height);
  const ambient = ctx.createRadialGradient(
    width * 0.5,
    height * 0.48,
    0,
    width * 0.5,
    height * 0.48,
    Math.max(width, height) * 0.7,
  );
  ambient.addColorStop(0, "#39538b60");
  ambient.addColorStop(1, "#01051200");
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, width, height);

  const side = step * SIZE;
  ctx.fillStyle = "#071028";
  ctx.fillRect(offsetX, offsetY, side, side);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const at = y * SIZE + x;
      const left = offsetX + x * step;
      const top = offsetY + y * step;
      if (game.arena.walls[at]) {
        const border = (x + y + game.seed) % 4;
        const color = border === 0 ? "#184168" : "#172646";
        ctx.fillStyle = color;
        ctx.fillRect(left + 1, top + 1, step - 2, step - 2);
        ctx.fillStyle = "#63cfff24";
        ctx.fillRect(left + 2, top + 2, step - 4, step * 0.11);
        ctx.fillStyle = "#01091880";
        ctx.fillRect(left + 2, top + step * 0.77, step - 4, step * 0.17);
      } else {
        ctx.strokeStyle = "#8dcbfd12";
        ctx.lineWidth = 1;
        ctx.strokeRect(left + 0.5, top + 0.5, step - 1, step - 1);
        if ((x * 9 + y * 13 + game.seed) % 7 === 0) {
          ctx.fillStyle = "#adf6ff45";
          ctx.fillRect(
            left + step * 0.43,
            top + step * 0.43,
            step * 0.06,
            step * 0.06,
          );
        }
      }
    }
  }
  ctx.strokeStyle = "#7daefa60";
  ctx.lineWidth = 2;
  ctx.strokeRect(offsetX + 1, offsetY + 1, side - 2, side - 2);

  const finish = objectiveReady(game);
  const exitX = pixel(game.arena.exit.x, offsetX, step);
  const exitY = pixel(game.arena.exit.y, offsetY, step);
  const exitColor = finish ? "#b9fb80" : "#596a90";
  circle(ctx, exitX, exitY, step * 0.43, exitColor + "18");
  ctx.lineWidth = step * 0.07;
  ctx.strokeStyle = exitColor;
  ctx.shadowBlur = finish ? step * 0.6 : 0;
  ctx.shadowColor = exitColor;
  diamond(ctx, exitX, exitY, step * 0.32);
  ctx.stroke();
  ctx.shadowBlur = 0;
  for (let index = 0; index < game.relays.length; index++) {
    relayRing(ctx, game.relays[index], index, frame, {
      step,
      offsetX,
      offsetY,
    });
  }

  for (const enemy of game.enemies) {
    const x = pixel(enemy.x, offsetX, step);
    const y = pixel(enemy.y, offsetY, step);
    ctx.shadowBlur = step * 0.35;
    ctx.shadowColor = "#ff6c79";
    circle(ctx, x, y, step * 0.31, "#f45a80");
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#321339";
    diamond(ctx, x, y, step * 0.24);
    ctx.fill();
    circle(ctx, x, y, step * 0.09, "#ffdae5");
    ctx.strokeStyle = "#ffc4d1";
    ctx.lineWidth = step * 0.035;
    ctx.beginPath();
    ctx.moveTo(x - step * 0.26, y - step * 0.37);
    ctx.lineTo(x - step * 0.26 + step * 0.17 * enemy.hp, y - step * 0.37);
    ctx.stroke();
  }

  for (const shot of game.shots) {
    const x = pixel(shot.x, offsetX, step);
    const y = pixel(shot.y, offsetY, step);
    const color = shot.hostile ? "#ffb37f" : "#6effe5";
    ctx.shadowBlur = step * 0.33;
    ctx.shadowColor = color;
    circle(ctx, x, y, step * (shot.hostile ? 0.12 : 0.09), color);
    ctx.shadowBlur = 0;
  }

  const { player } = game;
  const px = pixel(player.x, offsetX, step);
  const py = pixel(player.y, offsetY, step);
  const pulse = 0.93 + Math.sin(frame / 10) * 0.08;
  circle(ctx, px, py, step * 0.48 * pulse, "#3affda20");
  const heading = aim ?? bestAim(game);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(Math.atan2(heading.y, heading.x) + Math.PI / 2);
  ctx.shadowBlur = step * 0.48;
  ctx.shadowColor = "#67f9e5";
  ctx.beginPath();
  ctx.moveTo(0, -step * 0.37);
  ctx.lineTo(step * 0.25, step * 0.26);
  ctx.lineTo(0, step * 0.14);
  ctx.lineTo(-step * 0.25, step * 0.26);
  ctx.closePath();
  ctx.fillStyle =
    player.invulnerable > 0 && frame % 8 < 4 ? "#ffffff" : "#67f9e5";
  ctx.fill();
  ctx.shadowBlur = 0;
  circle(ctx, 0, 0, step * 0.1, "#0c1c3b");
  ctx.restore();
  if (player.dashTime > 0) {
    ctx.strokeStyle = "#e4ffab";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, step * 0.49, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (game.phase === "playing" && finish) {
    ctx.textAlign = "center";
    ctx.font = "700 " + Math.max(9, Math.round(step * 0.26)) + "px system-ui";
    ctx.fillStyle = "#caff95";
    ctx.fillText("EXTRACTION OUVERTE", exitX, exitY - step * 0.53);
  }
}
