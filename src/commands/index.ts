import { Bot } from "grammy";
import type { Context } from "../toolkit";
import { startCommand } from "./start";
import { helpCommand } from "./help";
import { listCommand } from "./list";

export function registerCommands(bot: Bot<Context>): void {
  bot.command("start", startCommand);
  bot.command("help", helpCommand);
  bot.command("list", listCommand);
}
