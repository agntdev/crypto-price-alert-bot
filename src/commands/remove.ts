import type { CommandContext } from "grammy";
import type { Context } from "../toolkit";
import { priceMonitor } from "../bot";

export async function removeCommand(ctx: CommandContext<Context>): Promise<void> {
  const input = ctx.match?.trim().toUpperCase();
  if (!input) {
    await ctx.reply(
      "Usage: `/remove [COIN]`. For example: `/remove BTC`.",
      { parse_mode: "Markdown" },
    );
    return;
  }

  const coins = input
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);

  if (coins.length === 0) {
    await ctx.reply(
      "Usage: `/remove [COIN]`. For example: `/remove BTC`.",
      { parse_mode: "Markdown" },
    );
    return;
  }

  const tracked = ctx.session.trackedCoins;
  const notTracked = coins.filter((c) => !tracked[c]);
  const toRemove = coins.filter((c) => tracked[c]);

  if (toRemove.length === 0) {
    const message =
      notTracked.length === 1
        ? `${notTracked[0]} is not currently being tracked.`
        : `None of those coins are currently being tracked.`;
    await ctx.reply(message);
    return;
  }

  for (const symbol of toRemove) {
    delete tracked[symbol];
  }

  if (ctx.chat) {
    priceMonitor.removeTracking(ctx.chat.id, toRemove);
  }

  if (ctx.session.trackingState) {
    for (const symbol of toRemove) {
      delete ctx.session.trackingState[symbol];
    }
    if (Object.keys(ctx.session.trackingState).length === 0) {
      delete ctx.session.trackingState;
    }
  }

  const removedList = toRemove.join(", ");
  let message = `Removed tracking for: ${removedList}.`;

  if (notTracked.length > 0) {
    const notTrackedList = notTracked.join(", ");
    message += `\n${notTrackedList} ${notTracked.length === 1 ? "was" : "were"} not being tracked.`;
  }

  await ctx.reply(message, { parse_mode: "Markdown" });
}
