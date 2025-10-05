import type { TradeConfig } from "../models/db.model";
import type { Context } from "../models/telegraf.model";
import { capitalize } from "../utils/helpers";
import { makeTrade } from "./exchange";

const requiredFields = [
  "side",
  "token",
  "leverage",
  "amount",
  "exchange",
] as const;

function formatTradeConfigMessage(config: TradeConfig) {
  return (
    `Direction: ${config.side!}\n` +
    `Token: ${config.token!}\n` +
    `Leverage: ${config.leverage!}x\n` +
    `Amount: ${config.amount!} USDT\n` +
    `Entry Price: ${config.entryPrice || "Market Price"}\n` +
    `Stop Loss: ${config.stopLoss || "Not set"}\n` +
    `Take Profit: ${config.takeProfit || "Not set"}\n` +
    `Exchange: ${capitalize(config.exchange!)}\n\n` +
    "⚠️ Remember: trading futures is risky. Ensure your settings match your risk tolerance."
  );
}

async function handleExecute(ctx: Context) {
  const config = ctx.session.tradeConfig;
  if (!config) return;

  const missing = requiredFields.filter((f) => !config[f]);
  if (missing.length > 0) {
    const missingMessage = `⚠️ Cannot execute trade. Missing fields: ${missing.join(
      ", "
    )}`;

    const { message_id } = await ctx.reply(missingMessage);

    setTimeout(() => ctx.deleteMessage(message_id).catch(() => {}), 5000);
    return;
  }

  ctx.session.state = "trade:execute";

  const { message_id } = await ctx.reply(
    `✅ Ready to execute trade with the following configuration:\n\n` +
      formatTradeConfigMessage(config) +
      "\n\nDo you want to proceed?",
    {
      reply_markup: {
        keyboard: [[{ text: "Proceed" }, { text: "Cancel" }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
  );

  ctx.session.toDeleteMessageIds.push(message_id);
}

async function executeTrade(ctx: Context) {
  if (!ctx.chat || !ctx.from) return ctx.reply("Cannot proceed");

  await ctx.telegram.sendChatAction(ctx.chat.id, "typing");

  const userId = ctx.from.id;
  const tradeConfig = ctx.session.tradeConfig;
  if (!tradeConfig)
    return ctx.reply("Trade config is empty. This shouldn't happen");

  const typingInterval = setInterval(() => {
    if (ctx.chat) {
      ctx.telegram.sendChatAction(ctx.chat.id, "typing").catch(() => {});
    }
  }, 4000);

  try {
    const order = await makeTrade(userId, tradeConfig);

    clearInterval(typingInterval);

    const summary = [
      `✅ *Trade Executed!*`,
      `• Exchange: *${tradeConfig.exchange?.toUpperCase()}*`,
      `• Symbol: *${tradeConfig.token}/USDT*`,
      `• Direction: *${tradeConfig.side?.toUpperCase()}*`,
      `• Leverage: *${tradeConfig.leverage}x*`,
      `• Amount: *${tradeConfig.amount} USDT*`,
      tradeConfig.entryPrice
        ? `• Entry: *${tradeConfig.entryPrice}*`
        : `• Entry: *Market*`,
      tradeConfig.takeProfit
        ? `• Take Profit: *${tradeConfig.takeProfit}*`
        : "",
      tradeConfig.stopLoss ? `• Stop Loss: *${tradeConfig.stopLoss}*` : "",
      `• Order ID: \`${order.id}\``,
    ]
      .filter(Boolean)
      .join("\n");

    await ctx.reply(summary, { parse_mode: "Markdown" });
  } catch (err) {
    clearInterval(typingInterval);

    console.error("Trade execution error:", err);
    await ctx.reply(
      err instanceof Error
        ? err.message
        : `⚠️ Trade execution failed: ${String(err)}`
    );
  }
}

export { handleExecute, executeTrade };
