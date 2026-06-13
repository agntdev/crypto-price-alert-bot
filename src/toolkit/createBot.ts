import { Bot, BotConfig, Context as GrammyContext } from "grammy";
import { session, type SessionFlavor } from "grammy";
import type { SessionData } from "../types";

export type Context = GrammyContext & SessionFlavor<SessionData>;

export function createBot(token: string, config?: BotConfig<Context>): Bot<Context> {
  const bot = new Bot<Context>(token, config);
  bot.use(session<SessionData, Context>({ initial: () => ({ __step: "idle" }) }));
  return bot;
}
