import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
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
                { error: "输入数据无效", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { username, email, password, tgAccount, whatsappAccount, evmAddress, solanaAddress } = parsed.data;

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "该邮箱已被注册" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

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
                status: "pending",
                isApproved: false
            },
            select: {
                id: true,
                username: true,
                email: true,
                status: true,
                isApproved: true,
                createdAt: true
            }
        });

        return NextResponse.json({
            message: "注册成功，请等待管理员审核后再登录",
            user
        }, { status: 201 });

    } catch (error: any) {
        console.error("注册错误:", error);
        return NextResponse.json(
            { error: `注册失败: ${error.message || error}` },
            { status: 500 }
        );
    }
}
