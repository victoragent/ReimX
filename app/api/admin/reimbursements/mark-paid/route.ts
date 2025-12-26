import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const markPaidSchema = z.object({
    reimbursementIds: z.array(z.string()).min(1, "至少选择一项"),
    reimbursementUrl: z.string().optional()
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
        const parsed = markPaidSchema.safeParse(payload);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "无效的请求数据", issues: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { reimbursementIds, reimbursementUrl } = parsed.data;

        await prisma.reimbursement.updateMany({
            where: {
                id: { in: reimbursementIds },
                status: "approved" // 只能标记已审批通过的为已报销
            },
            data: {
                status: "reimbursed",
                // @ts-ignore: Field added in recent schema update
                reimbursementUrl: reimbursementUrl || null,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            message: "操作成功"
        });
    } catch (error) {
        console.error("标记报销状态失败:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
