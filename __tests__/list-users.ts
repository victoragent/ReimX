import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
            }
        });
        console.log('Users:');
        console.table(users);
    } catch (error) {
        console.error('Failed to list users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
