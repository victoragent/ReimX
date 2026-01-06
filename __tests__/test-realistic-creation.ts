import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRealisticCreation() {
    console.log('Testing realistic asset creation...');

    // Mimic the payload from AssetForm
    const payload = {
        name: 'Realistic Test Asset',
        type: 'FIXED',
        initialValue: 1000,
        currency: 'USD',
        purchaseDate: '2026-01-05',
        description: 'Test description',
        quantity: undefined,
        unit: 'pcs'
    };

    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('No user found');
            return;
        }

        const sessionUserId = user.id;
        const targetUserId = user.id;

        const {
            name,
            description,
            type,
            initialValue,
            currency,
            quantity,
            unit,
            purchaseDate,
        } = payload;

        const result = await prisma.$transaction(async (tx) => {
            const asset = await tx.asset.create({
                data: {
                    userId: targetUserId,
                    name,
                    description,
                    type,
                    initialValue,
                    currency,
                    currentValue: initialValue,
                    quantity,
                    unit,
                    purchaseDate: new Date(purchaseDate),
                    status: 'ACTIVE',
                },
            });

            console.log('Asset created:', asset.id);

            await tx.assetRecord.create({
                data: {
                    assetId: asset.id,
                    userId: sessionUserId,
                    type: 'INITIAL',
                    amountChange: 0,
                    valueAfter: initialValue,
                    date: new Date(purchaseDate),
                    note: 'Initial creation',
                },
            });

            return asset;
        });

        console.log('Transaction successful:', result.id);

        // Clean up
        await prisma.assetRecord.deleteMany({ where: { assetId: result.id } });
        await prisma.asset.delete({ where: { id: result.id } });
        console.log('Cleanup done');

    } catch (error) {
        console.error('Realistic creation failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testRealisticCreation();
