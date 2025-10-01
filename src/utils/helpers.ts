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

export { capitalize, chunk };
