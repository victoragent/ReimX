import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const registerSchema = z.object({
    username: z.string().min(2, "用户名至少2个字符"),
    email: z.string().email("请输入有效的邮箱地址"),
    password: z.string().min(6, "密码至少6个字符"),
    tgAccount: z.string().optional(),
    whatsappAccount: z.string().optional(),
    evmAddress: z.string().optional(),
    solanaAddress: z.string().optional()
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "输入数据无效", details: parsed.error.errors },
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

        // 创建用户
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
                status: "active"
            }
        });

        // 返回用户信息（不包含密码）
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            message: "注册成功",
            user: userWithoutPassword
        }, { status: 201 });

    } catch (error) {
        console.error("注册错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}
