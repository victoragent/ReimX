import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const isAdmin = (role?: string) => role === 'admin' || role === 'superadmin';

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
            include: {
                records: {
                    orderBy: { date: 'desc' },
                    take: 5, // preview recent records
                },
            },
        });

        if (!asset) {
            return new NextResponse('Asset not found', { status: 404 });
        }

        // Permission check
        if (asset.userId !== session.user.id && !isAdmin(session.user.role)) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        return NextResponse.json(asset);
    } catch (error) {
        console.error('[ASSET_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = (await req.json()) as any;
        const { name, description, type, currency, quantity, unit, status } = body;

        const asset = await prisma.asset.findUnique({
            where: { id: params.id },
        });

        if (!asset) {
            return new NextResponse('Asset not found', { status: 404 });
        }

        // Permission check
        if (asset.userId !== session.user.id && !isAdmin(session.user.role)) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const updatedAsset = await prisma.asset.update({
            where: { id: params.id },
            data: {
                name,
                description,
                type,
                currency,
                quantity,
                unit,
                status,
            },
        });

        return NextResponse.json(updatedAsset);
    } catch (error) {
        console.error('[ASSET_PATCH]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(
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

        // Permission check
        if (asset.userId !== session.user.id && !isAdmin(session.user.role)) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        await prisma.asset.delete({
            where: { id: params.id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('[ASSET_DELETE]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
