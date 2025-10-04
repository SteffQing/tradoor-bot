import type { Exchange } from "../constants";

export interface SessionRow {
  value: string;
}

type ExchangeConfig = Partial<{
  apiKey: string;
  apiSecret: string;
  password: string;
}>;

type TradeConfig = Partial<{
  token: string;
  leverage: string;
  amount: string; // amount on the trade in USD
  exchange: Exchange;
  takeProfit: string;
  stopLoss: string;
  entryPrice: string;
  side: "buy" | "sell";
}>;

export type { ExchangeConfig, TradeConfig };
