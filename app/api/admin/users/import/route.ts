import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { read, utils } from "xlsx";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedRoles = new Set(["user", "reviewer", "admin"]);
const allowedStatuses = new Set(["pending", "active", "suspended"]);

function normalizeKey(key: string) {
  return key.trim().toLowerCase();
}

function normalizeValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return String(value).trim();
}

function randomPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "未授权访问" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  });

  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传包含用户数据的 Excel 文件" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(arrayBuffer, { type: "array" });

    if (!workbook.SheetNames.length) {
      return NextResponse.json({ error: "Excel 文件中没有数据工作表" }, { status: 400 });
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

    if (!rows.length) {
      return NextResponse.json({ error: "Excel 文件没有可导入的记录" }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let index = 0; index < rows.length; index++) {
      const rowNumber = index + 2; // considering header row
      const row = rows[index];
      const normalized = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [normalizeKey(key), normalizeValue(value)])
      ) as Record<string, string>;

      const username = normalized.username;
      const email = normalized.email;
      let password = normalized.password;
      const role = normalized.role?.toLowerCase() || "user";
      const status = normalized.status?.toLowerCase() || "pending";

      if (!username || !email) {
        skipped += 1;
        errors.push({ row: rowNumber, message: "缺少用户名或邮箱" });
        continue;
      }

      if (!allowedRoles.has(role)) {
        skipped += 1;
        errors.push({ row: rowNumber, message: `角色 ${role} 不被支持` });
        continue;
      }

      if (!allowedStatuses.has(status)) {
        skipped += 1;
        errors.push({ row: rowNumber, message: `状态 ${status} 不被支持` });
        continue;
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        skipped += 1;
        continue;
      }

      if (!password) {
        password = randomPassword();
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      try {
        await prisma.user.create({
          data: {
            username,
            email,
            password: hashedPassword,
            role,
            status,
            tgAccount: normalized["tg"] || normalized["tgaccount"] || undefined,
            whatsappAccount: normalized["whatsapp"] || normalized["whatsappaccount"] || undefined,
            evmAddress: normalized["evm"] || normalized["evmaddress"] || undefined,
            solanaAddress: normalized["solana"] || normalized["solanaaddress"] || undefined,
            salaryUsdt: normalized["salaryusdt"] ? Number.parseFloat(normalized["salaryusdt"]) || 0 : 0,
            isApproved: status === "active"
          }
        });
        created += 1;
      } catch (error) {
        console.error("导入用户写入失败:", error);
        skipped += 1;
        errors.push({ row: rowNumber, message: "写入数据库失败" });
      }
    }

    return NextResponse.json({
      created,
      skipped,
      errors
    });
  } catch (error) {
    console.error("导入用户失败:", error);
    return NextResponse.json({ error: "导入失败，请检查文件后重试" }, { status: 500 });
  }
}
