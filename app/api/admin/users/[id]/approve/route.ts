import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "未授权访问" }, { status: 401 });
        }

        // 检查当前用户是否为管理员
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        });

        if (!currentUser || currentUser.role !== "admin") {
            return NextResponse.json({ error: "权限不足" }, { status: 403 });
        }

        const { id } = params;
        const body = await request.json();
        const { approved, role } = body;

        // 查找用户
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return NextResponse.json({ error: "用户不存在" }, { status: 404 });
        }

        // 更新用户状态
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                isApproved: approved,
                status: approved ? "active" : "suspended",
                role: role || user.role,
                approvedBy: currentUser.id,
                approvedAt: new Date()
            }
        });

        return NextResponse.json({
            message: approved ? "用户审核通过" : "用户审核拒绝",
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                status: updatedUser.status,
                isApproved: updatedUser.isApproved
            }
        });

    } catch (error) {
        console.error("用户审核错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}
