import type { Bot } from "grammy";
import type { Context } from "./toolkit";
import { fetchPrices } from "./priceApi";
import type { PriceAlert } from "./schema";

const DEFAULT_POLL_INTERVAL_MS = 60_000;
const DEFAULT_THRESHOLD_PERCENT = 5;

interface CoinState {
  lastPrice: number;
  lastCheckedAt: string;
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
    const alerts: Array<{ chatId: number; alert: PriceAlert }> = [];

    for (const [chatId, coins] of this.tracking) {
      for (const [symbol, state] of coins) {
        const currentPrice = prices[symbol];
        if (currentPrice == null) continue;

        const previousPrice = state.lastPrice;
        if (previousPrice <= 0) {
          state.lastPrice = currentPrice;
          state.lastCheckedAt = now;
          continue;
        }

        const percentChange =
          ((currentPrice - previousPrice) / previousPrice) * 100;

        if (Math.abs(percentChange) >= this.threshold) {
          const direction: "up" | "down" =
            percentChange >= 0 ? "up" : "down";

          const alert: PriceAlert = {
            coinSymbol: symbol,
            triggeredAt: now,
            percentChange: Math.abs(percentChange),
            direction,
            currentPrice,
            previousPrice,
          };

          alerts.push({ chatId, alert });

          const emoji = direction === "up" ? "📈" : "📉";
          const message =
            `${emoji} *${symbol}* ${direction} ${Math.abs(percentChange).toFixed(2)}%\n` +
            `Price: $${currentPrice.toFixed(4)}\n` +
            `Previous: $${previousPrice.toFixed(4)}`;

          this.bot.api
            .sendMessage(chatId, message, { parse_mode: "Markdown" })
            .catch((err) => {
              console.error(
                `Failed to send alert to chat ${chatId}:`,
                err,
              );
            });
        }

        state.lastPrice = prices[symbol] !== undefined ? prices[symbol] : state.lastPrice;
        state.lastCheckedAt = now;
      }
    }
  }
}
