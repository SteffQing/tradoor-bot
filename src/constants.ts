const exchanges = [
  "binanceusdm",
  "bybit",
  "kucoinfutures",
  "mexc",
  "okx",
  "gate",
] as const;
type Exchange = (typeof exchanges)[number];

export { exchanges, type Exchange };
