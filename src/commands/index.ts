import { Bot } from "grammy";
import type { Context } from "../toolkit";
import { startCommand } from "./start";
import { helpCommand } from "./help";
import { trackCommand, handleTrackCallbacks } from "./track";

export function registerCommands(bot: Bot<Context>): void {
  bot.command("start", startCommand);
  bot.command("help", helpCommand);
  bot.command("track", trackCommand);
  bot.callbackQuery(["confirm_track", "cancel_track"], handleTrackCallbacks);
}
