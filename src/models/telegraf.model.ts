import type { Context as TelegrafContext } from "telegraf";
import type { Exchange } from "../constants";
import type { ExchangeInit, TradeConfig } from "./db.model";

interface Session {
  state:
    | "idle"
    | "awaiting_api_key"
    | "awaiting_api_secret"
    | "awaiting_password";
  lastInteraction: number;
  exchange: Exchange | undefined;
  exchangeInit: ExchangeInit | undefined;
  tradeConfig: TradeConfig | undefined;
}

type Context = TelegrafContext & {
  session: Session;
  match?: RegExpExecArray;
};
export type { Session, Context };
