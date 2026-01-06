import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDb() {
    try {
        console.log('Testing raw queries...');

        // Try a query that works in both SQLite and Postgres
        const result: any = await prisma.$queryRawUnsafe('SELECT 1 as result');
        console.log('Test query result:', result);

        // Try to identify the DB
        try {
            const version: any = await prisma.$queryRawUnsafe('SELECT version()');
            console.log('Postgres version:', version);
        } catch (e) {
            console.log('Not Postgres (probably SQLite or similar)');
            try {
                const sqliteVersion: any = await prisma.$queryRawUnsafe('SELECT sqlite_version()');
                console.log('SQLite version:', sqliteVersion);
            } catch (e2) {
                console.log('Could not determine SQLite version either');
            }
        }

    } catch (error) {
        console.error('Failed to check DB:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDb();
