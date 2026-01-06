import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper to determine if user is admin
const isAdmin = (role?: string) => role === 'admin' || role === 'superadmin';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = (await req.json()) as any;
        console.log('[ASSETS_POST] Body:', body);
        const {
            name,
            description,
            type,
            initialValue,
            currency,
            quantity,
            unit,
            purchaseDate,
            userId // Admin might allow creating for others
        } = body;

        if (!name || !type || initialValue === undefined || !currency || !purchaseDate) {
            console.log('[ASSETS_POST] Validation failed:', { name, type, initialValue, currency, purchaseDate });
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // Determine target User ID
        let targetUserId = session.user.id;
        if (userId && isAdmin(session.user.role)) {
            targetUserId = userId;
        }

        // Transaction: Create Asset AND Initial Record
        console.log('[ASSETS_POST] Creating asset with data:', {
            userId: targetUserId,
            name,
            type,
            initialValue,
            currency,
            purchaseDate
        });

        const result = await prisma.$transaction(async (tx) => {
            const asset = await tx.asset.create({
                data: {
                    userId: targetUserId,
                    name,
                    description,
                    type,
                    initialValue,
                    currency,
                    currentValue: initialValue, // Initial current value = initial value
                    quantity,
                    unit,
                    purchaseDate: new Date(purchaseDate),
                    status: 'ACTIVE',
                },
            });

            console.log('[ASSETS_POST] Asset created:', asset.id);

            await tx.assetRecord.create({
                data: {
                    assetId: asset.id,
                    userId: session.user.id, // Who performed the action (could be admin)
                    type: 'INITIAL',
                    amountChange: 0, // No change relative to initial? Or just 0.
                    valueAfter: initialValue,
                    date: new Date(purchaseDate),
                    note: 'Initial creation',
                },
            });

            console.log('[ASSETS_POST] Initial record created');

            return asset;
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[ASSETS_POST] Error:', error);
        // Log more details if it's a Prisma error
        if (error.code) {
            console.error('[ASSETS_POST] Prisma Error Code:', error.code);
            console.error('[ASSETS_POST] Prisma Error Meta:', error.meta);
        }
        return new NextResponse(JSON.stringify({ error: error.message || 'Internal Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userIdParam = searchParams.get('userId');
        const typeParam = searchParams.get('type');
        const statusParam = searchParams.get('status') || 'ACTIVE';

        let whereClause: any = {
            status: statusParam,
        };

        if (typeParam) {
            whereClause.type = typeParam;
        }

        // Permission Logic
        if (isAdmin(session.user.role)) {
            // Admin: Can view all, or filter by specific user
            if (userIdParam) {
                whereClause.userId = userIdParam;
            }
        } else {
            // Regular User: Can ONLY view their own
            whereClause.userId = session.user.id;
        }

        const assets = await prisma.asset.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    }
                }
            }
        });

        return NextResponse.json(assets);
    } catch (error) {
        console.error('[ASSETS_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
