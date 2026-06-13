import type { Bot } from "grammy";
import type { Context } from "./toolkit";
import { fetchPrices } from "./priceApi";
import type { PriceAlert } from "./schema";
import { sendPriceAlert } from "./notify";

const DEFAULT_POLL_INTERVAL_MS = 60_000;
const DEFAULT_THRESHOLD_PERCENT = 5;

interface CoinState {
  lastPrice: number;
  lastCheckedAt: string;
  priceHistory: Array<{ timestamp: string; price: number }>;
  lastAlertDirection?: "up" | "down";
}

export class PriceMonitor {
  private bot: Bot<Context>;
  private tracking: Map<number, Map<string, CoinState>> = new Map();
  private timer: ReturnType<typeof setInterval> | null = null;
  private intervalMs: number;
  private threshold: number;

  constructor(
    bot: Bot<Context>,
    intervalMs: number = DEFAULT_POLL_INTERVAL_MS,
    thresholdPercent: number = DEFAULT_THRESHOLD_PERCENT,
  ) {
    this.bot = bot;
    this.intervalMs = intervalMs;
    this.threshold = thresholdPercent;
  }

  addTracking(
    chatId: number,
    coins: Record<string, { price: number }>,
  ): void {
    let chatCoins = this.tracking.get(chatId);
    if (!chatCoins) {
      chatCoins = new Map();
      this.tracking.set(chatId, chatCoins);
    }

    const now = new Date().toISOString();
    for (const [symbol, info] of Object.entries(coins)) {
      chatCoins.set(symbol.toUpperCase(), {
        lastPrice: info.price,
        lastCheckedAt: now,
        priceHistory: [{ timestamp: now, price: info.price }],
      });
    }
  }

  removeTracking(chatId: number, symbols?: string[]): void {
    const chatCoins = this.tracking.get(chatId);
    if (!chatCoins) return;

    if (symbols) {
      for (const symbol of symbols) {
        chatCoins.delete(symbol.toUpperCase());
      }
      if (chatCoins.size === 0) {
        this.tracking.delete(chatId);
      }
    } else {
      this.tracking.delete(chatId);
    }
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.poll().catch((err) => {
        console.error("Price monitor poll error:", err);
      });
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  isRunning(): boolean {
    return this.timer !== null;
  }

  private getAllTrackedSymbols(): string[] {
    const symbols = new Set<string>();
    for (const coins of this.tracking.values()) {
      for (const symbol of coins.keys()) {
        symbols.add(symbol);
      }
    }
    return [...symbols];
  }

  private async poll(): Promise<void> {
    const allSymbols = this.getAllTrackedSymbols();
    if (allSymbols.length === 0) return;

    let prices: Record<string, number>;
    try {
      prices = await fetchPrices(allSymbols);
    } catch (err) {
      console.error("Failed to fetch prices during monitoring poll:", err);
      return;
    }

    const now = new Date().toISOString();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;

    for (const [chatId, coins] of this.tracking) {
      for (const [symbol, state] of coins) {
        const currentPrice = prices[symbol];
        if (currentPrice == null) continue;

        state.priceHistory.push({ timestamp: now, price: currentPrice });
        state.priceHistory = state.priceHistory.filter(
          (entry) => new Date(entry.timestamp).getTime() >= cutoff,
        );

        const baselineEntry = state.priceHistory[0];
        if (!baselineEntry) {
          continue;
        }

        const baselinePrice = baselineEntry.price;
        if (baselinePrice <= 0) {
          continue;
        }

        const percentChange =
          ((currentPrice - baselinePrice) / baselinePrice) * 100;

        if (Math.abs(percentChange) >= this.threshold) {
          const direction: "up" | "down" =
            percentChange >= 0 ? "up" : "down";

          if (state.lastAlertDirection === direction) continue;

          state.lastAlertDirection = direction;

          const alert: PriceAlert = {
            coinSymbol: symbol,
            triggeredAt: now,
            percentChange: Math.abs(percentChange),
            direction,
            currentPrice,
            previousPrice: baselinePrice,
          };

          sendPriceAlert(this.bot, chatId, alert).catch((err) => {
            console.error(
              `Failed to send alert to chat ${chatId}:`,
              err,
            );
          });
        }

        state.lastPrice = currentPrice;
        state.lastCheckedAt = now;
      }
    }
  }
}
