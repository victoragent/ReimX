import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing asset creation...');
    try {
        // Find a user first
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('No user found in database');
            return;
        }

        console.log('Using user:', user.email);

        const asset = await prisma.asset.create({
            data: {
                userId: user.id,
                name: 'Test Asset from Script',
                type: 'FIXED',
                initialValue: 123.45,
                currency: 'USD',
                currentValue: 123.45,
                purchaseDate: new Date(),
                status: 'ACTIVE',
            },
        });

        console.log('Asset created successfully:', asset.id);

        await prisma.assetRecord.create({
            data: {
                assetId: asset.id,
                userId: user.id,
                type: 'INITIAL',
                amountChange: 0,
                valueAfter: 123.45,
                date: new Date(),
                note: 'Initial creation from script',
            },
        });

        console.log('Initial record created successfully');

        // Clean up
        await prisma.assetRecord.deleteMany({ where: { assetId: asset.id } });
        await prisma.asset.delete({ where: { id: asset.id } });
        console.log('Test successful and cleaned up');
    } catch (error) {
        console.error('Error during asset creation:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
