import type { TradeConfig } from "../models/db.model";

function tradeKeyboard(config: TradeConfig | undefined) {
  const keyboard1 = [
    {
      text: config?.side ?? "Set Side",
      callback_data: "trade:side",
    },
    {
      text: config?.token ?? "Set Token",
      callback_data: "trade:token",
    },
    {
      text: config?.leverage ? config.leverage + "x" : "Not set",
      callback_data: "trade:leverage",
    },
  ];

  const keyboard2 = [
    {
      text: config?.entryPrice ?? "Set Entry Price",
      callback_data: "trade:entryPrice",
    },
    {
      text: config?.amount ?? "Set Trade Amount",
      callback_data: "trade:amount",
    },
    {
      text: config?.exchange ?? "Select Exchange",
      callback_data: "trade:exchange",
    },
  ];

  const keyboard3 = [
    {
      text: config?.takeProfit ?? "Set Take Profit",
      callback_data: "trade:takeProfit",
    },
    {
      text: config?.stopLoss ?? "Set Stop Loss",
      callback_data: "trade:stopLoss",
    },
  ];

  const keyboard4 = [
    {
      text: "Execute Trade",
      callback_data: "trade:execute",
    },
    {
      text: "Clear All",
      callback_data: "trade:clear",
    },
  ];

  return {
    inline_keyboard: [keyboard1, keyboard2, keyboard3, keyboard4],
  };
}

export { tradeKeyboard };
