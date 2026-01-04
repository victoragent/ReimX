
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
    id: z.string().min(1),
    paymentAmountUsdt: z.number().nonnegative().optional(),
    notes: z.string().optional()
});

export async function PATCH(request: NextRequest) {
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
        const parsed = updateSchema.safeParse(payload);

        if (!parsed.success) {
            return NextResponse.json({ error: "请求参数无效", issues: parsed.error.flatten() }, { status: 400 });
        }

        const { id, paymentAmountUsdt, notes } = parsed.data;

        const data: Record<string, any> = {};
        if (paymentAmountUsdt !== undefined) data.paymentAmountUsdt = paymentAmountUsdt;
        if (notes !== undefined) data.notes = notes;

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ message: "无更新内容" });
        }

        const salaryPayment = await prisma.salaryPayment.update({
            where: { id },
            data
        });

        return NextResponse.json({
            message: "更新成功",
            salaryPayment
        });
    } catch (error) {
        console.error("更新工资发放金额失败:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
