import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const schema = z.object({
  salaryPaymentIds: z.array(z.string()).min(1),
  transactionHash: z.string().optional()
});

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
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "请求参数无效", issues: parsed.error.flatten() }, { status: 400 });
    }

    const { salaryPaymentIds, transactionHash } = parsed.data;

    const result = await prisma.salaryPayment.updateMany({
      where: {
        id: { in: salaryPaymentIds },
        status: { in: ["pending", "scheduled"] }
      },
      data: {
        status: "paid",
        paidAt: new Date(),
        transactionHash: transactionHash ?? null
      }
    });

    return NextResponse.json({
      message: "工资发放状态已更新",
      updated: result.count
    });
  } catch (error) {
    console.error("更新工资发放状态失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
