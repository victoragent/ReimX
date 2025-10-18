import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currencies } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";

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

  // 根据用户角色决定返回的数据
  let whereClause = {};
  if (currentUser.role === "user") {
    // 普通用户只能看到自己的报销记录
    whereClause = { applicantId: currentUser.id };
  }
  // 管理员和审核员可以看到所有记录

  const reimbursements = await prisma.reimbursement.findMany({
    where: whereClause,
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

  // 确保用户只能为自己提交报销申请
  if (parsed.data.applicantId !== currentUser.id) {
    return NextResponse.json({ error: "只能为自己提交报销申请" }, { status: 403 });
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
