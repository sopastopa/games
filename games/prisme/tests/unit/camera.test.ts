import { describe, expect, it } from "vitest";
import {
  cameraFor,
  pilotRotation,
  WALL_PALETTE,
} from "../../src/presentation/renderer";
import { SIZE } from "../../src/domain/map";

describe("PRISME full-viewport camera", () => {
  it("scales the camera to the screen rather than squeezing a full map", () => {
    const player = { x: 20, y: 20 };
    const desktop = cameraFor(1280, 700, player);
    const mobile = cameraFor(390, 720, player);
    const landscape = cameraFor(844, 320, player);
    for (const camera of [desktop, mobile, landscape]) {
      expect(camera.scale).toBeGreaterThanOrEqual(24);
      expect(camera.x).toBeGreaterThan(0);
      expect(camera.y).toBeGreaterThan(0);
    }
    expect(mobile.scale * SIZE).toBeGreaterThan(390);
    expect(landscape.scale * SIZE).toBeGreaterThan(844);
    expect(desktop.scale * SIZE).toBeGreaterThan(1280);
  });

  it("clamps at the world edges without showing empty borders", () => {
    const first = cameraFor(390, 600, { x: 5, y: 5 });
    const last = cameraFor(390, 600, { x: 39, y: 39 });
    expect(first.x).toBe(0);
    expect(first.y).toBe(0);
    expect(last.x + 390 / last.scale).toBeCloseTo(SIZE);
    expect(last.y + 600 / last.scale).toBeCloseTo(SIZE);
  });
});

function luminance(hex: string): number {
  const linear = [1, 3, 5].map((index) => {
    const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrast(a: string, b: string): number {
  const high = Math.max(luminance(a), luminance(b));
  const low = Math.min(luminance(a), luminance(b));
  return (high + 0.05) / (low + 0.05);
}

describe("clear combat silhouettes", () => {
  it("renders raised wall faces clearly on lit and remembered floors", () => {
    expect(contrast(WALL_PALETTE.visible.face, "#142b45")).toBeGreaterThan(3);
    expect(contrast(WALL_PALETTE.explored.face, "#0b172b")).toBeGreaterThan(2);
    expect(
      contrast(WALL_PALETTE.visible.rim, WALL_PALETTE.visible.face),
    ).toBeGreaterThan(3);
  });

  it("points the arrow in all four world-space directions", () => {
    expect(pilotRotation({ x: 0, y: -1 })).toBeCloseTo(0);
    expect(pilotRotation({ x: 1, y: 0 })).toBeCloseTo(Math.PI / 2);
    expect(pilotRotation({ x: 0, y: 1 })).toBeCloseTo(Math.PI);
    expect(pilotRotation({ x: -1, y: 0 })).toBeCloseTo((3 * Math.PI) / 2);
  });
});
