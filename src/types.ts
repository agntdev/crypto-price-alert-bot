import type { TrackedCoin, PriceAlert } from "./schema";

export interface PriceHistoryEntry {
  timestamp: string;
  price: number;
}

export interface CoinTrackingState {
  lastPrice: number;
  lastCheckedAt: string;
  priceHistory: PriceHistoryEntry[];
  lastAlertDirection?: "up" | "down";
}

export interface SessionData {
  __step: string;
  trackedCoins: Record<string, TrackedCoin>;
  alertHistory: PriceAlert[];
  pendingTrackCoins?: string[];
  trackingState?: Record<string, CoinTrackingState>;
}
