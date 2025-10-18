import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const profileUpdateSchema = z.object({
    username: z.string().min(2, "用户名至少2个字符").optional(),
    tgAccount: z.string().optional(),
    whatsappAccount: z.string().optional(),
    evmAddress: z.string().optional(),
    solanaAddress: z.string().optional()
});

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "未授权访问" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                username: true,
                email: true,
                tgAccount: true,
                whatsappAccount: true,
                evmAddress: true,
                solanaAddress: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "用户不存在" },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });

    } catch (error) {
        console.error("获取用户资料错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "未授权访问" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const parsed = profileUpdateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "输入数据无效", details: parsed.error.errors },
                { status: 400 }
            );
        }

        const updateData = parsed.data;

        // 检查敏感信息变更（地址变更需要审核）
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!currentUser) {
            return NextResponse.json(
                { error: "用户不存在" },
                { status: 404 }
            );
        }

        const sensitiveFieldsChanged =
            (updateData.evmAddress && updateData.evmAddress !== currentUser.evmAddress) ||
            (updateData.solanaAddress && updateData.solanaAddress !== currentUser.solanaAddress);

        // 更新用户资料
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                ...updateData,
                // 如果敏感信息变更，状态改为 pending
                ...(sensitiveFieldsChanged && { status: "pending" })
            },
            select: {
                id: true,
                username: true,
                email: true,
                tgAccount: true,
                whatsappAccount: true,
                evmAddress: true,
                solanaAddress: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return NextResponse.json({
            message: sensitiveFieldsChanged
                ? "资料已更新，地址变更需要管理员审核"
                : "资料更新成功",
            user: updatedUser
        });

    } catch (error) {
        console.error("更新用户资料错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}
