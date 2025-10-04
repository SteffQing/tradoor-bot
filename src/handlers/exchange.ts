import ccxt from "ccxt";
import { type Exchange } from "../constants";
import type { ExchangeConfig } from "../models/db.model";

async function initExchange(name: Exchange, params: ExchangeConfig) {
  const { apiKey, apiSecret, password } = params;

  if (!apiKey || !apiSecret) throw new Error("Missing API credentials");

  const ExchangeClass = ccxt[name];
  const exchange = new ExchangeClass({
    apiKey,
    secret: apiSecret,
    ...(password ? { password } : {}),
    enableRateLimit: true,
  });

  await exchange.loadMarkets();

  return exchange;
}

export default initExchange;
