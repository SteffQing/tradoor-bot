import ccxt from "ccxt";
import { type Exchange } from "../constants";
import type { ExchangeConfig, TradeConfig } from "../models/db.model";
import prisma from "../db/prisma";
import { decrypt } from "../utils/encryption";
import { capitalize } from "../utils/helpers";

type OrderParams = Partial<{
  takeProfitPrice: number;
  stopLossPrice: number;
}>;

async function initExchange(name: Exchange, params: ExchangeConfig) {
  const { apiKey, apiSecret, password } = params;

  if (!apiKey || !apiSecret) throw new Error("Missing API credentials");

  const ExchangeClass = ccxt[name];
  const exchange = new ExchangeClass({
    apiKey,
    secret: apiSecret,
    ...(password ? { password } : {}),
    enableRateLimit: true,
    options: { defaultType: name === "binanceusdm" ? "future" : "swap" },
  });

  await exchange.loadMarkets();

  return exchange;
}

async function makeTrade(uid: number, params: TradeConfig) {
  const { amount, side, token, leverage, exchange: exchangeName } = params;
  if (!amount || !side || !token || !leverage || !exchangeName) {
    throw new Error(`Some required params seem to be undefined here`);
  }

  const { apiKeyEncrypted, apiSecretEncrypted, passwordEncrypted } =
    await prisma.exchangeAccount.findUniqueOrThrow({
      where: {
        userId_exchangeName: { userId: uid, exchangeName },
      },
      select: {
        apiKeyEncrypted: true,
        apiSecretEncrypted: true,
        passwordEncrypted: true,
      },
    });

  const apiKey = decrypt(apiKeyEncrypted);
  const apiSecret = decrypt(apiSecretEncrypted);
  const password = passwordEncrypted ? decrypt(passwordEncrypted) : undefined;

  const exchange = await initExchange(exchangeName, {
    apiKey,
    apiSecret,
    password,
  });

  const market = Object.values(exchange.markets).find(
    (m) =>
      m.base === token.toUpperCase() &&
      m.quote === "USDT" &&
      // m.type === "future" // strictly futures
      m.swap === true
  );
  if (!market) {
    throw new Error(
      `Futures market for ${token}/USDT not found on ${capitalize(
        exchangeName
      )}`
    );
  }

  // console.log(market);

  const symbol = market.symbol;
  const orderType = params.entryPrice ? "limit" : "market";
  const tradeAmount = exchange.amountToPrecision(symbol, parseFloat(amount));

  if (exchange.has["setLeverage"]) {
    try {
      await exchange.setLeverage(parseInt(leverage), symbol);
    } catch (err) {
      console.error("Set Leverage Error", err);
      throw new Error(formatCcxtError(err));
    }
  }

  const orderParams: OrderParams = {};
  if (params.takeProfit || params.stopLoss) {
    orderParams.takeProfitPrice = params.takeProfit
      ? parseFloat(params.takeProfit)
      : undefined;
    orderParams.stopLossPrice = params.stopLoss
      ? parseFloat(params.stopLoss)
      : undefined;
  }

  const order = await exchange.createOrder(
    symbol,
    orderType,
    params.side,
    Number(tradeAmount),
    params.entryPrice ? parseFloat(params.entryPrice) : undefined,
    orderParams
  );

  return order;
}

function formatCcxtError(error: unknown): string {
  const err = error as Error;
  try {
    const parsed = JSON.parse(err.message.replace(/^[^{]+/, ""));
    if (parsed?.message) return parsed.message;
  } catch (_) {}

  if (err.constructor?.name) {
    return `${err.constructor.name}: ${err.message}`;
  }

  return err.message || "Unknown exchange error";
}

export { initExchange, makeTrade };
