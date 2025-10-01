import { exchangeRegistrationKeyboard } from "../keyboards/exchange";
import type { Context } from "../models/telegraf.model";

async function registerExchangeCmd(ctx: Context) {
  if (ctx.chat?.type !== "private") return;

  const uid = ctx.from?.id;
  if (!uid) return;

  try {
    await ctx.telegram.sendChatAction(ctx.chat.id, "typing");

    const keyboard = await exchangeRegistrationKeyboard(uid);

    if (!keyboard) {
      await ctx.reply(
        "✅ You have already registered all supported exchanges."
      );
      return;
    }

    await ctx.reply("Select an exchange to register:", {
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error("Error in /register command:", err);
    await ctx.reply("⚠️ Something went wrong while loading exchanges.");
  }
}

export { registerExchangeCmd };
