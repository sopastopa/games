import { SIZE, type Pickup, type Point } from "../domain/map";
import {
  bestAim,
  isEnemyVisible,
  objectiveReady,
  type GameState,
} from "../domain/rules";

const COLORS = ["#58f3ef", "#fa71b0", "#ffcf69"];
const DISTRICTS = ["#142b45", "#332346", "#153b3e", "#383321"];

export interface Camera {
  scale: number;
  x: number;
  y: number;
}

export function cameraFor(
  width: number,
  height: number,
  player: Point,
): Camera {
  const scale =
    width < 850
      ? Math.max(24, Math.min(48, Math.min(width / 11, height / 11)))
      : Math.max(
          width / SIZE,
          height / SIZE,
          35,
          Math.min(70, Math.min(width / 18, height / 12)),
        );
  return {
    scale,
    x: Math.max(
      0,
      Math.min(SIZE - width / scale, player.x - width / scale / 2),
    ),
    y: Math.max(
      0,
      Math.min(SIZE - height / scale, player.y - height / scale / 2),
    ),
  };
}

export function geometry(canvas: HTMLCanvasElement, state: GameState): Camera {
  return cameraFor(canvas.clientWidth, canvas.clientHeight, state.player);
}

export function screenToWorld(
  canvas: HTMLCanvasElement,
  state: GameState,
  clientX: number,
  clientY: number,
): Point {
  const rect = canvas.getBoundingClientRect();
  const camera = geometry(canvas, state);
  return {
    x: camera.x + (clientX - rect.left) / camera.scale - 0.5,
    y: camera.y + (clientY - rect.top) / camera.scale - 0.5,
  };
}

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function worldX(camera: Camera, x: number): number {
  return (x - camera.x + 0.5) * camera.scale;
}
function worldY(camera: Camera, y: number): number {
  return (y - camera.y + 0.5) * camera.scale;
}

function coloredPickup(kind: Pickup["kind"]): [string, string] {
  switch (kind) {
    case "key-rose":
      return ["#ff84c1", "◆"];
    case "key-cyan":
      return ["#58f3ef", "◆"];
    case "scatter":
      return ["#f0a1ff", "⋈"];
    case "rail":
      return ["#ffbb63", "⚡"];
    case "armor":
      return ["#9ce1ff", "✚"];
    case "radar":
      return ["#9afc8f", "◉"];
    case "battery":
      return ["#ffee90", "↯"];
  }
}

function renderWorld(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
): void {
  const { scale } = camera;
  const fromX = Math.max(0, Math.floor(camera.x) - 1);
  const fromY = Math.max(0, Math.floor(camera.y) - 1);
  const toX = Math.min(
    SIZE - 1,
    Math.ceil(camera.x + ctx.canvas.clientWidth / scale) + 1,
  );
  const toY = Math.min(
    SIZE - 1,
    Math.ceil(camera.y + ctx.canvas.clientHeight / scale) + 1,
  );
  for (let y = fromY; y <= toY; y++) {
    for (let x = fromX; x <= toX; x++) {
      const index = y * SIZE + x;
      const px = worldX(camera, x) - scale / 2;
      const py = worldY(camera, y) - scale / 2;
      if (!state.explored[index]) {
        ctx.fillStyle = "#080d1d";
        ctx.fillRect(px, py, scale + 0.5, scale + 0.5);
        continue;
      }
      const district = Number(x >= 20) + 2 * Number(y >= 20);
      ctx.fillStyle = DISTRICTS[district]!;
      ctx.fillRect(px, py, scale + 0.5, scale + 0.5);
      if (state.arena.walls[index]) {
        ctx.fillStyle = "#385278";
        ctx.fillRect(px + 1, py + 1, scale - 2, scale - 2);
        ctx.fillStyle = COLORS[district % 3]! + "38";
        ctx.fillRect(px + 2, py + 2, scale - 4, scale * 0.13);
      } else {
        ctx.strokeStyle = "#b8dcff19";
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, scale - 1, scale - 1);
        if ((x * 11 + y * 7 + state.seed) % 9 === 0) {
          ctx.fillStyle = "#c4f5ff40";
          ctx.fillRect(
            px + scale * 0.44,
            py + scale * 0.44,
            scale * 0.07,
            scale * 0.07,
          );
        }
      }
      if (!state.visible[index]) {
        ctx.fillStyle = "#040818bf";
        ctx.fillRect(px, py, scale + 0.5, scale + 0.5);
      }
    }
  }
}

function decorations(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  frame: number,
): void {
  const s = camera.scale;
  const show = (point: Point): boolean =>
    state.visible[Math.round(point.y) * SIZE + Math.round(point.x)] === true;
  for (const door of state.arena.doors) {
    if (!state.explored[Math.round(door.y) * SIZE + Math.round(door.x)])
      continue;
    const opened = state.opened.includes(door.id);
    const color =
      door.id === "rose"
        ? "#ff86c4"
        : door.id === "cyan"
          ? "#62f3ee"
          : "#ffcc65";
    const x = worldX(camera, door.x);
    const y = worldY(camera, door.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, s * 0.09);
    ctx.strokeRect(x - s * 0.28, y - s * 0.4, s * 0.56, s * 0.8);
    if (!opened) {
      ctx.fillStyle = color + "9a";
      ctx.fillRect(x - s * 0.24, y - s * 0.36, s * 0.48, s * 0.72);
      circle(ctx, x, y, s * 0.09, "#10152e");
    }
  }
  for (const [index, relay] of state.relays.entries()) {
    if (!state.explored[Math.round(relay.y) * SIZE + Math.round(relay.x)])
      continue;
    const x = worldX(camera, relay.x);
    const y = worldY(camera, relay.y);
    const color = COLORS[index]!;
    circle(ctx, x, y, s * 0.55, color + "20");
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.075;
    ctx.beginPath();
    ctx.arc(
      x,
      y,
      s * 0.36,
      -Math.PI / 2,
      -Math.PI / 2 + (relay.charge * Math.PI) / 50,
    );
    ctx.stroke();
    circle(ctx, x, y, s * 0.16, color);
    if (relay.charge === 100) circle(ctx, x, y, s * 0.08, "#ffffff");
  }
  if (
    state.explored[
      Math.round(state.arena.exit.y) * SIZE + Math.round(state.arena.exit.x)
    ]
  ) {
    const x = worldX(camera, state.arena.exit.x);
    const y = worldY(camera, state.arena.exit.y);
    const color = objectiveReady(state) ? "#b6ffa1" : "#778aa8";
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.1;
    ctx.strokeRect(-s * 0.25, -s * 0.25, s * 0.5, s * 0.5);
    ctx.restore();
  }
  for (const pickup of state.pickups) {
    if (!show(pickup)) continue;
    const x = worldX(camera, pickup.x);
    const y = worldY(camera, pickup.y);
    const [color, glyph] = coloredPickup(pickup.kind);
    circle(ctx, x, y, s * (0.33 + Math.sin(frame / 20) * 0.02), color + "45");
    circle(ctx, x, y, s * 0.23, color);
    ctx.font = "bold " + Math.round(s * 0.32) + "px system-ui";
    ctx.fillStyle = "#0d1830";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, x, y);
  }
}

function actors(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  frame: number,
  aim?: Point,
): void {
  const s = camera.scale;
  for (const enemy of state.enemies) {
    if (!isEnemyVisible(state, enemy)) continue;
    const x = worldX(camera, enemy.x);
    const y = worldY(camera, enemy.y);
    const color =
      enemy.kind === "hunter"
        ? "#ff7193"
        : enemy.kind === "sniper"
          ? "#ffbb65"
          : "#bb92ff";
    const radius = enemy.kind === "bulwark" ? 0.38 : 0.29;
    ctx.shadowColor = color;
    ctx.shadowBlur = s * 0.3;
    circle(ctx, x, y, s * radius, color);
    ctx.shadowBlur = 0;
    circle(ctx, x, y, s * 0.14, "#18203b");
    ctx.font = "bold " + Math.round(s * 0.24) + "px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff4fd";
    ctx.fillText(
      enemy.kind === "hunter" ? "▲" : enemy.kind === "sniper" ? "✛" : "■",
      x,
      y,
    );
    const maxHp =
      enemy.kind === "bulwark"
        ? 5 + state.zone
        : enemy.kind === "sniper"
          ? 2
          : 3;
    ctx.fillStyle = "#3c1b35";
    ctx.fillRect(x - s * 0.35, y - s * 0.48, s * 0.7, s * 0.065);
    ctx.fillStyle = color;
    ctx.fillRect(
      x - s * 0.35,
      y - s * 0.48,
      s * 0.7 * Math.max(0, enemy.hp / maxHp),
      s * 0.065,
    );
    if (enemy.timer < 29 && enemy.alert > 0) {
      ctx.strokeStyle = color + "a0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        worldX(camera, state.player.x),
        worldY(camera, state.player.y),
      );
      ctx.stroke();
    }
  }
  for (const shot of state.shots) {
    if (
      shot.hostile &&
      !state.visible[Math.round(shot.y) * SIZE + Math.round(shot.x)]
    )
      continue;
    const color = shot.hostile ? "#ffb987" : "#76ffee";
    circle(
      ctx,
      worldX(camera, shot.x),
      worldY(camera, shot.y),
      s * (shot.hostile ? 0.13 : 0.1),
      color,
    );
  }
  const { player } = state;
  const x = worldX(camera, player.x);
  const y = worldY(camera, player.y);
  const heading = aim ?? bestAim(state);
  const angle = Math.atan2(heading.y, heading.x) + Math.PI / 2;
  circle(ctx, x, y, s * 0.57, "#75fbe72c");
  if (player.armor > 0) {
    ctx.strokeStyle = "#9cc8ff";
    ctx.lineWidth = Math.max(2, s * 0.05);
    ctx.beginPath();
    ctx.arc(x, y, s * 0.48, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.43);
  ctx.lineTo(s * 0.3, s * 0.3);
  ctx.lineTo(0, s * 0.13);
  ctx.lineTo(-s * 0.3, s * 0.3);
  ctx.closePath();
  ctx.shadowBlur = s * 0.38;
  ctx.shadowColor = "#62f9e9";
  ctx.fillStyle =
    player.invulnerable > 0 && frame % 8 < 4 ? "#ffffff" : "#64f3dc";
  ctx.fill();
  ctx.restore();
  if (state.waypoint) {
    const wx = worldX(camera, state.waypoint.x);
    const wy = worldY(camera, state.waypoint.y);
    ctx.strokeStyle = "#f6fb9e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(wx, wy, s * 0.35, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function renderArena(
  canvas: HTMLCanvasElement,
  state: GameState,
  frame: number,
  aim?: Point,
): void {
  const ctx = context(canvas);
  if (!ctx) return;
  const camera = geometry(canvas, state);
  ctx.fillStyle = "#050a1b";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  renderWorld(ctx, state, camera);
  decorations(ctx, state, camera, frame);
  actors(ctx, state, camera, frame, aim);
}

export function renderMap(
  canvas: HTMLCanvasElement,
  state: GameState,
  showLabels = false,
): void {
  const ctx = context(canvas);
  if (!ctx) return;
  const s = Math.min(canvas.clientWidth, canvas.clientHeight) / SIZE;
  const ox = (canvas.clientWidth - SIZE * s) / 2;
  const oy = (canvas.clientHeight - SIZE * s) / 2;
  ctx.fillStyle = "#080e20";
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const index = y * SIZE + x;
      if (!state.explored[index]) continue;
      const district = Number(x >= 20) + 2 * Number(y >= 20);
      ctx.fillStyle = state.arena.walls[index]
        ? "#697891"
        : DISTRICTS[district]!;
      ctx.fillRect(ox + x * s, oy + y * s, Math.ceil(s), Math.ceil(s));
      if (state.visible[index] && !state.arena.walls[index]) {
        ctx.fillStyle = "#56cfe836";
        ctx.fillRect(ox + x * s, oy + y * s, Math.ceil(s), Math.ceil(s));
      }
    }
  }
  for (const door of state.arena.doors) {
    if (!state.explored[Math.round(door.y) * SIZE + Math.round(door.x)])
      continue;
    ctx.fillStyle = state.opened.includes(door.id) ? "#8bf4bd" : "#f6b46b";
    ctx.fillRect(
      ox + door.x * s,
      oy + door.y * s,
      Math.max(2, s),
      Math.max(2, s),
    );
  }
  for (const [index, relay] of state.relays.entries()) {
    if (!state.explored[cellIndex(relay)]) continue;
    circle(
      ctx,
      ox + (relay.x + 0.5) * s,
      oy + (relay.y + 0.5) * s,
      Math.max(2, s * 1.5),
      COLORS[index]!,
    );
  }
  if (state.explored[cellIndex(state.arena.exit)]) {
    circle(
      ctx,
      ox + (state.arena.exit.x + 0.5) * s,
      oy + (state.arena.exit.y + 0.5) * s,
      Math.max(2, s),
      "#e9ff9c",
    );
  }
  if (state.waypoint) {
    ctx.strokeStyle = "#eaff8f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      ox + (state.waypoint.x + 0.5) * s,
      oy + (state.waypoint.y + 0.5) * s,
      Math.max(3, s * 1.8),
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  circle(
    ctx,
    ox + (state.player.x + 0.5) * s,
    oy + (state.player.y + 0.5) * s,
    Math.max(3, s * 1.7),
    "#ffffff",
  );
  if (showLabels) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold " + Math.max(9, Math.round(s * 1.6)) + "px system-ui";
    ctx.fillStyle = "#b0c5ed";
    for (const [i, label] of ["ATELIER", "NÉON", "CRYPTE", "NOYAU"].entries()) {
      const x = ox + ((i % 2) * 20 + 10) * s;
      const y = oy + (Math.floor(i / 2) * 20 + 10) * s;
      if (
        state.explored[
          Math.floor((y - oy) / s) * SIZE + Math.floor((x - ox) / s)
        ]
      )
        ctx.fillText(label, x, y);
    }
  }
}

function cellIndex(point: Point): number {
  return Math.round(point.y) * SIZE + Math.round(point.x);
}

export function mapPointer(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): Point {
  const rect = canvas.getBoundingClientRect();
  const s = Math.min(canvas.clientWidth, canvas.clientHeight) / SIZE;
  const ox = (canvas.clientWidth - SIZE * s) / 2;
  const oy = (canvas.clientHeight - SIZE * s) / 2;
  return {
    x: Math.floor((clientX - rect.left - ox) / s),
    y: Math.floor((clientY - rect.top - oy) / s),
  };
}
