export interface FullscreenHost {
  isNativeActive(): boolean;
  supportsNative(): boolean;
  enterNative(): Promise<void>;
  exitNative(): Promise<void>;
  onNativeChange(listener: () => void): () => void;
}

export interface FullscreenControl {
  readonly active: boolean;
  toggle(): Promise<void>;
  dispose(): void;
}

export function createFullscreenControl(
  host: FullscreenHost,
  onChange: (active: boolean) => void,
): FullscreenControl {
  let fallback = false;
  let disposed = false;
  function sync(): void {
    if (disposed) return;
    if (host.isNativeActive()) fallback = false;
    onChange(host.isNativeActive() || fallback);
  }
  const unsubscribe = host.onNativeChange(sync);
  sync();
  return {
    get active() {
      return !disposed && (host.isNativeActive() || fallback);
    },
    async toggle(): Promise<void> {
      if (disposed) return;
      if (host.isNativeActive()) {
        try {
          await host.exitNative();
        } catch {
          // A rejected exit leaves native fullscreen active.
        }
      } else if (fallback) {
        fallback = false;
      } else if (host.supportsNative()) {
        try {
          await host.enterNative();
          if (!host.isNativeActive()) fallback = true;
        } catch {
          fallback = true;
        }
      } else {
        fallback = true;
      }
      sync();
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      fallback = false;
      onChange(false);
    },
  };
}

export function installFullscreen(): void {
  const button = document.querySelector<HTMLButtonElement>("#fullscreen");
  if (!button) throw new Error("Missing fullscreen control");
  const control = createFullscreenControl(
    {
      isNativeActive: () =>
        document.fullscreenElement === document.documentElement,
      supportsNative: () =>
        typeof document.documentElement.requestFullscreen === "function",
      enterNative: () => document.documentElement.requestFullscreen(),
      exitNative: () => document.exitFullscreen(),
      onNativeChange: (listener) => {
        document.addEventListener("fullscreenchange", listener);
        return () => document.removeEventListener("fullscreenchange", listener);
      },
    },
    (active) => {
      document.documentElement.classList.toggle("game-fullscreen", active);
      button.setAttribute("aria-pressed", String(active));
      button.textContent = active
        ? "⤢ Quitter le plein écran"
        : "⛶ Plein écran";
      window.dispatchEvent(new Event("resize"));
    },
  );
  button.addEventListener("click", () => {
    void control.toggle();
  });
  const onEscape = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || !control.active) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void control.toggle();
  };
  document.addEventListener("keydown", onEscape, true);
  window.addEventListener(
    "pagehide",
    () => {
      document.removeEventListener("keydown", onEscape, true);
      control.dispose();
    },
    { once: true },
  );
}
