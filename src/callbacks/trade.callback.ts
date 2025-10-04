// import { tradeKeyboard } from "../keyboards/trade";
import type { Context } from "../models/telegraf.model";
import type { TradeConfig } from "../models/db.model";

async function tradeCallback(ctx: Context) {
  if (
    !ctx.callbackQuery ||
    !("data" in ctx.callbackQuery) ||
    !ctx.callbackQuery.data
  )
    return;
  if (!ctx.message || !("text" in ctx.message)) return;

  const userId = ctx.from?.id;

  const data = ctx.callbackQuery.data as string;
  const [callbackType, action] = data.split(":") as [
    string,
    keyof TradeConfig | "execute" | "clear"
  ];

  if (callbackType !== "trade" && !userId) return;

  const text = ctx.message.text;
  console.log(text, "ctx text", action, "action in trade callback");

  try {
    // if (!ctx.session.tradeConfig) {
    //   ctx.session.tradeConfig = {};
    // }

    switch (action) {
      case "side":
    }

    // Acknowledge the callback
    await ctx.answerCbQuery();
  } catch (err) {
    console.error("Error in trade callback:", err);
    await ctx.answerCbQuery("An error occurred while processing your request.");
  }
}

export { tradeCallback };
