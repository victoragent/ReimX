import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const registerSchema = z.object({
    username: z.string().min(1, "用户名不能为空"),
    email: z.string().email("邮箱格式不正确"),
    password: z.string().min(6, "密码至少6位"),
    tgAccount: z.string().optional(),
    whatsappAccount: z.string().optional(),
    evmAddress: z.string().optional(),
    solanaAddress: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "输入数据无效", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { username, email, password, tgAccount, whatsappAccount, evmAddress, solanaAddress } = parsed.data;

        // 检查邮箱是否已存在
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "该邮箱已被注册" },
                { status: 400 }
            );
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 12);

        // 创建用户（待审核状态）
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                tgAccount,
                whatsappAccount,
                evmAddress,
                solanaAddress,
                role: "user",
                status: "pending", // 待审核状态
                isApproved: false, // 未审核
            }
        });

        // 发送通知给管理员（这里可以集成邮件或Telegram通知）
        console.log(`新用户注册等待审核: ${username} (${email})`);

        return NextResponse.json({
            message: "注册成功，请等待管理员审核通过后即可登录",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                status: user.status
            }
        }, { status: 201 });

    } catch (error) {
        console.error("用户注册错误:", error);
        return NextResponse.json(
            { error: "注册失败，请重试" },
            { status: 500 }
        );
    }
}
