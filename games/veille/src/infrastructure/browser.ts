import type { CampaignStore } from "../application/CampaignController";
import type { Campaign } from "../domain/types";

const KEY = "games:veille:campaign:v1";
export const browserCampaign: CampaignStore = {
  load(): unknown {
    try {
      const value = localStorage.getItem(KEY);
      return value === null ? null : JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  },
  save(campaign: Campaign): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(campaign));
    } catch {
      // Private mode, disabled or full storage: play in memory.
    }
  },
};
