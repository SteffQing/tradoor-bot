// import { tradeKeyboard } from "../keyboards/trade";
import type { Context } from "../models/telegraf.model";
import type { TradeConfig } from "../models/db.model";
import {
  handleAmount,
  handleClear,
  handleEntryPrice,
  handleExchange,
  handleLeverage,
  handleSide,
  handleStopLoss,
  handleTakeProfit,
  handleToken,
} from "../handlers/trade.handler";
import handleExecute from "../handlers/trade.execute";
import { parseLeverage, parsePositiveNumber } from "../utils/helpers";
import { Exchange, exchanges, tradeMsg } from "../constants";
import { tradeKeyboard } from "../keyboards/trade";
import { makeTrade } from "../handlers/exchange";

async function tradeCallback(ctx: Context) {
  if (
    !ctx.callbackQuery ||
    !("data" in ctx.callbackQuery) ||
    !ctx.callbackQuery.data ||
    !ctx.chat
  )
    return;

  const data = ctx.callbackQuery.data as string;
  const [, action] = data.split(":") as [string, keyof TradeConfig];

  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    if (!ctx.session.tradeConfig) {
      ctx.session.tradeConfig = {};
    }

    let handler: typeof handleAmount;

    switch (action) {
      case "side":
        handler = handleSide;
        break;
      case "amount":
        handler = handleAmount;
        break;
      case "entryPrice":
        handler = handleEntryPrice;
        break;
      case "exchange":
        handler = handleExchange;
        break;
      case "leverage":
        handler = handleLeverage;
        break;
      case "stopLoss":
        handler = handleStopLoss;
        break;
      case "token":
        handler = handleToken;
        break;
      case "takeProfit":
        handler = handleTakeProfit;
        break;
      case "clear":
        handler = handleClear;
        break;
      case "execute":
        handler = handleExecute;
    }

    await ctx.telegram.sendChatAction(ctx.chat.id, "typing");
    await handler(ctx);

    await ctx.answerCbQuery();
  } catch (err) {
    console.error("Error in trade callback:", err);
    await ctx.answerCbQuery("An error occurred while processing your request.");
  }
}

async function tradeMessageHandler(ctx: Context) {
  if (!ctx.session.state || !ctx.session.tradeConfig) return;
  if (!ctx.message || !("text" in ctx.message)) return;

  const text = ctx.message?.text?.trim();
  if (!text) return;
  ctx.deleteMessage(ctx.message.message_id).catch(() => {});

  const state = ctx.session.state;

  switch (state) {
    case "trade:side":
      const side = text.toLowerCase();
      if (["buy", "sell"].includes(side))
        ctx.session.tradeConfig.side = side as keyof TradeConfig["side"];
      else await handleSide(ctx);
      break;

    case "trade:token":
      ctx.session.tradeConfig.token = text.trim().toUpperCase();
      break;

    case "trade:leverage":
      const lev = parseLeverage(text);
      if (lev) ctx.session.tradeConfig.leverage = lev.toString();
      else await handleLeverage(ctx);
      break;

    case "trade:amount":
      const amt = parsePositiveNumber(text);
      if (amt) ctx.session.tradeConfig.amount = amt.toString();
      else await handleAmount(ctx);
      break;

    case "trade:entryPrice":
      const ep = parsePositiveNumber(text);
      if (ep) ctx.session.tradeConfig.amount = ep.toString();
      else await handleEntryPrice(ctx);
      break;

    case "trade:takeProfit":
      const tp = parsePositiveNumber(text);
      if (tp) ctx.session.tradeConfig.takeProfit = tp.toString();
      else await handleTakeProfit(ctx);
      break;

    case "trade:stopLoss":
      const sl = parsePositiveNumber(text);
      if (sl) ctx.session.tradeConfig.stopLoss = sl.toString();
      else handleStopLoss(ctx);
      break;

    case "trade:exchange":
      const exch = text.toLowerCase();
      const isExchange = (exchanges as unknown as string[]).includes(exch);
      if (isExchange) ctx.session.tradeConfig.exchange = exch as Exchange;
      else await handleExchange(ctx);
      break;

    case "trade:clear":
      if (text == "Yes") {
        ctx.session.tradeConfig = {};
        ctx.session.state = "idle";
        if (ctx.session.msgId) {
          await ctx.telegram.editMessageText(
            ctx.chat?.id,
            ctx.session.msgId,
            undefined,
            "✅ Trade configuration cleared."
          );
        }
      }
      break;

    case "trade:execute":
      if (text == "Proceed" && ctx.chat && ctx.from) {
        await ctx.telegram.sendChatAction(ctx.chat.id, "typing");

        const userId = ctx.from.id;
        const tradeConfig = ctx.session.tradeConfig;

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
            `• Side: *${tradeConfig.side?.toUpperCase()}*`,
            `• Leverage: *${tradeConfig.leverage}x*`,
            `• Amount: *${tradeConfig.amount} USDT*`,
            tradeConfig.entryPrice
              ? `• Entry: *${tradeConfig.entryPrice}*`
              : `• Entry: *Market*`,
            tradeConfig.takeProfit
              ? `• Take Profit: *${tradeConfig.takeProfit}*`
              : "",
            tradeConfig.stopLoss
              ? `• Stop Loss: *${tradeConfig.stopLoss}*`
              : "",
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
  }

  if (state !== "trade:execute") {
    await Promise.all(
      ctx.session.toDeleteMessageIds.map((id) =>
        ctx.deleteMessage(id).catch(() => {})
      )
    );
  }

  if (!["trade:execute", "trade:clear"].includes(state)) {
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      ctx.session.msgId,
      undefined,
      tradeMsg,
      {
        reply_markup: tradeKeyboard(ctx.session.tradeConfig),
      }
    );
  }
}
export { tradeCallback, tradeMessageHandler };
