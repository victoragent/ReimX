import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    newPassword: z.string().min(6, "新密码长度至少为6位"),
    confirmPassword: z.string().min(1, "请确认新密码"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "新密码和确认密码不匹配",
    path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        console.log("Session in change password:", session);

        if (!session?.user?.id) {
            console.log("No session or user ID found");
            return NextResponse.json(
                { error: "请先登录" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { currentPassword, newPassword } = changePasswordSchema.parse(body);

        // 获取用户信息
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, password: true },
        });

        if (!user) {
            return NextResponse.json(
                { error: "用户不存在" },
                { status: 404 }
            );
        }

        // 验证当前密码
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password || "");
        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { error: "当前密码错误" },
                { status: 400 }
            );
        }

        // 加密新密码
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // 更新密码
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword },
        });

        console.log(`Password changed for user: ${session.user.email}`);

        return NextResponse.json({
            message: "密码修改成功",
        });
    } catch (error) {
        console.error("Change password error:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "服务器错误，请稍后重试" },
            { status: 500 }
        );
    }
}
