import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "未授权访问" }, { status: 401 });
        }

        // 检查管理员权限
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true }
        });

        if (!currentUser || currentUser.role !== "admin") {
            return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
        }

        const { id } = params;

        // 检查是否存在
        const existing = await prisma.reimbursement.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: "报销单不存在" }, { status: 404 });
        }

        // 执行删除
        await prisma.reimbursement.delete({
            where: { id }
        });

        return NextResponse.json({ message: "删除成功" });
    } catch (error) {
        console.error("删除报销单错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}

