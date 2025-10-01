import type { Context } from "../models/telegraf.model";
import prisma from "../db/prisma";
import { tradeKeyboard } from "../keyboards/trade";

async function handleTradeMessage(ctx: Context) {
  try {
    const userId = ctx.from?.id;
    if (!userId) return;

    // If the user is in a trade input state, handle the input
    if (!ctx.session.tempData) ctx.session.tempData = {};

    switch (ctx.session.state) {
      case "awaiting_token":
        (ctx.session.tempData as any).token = ctx.message?.text;
        ctx.session.state = "idle";
        await updateTradeKeyboard(ctx, userId);
        await ctx.reply("Token has been set!");
        break;

      case "awaiting_leverage":
        const leverage = parseInt(ctx.message?.text as string);
        if (isNaN(leverage)) {
          await ctx.reply("Please enter a valid number for leverage.");
          return;
        }
        (ctx.session.tempData as any).leverage = leverage;
        ctx.session.state = "idle";
        await updateTradeKeyboard(ctx, userId);
        await ctx.reply(`Leverage has been set to ${leverage}x!`);
        break;

      case "awaiting_amount":
        const amount = parseFloat(ctx.message?.text as string);
        if (isNaN(amount)) {
          await ctx.reply("Please enter a valid number for amount.");
          return;
        }
        (ctx.session.tempData as any).amount = amount;
        ctx.session.state = "idle";
        await updateTradeKeyboard(ctx, userId);
        await ctx.reply(`Amount has been set to ${amount}!`);
        break;

      case "awaiting_tp":
        if (ctx.message?.text?.toLowerCase() === 'none') {
          (ctx.session.tempData as any).takeProfit = undefined;
        } else {
          const tp = parseFloat(ctx.message?.text as string);
          if (isNaN(tp)) {
            await ctx.reply("Please enter a valid number for take profit or 'none' to clear.");
            return;
          }
          (ctx.session.tempData as any).takeProfit = tp;
        }
        ctx.session.state = "idle";
        await updateTradeKeyboard(ctx, userId);
        await ctx.reply("Take profit has been set!");
        break;

      case "awaiting_sl":
        if (ctx.message?.text?.toLowerCase() === 'none') {
          (ctx.session.tempData as any).stopLoss = undefined;
        } else {
          const sl = parseFloat(ctx.message?.text as string);
          if (isNaN(sl)) {
            await ctx.reply("Please enter a valid number for stop loss or 'none' to clear.");
            return;
          }
          (ctx.session.tempData as any).stopLoss = sl;
        }
        ctx.session.state = "idle";
        await updateTradeKeyboard(ctx, userId);
        await ctx.reply("Stop loss has been set!");
        break;

      case "awaiting_entry_price":
        if (ctx.message?.text?.toLowerCase() === 'market') {
          (ctx.session.tempData as any).entryPrice = undefined; // undefined means market order
        } else {
          const entryPrice = parseFloat(ctx.message?.text as string);
          if (isNaN(entryPrice)) {
            await ctx.reply("Please enter a valid number for entry price or 'market' for market order.");
            return;
          }
          (ctx.session.tempData as any).entryPrice = entryPrice;
        }
        ctx.session.state = "idle";
        await updateTradeKeyboard(ctx, userId);
        await ctx.reply("Entry price has been set!");
        break;

      default:
        // Not in a trade input state, so do nothing special
        break;
    }
  } catch (err) {
    console.error("Error handling trade message:", err);
  }
}

async function updateTradeKeyboard(ctx: Context, userId: number) {
  // Get user's default values
  const userDefaults = await prisma.userDefault.findUnique({
    where: { userId: userId.toString() },
  });

  const tradeConfig = {
    token: (ctx.session.tempData as any)?.token,
    leverage: (ctx.session.tempData as any)?.leverage,
    amount: (ctx.session.tempData as any)?.amount,
    exchange: (ctx.session.tempData as any)?.exchange,
    takeProfit: (ctx.session.tempData as any)?.takeProfit,
    stopLoss: (ctx.session.tempData as any)?.stopLoss,
    entryPrice: (ctx.session.tempData as any)?.entryPrice,
  };

  const keyboard = await tradeKeyboard(userId, {
    leverage: userDefaults?.defaultLeverage || 1,
    amount: userDefaults?.defaultAmount || 0,
  }, tradeConfig);

  // Try to edit the previous message with the updated keyboard
  try {
    await ctx.editMessageReplyMarkup({
      reply_markup: keyboard.reply_markup,
    });
  } catch (err) {
    // If editing fails (e.g., message too old), just send a new message with the keyboard
    await ctx.reply("Trade configuration updated:", {
      reply_markup: keyboard.reply_markup,
    });
  }
}

export { handleTradeMessage };