import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const isAdmin = (role?: string) => role === 'admin' || role === 'superadmin';

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { type, amount, date, note } = (await req.json()) as any;

        if (!type || amount === undefined) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // Fetch Asset
        const asset = await prisma.asset.findUnique({
            where: { id: params.id },
        });

        if (!asset) {
            return new NextResponse('Asset not found', { status: 404 });
        }

        // Permission Check
        if (asset.userId !== session.user.id && !isAdmin(session.user.role)) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Calculate Values
        const currentVal = new Decimal(asset.currentValue);
        const inputAmount = new Decimal(amount);

        let amountChange = new Decimal(0);
        let valueAfter = new Decimal(0);

        if (type === 'REVALUATION') {
            valueAfter = inputAmount;
            amountChange = valueAfter.minus(currentVal);
        } else {
            // ADDITION, CONSUMPTION, etc. treated as delta
            // Note: For CONSUMPTION, frontend should send negative value if it decreases asset
            // Or we could enforce it here, but flexible is better.
            amountChange = inputAmount;
            valueAfter = currentVal.plus(amountChange);
        }

        // Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create Record
            const record = await tx.assetRecord.create({
                data: {
                    assetId: params.id,
                    userId: session.user.id,
                    type,
                    amountChange,
                    valueAfter,
                    date: new Date(date || new Date()),
                    note,
                },
            });

            // Update Asset
            const updatedAsset = await tx.asset.update({
                where: { id: params.id },
                data: {
                    currentValue: valueAfter,
                    // Optional: Auto-update status if depleted?
                    // status: valueAfter.lte(0) && type === 'CONSUMPTION' ? 'DEPLETED' : undefined
                },
            });

            return { record, updatedAsset };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[ASSET_RECORD_POST]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const asset = await prisma.asset.findUnique({
            where: { id: params.id },
        });

        if (!asset) {
            return new NextResponse('Asset not found', { status: 404 });
        }

        if (asset.userId !== session.user.id && !isAdmin(session.user.role)) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const records = await prisma.assetRecord.findMany({
            where: { assetId: params.id },
            orderBy: { date: 'desc' },
            include: {
                user: { select: { username: true } }
            }
        });

        return NextResponse.json(records);
    } catch (error) {
        console.error('[ASSET_RECORDS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
