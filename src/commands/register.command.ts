import { exchangeRegistrationKeyboard } from "../keyboards/exchange";
import type { Context } from "../models/telegraf.model";

async function registerExchangeCmd(ctx: Context) {
  if (ctx.chat?.type !== "private") return;

  const uid = ctx.from?.id;
  if (!uid) return;

  try {
    await ctx.telegram.sendChatAction(ctx.chat.id, "typing");

    const keyboard = await exchangeRegistrationKeyboard(uid);
    ctx.deleteMessage(ctx.message?.message_id).catch(() => {});

    if (!keyboard) {
      const { message_id } = await ctx.reply(
        "✅ You have already registered all supported exchanges."
      );
      ctx.session.toDeleteMessageIds.push(message_id);
      return;
    }
    ctx.session.state = "idle";
    ctx.session.exchange = undefined;

    const { message_id } = await ctx.reply("Select an exchange to register:", {
      reply_markup: keyboard,
    });
    ctx.session.toDeleteMessageIds.push(message_id);
  } catch (err) {
    console.error("Error in /register command:", err);
    const { message_id } = await ctx.reply(
      "⚠️ Something went wrong while loading exchanges."
    );
    ctx.session.toDeleteMessageIds.push(message_id);
  }
}

export default registerExchangeCmd;
