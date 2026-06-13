const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  DOGE: "dogecoin",
  ADA: "cardano",
  DOT: "polkadot",
  XRP: "ripple",
  BNB: "binancecoin",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
  LTC: "litecoin",
  UNI: "uniswap",
  LINK: "chainlink",
  ATOM: "cosmos",
  FET: "fetch-ai",
};

const BASE_URL = "https://api.coingecko.com/api/v3";

export async function fetchPrices(symbols: string[]): Promise<Record<string, number>> {
  const ids = symbols
    .map((s) => COINGECKO_IDS[s.toUpperCase()])
    .filter(Boolean) as string[];

  if (ids.length === 0) return {};

  const url = `${BASE_URL}/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Price API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Record<string, { usd?: number }>;
  const result: Record<string, number> = {};

  for (const symbol of symbols) {
    const upper = symbol.toUpperCase();
    const id = COINGECKO_IDS[upper];
    if (id && data[id]?.usd !== undefined) {
      result[upper] = data[id].usd;
    }
  }

  return result;
}

export async function fetchPrice(symbol: string): Promise<number> {
  const prices = await fetchPrices([symbol]);
  return prices[symbol.toUpperCase()] ?? 0;
}
