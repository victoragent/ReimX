import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
    token: z.string().min(1, "重置令牌无效"),
    newPassword: z.string().min(6, "新密码长度至少为6位"),
    confirmPassword: z.string().min(1, "请确认新密码"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "新密码和确认密码不匹配",
    path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, newPassword } = resetPasswordSchema.parse(body);

        // 查找有效的重置令牌
        const resetToken = await prisma.passwordResetToken.findFirst({
            where: {
                token,
                expiresAt: {
                    gt: new Date(), // 令牌未过期
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        status: true,
                    },
                },
            },
        });

        if (!resetToken) {
            return NextResponse.json(
                { error: "重置链接无效或已过期，请重新申请密码重置" },
                { status: 400 }
            );
        }

        // 检查用户状态
        if (resetToken.user.status === "suspended") {
            return NextResponse.json(
                { error: "账户已被暂停，请联系管理员" },
                { status: 400 }
            );
        }

        // 加密新密码
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // 更新用户密码
        await prisma.user.update({
            where: { id: resetToken.user.id },
            data: { password: hashedNewPassword },
        });

        // 删除已使用的重置令牌
        await prisma.passwordResetToken.delete({
            where: { id: resetToken.id },
        });

        // 删除用户的所有其他重置令牌（防止重放攻击）
        await prisma.passwordResetToken.deleteMany({
            where: { userId: resetToken.user.id },
        });

        console.log(`Password reset successfully for user: ${resetToken.user.email}`);

        return NextResponse.json({
            message: "密码重置成功，请使用新密码登录",
        });
    } catch (error) {
        console.error("Reset password error:", error);

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
