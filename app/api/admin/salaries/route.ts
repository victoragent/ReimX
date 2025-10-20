import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "月份格式应为 YYYY-MM");

const scheduleSchema = z.object({
  month: monthSchema,
  userIds: z.array(z.string()).optional()
});

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month");
    const statusParam = searchParams.get("status");
    const userIdParam = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {};

    if (monthParam) {
      monthSchema.parse(monthParam);
      where.month = monthParam;
    }

    if (statusParam) {
      where.status = statusParam;
    }

    if (userIdParam) {
      where.userId = userIdParam;
    }

    const [payments, total, aggregated] = await Promise.all([
      prisma.salaryPayment.findMany({
        where,
        orderBy: [{ month: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              evmAddress: true,
              solanaAddress: true,
              salaryUsdt: true
            }
          }
        }
      }),
      prisma.salaryPayment.count({ where }),
      prisma.salaryPayment.aggregate({
        where,
        _sum: { amountUsdt: true }
      })
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalAmountUsdt: Number(aggregated._sum.amountUsdt?.toFixed(2) ?? 0)
      }
    });
  } catch (error) {
    console.error("获取工资发放列表失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const parsed = scheduleSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "请求参数无效", issues: parsed.error.flatten() }, { status: 400 });
    }

    const { month, userIds } = parsed.data;

    const userWhere: Record<string, unknown> = {
      salaryUsdt: { gt: 0 },
      status: "active"
    };

    if (userIds && userIds.length > 0) {
      userWhere.id = { in: userIds };
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        username: true,
        salaryUsdt: true
      }
    });

    if (users.length === 0) {
      return NextResponse.json({
        message: "没有符合条件的用户或工资未设置",
        created: 0,
        skipped: []
      });
    }

    const existing = await prisma.salaryPayment.findMany({
      where: {
        month,
        userId: { in: users.map((user) => user.id) }
      },
      select: { userId: true }
    });

    const existingIds = new Set(existing.map((item) => item.userId));

    const newUsers = users.filter((user) => !existingIds.has(user.id));

    if (newUsers.length === 0) {
      return NextResponse.json({
        message: "所有目标用户本月工资记录已存在",
        month,
        attempted: users.length,
        created: 0,
        skipped: Array.from(existingIds)
      });
    }

    const data = newUsers.map((user) => ({
      userId: user.id,
      month,
      amountUsdt: user.salaryUsdt,
      status: "pending" as const,
      scheduledAt: new Date()
    }));

    const result = await prisma.salaryPayment.createMany({
      data
    });

    const attempted = users.length;
    const created = result.count;
    const skipped = Array.from(existingIds);

    return NextResponse.json({
      message: "工资发放记录已生成",
      month,
      attempted,
      created,
      skipped
    });
  } catch (error) {
    console.error("生成工资发放记录失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
