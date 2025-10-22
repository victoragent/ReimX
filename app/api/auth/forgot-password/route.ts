import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomBytes } from "crypto";
import { sendEmailNotification } from "@/lib/notifications";

const forgotPasswordSchema = z.object({
    email: z.string().email("请输入有效的邮箱地址"),
});

// 生成安全的随机令牌
function generateResetToken(): string {
    return randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = forgotPasswordSchema.parse(body);

        // 查找用户
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // 出于安全考虑，即使邮箱不存在也返回成功消息
            return NextResponse.json({
                message: "如果该邮箱已注册，密码重置链接将发送到您的邮箱",
            });
        }

        // 检查用户状态
        if (user.status === "suspended") {
            return NextResponse.json(
                { error: "账户已被暂停，请联系管理员" },
                { status: 400 }
            );
        }

        // 生成重置令牌
        const resetToken = generateResetToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

        // 删除用户之前的重置令牌
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id }
        });

        // 创建新的重置令牌
        await prisma.passwordResetToken.create({
            data: {
                token: resetToken,
                userId: user.id,
                expiresAt,
            },
        });

        // 发送密码重置邮件
        const emailSent = await sendEmailNotification({
            type: 'password_reset',
            user: {
                name: user.username,
                email: user.email,
            },
            reimbursement: {
                id: '',
                title: '',
                amount: 0,
                currency: '',
                chain: '',
            },
            resetToken,
        });

        if (!emailSent) {
            console.error(`Failed to send password reset email to ${email}`);
            // 即使邮件发送失败，也返回成功消息以保护用户隐私
        }

        console.log(`Password reset requested for user: ${email}, token: ${resetToken}`);

        return NextResponse.json({
            message: "如果该邮箱已注册，密码重置链接将发送到您的邮箱",
        });
    } catch (error) {
        console.error("Forgot password error:", error);

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

