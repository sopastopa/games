import { WORLD, orbY } from "../domain/rules";
import type { Chapter, View } from "../domain/types";

const TWO_PI = Math.PI * 2;

function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TWO_PI);
  ctx.fill();
}

function cloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  circle(ctx, x - size * 0.32, y + size * 0.16, size * 0.35, color);
  circle(ctx, x, y, size * 0.45, color);
  circle(ctx, x + size * 0.38, y + size * 0.11, size * 0.31, color);
  ctx.fillStyle = color;
  ctx.fillRect(x - size * 0.48, y + size * 0.1, size * 0.96, size * 0.25);
}

function hills(
  ctx: CanvasRenderingContext2D,
  offset: number,
  baseline: number,
  amplitude: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, WORLD.height);
  for (let x = 0; x <= WORLD.width + 20; x += 16) {
    const wave = Math.sin((x + offset) * 0.007) * amplitude;
    const small = Math.cos((x + offset) * 0.016) * amplitude * 0.32;
    ctx.lineTo(x, baseline + wave + small);
  }
  ctx.lineTo(WORLD.width, WORLD.height);
  ctx.closePath();
  ctx.fill();
}

function petals(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 5; i++) {
    ctx.rotate(TWO_PI / 5);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, -13, 7, 13, 0, 0, TWO_PI);
    ctx.fill();
  }
  circle(ctx, 0, 0, 7, "#fff3a1");
  ctx.restore();
}

function scenery(
  ctx: CanvasRenderingContext2D,
  chapter: Chapter,
  camera: number,
): void {
  const { palette, motif } = chapter;
  for (let i = 0; i < Math.ceil(chapter.endX / 145) + 2; i++) {
    const x = 150 + i * 145 - camera;
    if (x < -110 || x > WORLD.width + 110) continue;
    const altitude = 14 + (i % 3) * 9;
    if (motif === "flowers" || motif === "forest") {
      ctx.lineWidth = motif === "forest" ? 8 : 4;
      ctx.strokeStyle = palette.ink;
      ctx.beginPath();
      ctx.moveTo(x, WORLD.ground);
      ctx.quadraticCurveTo(
        x - 14,
        WORLD.ground - 68,
        x + 7,
        WORLD.ground - 120 - altitude,
      );
      ctx.stroke();
      if (motif === "forest") {
        circle(ctx, x + 7, WORLD.ground - 137 - altitude, 43, palette.hillFar);
        circle(ctx, x - 17, WORLD.ground - 112 - altitude, 30, palette.glow);
        circle(ctx, x + 30, WORLD.ground - 114 - altitude, 29, palette.hill);
      } else {
        petals(
          ctx,
          x + 7,
          WORLD.ground - 120 - altitude,
          i % 2 ? "#ffe9f2" : palette.glow,
        );
        ctx.fillStyle = palette.hill;
        ctx.beginPath();
        ctx.ellipse(x + 14, WORLD.ground - 52, 15, 7, -0.65, 0, TWO_PI);
        ctx.fill();
      }
    } else if (motif === "lanterns" || motif === "candy") {
      ctx.strokeStyle = palette.ink;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, WORLD.ground);
      ctx.lineTo(x + 4, WORLD.ground - 156 - altitude);
      ctx.stroke();
      circle(
        ctx,
        x + 4,
        WORLD.ground - 163 - altitude,
        motif === "candy" ? 22 : 29,
        motif === "candy" ? "#ffe6ff" : palette.glow,
      );
      circle(ctx, x - 2, WORLD.ground - 171 - altitude, 8, palette.ground);
    } else if (motif === "sea") {
      ctx.strokeStyle = "#e9ffff";
      ctx.lineWidth = 4;
      for (let row = 0; row < 3; row++) {
        ctx.beginPath();
        ctx.arc(x, WORLD.ground - row * 21 - 19, 25, Math.PI, TWO_PI);
        ctx.stroke();
      }
      circle(ctx, x + 32, WORLD.ground - 50, 16, palette.glow);
    } else if (motif === "night") {
      circle(ctx, x + 8, WORLD.ground - 120 - altitude, 24, palette.glow);
      circle(ctx, x + 19, WORLD.ground - 130 - altitude, 24, palette.hill);
      for (let star = 0; star < 3; star++)
        circle(
          ctx,
          x - 35 + star * 23,
          WORLD.ground - 198 - altitude + star * 13,
          3.5,
          "#fff8e1",
        );
    } else {
      for (let stripe = 0; stripe < 5; stripe++) {
        ctx.strokeStyle = [
          "#ff8ba9",
          "#ffcf66",
          "#9ffbc0",
          "#83deff",
          "#ad8aff",
        ][stripe]!;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(x, WORLD.ground + 11, 65 + stripe * 11, Math.PI, TWO_PI);
        ctx.stroke();
      }
    }
  }
}

function paintWinds(
  ctx: CanvasRenderingContext2D,
  chapter: Chapter,
  camera: number,
): void {
  for (const wind of chapter.winds) {
    const x = wind.x - camera;
    if (x > WORLD.width || x + wind.width < 0) continue;
    ctx.save();
    const gradient = ctx.createLinearGradient(x, WORLD.ground, x, 135);
    gradient.addColorStop(0, "#72fce299");
    gradient.addColorStop(1, "#ffffff00");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 135, wind.width, WORLD.ground - 135);
    ctx.strokeStyle = "#e8fff2b8";
    ctx.lineWidth = 3;
    for (let col = 0; col < 3; col++) {
      const centerX = x + ((col + 0.5) * wind.width) / 3;
      for (let row = 0; row < 3; row++) {
        const y = WORLD.ground - 62 - row * 72;
        ctx.beginPath();
        ctx.moveTo(centerX - 11, y + 11);
        ctx.lineTo(centerX, y - 2);
        ctx.lineTo(centerX + 11, y + 11);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function paintHazards(
  ctx: CanvasRenderingContext2D,
  chapter: Chapter,
  camera: number,
  promenade: boolean,
  elapsed: number,
): void {
  for (const obstacle of chapter.obstacles) {
    const x = obstacle.x - camera;
    if (x < -410 || x > WORLD.width + 60) continue;
    ctx.save();
    ctx.globalAlpha = promenade ? 0.38 : 1;
    if (obstacle.kind === "gap") {
      const deep = ctx.createLinearGradient(0, WORLD.ground, 0, WORLD.height);
      deep.addColorStop(0, "#241738");
      deep.addColorStop(1, "#080c2a");
      ctx.fillStyle = deep;
      ctx.fillRect(
        x,
        WORLD.ground - 1,
        obstacle.width,
        WORLD.height - WORLD.ground + 3,
      );
      ctx.strokeStyle = "#fae4ff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, WORLD.ground);
      ctx.lineTo(x, WORLD.ground + 34);
      ctx.moveTo(x + obstacle.width, WORLD.ground);
      ctx.lineTo(x + obstacle.width, WORLD.ground + 34);
      ctx.stroke();
      for (let i = 0; i < Math.floor(obstacle.width / 26); i++) {
        circle(
          ctx,
          x + 16 + i * 26,
          WORLD.ground + 50 + (i % 2) * 18,
          2.5,
          "#f5cdff",
        );
      }
      if (promenade) {
        ctx.fillStyle = "#d1fff0b8";
        ctx.fillRect(x, WORLD.ground - 2, obstacle.width, 6);
      }
    } else if (obstacle.kind === "arch") {
      const bottom = obstacle.bottom ?? 350;
      ctx.fillStyle = "#423050";
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x + obstacle.width, 40);
      ctx.lineTo(x + obstacle.width, bottom - 18);
      ctx.quadraticCurveTo(x + obstacle.width / 2, bottom + 17, x, bottom - 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fdb8de";
      ctx.fillRect(x + 10, 40, 6, bottom - 87);
      ctx.fillRect(x + obstacle.width - 16, 40, 6, bottom - 87);
      ctx.fillStyle = "#fff1a8";
      circle(ctx, x + obstacle.width / 2, bottom - 20, 12, "#fff1a8");
      ctx.fillStyle = "#413052";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("↓", x + obstacle.width / 2, bottom - 13);
    } else if (obstacle.kind === "orb") {
      const y = orbY(obstacle, elapsed);
      const center = x + obstacle.width / 2;
      ctx.shadowColor = "#ff45c0";
      ctx.shadowBlur = 24;
      circle(ctx, center, y, obstacle.width * 0.48 + 7, "#ff74c4aa");
      ctx.shadowBlur = 0;
      circle(ctx, center, y, obstacle.width * 0.45, "#402654");
      circle(ctx, center + 5, y - 5, 7, "#fff18a");
      circle(ctx, center - 9, y + 7, 4, "#ff9ede");
      ctx.strokeStyle = "#ffffffbd";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(center, y, obstacle.width * 0.48 + 17, 0.3, 2.5);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#302342";
      ctx.beginPath();
      ctx.moveTo(x, WORLD.ground + 2);
      ctx.quadraticCurveTo(
        x + 6,
        WORLD.ground - 33,
        x + obstacle.width * 0.24,
        WORLD.ground - 23,
      );
      ctx.quadraticCurveTo(
        x + obstacle.width * 0.48,
        WORLD.ground - 58,
        x + obstacle.width * 0.7,
        WORLD.ground - 25,
      );
      ctx.quadraticCurveTo(
        x + obstacle.width,
        WORLD.ground - 49,
        x + obstacle.width,
        WORLD.ground,
      );
      ctx.closePath();
      ctx.fill();
      circle(ctx, x + obstacle.width * 0.5, WORLD.ground - 24, 4.5, "#fff1a0");
    }
    ctx.restore();
  }
}

function spark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
): void {
  ctx.save();
  ctx.shadowColor = "#fff4b6";
  ctx.shadowBlur = 20;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 16);
  ctx.quadraticCurveTo(x + 5, y - 5, x + 16, y);
  ctx.quadraticCurveTo(x + 5, y + 5, x, y + 16);
  ctx.quadraticCurveTo(x - 5, y + 5, x - 16, y);
  ctx.quadraticCurveTo(x - 5, y - 5, x, y - 16);
  ctx.fill();
  ctx.restore();
}

function player(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  view: View,
): void {
  const { palette } = view.chapter;
  ctx.save();
  ctx.translate(x, y);
  if (!view.run.grounded) ctx.rotate(-0.07);
  ctx.globalAlpha = 0.2;
  circle(ctx, -35, 8, 14, palette.glow);
  circle(ctx, -58, 12, 8, palette.glow);
  ctx.globalAlpha = 1;
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = 25;
  circle(ctx, 0, 1, 26, palette.companion);
  circle(ctx, -12, -14, 17, palette.companion);
  circle(ctx, 13, -10, 17, palette.companion);
  ctx.shadowBlur = 0;
  ctx.fillStyle = palette.ink;
  ctx.beginPath();
  ctx.ellipse(-9, 0, 2.9, 4.3, 0, 0, TWO_PI);
  ctx.ellipse(9, 0, 2.9, 4.3, 0, 0, TWO_PI);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = palette.ink;
  ctx.beginPath();
  ctx.arc(0, 7, 5, 0.18, Math.PI - 0.18);
  ctx.stroke();
  circle(ctx, -17, 8, 5, "#ff93ae");
  circle(ctx, 17, 8, 5, "#ff93ae");
  circle(ctx, -12, 27, 6, palette.ink);
  circle(ctx, 12, 27, 6, palette.ink);
  spark(ctx, 17, -29, palette.glow);
  ctx.restore();
}

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  view: View,
  motion = true,
): void {
  const { chapter, run } = view;
  const { palette } = chapter;
  const camera = Math.max(0, Math.min(run.x - 235, chapter.endX - 690));
  const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  gradient.addColorStop(0, palette.sky);
  gradient.addColorStop(1, palette.horizon);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  const sunX = 730 - camera * 0.08;
  circle(ctx, sunX, 125, 85, palette.glow);
  circle(ctx, sunX, 125, 111, "#ffffff32");
  for (let i = 0; i < 12; i++) {
    const x = ((((i * 233 + 67 - camera * 0.19) % 1250) + 1250) % 1250) - 70;
    const y = 65 + (i % 5) * 52;
    if (i % 3 === 0) spark(ctx, x, y, "#fff9e4");
    else cloud(ctx, x, y, 28 + (i % 4) * 13, "#ffffff63");
  }
  hills(ctx, camera * 0.19, 298, 30, palette.hillFar);
  hills(ctx, camera * 0.41 + 200, 349, 28, palette.hill);
  scenery(ctx, chapter, camera);
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, WORLD.ground, WORLD.width, WORLD.height - WORLD.ground);
  ctx.strokeStyle = palette.glow;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, WORLD.ground);
  ctx.lineTo(WORLD.width, WORLD.ground);
  ctx.stroke();
  for (let i = 0; i < 50; i++) {
    const x = (((i * 119 - camera * 0.98) % 1100) + 1100) % 1100;
    circle(ctx, x, 451 + (i % 4) * 21, i % 3 === 0 ? 4 : 2.5, "#ffffff5f");
  }
  paintWinds(ctx, chapter, camera);
  paintHazards(ctx, chapter, camera, view.progress.promenade, run.elapsed);
  const flagX = chapter.checkpoint - camera;
  if (flagX > -50 && flagX < WORLD.width + 50) {
    ctx.fillStyle = palette.ink;
    ctx.fillRect(flagX, WORLD.ground - 100, 4, 100);
    ctx.fillStyle = palette.glow;
    ctx.beginPath();
    ctx.moveTo(flagX + 5, WORLD.ground - 100);
    ctx.lineTo(flagX + 55, WORLD.ground - 90);
    ctx.lineTo(flagX + 5, WORLD.ground - 63);
    ctx.closePath();
    ctx.fill();
    spark(ctx, flagX + 21, WORLD.ground - 85, "#ffffff");
  }
  const doorX = chapter.endX - camera;
  if (doorX > -100 && doorX < WORLD.width + 100) {
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = ["#ff71a3", "#ffcf63", "#abf2a9", "#88dfff", "#b9a2ff"][
        i
      ]!;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(doorX, WORLD.ground, 71 - 12 * i, Math.PI, TWO_PI);
      ctx.stroke();
    }
    spark(ctx, doorX, WORLD.ground - 115, "#ffffff");
  }
  chapter.sparks.forEach((item, index) => {
    if (run.sparks.includes(index)) return;
    const x = item.x - camera;
    if (x < -35 || x > WORLD.width + 35) return;
    spark(
      ctx,
      x,
      item.y + (motion ? Math.sin(run.x * 0.035 + index) * 6 : 0),
      palette.glow,
    );
    circle(ctx, x, item.y, 25, "#ffffff24");
  });
  player(ctx, run.x - camera, run.y, view);
}
