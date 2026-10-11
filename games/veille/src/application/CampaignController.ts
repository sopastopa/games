import { newExpedition, transition, validateExpedition } from "../domain/rules";
import { SECTORS } from "../domain/sectors";
import {
  SECTOR_COUNT,
  type Action,
  type Campaign,
  type Expedition,
  type Role,
} from "../domain/types";

export interface CampaignStore {
  load(): unknown;
  save(campaign: Campaign): void;
}
export interface View {
  campaign: Campaign;
  run: Expedition | null;
}

export function restoreCampaign(raw: unknown): Campaign {
  const empty: Campaign = {
    unlocked: 0,
    completed: [],
    bestTurns: {},
    discoveries: [],
    launches: 0,
    run: null,
  };
  if (!raw || typeof raw !== "object") return empty;
  const value = raw as Partial<Campaign>;
  const completed = Array.isArray(value.completed)
    ? Array.from(
        new Set(
          value.completed.filter(
            (index): index is number =>
              Number.isInteger(index) && index >= 0 && index < SECTOR_COUNT,
          ),
        ),
      )
    : [];
  const bestTurns: Record<string, number> = {};
  if (value.bestTurns && typeof value.bestTurns === "object") {
    for (const [index, score] of Object.entries(value.bestTurns)) {
      if (
        /^(?:[0-9]|1[01])$/.test(index) &&
        typeof score === "number" &&
        Number.isInteger(score) &&
        score > 0 &&
        score < 100000
      ) {
        bestTurns[index] = score;
      }
    }
  }
  const discoveries = Array.isArray(value.discoveries)
    ? Array.from(
        new Set(
          value.discoveries.filter(
            (id): id is string =>
              typeof id === "string" && /^(?:[0-9]|1[01]):[123]$/.test(id),
          ),
        ),
      )
    : [];
  const unlocked = Math.max(
    0,
    Math.min(
      SECTOR_COUNT - 1,
      completed.reduce((highest, index) => Math.max(highest, index + 1), 0),
    ),
  );
  const candidate =
    validateExpedition(value.run) && value.run.sector <= unlocked
      ? value.run
      : null;
  return {
    unlocked,
    completed,
    bestTurns,
    discoveries,
    launches:
      Number.isSafeInteger(value.launches) && (value.launches ?? -1) >= 0
        ? value.launches!
        : 0,
    run: candidate,
  };
}

export class CampaignController {
  private campaign: Campaign;
  private observers = new Set<(view: View) => void>();

  constructor(private readonly store: CampaignStore) {
    this.campaign = restoreCampaign(store.load());
  }

  get view(): View {
    return { campaign: this.campaign, run: this.campaign.run };
  }

  subscribe(listener: (view: View) => void): () => void {
    this.observers.add(listener);
    listener(this.view);
    return () => this.observers.delete(listener);
  }

  private publish(): void {
    this.store.save(this.campaign);
    for (const observer of this.observers) observer(this.view);
  }

  launch(sector: number, role: Role, customSeed?: number): boolean {
    if (
      !Number.isInteger(sector) ||
      sector < 0 ||
      sector > this.campaign.unlocked ||
      !["scout", "engineer", "guardian"].includes(role)
    )
      return false;
    const seed =
      customSeed ?? 4217 + sector * 1013 + this.campaign.launches * 7919;
    if (!Number.isSafeInteger(seed) || seed <= 0 || seed > 999999999)
      return false;
    const run = newExpedition(sector, seed, role);
    this.campaign = {
      ...this.campaign,
      launches: this.campaign.launches + 1,
      run,
    };
    this.publish();
    return true;
  }

  act(action: Action): boolean {
    const run = this.campaign.run;
    if (!run) return false;
    const next = transition(run, action);
    if (next === run) return false;
    const discoveries = [...this.campaign.discoveries];
    for (let i = run.archives + 1; i <= next.archives; i++) {
      const id = `${next.sector}:${i}`;
      if (!discoveries.includes(id)) discoveries.push(id);
    }
    const completed = [...this.campaign.completed];
    const bestTurns = { ...this.campaign.bestTurns };
    let unlocked = this.campaign.unlocked;
    if (next.phase === "won") {
      if (!completed.includes(next.sector)) completed.push(next.sector);
      unlocked = Math.max(
        unlocked,
        Math.min(SECTORS.length - 1, next.sector + 1),
      );
      const current = bestTurns[String(next.sector)];
      bestTurns[String(next.sector)] =
        current === undefined ? next.turn : Math.min(current, next.turn);
    }
    this.campaign = {
      ...this.campaign,
      run: next,
      discoveries,
      completed,
      bestTurns,
      unlocked,
    };
    this.publish();
    return true;
  }

  abandon(): void {
    this.campaign = { ...this.campaign, run: null };
    this.publish();
  }

  retry(): void {
    const run = this.campaign.run;
    if (run) this.launch(run.sector, run.role, run.seed);
  }

  next(): void {
    const run = this.campaign.run;
    if (run?.phase === "won")
      this.launch(Math.min(run.sector + 1, this.campaign.unlocked), run.role);
  }

  dispose(): void {
    this.observers.clear();
  }
}
