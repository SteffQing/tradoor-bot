import { tradeKeyboard } from "../keyboards/trade";
import type { Context } from "../models/telegraf.model";
import prisma from "../db/prisma";
import { tradeMsg } from "../constants";
import { reset } from "../utils/helpers";

async function tradeCmd(ctx: Context) {
  if (ctx.chat?.type !== "private") return;

  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    await reset(ctx);

    const userDefaults = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultLeverage: true, defaultAmount: true },
    });

    if (!userDefaults) {
      const { message_id } = await ctx.reply(
        "⚠️ You need to register first by sending /register."
      );
      ctx.session.toDeleteMessageIds.push(message_id);
      return;
    }

    ctx.session.tradeConfig = {
      leverage: userDefaults.defaultLeverage.toString(),
      amount: userDefaults.defaultAmount.toString(),
    };
    const keyboard = tradeKeyboard(ctx.session.tradeConfig);

    const { message_id } = await ctx.reply(tradeMsg, {
      reply_markup: keyboard,
    });
    ctx.session.msgId = message_id;
  } catch (err) {
    console.error("Error in /trade command:", err);
    const { message_id } = await ctx.reply(
      "⚠️ Something went wrong while loading trade options."
    );
    ctx.session.toDeleteMessageIds.push(message_id);
  }
}

export default tradeCmd;
