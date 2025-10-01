import type { Context } from "../models/telegraf.model";
import prisma from "../db/prisma";
import { capitalize } from "../utils/helpers";
import { encrypt } from "../utils/encryption";
import ccxt from "ccxt";
import { type Exchange } from "../constants";

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
    ctx.session.state = "awaiting_api_key";
    ctx.session.exchangeInit = {};

    await ctx.answerCbQuery();
    await ctx.reply(
      `Great! Let's register ${capitalize(
        exchangeName
      )}.\n\nPlease enter your API key:`
    );
  } catch (err) {
    console.error("Error in registerExchangeCallback:", err);
    await ctx.reply("⚠️ Something went wrong while registering your exchange.");
  }
}

async function exchangeMessageHandler(ctx: Context) {
  if (!ctx.session.state || !ctx.session.exchange) return;
  if (!ctx.message || !("text" in ctx.message)) return;

  const text = ctx.message?.text?.trim();
  if (!text) return;

  switch (ctx.session.state) {
    case "awaiting_api_key":
      ctx.session.exchangeInit!.apiKey = text;
      ctx.session.state = "awaiting_api_secret";
      await ctx.reply("✅ API key received.\nPlease enter your API secret:");
      break;

    case "awaiting_api_secret":
      ctx.session.exchangeInit!.apiSecret = text;

      const exchangesWithPassword = ["kucoinfutures", "okx"];
      if (exchangesWithPassword.includes(ctx.session.exchange)) {
        ctx.session.state = "awaiting_password";
        await ctx.reply("Please enter your API password/passphrase:");
      } else {
        await finalizeExchangeRegistration(ctx);
      }
      break;

    case "awaiting_password":
      ctx.session.exchangeInit!.password = text;
      await finalizeExchangeRegistration(ctx);
      break;

    default:
      break;
  }
}

async function finalizeExchangeRegistration(ctx: Context) {
  const uid = ctx.from?.id;
  const exchangeName = ctx.session.exchange;
  const { apiKey, apiSecret, password } = ctx.session.exchangeInit || {};

  if (!uid || !exchangeName || !apiKey || !apiSecret) return;

  try {
    const ExchangeClass = ccxt[exchangeName as Exchange];

    const exchange = new ExchangeClass({
      apiKey,
      secret: apiSecret,
      ...(password ? { password } : {}),
      enableRateLimit: true,
    });

    await exchange.loadMarkets(); // validate credentials - throw if it fails

    await prisma.exchangeAccount.create({
      data: {
        userId: uid,
        exchangeName,
        apiKeyEncrypted: encrypt(apiKey),
        apiSecretEncrypted: encrypt(apiSecret),
        passwordEncrypted: password ? encrypt(password) : null,
      },
    });

    ctx.session.state = "idle";
    ctx.session.exchange = undefined;
    ctx.session.exchangeInit = undefined;

    await ctx.reply(`✅ ${capitalize(exchangeName)} registered successfully!`);
  } catch (err: any) {
    console.error("Exchange registration error:", err);
    ctx.session.state = "awaiting_api_key";
    ctx.session.exchangeInit = undefined;
    await ctx.reply(
      "⚠️ Failed to register exchange. Check your credentials and try again.\nPlease enter your API key again:"
    );
  }
}

export { registerExchangeCallback, exchangeMessageHandler };
