import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "未授权访问" },
                { status: 401 }
            );
        }

        // 获取当前用户信息
        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                salaryUsdt: true
            }
        });

        if (!currentUser) {
            return NextResponse.json(
                { error: "用户不存在" },
                { status: 404 }
            );
        }

        // 获取用户的报销统计
        const [
            totalReimbursements,
            pendingReimbursements,
            approvedReimbursements,
            totalAmount,
            pendingAmount
        ] = await Promise.all([
            prisma.reimbursement.count({
                where: { applicantId: currentUser.id }
            }),
            prisma.reimbursement.count({
                where: {
                    applicantId: currentUser.id,
                    status: "submitted"
                }
            }),
            prisma.reimbursement.count({
                where: {
                    applicantId: currentUser.id,
                    status: "approved"
                }
            }),
            prisma.reimbursement.aggregate({
                where: { applicantId: currentUser.id },
                _sum: { amountUsdEquivalent: true }
            }),
            prisma.reimbursement.aggregate({
                where: {
                    applicantId: currentUser.id,
                    status: "submitted"
                },
                _sum: { amountUsdEquivalent: true }
            })
        ]);

        return NextResponse.json({
            totalReimbursements,
            pendingReimbursements,
            approvedReimbursements,
            totalAmount: totalAmount._sum.amountUsdEquivalent || 0,
            pendingAmount: pendingAmount._sum.amountUsdEquivalent || 0,
            salaryUsdt: currentUser.salaryUsdt || 0
        });

    } catch (error) {
        console.error("获取用户统计失败:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}
