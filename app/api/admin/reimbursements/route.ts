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

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search");
        const status = searchParams.get("status");
        const currency = searchParams.get("currency");
        const expenseType = searchParams.get("expenseType");
        const minUsdRaw = searchParams.get("minUsd");

        const skip = (page - 1) * limit;

        // 构建查询条件
        const where: any = {};

        if (search) {
            where.OR = [
                { description: { contains: search, mode: "insensitive" } },
                { applicant: { username: { contains: search, mode: "insensitive" } } },
                { applicant: { email: { contains: search, mode: "insensitive" } } }
            ];
        }

        if (status) {
            where.status = status;
        }

        if (currency) {
            where.currency = currency;
        }

        if (expenseType) {
            where.expenseType = expenseType;
        }

        if (minUsdRaw) {
            const minUsd = parseFloat(minUsdRaw);
            if (!Number.isNaN(minUsd)) {
                where.amountUsdEquivalent = { gte: minUsd };
            }
        }

        // 获取报销列表
        const [reimbursements, total] = await Promise.all([
            prisma.reimbursement.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    applicant: {
                        select: {
                            id: true,
                            username: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.reimbursement.count({ where })
        ]);

        // 转换数据格式以匹配前端期望
        // 注意：前端“金额”列应展示原币种金额（amountOriginal），
        // 金额（美元）单独使用 amountUsdEquivalent。
        const formattedReimbursements = reimbursements.map(reimbursement => ({
            ...reimbursement,
            // 显式保留原金额字段，避免混淆
            amount: reimbursement.amountOriginal,
            submittedAt: reimbursement.createdAt
        }));

        const pages = Math.ceil(total / limit);

        return NextResponse.json({
            reimbursements: formattedReimbursements,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        });

    } catch (error) {
        console.error("获取报销列表错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}
