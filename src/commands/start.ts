import type { CommandContext } from "grammy";
import type { Context } from "../toolkit";

const WELCOME_MESSAGE =
  "Hello! I'm your crypto price alert bot. " +
  "Use `/track [COIN]` to start monitoring price changes. " +
  "For example: `/track BTC,ETH`.";

export async function startCommand(ctx: CommandContext<Context>): Promise<void> {
  ctx.session.__step = "idle";
  await ctx.reply(WELCOME_MESSAGE, { parse_mode: "Markdown" });
}
