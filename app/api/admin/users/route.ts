import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
const roleEnum = ["user", "reviewer", "admin"] as const;
const statusEnum = ["active", "suspended", "pending"] as const;

const userCreateSchema = z.object({
    username: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(roleEnum).default("user"),
    status: z.enum(statusEnum).optional(),
    isApproved: z.boolean().optional(),
    tgAccount: z.string().optional(),
    whatsappAccount: z.string().optional(),
    evmAddress: z.string().optional(),
    solanaAddress: z.string().optional(),
    salaryUsdt: z.number().nonnegative().optional()
});

const userUpdateSchema = z.object({
    id: z.string(),
    username: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(roleEnum).optional(),
    status: z.enum(statusEnum).optional(),
    isApproved: z.boolean().optional(),
    tgAccount: z.string().optional(),
    whatsappAccount: z.string().optional(),
    evmAddress: z.string().optional(),
    solanaAddress: z.string().optional(),
    salaryUsdt: z.number().nonnegative().optional()
});

const sanitizeString = (value: string | undefined) => {
    if (value === undefined) return undefined;
    return value === "" ? null : value;
};

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email || session.user.role !== "admin") {
            return NextResponse.json(
                { error: "需要管理员权限" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const parsed = userCreateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "输入数据无效", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const {
            username,
            email,
            password,
            role,
            status,
            isApproved,
            tgAccount,
            whatsappAccount,
            evmAddress,
            solanaAddress,
            salaryUsdt
        } = parsed.data;

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

        const adminUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        const shouldApprove = isApproved ?? status === "active";

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role,
                status: status ?? (shouldApprove ? "active" : "pending"),
                isApproved: shouldApprove,
                tgAccount,
                whatsappAccount,
                evmAddress,
                solanaAddress,
                salaryUsdt,
                ...(shouldApprove && adminUser
                    ? {
                        approvedBy: adminUser.id,
                        approvedAt: new Date()
                    }
                    : {})
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                status: true,
                isApproved: true,
                tgAccount: true,
                whatsappAccount: true,
                evmAddress: true,
                solanaAddress: true,
                salaryUsdt: true,
                createdAt: true
            }
        });

        return NextResponse.json({
            message: "用户创建成功",
            user: newUser
        }, { status: 201 });
    } catch (error) {
        console.error("创建用户错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email || session.user.role !== "admin") {
            return NextResponse.json(
                { error: "需要管理员权限" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || "";
        const status = searchParams.get("status") || "";

        const where: any = {};

        if (search) {
            where.OR = [
                { username: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } }
            ];
        }

        if (role) {
            where.role = role;
        }

        if (status) {
            where.status = status;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    tgAccount: true,
                    whatsappAccount: true,
                    evmAddress: true,
                    solanaAddress: true,
                    chainAddresses: true,
                    role: true,
                    status: true,
                    isApproved: true,
                    salaryUsdt: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            reimbursements: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.user.count({ where })
        ]);

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("获取用户列表错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email || session.user.role !== "admin") {
            return NextResponse.json(
                { error: "需要管理员权限" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const parsed = userUpdateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "输入数据无效", details: parsed.error.errors },
                { status: 400 }
            );
        }

        const { id, ...updateData } = parsed.data;

        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: "用户不存在" },
                { status: 404 }
            );
        }

        if (updateData.email && updateData.email !== existingUser.email) {
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

        const adminUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        const payload: Record<string, unknown> = {
            ...(updateData.username !== undefined && { username: updateData.username }),
            ...(updateData.email !== undefined && { email: updateData.email }),
            ...(updateData.role !== undefined && { role: updateData.role }),
            ...(updateData.status !== undefined && { status: updateData.status }),
            ...(updateData.salaryUsdt !== undefined && { salaryUsdt: updateData.salaryUsdt }),
            ...(updateData.tgAccount !== undefined && { tgAccount: sanitizeString(updateData.tgAccount) }),
            ...(updateData.whatsappAccount !== undefined && { whatsappAccount: sanitizeString(updateData.whatsappAccount) }),
            ...(updateData.evmAddress !== undefined && { evmAddress: sanitizeString(updateData.evmAddress) }),
            ...(updateData.solanaAddress !== undefined && { solanaAddress: sanitizeString(updateData.solanaAddress) })
        };

        if (updateData.isApproved !== undefined) {
            payload.isApproved = updateData.isApproved;
            if (updateData.isApproved) {
                payload.status = updateData.status ?? "active";
                payload.approvedBy = adminUser?.id ?? null;
                payload.approvedAt = new Date();
            } else {
                payload.approvedBy = null;
                payload.approvedAt = null;
                payload.status = updateData.status ?? "pending";
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id },
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
                approvedBy: true,
                approvedAt: true,
                salaryUsdt: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return NextResponse.json({
            message: "用户信息更新成功",
            user: updatedUser
        });

    } catch (error) {
        console.error("更新用户信息错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email || session.user.role !== "admin") {
            return NextResponse.json(
                { error: "需要管理员权限" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("id");

        if (!userId) {
            return NextResponse.json(
                { error: "缺少用户ID" },
                { status: 400 }
            );
        }

        // 检查用户是否存在
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return NextResponse.json(
                { error: "用户不存在" },
                { status: 404 }
            );
        }

        // 软删除：将状态改为 suspended
        await prisma.user.update({
            where: { id: userId },
            data: { status: "suspended", isApproved: false }
        });

        return NextResponse.json({
            message: "用户已禁用"
        });

    } catch (error) {
        console.error("删除用户错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}
