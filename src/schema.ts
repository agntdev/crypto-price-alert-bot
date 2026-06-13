export interface TrackedCoin {
  symbol: string;
  lastPrice: number;
  lastCheckedAt: string;
}

export interface PriceAlert {
  coinSymbol: string;
  triggeredAt: string;
  percentChange: number;
  direction: "up" | "down";
  currentPrice: number;
  previousPrice: number;
}

/** Maximum number of coins a user can track at once. */
export const MAX_TRACKED_COINS = 5;
