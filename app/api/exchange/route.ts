import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currencies } from "@/lib/utils";
import { getExchangeRateToUsd, ExchangeRateError } from "@/lib/exchange";

const querySchema = z.object({
  currency: z.enum(currencies, {
    errorMap: () => ({ message: "不支持的货币类型" })
  })
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parseResult = querySchema.safeParse({
    currency: searchParams.get("currency")?.toUpperCase()
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.flatten().fieldErrors?.currency?.[0] ?? "参数错误" },
      { status: 400 }
    );
  }

  try {
    const quote = await getExchangeRateToUsd(parseResult.data.currency);
    return NextResponse.json({
      currency: parseResult.data.currency,
      rate: quote.rate,
      source: quote.source,
      fetchedAt: quote.fetchedAt
    });
  } catch (error) {
    const message =
      error instanceof ExchangeRateError
        ? error.message
        : "获取汇率失败，请稍后重试";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
