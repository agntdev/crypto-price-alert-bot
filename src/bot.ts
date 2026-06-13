import type { SessionData } from "./types";
import { createBot, type Context } from "./toolkit";
import { registerCommands } from "./commands";

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN environment variable is required");
}

const bot = createBot(token);
registerCommands(bot);

bot.start();

export type { SessionData, Context };
