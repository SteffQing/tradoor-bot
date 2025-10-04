import type { Context } from "../models/telegraf.model";
import prisma from "../db/prisma";
import { capitalize } from "../utils/helpers";
import { encrypt } from "../utils/encryption";
import initExchange from "./exchange";

async function finalizeExchangeRegistration(ctx: Context) {
  const uid = ctx.from?.id;
  const exchangeName = ctx.session.exchange;
  const { apiKey, apiSecret, password } = ctx.session.exchangeConfig || {};

  if (!uid || !exchangeName || !apiKey || !apiSecret) return;
  if (ctx.chat?.type !== "private") return;

  try {
    await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
    await initExchange(exchangeName, {
      apiKey,
      apiSecret,
      ...(password ? { password } : {}),
    });

    const { message_id } = await ctx.reply(
      "✅ Exchange credentials verified! Processing..."
    );
    ctx.session.toDeleteMessageIds.push(message_id);
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
    ctx.session.exchangeConfig = undefined;

    await ctx.reply(`✅ ${capitalize(exchangeName)} registered successfully!`);
  } catch (err: any) {
    console.error("Exchange registration error:", err);
    ctx.session.state = "register:api_key";
    ctx.session.exchangeConfig = undefined;
    await ctx.reply(
      "⚠️ Failed to register exchange. Check your credentials and try again.\nPlease enter your API key again:"
    );
  } finally {
    await Promise.all(
      ctx.session.toDeleteMessageIds.map((id) =>
        ctx.deleteMessage(id).catch(() => {})
      )
    );
    ctx.session.toDeleteMessageIds = [];
  }
}

export { finalizeExchangeRegistration, initExchange };
