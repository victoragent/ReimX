import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { sendNotification } from "@/lib/notifications";

const reviewSchema = z.object({
    action: z.enum(["approve", "reject"]),
    comment: z.string().optional()
});

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "未授权访问" },
                { status: 401 }
            );
        }

        // 检查管理员权限
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        });

        if (!currentUser || currentUser.role !== "admin") {
            return NextResponse.json(
                { error: "需要管理员权限" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const parsed = reviewSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "输入数据无效", details: parsed.error.errors },
                { status: 400 }
            );
        }

        const { action, comment } = parsed.data;

        // 检查报销是否存在且状态为待审核
        const reimbursement = await prisma.reimbursement.findUnique({
            where: { id: params.id },
            include: {
                applicant: {
                    select: {
                        username: true,
                        email: true,
                        tgAccount: true
                    }
                }
            }
        });

        if (!reimbursement) {
            return NextResponse.json(
                { error: "报销记录不存在" },
                { status: 404 }
            );
        }

        if (reimbursement.status !== "submitted") {
            return NextResponse.json(
                { error: "该报销记录不是待审核状态" },
                { status: 400 }
            );
        }

        // 更新报销状态
        const updatedReimbursement = await prisma.reimbursement.update({
            where: { id: params.id },
            data: {
                status: action === "approve" ? "approved" : "rejected",
                reviewerId: currentUser.id,
                approverId: action === "approve" ? currentUser.id : null,
                reviewComment: comment ?? null
            },
            include: {
                applicant: {
                    select: {
                        username: true,
                        email: true
                    }
                },
                reviewer: {
                    select: {
                        username: true
                    }
                }
            }
        });

        // 发送通知
        try {
            await sendNotification({
                type: action === "approve" ? 'reimbursement_approved' : 'reimbursement_rejected',
                user: {
                    name: reimbursement.applicant.username,
                    email: reimbursement.applicant.email,
                    tgAccount: reimbursement.applicant.tgAccount || undefined
                },
                reimbursement: {
                    id: reimbursement.id,
                    title: reimbursement.title,
                    amount: reimbursement.amountOriginal,
                    currency: reimbursement.currency,
                    chain: reimbursement.chain
                },
                comment: comment
            });
        } catch (error) {
            console.error('发送通知失败:', error);
            // 通知失败不影响主流程
        }

        return NextResponse.json({
            message: action === "approve" ? "报销已批准" : "报销已拒绝",
            reimbursement: updatedReimbursement
        });

    } catch (error) {
        console.error("审核报销错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}
