import type { BestScoreStore, Clock } from "../application/ports";

export const browserClock: Clock = {
  every(milliseconds, action) {
    const timer = window.setInterval(action, milliseconds);
    return () => window.clearInterval(timer);
  },
};

const key = "games:snake:best-score";
export const browserBestScore: BestScoreStore = {
  read() {
    try {
      return Number(window.localStorage.getItem(key) ?? 0);
    } catch {
      return 0;
    }
  },
  write(score) {
    try {
      window.localStorage.setItem(key, String(score));
    } catch {
      /* Storage may be blocked. */
    }
  },
};
