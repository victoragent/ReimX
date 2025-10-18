import { NextResponse } from "next/server";
import { z } from "zod";
import { currencies } from "@/lib/utils";

const schema = z.object({
  amount: z.number().positive(),
  currency: z.enum(currencies),
  manualRate: z.number().positive().optional()
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { amount, currency, manualRate } = parsed.data;
  const exchangeRate = manualRate ?? (currency === "USD" ? 1 : currency === "RMB" ? 0.137 : 0.128);

  return NextResponse.json({
    amountUsd: Number((amount * exchangeRate).toFixed(2)),
    exchangeRate,
    source: manualRate ? "manual" : "mock",
    timestamp: new Date().toISOString()
  });
}
