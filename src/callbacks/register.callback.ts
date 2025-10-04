import type { Context } from "../models/telegraf.model";
import prisma from "../db/prisma";
import { capitalize } from "../utils/helpers";
import { type Exchange } from "../constants";
import { finalizeExchangeRegistration } from "../handlers/register.handler";

async function registerExchangeCallback(ctx: Context) {
  const uid = ctx.from?.id;
  if (!uid) return;

  if (
    !ctx.callbackQuery ||
    !("data" in ctx.callbackQuery) ||
    !ctx.callbackQuery.data
  )
    return;

  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith("register:")) return;

  const exchangeName = data.split(":")[1] as Exchange | undefined;
  if (!exchangeName) return;

  try {
    let user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
      user = await prisma.user.create({ data: { id: uid } });
    }

    const existingAccount = await prisma.exchangeAccount.findUnique({
      where: { userId_exchangeName: { userId: uid, exchangeName } },
    });

    if (existingAccount) {
      await ctx.answerCbQuery(
        `${capitalize(exchangeName)} is already registered ✅`
      );
      return;
    }

    ctx.session.exchange = exchangeName;
    ctx.session.state = "register:api_key";
    ctx.session.exchangeConfig = {};

    await ctx.answerCbQuery();
    const message = await ctx.reply(
      `Great! Let's register ${capitalize(
        exchangeName
      )}.\n\nPlease enter your API key:`
    );

    ctx.session.toDeleteMessageIds.push(message.message_id);
  } catch (err) {
    console.error("Error in registerExchangeCallback:", err);
    const { message_id } = await ctx.reply(
      "⚠️ Something went wrong while registering your exchange."
    );
    ctx.session.toDeleteMessageIds.push(message_id);
  }
}

async function exchangeMessageHandler(ctx: Context) {
  if (!ctx.session.state || !ctx.session.exchange) return;
  if (!ctx.message || !("text" in ctx.message)) return;

  const text = ctx.message?.text?.trim();
  if (!text) return;
  ctx.deleteMessage(ctx.message.message_id).catch(() => {});

  switch (ctx.session.state) {
    case "register:api_key":
      ctx.session.exchangeConfig!.apiKey = text;
      ctx.session.state = "register:api_secret";
      const { message_id } = await ctx.reply(
        "✅ API key received.\nPlease enter your API secret:"
      );
      ctx.session.toDeleteMessageIds.push(message_id);
      break;

    case "register:api_secret":
      ctx.session.exchangeConfig!.apiSecret = text;

      const exchangesWithPassword = ["kucoinfutures", "okx"];
      if (exchangesWithPassword.includes(ctx.session.exchange)) {
        ctx.session.state = "register:password";
        const { message_id } = await ctx.reply(
          "Please enter your API password/passphrase:"
        );
        ctx.session.toDeleteMessageIds.push(message_id);
      } else {
        await finalizeExchangeRegistration(ctx);
      }
      break;

    case "register:password":
      ctx.session.exchangeConfig!.password = text;
      await finalizeExchangeRegistration(ctx);
      break;

    default:
      break;
  }
}

export { registerExchangeCallback, exchangeMessageHandler };
