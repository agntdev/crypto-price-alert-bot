import type { Bot } from "grammy";
import type { Context } from "./toolkit";
import type { PriceAlert } from "./schema";

function formatAlertMessage(alert: PriceAlert): string {
  const directionSymbol = alert.direction === "up" ? "↑" : "↓";
  return (
    `${alert.coinSymbol} moved ${alert.percentChange.toFixed(2)}% ${directionSymbol}! 🚨\n` +
    `Last tracked price: $${alert.previousPrice.toFixed(4)}\n` +
    `Current price: $${alert.currentPrice.toFixed(4)}`
  );
}

export async function sendPriceAlert(
  bot: Bot<Context>,
  chatId: number,
  alert: PriceAlert,
): Promise<void> {
  const message = formatAlertMessage(alert);
  await bot.api.sendMessage(chatId, message);
}
