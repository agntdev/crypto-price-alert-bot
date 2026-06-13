import type { CommandContext } from "grammy";
import { InlineKeyboard } from "grammy";
import type { Context } from "../toolkit";

export async function listCommand(ctx: CommandContext<Context>): Promise<void> {
  const coins = Object.keys(ctx.session.trackedCoins);

  if (coins.length === 0) {
    await ctx.reply(
      "You're not tracking any cryptocurrencies. Try `/track [COIN]`!",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const coinsDisplay = coins.join(", ");
  const keyboard = new InlineKeyboard();

  for (const coin of coins) {
    keyboard.text(`Remove ${coin}`, `remove_${coin}`);
  }
  keyboard.row().text("Done", "close_list");

  await ctx.reply(
    `You're currently tracking: ${coinsDisplay}. Tap 'Remove [COIN]' to delete.`,
    { reply_markup: keyboard }
  );
}
