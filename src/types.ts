import type { TrackedCoin, PriceAlert } from "./schema";

export interface SessionData {
  __step: string;
  trackedCoins: Record<string, TrackedCoin>;
  alertHistory: PriceAlert[];
  pendingTrackCoins?: string[];
}
