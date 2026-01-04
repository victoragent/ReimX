import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
    action: z.enum(["APPROVE", "REJECT"]),
    note: z.string().optional()
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        });

        if (!currentUser || currentUser.role !== "admin") {
            return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
        }

        const { id } = params;
        const body = await request.json();
        const parsed = reviewSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "无效的请求参数", issues: parsed.error.flatten() }, { status: 400 });
        }

        const { action, note } = parsed.data;

        const entry = await prisma.ledgerEntry.findUnique({ where: { id } });
        if (!entry) {
            return NextResponse.json({ error: "记录不存在" }, { status: 404 });
        }

        // Map action to status
        const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

        const updatedEntry = await prisma.ledgerEntry.update({
            where: { id },
            data: {
                status: newStatus,
                reviewedBy: currentUser.id,
                reviewedAt: new Date(),
                reviewNote: note
            }
        });

        return NextResponse.json(updatedEntry);

    } catch (error) {
        console.error("审核记录失败:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
