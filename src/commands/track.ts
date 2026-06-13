import type { CommandContext, CallbackQueryContext } from "grammy";
import type { Context } from "../toolkit";
import { MAX_TRACKED_COINS } from "../schema";
import type { TrackedCoin } from "../schema";
import { fetchPrices } from "../priceApi";

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

function parseCoins(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);
}

function formatCoinList(coins: string[]): string {
  return coins.join(", ");
}

export async function trackCommand(ctx: CommandContext<Context>): Promise<void> {
  const text = ctx.match?.trim();
  if (!text) {
    await ctx.reply(
      "Usage: `/track [COINS]`. For example: `/track BTC,ETH`.",
      { parse_mode: "Markdown" },
    );
    return;
  }

  const inputCoins = parseCoins(text);
  if (inputCoins.length === 0) {
    await ctx.reply(
      "Usage: `/track [COINS]`. For example: `/track BTC,ETH`.",
      { parse_mode: "Markdown" },
    );
    return;
  }

  const invalidCoins = inputCoins.filter((c) => !SUPPORTED_COINS.has(c));
  if (invalidCoins.length > 0) {
    const message =
      invalidCoins.length === 1
        ? `${invalidCoins[0]} is not a valid cryptocurrency. Supported symbols: ${[...SUPPORTED_COINS].join(", ")}.`
        : `${formatCoinList(invalidCoins)} are not valid cryptocurrencies. Supported symbols: ${[...SUPPORTED_COINS].join(", ")}.`;
    await ctx.reply(message, { parse_mode: "Markdown" });
    return;
  }

  const validCoins = inputCoins;
  const uniqueNew = [...new Set(validCoins)];

  const existingTracked = ctx.session.trackedCoins;
  const alreadyTracked = uniqueNew.filter((c) => existingTracked[c]);
  if (alreadyTracked.length > 0) {
    const message =
      alreadyTracked.length === 1
        ? `${alreadyTracked[0]} is already being monitored.`
        : `${formatCoinList(alreadyTracked)} are already being monitored.`;
    await ctx.reply(message);
    return;
  }

  const currentCount = Object.keys(existingTracked).length;
  if (currentCount + uniqueNew.length > MAX_TRACKED_COINS) {
    await ctx.reply(
      `You can only track up to ${MAX_TRACKED_COINS} cryptocurrencies at once. You are currently tracking ${currentCount}.`,
    );
    return;
  }

  ctx.session.__step = "tracking_setup";
  ctx.session.pendingTrackCoins = uniqueNew;

  const confirmMessage =
    `Add tracking for: ${formatCoinList(uniqueNew)}? Confirm or cancel below.`;

  await ctx.reply(confirmMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Confirm", callback_data: "confirm_track" },
          { text: "Cancel", callback_data: "cancel_track" },
        ],
      ],
    },
  });
}

export async function handleTrackCallbacks(
  ctx: CallbackQueryContext<Context>,
): Promise<void> {
  const data = ctx.callbackQuery.data;

  if (data === "confirm_track") {
    const pending = ctx.session.pendingTrackCoins;
    if (!pending || pending.length === 0) {
      ctx.session.__step = "idle";
      await ctx.answerCallbackQuery({ text: "Nothing to confirm." });
      return;
    }

    const now = new Date().toISOString();
    const prices = await fetchPrices(pending);
    for (const symbol of pending) {
      ctx.session.trackedCoins[symbol] = {
        symbol,
        lastPrice: prices[symbol] ?? 0,
        lastCheckedAt: now,
      };
    }

    ctx.session.pendingTrackCoins = undefined;
    ctx.session.__step = "idle";

    const coinList = formatCoinList(pending);
    await ctx.answerCallbackQuery({
      text: `Tracking added for: ${coinList}.`,
    });
    await ctx.editMessageText(
      `Tracking added for: ${coinList}. I'll notify you if any of these move 5% ↑/↓.`,
    );
  } else if (data === "cancel_track") {
    ctx.session.pendingTrackCoins = undefined;
    ctx.session.__step = "idle";
    await ctx.answerCallbackQuery({ text: "Cancelled." });
    await ctx.editMessageText("Tracking setup cancelled.");
  } else {
    await ctx.answerCallbackQuery();
  }
}
