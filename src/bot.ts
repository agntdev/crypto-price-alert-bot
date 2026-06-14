import type { SessionData } from "./types";
import { createBot, type Context } from "./toolkit";
import { registerCommands } from "./commands";
import { PriceMonitor } from "./monitoring";

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN environment variable is required");
}

const bot = createBot(token);
registerCommands(bot);

export const priceMonitor = new PriceMonitor(bot);

bot.use(async (ctx, next) => {
  const chatId = ctx.chat?.id;

  if (chatId) {
    if (ctx.session.trackingState) {
      priceMonitor.syncFromSession(chatId, ctx.session.trackingState);
    }

    await next();

    const alerts = priceMonitor.drainAlerts(chatId);
    if (alerts.length > 0) {
      ctx.session.alertHistory.push(...alerts);
      const MAX_ALERT_HISTORY = 50;
      if (ctx.session.alertHistory.length > MAX_ALERT_HISTORY) {
        ctx.session.alertHistory = ctx.session.alertHistory.slice(-MAX_ALERT_HISTORY);
      }
    }

    const snapshot = priceMonitor.getTrackingSnapshot(chatId);
    if (snapshot) {
      ctx.session.trackingState = snapshot;
    } else if (ctx.session.trackingState) {
      delete ctx.session.trackingState;
    }
  } else {
    await next();
  }
});

bot.start();
priceMonitor.start();

export type { SessionData, Context };
