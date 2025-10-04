const exchanges = [
  "binanceusdm",
  "bybit",
  "kucoinfutures",
  "mexc",
  "okx",
  "gate",
] as const;
type Exchange = (typeof exchanges)[number];

const REPORT = 976665869;

const tradeMsg =
  "Configure your trade details:" +
  "⚠️ Remember: trading futures is risky. Make sure your settings match your risk tolerance.";

export { exchanges, type Exchange, REPORT, tradeMsg };
