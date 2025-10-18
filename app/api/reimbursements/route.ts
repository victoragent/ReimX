import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currencies } from "@/lib/utils";

const createSchema = z.object({
  applicantId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  amountOriginal: z.number().positive(),
  currency: z.enum(currencies),
  exchangeRateToUsd: z.number().positive(),
  amountUsdEquivalent: z.number().positive(),
  exchangeRateSource: z.string().min(1),
  exchangeRateTime: z.coerce.date(),
  isManualRate: z.boolean().optional(),
  convertedBy: z.string().optional(),
  chain: z.enum(["evm", "solana"] as const),
  receiptUrl: z.string().url().optional()
});

export async function GET() {
  const reimbursements = await prisma.reimbursement.findMany({
    orderBy: { createdAt: "desc" },
    take: 25
  });

  return NextResponse.json({ reimbursements });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reimbursement = await prisma.reimbursement.create({
    data: {
      applicantId: parsed.data.applicantId,
      title: parsed.data.title,
      description: parsed.data.description,
      amountOriginal: parsed.data.amountOriginal,
      currency: parsed.data.currency,
      exchangeRateToUsd: parsed.data.exchangeRateToUsd,
      amountUsdEquivalent: parsed.data.amountUsdEquivalent,
      exchangeRateSource: parsed.data.exchangeRateSource,
      exchangeRateTime: parsed.data.exchangeRateTime,
      isManualRate: parsed.data.isManualRate ?? false,
      convertedBy: parsed.data.convertedBy,
      chain: parsed.data.chain,
      receiptUrl: parsed.data.receiptUrl,
      status: "submitted"
    }
  });

  return NextResponse.json({ reimbursement, message: "Reimbursement submitted" }, { status: 201 });
}
