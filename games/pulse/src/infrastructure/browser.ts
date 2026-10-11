import type { BestStore, Clock, Effects } from "../application/ports";

const storageKey = "games:pulse:best-v1";

export const bestStore: BestStore = {
  read(): number {
    try {
      return Number(window.localStorage.getItem(storageKey) ?? 0);
    } catch {
      return 0;
    }
  },
  write(score: number): void {
    try {
      window.localStorage.setItem(storageKey, String(score));
    } catch {
      // Private mode or disabled storage must never block play.
    }
  },
};

export const frameClock: Clock = {
  begin(onFrame) {
    let last = performance.now();
    let request = 0;
    let active = true;
    const frame = (now: number): void => {
      if (!active) return;
      const delta = (now - last) / 1000;
      last = now;
      onFrame(delta);
      if (active) request = requestAnimationFrame(frame);
    };
    request = requestAnimationFrame(frame);
    return () => {
      active = false;
      cancelAnimationFrame(request);
    };
  },
};

export class BrowserSound implements Effects {
  enabled = false;
  private context: AudioContext | null = null;

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  hit(perfect: boolean): void {
    this.tone(perfect ? 880 : 660, perfect ? 0.16 : 0.11);
  }

  miss(): void {
    this.tone(190, 0.14);
  }

  private tone(frequency: number, duration: number): void {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(80, frequency * 0.75),
        now + duration,
      );
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.11, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.01);
    } catch {
      // Audio is optional; unsupported devices still have visual feedback.
    }
  }
}
