import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Schema for creating a ledger entry
const createLedgerSchema = z.object({
    type: z.string().default("other"),
    amountOriginal: z.number().or(z.string()).transform(v => Number(v)),
    amountUsdEquivalent: z.number().or(z.string()).transform(v => Number(v)).default(0),
    currency: z.string(),
    title: z.string().min(1, "标题不能为空"),
    description: z.string().optional(),
    transactionDate: z.string().optional(), // ISO string
    attachmentUrl: z.string().optional(),
    txHash: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "未授权访问" }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        });

        if (!currentUser) {
            return NextResponse.json({ error: "用户不存在" }, { status: 404 });
        }

        const payload = await request.json();
        const parsed = createLedgerSchema.safeParse(payload);

        if (!parsed.success) {
            return NextResponse.json({ error: "请求参数无效", issues: parsed.error.flatten() }, { status: 400 });
        }

        const { type, amountOriginal, amountUsdEquivalent, currency, title, description, transactionDate, attachmentUrl, txHash } = parsed.data;

        // Admin created -> APPROVED, User created -> PENDING
        const status = currentUser.role === "admin" ? "APPROVED" : "PENDING";

        const entry = await prisma.ledgerEntry.create({
            data: {
                userId: currentUser.id,
                type,
                amountOriginal,
                amountUsdEquivalent,
                currency,
                title,
                description,
                transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
                attachmentUrl,
                txHash,
                status,
                reviewedBy: currentUser.role === "admin" ? currentUser.id : null,
                reviewedAt: currentUser.role === "admin" ? new Date() : null,
            }
        });

        return NextResponse.json(entry, { status: 201 });
    } catch (error) {
        console.error("创建记账条目失败:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "未授权访问" }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        });

        if (!currentUser) {
            return NextResponse.json({ error: "用户不存在" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const userIdParam = searchParams.get("userId");
        const statusParam = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "20", 10);

        const where: any = {};

        // Permission Logic
        if (currentUser.role === "admin") {
            // Admin can filter by userId if provided
            if (userIdParam) {
                where.userId = userIdParam;
            }
        } else {
            // Regular user MUST see only their own entries
            where.userId = currentUser.id;
        }

        if (statusParam) {
            where.status = statusParam;
        }

        const [entries, total] = await Promise.all([
            prisma.ledgerEntry.findMany({
                where,
                orderBy: { transactionDate: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true
                        }
                    },
                    reviewer: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                }
            }),
            prisma.ledgerEntry.count({ where }),
        ]);

        return NextResponse.json({
            entries,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("获取记账列表失败:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
