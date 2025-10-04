function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

function parsePositiveNumber(input: string): number | null {
  const match = input.match(/^\d+(\.\d+)?$/);
  if (!match) return null;
  return parseFloat(match[0]);
}

function parseLeverage(input: string): number | null {
  const num = parsePositiveNumber(input);
  if (!num || num < 1) return null;
  return Math.round(num);
}

export { capitalize, chunk, parseLeverage, parsePositiveNumber };
