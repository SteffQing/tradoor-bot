import fp from "fastify-plugin";
import { session, Telegraf } from "telegraf";
import { getDefaultSession } from "../utils";
import store from "../db/sqlite3";
import { createTicketHandler, handleExistingTicketReply } from "../handlers/user.ticket";
import { respondToQuery } from "../handlers/admin.ticket";
import { closeTicketCallback, replyTicketCallback } from "../handlers/callback.handler";
import { startCmd, helpCmd } from "../handlers/start.command";
import { tradeCmd } from "../commands/trade.command";
import { 
  tradeTokenCallback,
  tradeLeverageCallback,
  tradeAmountCallback,
  tradeExchangeCallback,
  tradeTpCallback,
  tradeSlCallback,
  tradeEntryPriceCallback,
  tradeExecuteCallback,
  tradeClearCallback,
  tradeSelectExchangeCallback
} from "../handlers/trade.callback";
import { handleTradeMessage } from "../handlers/trade.message";
import type { FastifyInstance } from "fastify";
import type { Context } from "../models/telegraf.model";
import type { Update } from "telegraf/typings/core/types/typegram";

async function init(fastify: FastifyInstance) {
  const { BOT_TOKEN, WEBHOOK_URL } = fastify.config;

  await fastify.register(
    fp<{ token: string; store: typeof store }>(
      async (fastify, opts) => {
        fastify.log.debug("Registering bot..");

        const bot = new Telegraf<Context>(opts.token);

        bot.use(
          session({
            defaultSession: getDefaultSession,
            store,
          })
        );

        bot.start(startCmd);
        bot.command("help", helpCmd);
        bot.command("trade", tradeCmd);
        bot.hears(/create\s+(a\s+)?ticket|^ticket$/i, createTicketHandler);

        bot.on("message", async (ctx, next) => {
          await handleTradeMessage(ctx);
          await handleExistingTicketReply(ctx);
          await respondToQuery(ctx);
          await next();
        });

        bot.action(/close_(.+)/, closeTicketCallback);
        bot.action(/reply_(.+)/, replyTicketCallback);
        bot.action("trade_token", tradeTokenCallback);
        bot.action("trade_leverage", tradeLeverageCallback);
        bot.action("trade_amount", tradeAmountCallback);
        bot.action("trade_exchange", tradeExchangeCallback);
        bot.action("trade_tp", tradeTpCallback);
        bot.action("trade_sl", tradeSlCallback);
        bot.action("trade_entry_price", tradeEntryPriceCallback);
        bot.action("trade_execute", tradeExecuteCallback);
        bot.action("trade_clear", tradeClearCallback);
        bot.action(/trade_select_exchange_/, tradeSelectExchangeCallback);

        // bot.launch(() => console.log("Bot is running..."));
        const webhookPath = "/telegram";
        const webhookUrl = `${WEBHOOK_URL}${webhookPath}`;

        await bot.telegram.setWebhook(webhookUrl);

        fastify.post(webhookPath, async (request, reply) => {
          await bot.handleUpdate(request.body as Update);
          return reply.send({ ok: true });
        });

        fastify.decorate("bot", bot);
      },
      {
        name: "hawk-trading-bot",
      }
    ),
    {
      token: BOT_TOKEN,
      store,
    }
  );

  return fastify;
}

declare module "fastify" {
  interface FastifyInstance {
    bot: Telegraf<Context>;
  }
}

export default init;
