import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { aggregateSalariesForSafeWallet } from "@/lib/safewallet";

export const dynamic = "force-dynamic";
const schema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  status: z.string().optional(),
  userId: z.string().optional()
});

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
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "请求参数无效", issues: parsed.error.flatten() }, { status: 400 });
    }

    const { month, status, userId } = parsed.data;

    const where: Record<string, unknown> = { month };

    if (status && status !== "all") {
      where.status = status;
    } else if (!status) {
      where.status = { in: ["pending", "scheduled"] };
    }

    if (userId) {
      where.userId = userId;
    }

    const salaries = await prisma.salaryPayment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
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

    const aggregation = aggregateSalariesForSafeWallet(salaries);

    return NextResponse.json({
      filtersApplied: { month, status: status ?? "pending" },
      totalPayments: aggregation.items.length,
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
    console.error("生成工资 SafeWallet 数据失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
