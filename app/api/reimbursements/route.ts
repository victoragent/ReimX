import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currencies, expenseTypes } from "@/lib/utils";
import { getExchangeRateToUsd, ExchangeRateError } from "@/lib/exchange";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";
const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amountOriginal: z.number().positive(),
  currency: z.enum(currencies),
  receiptUrl: z.string().url().optional(),
  expenseType: z.enum(expenseTypes)
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "未授权访问" }, { status: 401 });
  }

  // 获取当前用户信息
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true }
  });

  if (!currentUser) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const reimbursements = await prisma.reimbursement.findMany({
    where: { applicantId: currentUser.id },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      applicant: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  });

  return NextResponse.json({ reimbursements });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "未授权访问" }, { status: 401 });
  }

  // 获取当前用户信息
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true }
  });

  if (!currentUser) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const payload = await request.json();
  const parsed = createSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 使用当前用户的ID，忽略前端传递的applicantId
  const applicantId = currentUser.id;

  let quote;
  try {
    quote = await getExchangeRateToUsd(parsed.data.currency);
  } catch (error) {
    console.error("获取汇率失败:", error);
    const message =
      error instanceof ExchangeRateError
        ? error.message
        : "汇率获取失败，请稍后重试";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const exchangeRateToUsd = quote.rate;
  const amountUsdEquivalent = Number(
    (parsed.data.amountOriginal * exchangeRateToUsd).toFixed(2)
  );
  const exchangeRateTime = new Date(quote.fetchedAt);

  const reimbursement = await prisma.reimbursement.create({
    data: {
      applicantId: applicantId,
      title: parsed.data.title,
      description: parsed.data.description,
      amountOriginal: parsed.data.amountOriginal,
      currency: parsed.data.currency,
      exchangeRateToUsd,
      amountUsdEquivalent,
      exchangeRateSource: quote.source,
      exchangeRateTime,
      isManualRate: false,
      convertedBy: quote.source,
      chain: "evm",
      receiptUrl: parsed.data.receiptUrl,
      expenseType: parsed.data.expenseType,
      status: "submitted"
    },
    include: {
      applicant: {
        select: {
          username: true,
          email: true,
          tgAccount: true
        }
      }
    }
  });

  // 发送通知
  try {
    await sendNotification({
      type: 'reimbursement_submitted',
      user: {
        name: reimbursement.applicant.username,
        email: reimbursement.applicant.email,
        tgAccount: reimbursement.applicant.tgAccount || undefined
      },
      reimbursement: {
        id: reimbursement.id,
        title: reimbursement.title,
        amount: reimbursement.amountOriginal,
        currency: reimbursement.currency,
        chain: reimbursement.chain
      }
    });
  } catch (error) {
    console.error('发送通知失败:', error);
    // 通知失败不影响主流程
  }

  return NextResponse.json({ reimbursement, message: "报销申请提交成功" }, { status: 201 });
}
