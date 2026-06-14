import type { CommandContext } from "grammy";
import type { Context } from "../toolkit";

export async function listCommand(ctx: CommandContext<Context>): Promise<void> {
  const tracked = ctx.session.trackedCoins;
  const symbols = Object.keys(tracked);

  if (symbols.length === 0) {
    await ctx.reply("You are not tracking any cryptocurrencies. Use `/track [COINS]` to start.");
    return;
  }

  const lines = symbols.map((symbol) => {
    const coin = tracked[symbol];
    return `${coin.symbol}: $${coin.lastPrice.toFixed(4)} (last updated: ${new Date(coin.lastCheckedAt).toLocaleString()})`;
  });

  await ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
}