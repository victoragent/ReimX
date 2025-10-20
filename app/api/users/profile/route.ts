import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const editableRoles = ["user", "reviewer"] as const;

const profileUpdateSchema = z.object({
    username: z.string().min(2, "用户名至少2个字符").optional(),
    email: z.string().email("请输入有效的邮箱地址").optional(),
    tgAccount: z.string().optional(),
    whatsappAccount: z.string().optional(),
    evmAddress: z.string().optional(),
    solanaAddress: z.string().optional(),
    role: z.enum(editableRoles).optional()
});

const toNullable = (value: string | undefined) => {
    if (value === undefined) {
        return undefined;
    }
    return value === "" ? null : value;
};

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

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
                isApproved: true,
                salaryUsdt: true,
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
        const session = await getServerSession(authOptions);

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
                { error: "输入数据无效", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const updateData = parsed.data;

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                email: true,
                role: true,
                evmAddress: true,
                solanaAddress: true
            }
        });

        if (!currentUser) {
            return NextResponse.json(
                { error: "用户不存在" },
                { status: 404 }
            );
        }

        if (updateData.role && currentUser.role === "admin") {
            // 管理员通过控制台调整自身角色，走管理员通道更安全
            delete updateData.role;
        }

        if (updateData.role && !editableRoles.includes(updateData.role)) {
            return NextResponse.json(
                { error: "无法设置为该角色" },
                { status: 400 }
            );
        }

        if (updateData.email && updateData.email !== currentUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: updateData.email }
            });

            if (emailExists) {
                return NextResponse.json(
                    { error: "该邮箱已被其他用户使用" },
                    { status: 400 }
                );
            }
        }

        const roleChanged = updateData.role && updateData.role !== currentUser.role;
        const emailChanged = updateData.email && updateData.email !== currentUser.email;
        const evmChanged = updateData.evmAddress !== undefined && updateData.evmAddress !== currentUser.evmAddress;
        const solanaChanged = updateData.solanaAddress !== undefined && updateData.solanaAddress !== currentUser.solanaAddress;

        const sensitiveFieldsChanged = roleChanged || emailChanged || evmChanged || solanaChanged;

        const payload = {
            ...(updateData.username !== undefined && { username: updateData.username }),
            ...(updateData.email !== undefined && { email: updateData.email }),
            ...(updateData.tgAccount !== undefined && { tgAccount: toNullable(updateData.tgAccount) }),
            ...(updateData.whatsappAccount !== undefined && { whatsappAccount: toNullable(updateData.whatsappAccount) }),
            ...(updateData.evmAddress !== undefined && { evmAddress: toNullable(updateData.evmAddress) }),
            ...(updateData.solanaAddress !== undefined && { solanaAddress: toNullable(updateData.solanaAddress) }),
            ...(updateData.role !== undefined && { role: updateData.role })
        };

        if (sensitiveFieldsChanged) {
            Object.assign(payload, { status: "pending", isApproved: false });
        }

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: payload,
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
                isApproved: true,
                salaryUsdt: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return NextResponse.json({
            message: sensitiveFieldsChanged
                ? "资料已更新，变更信息需管理员审核后生效"
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
