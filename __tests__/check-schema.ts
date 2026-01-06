import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
    try {
        console.log('Checking Asset table structure...');
        // We can use a raw query to check the columns in PostgreSQL
        const assetColumns = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'Asset'
        `;
        console.log('Asset Columns:');
        console.table(assetColumns);

        console.log('\nChecking AssetRecord table structure...');
        const recordColumns = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'AssetRecord'
        `;
        console.log('AssetRecord Columns:');
        console.table(recordColumns);

    } catch (error) {
        console.error('Failed to check schema:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSchema();
