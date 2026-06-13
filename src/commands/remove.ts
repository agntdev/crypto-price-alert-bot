import type { CommandContext } from "grammy";
import type { Context } from "../toolkit";

const SUPPORTED_COINS = new Set([
  "BTC",
  "ETH",
  "SOL",
  "DOGE",
  "ADA",
  "DOT",
  "XRP",
  "BNB",
  "MATIC",
  "AVAX",
  "LTC",
  "UNI",
  "LINK",
  "ATOM",
  "FET",
]);

export async function removeCommand(ctx: CommandContext<Context>): Promise<void> {
  const coin = ctx.match?.trim().toUpperCase();
  if (!coin) {
    await ctx.reply(
      "Usage: `/remove [COIN]`. For example: `/remove BTC`.",
      { parse_mode: "Markdown" },
    );
    return;
  }

  if (!SUPPORTED_COINS.has(coin)) {
    await ctx.reply(
      `${coin} is not a valid cryptocurrency. Supported symbols: ${[...SUPPORTED_COINS].join(", ")}.`,
      { parse_mode: "Markdown" },
    );
    return;
  }

  const existing = ctx.session.trackedCoins[coin];
  if (!existing) {
    await ctx.reply(`${coin} is not currently being tracked.`);
    return;
  }

  delete ctx.session.trackedCoins[coin];
  ctx.session.__step = "idle";
  await ctx.reply(`${coin} has been removed from tracking.`);
}
