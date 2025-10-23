import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
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
            select: { role: true }
        });

        if (!currentUser || currentUser.role !== "admin") {
            return NextResponse.json(
                { error: "需要管理员权限" },
                { status: 403 }
            );
        }

        // 获取统计数据
        const [
            totalUsers,
            activeUsers,
            pendingUsers,
            suspendedUsers,
            totalReimbursements,
            pendingReimbursements,
            approvedReimbursements,
            rejectedReimbursements,
            totalAmount,
            monthlyStats,
            userGrowth,
            reimbursementTrends
        ] = await Promise.all([
            // 用户统计
            prisma.user.count(),
            prisma.user.count({ where: { status: "active" } }),
            prisma.user.count({ where: { status: "pending" } }),
            prisma.user.count({ where: { status: "suspended" } }),

            // 报销统计
            prisma.reimbursement.count(),
            prisma.reimbursement.count({ where: { status: "submitted" } }),
            prisma.reimbursement.count({ where: { status: "approved" } }),
            prisma.reimbursement.count({ where: { status: "rejected" } }),

            // 总金额
            prisma.reimbursement.aggregate({
                where: { status: "approved" },
                _sum: { amountUsdEquivalent: true }
            }),

            // 月度统计
            prisma.reimbursement.groupBy({
                by: ['status'],
                _count: { id: true },
                _sum: { amountUsdEquivalent: true },
                where: {
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            }),

            // 用户增长趋势（最近6个月）
            prisma.user.groupBy({
                by: ['createdAt'],
                _count: { id: true },
                where: {
                    createdAt: {
                        gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
                    }
                },
                orderBy: { createdAt: 'asc' }
            }),

            // 报销趋势（最近6个月）
            prisma.reimbursement.groupBy({
                by: ['createdAt', 'status'],
                _count: { id: true },
                _sum: { amountUsdEquivalent: true },
                where: {
                    createdAt: {
                        gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
                    }
                },
                orderBy: { createdAt: 'asc' }
            })
        ]);

        // 获取最近活动
        const recentUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                status: true,
                createdAt: true
            }
        });

        const recentReimbursements = await prisma.reimbursement.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                amountOriginal: true,
                amountUsdEquivalent: true,
                currency: true,
                status: true,
                createdAt: true,
                applicant: {
                    select: {
                        username: true,
                        email: true
                    }
                }
            }
        });

        // 转换数据格式以匹配前端期望
        const formattedRecentReimbursements = recentReimbursements.map(reimbursement => ({
            ...reimbursement,
            amount: reimbursement.amountOriginal
        }));

        // 计算审核效率 - 简化处理，返回固定值
        const avgReviewTime = { _avg: { updatedAt: null } };

        const stats = {
            users: {
                total: totalUsers,
                active: activeUsers,
                pending: pendingUsers,
                suspended: suspendedUsers,
                growth: userGrowth.length
            },
            reimbursements: {
                total: totalReimbursements,
                pending: pendingReimbursements,
                approved: approvedReimbursements,
                rejected: rejectedReimbursements,
                totalAmount: totalAmount._sum.amountUsdEquivalent || 0
            },
            efficiency: {
                approvalRate: totalReimbursements > 0 ? (approvedReimbursements / totalReimbursements * 100).toFixed(1) : 0,
                avgReviewTime: avgReviewTime._avg.updatedAt ?
                    Math.round((Date.now() - new Date(avgReviewTime._avg.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
            },
            trends: {
                monthly: monthlyStats,
                userGrowth: userGrowth,
                reimbursementTrends: reimbursementTrends
            },
            recent: {
                users: recentUsers,
                reimbursements: formattedRecentReimbursements
            }
        };

        return NextResponse.json({ stats });

    } catch (error) {
        console.error("获取统计数据错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}
