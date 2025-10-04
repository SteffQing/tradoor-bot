import type { Context } from "../models/telegraf.model";
import prisma from "../db/prisma";
import { capitalize } from "../utils/helpers";
import { encrypt } from "../utils/encryption";
import initExchange from "./exchange";
import { REPORT } from "../constants";

async function finalizeExchangeRegistration(ctx: Context) {
  const uid = ctx.from?.id;
  const exchangeName = ctx.session.exchange;
  const { apiKey, apiSecret, password } = ctx.session.exchangeConfig || {};

  if (!uid || !exchangeName || !apiKey || !apiSecret) return;
  if (ctx.chat?.type !== "private") return;
  let msgId;

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
    await ctx.telegram.sendMessage(
      REPORT,
      `⚠️ Exchange registration error for user ${uid} on ${exchangeName}:\n${JSON.stringify(
        err,
        null,
        2
      )}`
    );

    ctx.session.state = "register:api_key";
    ctx.session.exchangeConfig = undefined;

    const isTimeout =
      err instanceof Error &&
      (err.name === "RequestTimeout" || err.message.includes("RequestTimeout"));

    const { message_id } = isTimeout
      ? await ctx.reply(
          `⚠️ The exchange request timed out. This often happens if ${capitalize(
            exchangeName
          )} blocks your region.\n` +
            "Try using a VPN in a supported region and then enter your API key again or /register a different exchange:"
        )
      : await ctx.reply(
          "⚠️ Failed to register exchange. Check your credentials and try again.\n" +
            "Please enter your API key again:"
        );

    msgId = message_id;
  } finally {
    await Promise.all(
      ctx.session.toDeleteMessageIds.map((id) =>
        ctx.deleteMessage(id).catch(() => {})
      )
    );
    ctx.session.toDeleteMessageIds = [msgId].filter(Boolean) as number[];
  }
}

export { finalizeExchangeRegistration, initExchange };
