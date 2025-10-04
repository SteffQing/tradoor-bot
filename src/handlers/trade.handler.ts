import prisma from "../db/prisma";
import { Context } from "../models/telegraf.model";

async function handleSide(ctx: Context) {
  const { message_id } = await ctx.reply("Please select a trade direction:", {
    reply_markup: {
      keyboard: [[{ text: "Buy" }, { text: "Sell" }]],
      resize_keyboard: true,
      one_time_keyboard: true, // hides keyboard after selection
    },
  });
  ctx.session.state = "trade:side";
  ctx.session.toDeleteMessageIds.push(message_id);
  return;
}

async function handleToken(ctx: Context) {
  const { message_id } = await ctx.reply(
    "Please enter the token symbol you want to trade (e.g., BTC/USDT):"
  );
  ctx.session.state = "trade:token";
  ctx.session.toDeleteMessageIds.push(message_id);
}

async function handleLeverage(ctx: Context) {
  const { message_id } = await ctx.reply(
    "Enter leverage (e.g., 5 for 5x). Make sure it is within allowed range:"
  );
  ctx.session.state = "trade:leverage";
  ctx.session.toDeleteMessageIds.push(message_id);
}

async function handleEntryPrice(ctx: Context) {
  const { message_id } = await ctx.reply(
    "Enter the entry price for the trade if you want it as a limit order (e.g., 30000):"
  );
  ctx.session.state = "trade:entryPrice";
  ctx.session.toDeleteMessageIds.push(message_id);
}

async function handleAmount(ctx: Context) {
  const { message_id } = await ctx.reply(
    "Enter the trade amount in USD (e.g., 10) Ensure your balance covers this trade:"
  );
  ctx.session.state = "trade:amount";
  ctx.session.toDeleteMessageIds.push(message_id);
}

async function handleStopLoss(ctx: Context) {
  const { message_id } = await ctx.reply(
    "Enter the stop loss price (e.g., 29500):"
  );
  ctx.session.state = "trade:stopLoss";
  ctx.session.toDeleteMessageIds.push(message_id);
}

async function handleTakeProfit(ctx: Context) {
  const { message_id } = await ctx.reply(
    "Enter the take profit price (e.g., 31000):"
  );
  ctx.session.state = "trade:takeProfit";
  ctx.session.toDeleteMessageIds.push(message_id);
}

async function handleExchange(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const exchangeAccounts = await prisma.exchangeAccount.findMany({
    where: { userId },
    select: { exchangeName: true },
  });

  if (exchangeAccounts.length === 0) {
    const { message_id } = await ctx.reply(
      "⚠️ You have no registered exchanges. Please register one with /register first."
    );
    ctx.session.toDeleteMessageIds.push(message_id);
    return;
  }

  const keyboard = exchangeAccounts.map((acc) => [{ text: acc.exchangeName }]);

  const { message_id } = await ctx.reply("Select exchange:", {
    reply_markup: {
      keyboard,
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
  ctx.session.state = "trade:exchange";
  ctx.session.toDeleteMessageIds.push(message_id);
}
async function handleClear(ctx: Context) {
  if (!ctx.session.tradeConfig) return;

  const { message_id } = await ctx.reply(
    "Are you sure you want to clear your trade config?",
    {
      reply_markup: {
        keyboard: [[{ text: "Yes" }, { text: "No" }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
  );

  ctx.session.state = "trade:clear";
  ctx.session.toDeleteMessageIds.push(message_id);
}

export {
  handleSide,
  handleToken,
  handleLeverage,
  handleAmount,
  handleEntryPrice,
  handleExchange,
  handleStopLoss,
  handleTakeProfit,
  handleClear,
};
