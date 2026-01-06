const EXCHANGE_API_BASE = "https://open.er-api.com/v6/latest";
const COINBASE_API_BASE = "https://api.coinbase.com/v2/prices";
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds for real-time rates

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
  NZD: 0.61,
  // Crypto fallbacks (very rough estimates)
  BTC: 90000,
  ETH: 3000,
  SOL: 130,
  USDT: 1.00
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

// Check if currency is supported crypto (available on Coinbase)
const CRYPTO_CURRENCIES = ["BTC", "ETH", "SOL", "USDT"];

async function fetchCryptoRate(currency: string): Promise<{ rate: number; source: string }> {
  const symbol = currency.toUpperCase();
  const url = `${COINBASE_API_BASE}/${symbol}-USD/spot`;

  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }

    const data = await response.json() as { data?: { base: string; currency: string; amount: string } };
    // Expected format: { "data": { "base":"BTC", "currency":"USD", "amount":"93734.975" } }

    if (!data.data || !data.data.amount) {
      throw new Error("Invalid response format");
    }

    const rate = parseFloat(data.data.amount);
    if (isNaN(rate)) {
      throw new Error("Invalid rate amount");
    }

    return { rate, source: "api.coinbase.com" };
  } catch (error) {
    throw new ExchangeRateError(`Failed to fetch crypto rate for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
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
      source: "system",
      fetchedAt: new Date().toISOString()
    };
  }

  // Check cache
  const cached = cache.get(apiCode);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CACHE_DURATION_MS) {
    return {
      rate: cached.rate,
      source: cached.source,
      fetchedAt: new Date(cached.fetchedAt).toISOString()
    };
  }

  // Fetch Logic
  try {
    let result: { rate: number; source: string };

    if (CRYPTO_CURRENCIES.includes(apiCode)) {
      result = await fetchCryptoRate(apiCode);
    } else {
      // Use existing logic for Fiat
      const response = await fetch(`${EXCHANGE_API_BASE}/${apiCode}`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Fiat API Status ${response.status}`);
      }

      const data = (await response.json()) as {
        result?: string;
        rates?: Record<string, number>;
        time_last_update_utc?: string;
      };

      if (data.result !== "success" || !data.rates || typeof data.rates.USD !== "number") {
        throw new Error("Invalid Fiat API response");
      }

      result = { rate: data.rates.USD, source: "open.er-api.com" };
    }

    // Success - Update Cache
    const entry: CacheEntry = {
      rate: result.rate,
      source: result.source,
      fetchedAt: now
    };
    cache.set(apiCode, entry);

    return {
      rate: result.rate,
      source: result.source,
      fetchedAt: new Date(entry.fetchedAt).toISOString()
    };

  } catch (error) {
    // Fallback Logic
    const fallback = DEFAULT_RATES[apiCode];
    if (fallback) {
      return { rate: fallback, source: "static-fallback (error)", fetchedAt: new Date().toISOString() };
    }
    throw new ExchangeRateError(`无需获取汇率: ${error instanceof Error ? error.message : String(error)}`);
  }
}
