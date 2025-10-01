import type { TradeConfig } from "../models/db.model";

function tradeKeyboard(config: TradeConfig | undefined) {
  const keyboard1 = [
    {
      text: config?.side ?? "Set Side",
      callback_data: "trade_set_side",
    },
    {
      text: config?.token ?? "Set Token",
      callback_data: "trade_set_token",
    },
    {
      text: config?.leverage ? config.leverage + "x" : "Not set",
      callback_data: "trade_set_leverage",
    },
  ];

  const keyboard2 = [
    {
      text: config?.entryPrice ?? "Set Entry Price",
      callback_data: "trade_set_entry_price",
    },
    {
      text: config?.amount ?? "Set Trade Amount",
      callback_data: "trade_set_amount",
    },
    {
      text: config?.exchange ?? "Select Exchange",
      callback_data: "trade_set_exchange",
    },
  ];

  const keyboard3 = [
    {
      text: config?.takeProfit ?? "Set Take Profit",
      callback_data: "trade_set_take_profit",
    },
    {
      text: config?.stopLoss ?? "Set Stop Loss",
      callback_data: "trade_set_stop_loss",
    },
  ];

  const keyboard4 = [
    {
      text: "Execute Trade",
      callback_data: "trade_execute",
    },
    {
      text: "Clear All",
      callback_data: "trade_clear",
    },
  ];

  return {
    inline_keyboard: [keyboard1, keyboard2, keyboard3, keyboard4],
  };
}

export { tradeKeyboard };
