import { tradeKeyboard } from "../keyboards/trade";
import type { Context } from "../models/telegraf.model";
import prisma from "../db/prisma";

async function tradeCmd(ctx: Context) {
  if (ctx.chat?.type !== "private") return;

  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    await ctx.telegram.sendChatAction(ctx.chat.id, "typing");

    const userDefaults = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultLeverage: true, defaultAmount: true },
    });

    if (!userDefaults) {
      await ctx.reply("⚠️ You need to register first by sending /register.");
      return;
    }

    const keyboard = tradeKeyboard(ctx.session.tradeConfig);

    await ctx.reply("Configure your trade details:", {
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error("Error in /trade command:", err);
    await ctx.reply("⚠️ Something went wrong while loading trade options.");
  }
}

export default tradeCmd;
