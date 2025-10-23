import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { aggregateForSafeWallet } from "@/lib/safewallet";

const filterSchema = z.object({
  applicantId: z.string().optional(),
  currency: z.string().optional(),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  minAmountUsdt: z.number().nonnegative().optional(),
  maxAmountUsdt: z.number().nonnegative().optional()
});

const requestSchema = z.object({
  filters: filterSchema.optional()
});

const isValidDate = (value?: string | null) => {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const payload = await request.json();
    const parsed = requestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "无效的筛选条件",
          issues: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const filters = parsed.data.filters ?? {};

    const where: any = {
      status: "approved"
    };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { applicant: { username: { contains: filters.search, mode: "insensitive" } } },
        { applicant: { email: { contains: filters.search, mode: "insensitive" } } }
      ];
    }

    if (filters.currency) {
      where.currency = filters.currency;
    }

    if (filters.applicantId) {
      where.applicantId = filters.applicantId;
    }

    if (filters.fromDate || filters.toDate) {
      const dateFilter: Record<string, Date> = {};

      if (filters.fromDate) {
        if (!isValidDate(filters.fromDate)) {
          return NextResponse.json({ error: "开始日期格式不正确" }, { status: 400 });
        }
        dateFilter.gte = new Date(filters.fromDate);
      }

      if (filters.toDate) {
        if (!isValidDate(filters.toDate)) {
          return NextResponse.json({ error: "结束日期格式不正确" }, { status: 400 });
        }
        dateFilter.lte = new Date(filters.toDate);
      }

      where.updatedAt = dateFilter;
    }

    if (typeof filters.minAmountUsdt === "number" || typeof filters.maxAmountUsdt === "number") {
      const amountFilter: Record<string, number> = {};

      if (typeof filters.minAmountUsdt === "number") {
        amountFilter.gte = filters.minAmountUsdt;
      }

      if (typeof filters.maxAmountUsdt === "number") {
        amountFilter.lte = filters.maxAmountUsdt;
      }

      where.amountUsdEquivalent = amountFilter;
    }

    const reimbursements = await prisma.reimbursement.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        applicant: {
          select: {
            id: true,
            username: true,
            email: true,
            evmAddress: true,
            solanaAddress: true,
            chainAddresses: true
          }
        }
      }
    });

    const aggregation = aggregateForSafeWallet(reimbursements);

    return NextResponse.json({
      filtersApplied: filters,
      totalReimbursements: aggregation.items.length,
      totalBatches: aggregation.batches.length,
      totalUsdt: Number(
        aggregation.batches.reduce((sum, batch) => sum + batch.totalAmountUsdt, 0).toFixed(2)
      ),
      items: aggregation.items,
      batches: aggregation.batches,
      issues: aggregation.issues,
      safewallet: aggregation.safewalletPayload
    });
  } catch (error) {
    console.error("生成 SafeWallet 数据失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
