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
  const control = createFullscreenControl(host, (active) => states.push(active));
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

describe("PRISME fullscreen", () => {
  it("enters and exits native fullscreen", async () => {
    const { control, states } = setup();
    await control.toggle();
    expect(control.active).toBe(true);
    await control.toggle();
    expect(control.active).toBe(false);
    expect(states.at(-1)).toBe(false);
  });

  it("uses viewport fallback without native support or after rejection", async () => {
    for (const options of [{ supported: false }, { rejects: true }]) {
      const { control } = setup(options);
      await control.toggle();
      expect(control.active).toBe(true);
      await control.toggle();
      expect(control.active).toBe(false);
    }
  });

  it("responds to external fullscreen changes and disposes cleanly", () => {
    const { control, unsubscribe, nativeChange } = setup();
    nativeChange(true);
    expect(control.active).toBe(true);
    nativeChange(false);
    expect(control.active).toBe(false);
    control.dispose();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
