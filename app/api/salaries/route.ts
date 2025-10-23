import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
const querySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
  status: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, username: true, salaryUsdt: true }
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || undefined;
    const status = searchParams.get("status") || undefined;

    const validated = querySchema.safeParse({ month, status });

    if (!validated.success) {
      return NextResponse.json({ error: "查询参数无效", issues: validated.error.flatten() }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      userId: user.id
    };

    if (validated.data.month) {
      where.month = validated.data.month;
    }

    if (validated.data.status) {
      where.status = validated.data.status;
    }

    const payments = await prisma.salaryPayment.findMany({
      where,
      orderBy: [{ month: "desc" }, { createdAt: "desc" }]
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        salaryUsdt: user.salaryUsdt
      },
      payments
    });
  } catch (error) {
    console.error("获取工资发放记录失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
