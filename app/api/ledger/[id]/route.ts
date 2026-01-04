import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const updateLedgerSchema = z.object({
    type: z.string().optional(),
    amountOriginal: z.number().or(z.string()).transform(v => Number(v)).optional(),
    amountUsdEquivalent: z.number().or(z.string()).transform(v => Number(v)).optional(),
    currency: z.string().optional(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    transactionDate: z.string().optional(),
    attachmentUrl: z.string().optional(),
    txHash: z.string().optional(),
});

// GET /api/ledger/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const { id } = params;

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        });

        if (!currentUser) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

        const entry = await prisma.ledgerEntry.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, username: true, email: true } },
                reviewer: { select: { id: true, username: true } }
            }
        });

        if (!entry) return NextResponse.json({ error: "记录不存在" }, { status: 404 });

        // Permission Check
        if (currentUser.role !== "admin" && entry.userId !== currentUser.id) {
            return NextResponse.json({ error: "无权访问此记录" }, { status: 403 });
        }

        return NextResponse.json(entry);
    } catch (error) {
        console.error("获取记录详情失败:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}

// PATCH /api/ledger/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "未授权" }, { status: 401 });
        }

        const { id } = params;
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        });

        if (!currentUser) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

        const entry = await prisma.ledgerEntry.findUnique({ where: { id } });

        if (!entry) return NextResponse.json({ error: "记录不存在" }, { status: 404 });

        // Permission Check: Access
        // Only Owner or Admin can edit
        if (currentUser.role !== "admin" && entry.userId !== currentUser.id) {
            return NextResponse.json({ error: "无权修改此记录" }, { status: 403 });
        }

        // Permission Check: Status
        // Regular users can only edit if PENDING
        if (currentUser.role !== "admin" && entry.status !== "PENDING") {
            return NextResponse.json({ error: "只能修改待审核的记录" }, { status: 400 });
        }

        const payload = await request.json();
        const parsed = updateLedgerSchema.safeParse(payload);

        if (!parsed.success) {
            return NextResponse.json({ error: "参数无效", issues: parsed.error.flatten() }, { status: 400 });
        }

        const updateData: any = parsed.data;
        if (updateData.transactionDate) {
            updateData.transactionDate = new Date(updateData.transactionDate);
        }

        // Update
        const updatedEntry = await prisma.ledgerEntry.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedEntry);

    } catch (error) {
        console.error("更新记录失败:", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
}
