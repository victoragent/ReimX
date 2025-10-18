import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 获取当前用户信息
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // 查找报销记录
    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id: params.id },
      include: {
        applicant: {
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
        },
        approver: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    if (!reimbursement) {
      return NextResponse.json({ error: "报销记录不存在" }, { status: 404 });
    }

    // 权限检查：普通用户只能查看自己的报销记录
    if (currentUser.role === "user" && reimbursement.applicantId !== currentUser.id) {
      return NextResponse.json({ error: "无权访问此报销记录" }, { status: 403 });
    }

    return NextResponse.json({ reimbursement });

  } catch (error) {
    console.error("获取报销详情错误:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
