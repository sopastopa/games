import { describe, expect, it, vi } from "vitest";
import {
  createFullscreenControl,
  type FullscreenHost,
} from "../../src/presentation/fullscreen";

function setup(options: { supported?: boolean; rejects?: boolean } = {}) {
  let native = false;
  let listener = () => {};
  const states: boolean[] = [];
  const unsubscribe = vi.fn();
  const host: FullscreenHost = {
    isNativeActive: () => native,
    supportsNative: () => options.supported ?? true,
    enterNative: async () => {
      if (options.rejects) throw new Error("Fullscreen denied");
      native = true;
      listener();
    },
    exitNative: async () => {
      native = false;
      listener();
    },
    onNativeChange: (onChange) => {
      listener = onChange;
      return unsubscribe;
    },
  };
  const control = createFullscreenControl(host, (active) =>
    states.push(active),
  );
  return {
    control,
    states,
    unsubscribe,
    nativeChange(value: boolean) {
      native = value;
      listener();
    },
  };
}

describe("fullscreen", () => {
  it("enters and exits native fullscreen", async () => {
    const { control, states } = setup();
    await control.toggle();
    expect(control.active).toBe(true);
    await control.toggle();
    expect(control.active).toBe(false);
    expect(states).toEqual([false, true, true, false, false]);
  });
  it("falls back without native support", async () => {
    const { control } = setup({ supported: false });
    await control.toggle();
    expect(control.active).toBe(true);
    await control.toggle();
    expect(control.active).toBe(false);
  });
  it("recovers from a refused request", async () => {
    const { control } = setup({ rejects: true });
    await control.toggle();
    expect(control.active).toBe(true);
  });
  it("reacts to external fullscreen changes and disposes cleanly", () => {
    const { control, nativeChange, unsubscribe, states } = setup();
    nativeChange(true);
    expect(control.active).toBe(true);
    nativeChange(false);
    expect(control.active).toBe(false);
    control.dispose();
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(states.at(-1)).toBe(false);
  });
});
