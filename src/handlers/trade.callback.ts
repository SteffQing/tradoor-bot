import type { Context } from "../models/telegraf.model";
import prisma from "../db/prisma";
import { tradeKeyboard } from "../keyboards/trade";

// Trade callback handlers
async function tradeTokenCallback(ctx: Context) {
  try {
    await ctx.answerCbQuery();
    await ctx.reply("Please enter the token symbol (e.g., BTCUSDT):");
    
    // Set session state to expect token input
    ctx.session.state = "awaiting_token";
  } catch (err) {
    console.error("Error in trade token callback:", err);
    await ctx.answerCbQuery("Error occurred while setting token.");
  }
}

async function tradeLeverageCallback(ctx: Context) {
  try {
    await ctx.answerCbQuery();
    await ctx.reply("Please enter the leverage (number only):");
    
    ctx.session.state = "awaiting_leverage";
  } catch (err) {
    console.error("Error in trade leverage callback:", err);
    await ctx.answerCbQuery("Error occurred while setting leverage.");
  }
}

async function tradeAmountCallback(ctx: Context) {
  try {
    await ctx.answerCbQuery();
    await ctx.reply("Please enter the trade amount:");
    
    ctx.session.state = "awaiting_amount";
  } catch (err) {
    console.error("Error in trade amount callback:", err);
    await ctx.answerCbQuery("Error occurred while setting amount.");
  }
}

async function tradeExchangeCallback(ctx: Context) {
  try {
    await ctx.answerCbQuery();
    
    // Get user's registered exchanges
    const userId = ctx.from?.id;
    if (!userId) return;

    const userExchanges = await prisma.exchangeAccount.findMany({
      where: { userId: userId.toString() },
      select: { exchangeName: true },
    });

    if (userExchanges.length === 0) {
      await ctx.reply("You haven't registered any exchanges yet. Please use /register command first.");
      return;
    }

    // Create inline keyboard with available exchanges
    const exchangeKeyboard = userExchanges.map(ex => [
      { text: ex.exchangeName, callback_data: `trade_select_exchange_${ex.exchangeName}` }
    ]);

    await ctx.reply("Select an exchange:", {
      reply_markup: { inline_keyboard: exchangeKeyboard }
    });
  } catch (err) {
    console.error("Error in trade exchange callback:", err);
    await ctx.answerCbQuery("Error occurred while selecting exchange.");
  }
}

async function tradeTpCallback(ctx: Context) {
  try {
    await ctx.answerCbQuery();
    await ctx.reply("Please enter the take profit price (or 'none' to clear):");
    
    ctx.session.state = "awaiting_tp";
  } catch (err) {
    console.error("Error in trade TP callback:", err);
    await ctx.answerCbQuery("Error occurred while setting TP.");
  }
}

async function tradeSlCallback(ctx: Context) {
  try {
    await ctx.answerCbQuery();
    await ctx.reply("Please enter the stop loss price (or 'none' to clear):");
    
    ctx.session.state = "awaiting_sl";
  } catch (err) {
    console.error("Error in trade SL callback:", err);
    await ctx.answerCbQuery("Error occurred while setting SL.");
  }
}

async function tradeEntryPriceCallback(ctx: Context) {
  try {
    await ctx.answerCbQuery();
    await ctx.reply("Please enter the entry price for limit order (or 'market' for market order):");
    
    ctx.session.state = "awaiting_entry_price";
  } catch (err) {
    console.error("Error in trade entry price callback:", err);
    await ctx.answerCbQuery("Error occurred while setting entry price.");
  }
}

async function tradeExecuteCallback(ctx: Context) {
  try {
    await ctx.answerCbQuery();
    
    // Get user's trade session data
    const userId = ctx.from?.id;
    if (!userId) return;

    // For now, just show what would be executed
    await ctx.reply("Trade execution would happen here with the following details:\n" +
                   `- Token: ${(ctx.session.tempData as any)?.token || 'Not set'}\n` +
                   `- Leverage: ${(ctx.session.tempData as any)?.leverage || 'Not set'}x\n` +
                   `- Amount: ${(ctx.session.tempData as any)?.amount || 'Not set'}\n` +
                   `- Exchange: ${(ctx.session.tempData as any)?.exchange || 'Not set'}\n` +
                   `- Take Profit: ${(ctx.session.tempData as any)?.takeProfit || 'Not set'}\n` +
                   `- Stop Loss: ${(ctx.session.tempData as any)?.stopLoss || 'Not set'}\n` +
                   `- Entry Price: ${(ctx.session.tempData as any)?.entryPrice || 'Market'}`);
  } catch (err) {
    console.error("Error in trade execute callback:", err);
    await ctx.answerCbQuery("Error occurred while executing trade.");
  }
}

async function tradeClearCallback(ctx: Context) {
  try {
    await ctx.answerCbQuery();
    
    // Clear trade session data (using tempData to store trade config)
    if (ctx.session.tempData) {
      (ctx.session.tempData as any).token = undefined;
      (ctx.session.tempData as any).leverage = undefined;
      (ctx.session.tempData as any).amount = undefined;
      (ctx.session.tempData as any).exchange = undefined;
      (ctx.session.tempData as any).takeProfit = undefined;
      (ctx.session.tempData as any).stopLoss = undefined;
      (ctx.session.tempData as any).entryPrice = undefined;
    }
    
    // Show updated keyboard
    const userId = ctx.from?.id;
    if (!userId) return;

    // Get user's default values
    const userDefaults = await prisma.userDefault.findUnique({
      where: { userId: userId.toString() },
    });

    const keyboard = await tradeKeyboard(userId, {
      leverage: userDefaults?.defaultLeverage || 1,
      amount: userDefaults?.defaultAmount || 0,
    });

    await ctx.editMessageReplyMarkup({
      reply_markup: keyboard.reply_markup,
    });
  } catch (err) {
    console.error("Error in trade clear callback:", err);
    await ctx.answerCbQuery("Error occurred while clearing trade.");
  }
}

async function tradeSelectExchangeCallback(ctx: Context) {
  try {
    await ctx.answerCbQuery();
    
    // Extract exchange name from callback data
    const callbackData = ctx.callbackQuery?.data;
    if (!callbackData) return;

    const exchangeName = callbackData.replace('trade_select_exchange_', '');
    
    // Update session with selected exchange
    if (!ctx.session.tempData) ctx.session.tempData = {};
    (ctx.session.tempData as any).exchange = exchangeName;

    // Show updated keyboard
    const userId = ctx.from?.id;
    if (!userId) return;

    // Get user's default values
    const userDefaults = await prisma.userDefault.findUnique({
      where: { userId: userId.toString() },
    });

    const keyboard = await tradeKeyboard(userId, {
      leverage: userDefaults?.defaultLeverage || 1,
      amount: userDefaults?.defaultAmount || 0,
    });

    await ctx.editMessageReplyMarkup({
      reply_markup: keyboard.reply_markup,
    });
  } catch (err) {
    console.error("Error in trade select exchange callback:", err);
    await ctx.answerCbQuery("Error occurred while selecting exchange.");
  }
}

export {
  tradeTokenCallback,
  tradeLeverageCallback,
  tradeAmountCallback,
  tradeExchangeCallback,
  tradeTpCallback,
  tradeSlCallback,
  tradeEntryPriceCallback,
  tradeExecuteCallback,
  tradeClearCallback,
  tradeSelectExchangeCallback
};