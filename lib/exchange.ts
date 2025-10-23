const EXCHANGE_API_BASE = "https://open.er-api.com/v6/latest";
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

type CacheEntry = {
  rate: number;
  fetchedAt: number;
  source: string;
};

const DEFAULT_RATES: Record<string, number> = {
  CNY: 0.14,
  RMB: 0.14,
  HKD: 0.128,
  EUR: 1.09,
  GBP: 1.27,
  JPY: 0.0068,
  AUD: 0.66,
  CAD: 0.74,
  CHF: 1.11,
  SGD: 0.74,
  KRW: 0.00073,
  INR: 0.012,
  IDR: 0.000064,
  THB: 0.028,
  TWD: 0.032,
  MYR: 0.21,
  PHP: 0.018,
  VND: 0.000041,
  NZD: 0.61
};

const aliasMap: Record<string, string> = {
  RMB: "CNY"
};

const cache = new Map<string, CacheEntry>();

export function invalidateExchangeRateCache() {
  cache.clear();
}

export class ExchangeRateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExchangeRateError";
  }
}

export async function getExchangeRateToUsd(currency: string): Promise<{
  rate: number;
  source: string;
  fetchedAt: string;
}> {
  const requestedCode = currency.toUpperCase();
  const apiCode = aliasMap[requestedCode] ?? requestedCode;

  if (apiCode === "USD") {
    return {
      rate: 1,
      source: "static-usd",
      fetchedAt: new Date().toISOString()
    };
  }

  const cached = cache.get(apiCode);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_DURATION_MS) {
    return {
      rate: cached.rate,
      source: cached.source,
      fetchedAt: new Date(cached.fetchedAt).toISOString()
    };
  }

  const response = await fetch(`${EXCHANGE_API_BASE}/${apiCode}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    const fallback = DEFAULT_RATES[apiCode];
    if (fallback) {
      return { rate: fallback, source: "static-fallback", fetchedAt: new Date().toISOString() };
    }
    throw new ExchangeRateError(`无法获取 ${apiCode} 的汇率（状态码 ${response.status}）`);
  }

  const data = (await response.json()) as {
    result?: string;
    rates?: Record<string, number>;
    time_last_update_utc?: string;
    error?: string;
  };

  if (data.result !== "success" || !data.rates || typeof data.rates.USD !== "number") {
    const fallback = DEFAULT_RATES[apiCode];
    if (fallback) {
      return { rate: fallback, source: "static-fallback", fetchedAt: new Date().toISOString() };
    }
    throw new ExchangeRateError(`汇率数据无效：${JSON.stringify(data)}`);
  }

  const rate = data.rates.USD;
  const entry: CacheEntry = {
    rate,
    source: "open.er-api.com",
    fetchedAt: now
  };
  cache.set(apiCode, entry);

  return {
    rate,
    source: entry.source,
    fetchedAt: new Date(data.time_last_update_utc ?? entry.fetchedAt).toISOString()
  };
}
