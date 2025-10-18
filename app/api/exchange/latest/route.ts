import { NextResponse } from "next/server";
import { currencies, type ExchangeQuote } from "@/lib/utils";

export const dynamic = "force-dynamic";

const mockRates: Record<string, ExchangeQuote> = {
  RMB: {
    amountUsd: 0,
    exchangeRate: 0.137,
    source: "Binance",
    timestamp: new Date().toISOString()
  },
  HKD: {
    amountUsd: 0,
    exchangeRate: 0.128,
    source: "Coinbase",
    timestamp: new Date().toISOString()
  },
  USD: {
    amountUsd: 0,
    exchangeRate: 1,
    source: "1inch",
    timestamp: new Date().toISOString()
  }
};

export async function GET() {
  return NextResponse.json(
    currencies.reduce<Record<string, ExchangeQuote>>((acc, currency) => {
      acc[currency] = mockRates[currency];
      return acc;
    }, {})
  );
}
