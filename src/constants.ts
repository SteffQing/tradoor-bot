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

export { exchanges, type Exchange, REPORT };
