import type { CommandContext } from "grammy";
import type { Context } from "../toolkit";

const HELP_MESSAGE =
  "Available commands:\n" +
  "`/track [COINS]` - Add coins to monitor (e.g., `/track BTC,ETH`).\n" +
  "`/list` - View tracked coins.\n" +
  "`/remove [COIN]` - Remove a coin from tracking.\n" +
  "`/help` - Show this help message.";

export async function helpCommand(ctx: CommandContext<Context>): Promise<void> {
  await ctx.reply(HELP_MESSAGE, { parse_mode: "Markdown" });
}
