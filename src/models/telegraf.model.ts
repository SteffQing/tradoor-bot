import type { Context as TelegrafContext } from "telegraf";
import type { Exchange } from "../constants";
import type { ExchangeConfig, TradeConfig } from "./db.model";

type RegisterState = "api_key" | "api_secret" | "password";
type TradeState = keyof TradeConfig;

interface Session {
  state: "idle" | `register:${RegisterState}` | `trade:${TradeState}`;
  lastInteraction: number;
  exchange: Exchange | undefined;
  exchangeConfig: ExchangeConfig | undefined;
  tradeConfig: TradeConfig | undefined;
  toDeleteMessageIds: number[];
  msgId: number | undefined;
}

type Context = TelegrafContext & {
  session: Session;
  match?: RegExpExecArray;
};
export type { Session, Context };
