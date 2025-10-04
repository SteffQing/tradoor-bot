import fp from "fastify-plugin";
import { session, Telegraf } from "telegraf";
import { getDefaultSession } from "../utils";
import store from "../db/sqlite3";
import type { FastifyInstance } from "fastify";
import type { Context } from "../models/telegraf.model";
import {
  registerExchangeCmd,
  tradeCmd,
  startCmd,
  helpCmd,
} from "../commands/exports";
import {
  exchangeMessageHandler,
  registerExchangeCallback,
} from "../callbacks/register.callback";
import {
  tradeCallback,
  tradeMessageHandler,
} from "../callbacks/trade.callback";
// import type { Update } from "telegraf/typings/core/types/typegram";

async function init(fastify: FastifyInstance) {
  const { BOT_TOKEN /* WEBHOOK_URL */ } = fastify.config;

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
        bot.command("register", registerExchangeCmd);

        bot.action(/^register:(.+)$/, registerExchangeCallback);
        bot.action(/^trade:(.+)$/, tradeCallback);

        bot.on("message", async (ctx, next) => {
          const { state } = ctx.session;
          if (state.startsWith("register:")) await exchangeMessageHandler(ctx);
          else if (state.startsWith("trade:")) await tradeMessageHandler(ctx);
          return await next();
        });

        bot.launch(() => console.log("Bot is running..."));
        // const webhookPath = "/telegram";
        // const webhookUrl = `${WEBHOOK_URL}${webhookPath}`;

        // await bot.telegram.setWebhook(webhookUrl);

        // fastify.post(webhookPath, async (request, reply) => {
        //   await bot.handleUpdate(request.body as Update);
        //   return reply.send({ ok: true });
        // });

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
