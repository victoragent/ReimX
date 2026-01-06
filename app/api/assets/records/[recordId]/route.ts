import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const isAdmin = (role?: string) => role === 'admin' || role === 'superadmin';

// Helper to recalculate asset history
async function recalculateAssetHistory(tx: any, assetId: string) {
    const asset = await tx.asset.findUnique({ where: { id: assetId } });

    // Get all records in chronological order
    const records = await tx.assetRecord.findMany({
        where: { assetId },
        orderBy: [
            { date: 'asc' },
            { createdAt: 'asc' } // tie-breaker
        ]
    });

    let currentVal = new Decimal(asset.initialValue);

    for (const record of records) {
        let newAmountChange = new Decimal(record.amountChange);
        let newValueAfter = new Decimal(record.valueAfter);

        if (record.type === 'INITIAL') {
            // Reset to initial (usually this is the first record)
            // If multiple INITIALs exist (weird), assume they reset to asset.initialValue?
            // Let's assume INITIAL allows resetting anchor.
            currentVal = new Decimal(asset.initialValue);
            newAmountChange = new Decimal(0);
            newValueAfter = currentVal;
        } else if (record.type === 'REVALUATION') {
            // Target value is trusted. Recompute delta.
            // We assume 'valueAfter' stores the User's target value for Revaluation.
            // Note: If user edits Revaluation AMOUNT, they update valueAfter.
            newValueAfter = new Decimal(record.valueAfter);
            newAmountChange = newValueAfter.minus(currentVal);
            currentVal = newValueAfter;
        } else {
            // CONSUMPTION / ADDITION: Delta is trusted. Recompute total.
            newAmountChange = new Decimal(record.amountChange);
            currentVal = currentVal.plus(newAmountChange);
            newValueAfter = currentVal;
        }

        // Update record if changed
        // Optimization: only update if diff
        if (!newAmountChange.equals(record.amountChange) || !newValueAfter.equals(record.valueAfter)) {
            await tx.assetRecord.update({
                where: { id: record.id },
                data: {
                    amountChange: newAmountChange,
                    valueAfter: newValueAfter,
                }
            });
        }
    }

    // Update Asset Final Value
    await tx.asset.update({
        where: { id: assetId },
        data: { currentValue: currentVal }
    });
}

export async function PATCH(
    req: Request,
    { params }: { params: { recordId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { amount, date, note } = (await req.json()) as any;

        // 1. Fetch Record & Asset
        const record = await prisma.assetRecord.findUnique({
            where: { id: params.recordId },
            include: { asset: true },
        });

        if (!record) {
            return new NextResponse('Record not found', { status: 404 });
        }

        // 2. Permission
        if (record.userId !== session.user.id && !isAdmin(session.user.role)) {
            // Note: Admin can edit ANY record. Owner can edit OWN record.
            // Design said: Owner can edit own.
            return new NextResponse('Forbidden', { status: 403 });
        }

        // 3. Prepare Updates
        const data: any = {};
        if (date) data.date = new Date(date);
        if (note !== undefined) data.note = note;

        // Handling Amount Change
        // If amount is changing, we need to know what it means.
        // REVALUATION: Amount = New Target Value (valueAfter)
        // OTHERS: Amount = Delta (amountChange)
        if (amount !== undefined) {
            if (record.type === 'REVALUATION') {
                data.valueAfter = new Decimal(amount);
            } else {
                data.amountChange = new Decimal(amount);
            }
        }

        // 4. Update & Replay
        await prisma.$transaction(async (tx) => {
            // Update the target record first
            await tx.assetRecord.update({
                where: { id: params.recordId },
                data,
            });

            // Recalculate everything for this asset
            await recalculateAssetHistory(tx, record.assetId);
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[ASSET_RECORD_PATCH]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { recordId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const record = await prisma.assetRecord.findUnique({
            where: { id: params.recordId },
            include: { asset: true },
        });

        if (!record) return new NextResponse('Not found', { status: 404 });

        if (record.userId !== session.user.id && !isAdmin(session.user.role)) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Transaction
        await prisma.$transaction(async (tx) => {
            await tx.assetRecord.delete({
                where: { id: params.recordId }
            });
            await recalculateAssetHistory(tx, record.assetId);
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[ASSET_RECORD_DELETE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
