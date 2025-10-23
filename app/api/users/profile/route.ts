import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
const editableRoles = ["user", "reviewer"] as const;

const chainAddressInputSchema = z.array(
    z.object({
        chain: z.string().min(1, "请选择链"),
        address: z.string().min(1, "请输入有效的地址")
    }).transform((value) => ({
        chain: value.chain.trim().toLowerCase(),
        address: value.address.trim()
    }))
).optional();

const profileUpdateSchema = z.object({
    username: z.string().min(2, "用户名至少2个字符").optional(),
    email: z.string().email("请输入有效的邮箱地址").optional(),
    tgAccount: z.string().optional(),
    whatsappAccount: z.string().optional(),
    evmAddress: z.string().optional(),
    solanaAddress: z.string().optional(),
    chainAddresses: chainAddressInputSchema,
    role: z.string().optional()
});

const toNullable = (value: string | undefined) => {
    if (value === undefined) {
        return undefined;
    }
    return value === "" ? null : value;
};

const normalizeChainAddresses = (
    entries?: Array<{ chain: string; address: string }>
): Record<string, string> | null | undefined => {
    if (entries === undefined) {
        return undefined;
    }

    const result: Record<string, string> = {};

    for (const { chain, address } of entries) {
        if (!chain || !address) {
            continue;
        }

        if (result[chain]) {
            throw new Error(`链 ${chain} 已存在地址，请勿重复添加`);
        }

        result[chain] = address;
    }

    return Object.keys(result).length > 0 ? result : null;
};

const parseChainAddresses = (value: unknown): Record<string, string> | null => {
    if (!value) {
        return null;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
            return null;
        }
        try {
            return parseChainAddresses(JSON.parse(trimmed));
        } catch {
            return null;
        }
    }

    if (Array.isArray(value)) {
        const entries = value
            .map((entry) => {
                if (!entry || typeof entry !== "object") return null;
                const chain = "chain" in entry ? (entry as { chain?: unknown }).chain : undefined;
                const address = "address" in entry ? (entry as { address?: unknown }).address : undefined;
                if (typeof chain === "string" && typeof address === "string") {
                    const normalizedChain = chain.trim().toLowerCase();
                    const trimmedAddress = address.trim();
                    if (normalizedChain && trimmedAddress) {
                        return [normalizedChain, trimmedAddress] as const;
                    }
                }
                return null;
            })
            .filter((entry): entry is readonly [string, string] => entry !== null);

        if (entries.length === 0) {
            return null;
        }

        return Object.fromEntries(entries);
    }

    if (typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>)
            .map(([chain, address]) => {
                if (typeof address !== "string") {
                    return null;
                }
                const normalizedChain = chain.trim().toLowerCase();
                const trimmedAddress = address.trim();
                if (!normalizedChain || !trimmedAddress) {
                    return null;
                }
                return [normalizedChain, trimmedAddress] as const;
            })
            .filter((entry): entry is readonly [string, string] => entry !== null);

        if (entries.length === 0) {
            return null;
        }

        return Object.fromEntries(entries);
    }

    return null;
};

const serializeChainAddresses = (
    value: Record<string, string> | null | undefined
): string | null | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (Object.keys(value).length === 0) {
        return null;
    }

    return JSON.stringify(value);
};

const areChainAddressesEqual = (
    nextValue: Record<string, string> | null | undefined,
    currentValue: Record<string, string> | null | undefined
) => {
    const serialize = (value: Record<string, string> | null | undefined) =>
        JSON.stringify(value ?? null);
    return serialize(nextValue) === serialize(currentValue);
};

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "未授权访问" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
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
                updatedAt: true
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "用户不存在" },
                { status: 404 }
            );
        }

        const responseUser = {
            ...user,
            chainAddresses: parseChainAddresses(user.chainAddresses)
        };

        return NextResponse.json({ user: responseUser });

    } catch (error) {
        console.error("获取用户资料错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "未授权访问" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const parsed = profileUpdateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: "输入数据无效", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { role: rawRole, ...updateData } = parsed.data;
        const requestedRoleRaw = typeof rawRole === "string" ? rawRole.trim() : undefined;
        const requestedRole = requestedRoleRaw && requestedRoleRaw.length > 0 ? requestedRoleRaw : undefined;

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                email: true,
                role: true,
                evmAddress: true,
                solanaAddress: true,
                chainAddresses: true
            }
        });

        if (!currentUser) {
            return NextResponse.json(
                { error: "用户不存在" },
                { status: 404 }
            );
        }

        const currentChainAddresses = parseChainAddresses(currentUser.chainAddresses);

        if (requestedRole && !editableRoles.includes(requestedRole as (typeof editableRoles)[number])) {
            return NextResponse.json(
                { error: "无法设置为该角色" },
                { status: 400 }
            );
        }

        const roleForUpdate =
            requestedRole && currentUser.role !== "admin" ? requestedRole : undefined;

        if (updateData.email && updateData.email !== currentUser.email) {
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

        let chainAddressPayload: Record<string, string> | null | undefined;
        try {
            chainAddressPayload = normalizeChainAddresses(updateData.chainAddresses);
        } catch (error) {
            const message = error instanceof Error ? error.message : "链上地址重复";
            return NextResponse.json(
                { error: message },
                { status: 400 }
            );
        }

        const roleChanged = roleForUpdate !== undefined && roleForUpdate !== currentUser.role;
        const emailChanged = updateData.email && updateData.email !== currentUser.email;
        const evmChanged = updateData.evmAddress !== undefined && updateData.evmAddress !== currentUser.evmAddress;
        const solanaChanged = updateData.solanaAddress !== undefined && updateData.solanaAddress !== currentUser.solanaAddress;
        const chainAddressesChanged =
            chainAddressPayload !== undefined &&
            !areChainAddressesEqual(chainAddressPayload, currentChainAddresses);

        const sensitiveFieldsChanged = roleChanged || emailChanged || evmChanged || solanaChanged || chainAddressesChanged;

        const payload: Record<string, unknown> = {
            ...(updateData.username !== undefined && { username: updateData.username }),
            ...(updateData.email !== undefined && { email: updateData.email }),
            ...(updateData.tgAccount !== undefined && { tgAccount: toNullable(updateData.tgAccount) }),
            ...(updateData.whatsappAccount !== undefined && { whatsappAccount: toNullable(updateData.whatsappAccount) }),
            ...(updateData.evmAddress !== undefined && { evmAddress: toNullable(updateData.evmAddress) }),
            ...(updateData.solanaAddress !== undefined && { solanaAddress: toNullable(updateData.solanaAddress) }),
            ...(roleForUpdate !== undefined && { role: roleForUpdate })
        };

        const serializedChainAddresses = serializeChainAddresses(chainAddressPayload);
        if (serializedChainAddresses !== undefined) {
            payload.chainAddresses = serializedChainAddresses;
        }

        if (sensitiveFieldsChanged) {
            Object.assign(payload, { status: "pending", isApproved: false });
        }

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: payload,
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
                updatedAt: true
            }
        });

        const responseUser = {
            ...updatedUser,
            chainAddresses: parseChainAddresses(updatedUser.chainAddresses)
        };

        return NextResponse.json({
            message: sensitiveFieldsChanged
                ? "资料已更新，变更信息需管理员审核后生效"
                : "资料更新成功",
            user: responseUser
        });

    } catch (error) {
        console.error("更新用户资料错误:", error);
        return NextResponse.json(
            { error: "服务器内部错误" },
            { status: 500 }
        );
    }
}
