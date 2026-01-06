const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function run() {
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await prisma.user.upsert({
        where: { email: 'testuser@reimx.com' },
        update: {
            status: 'active',
            isApproved: true,
            password: hashedPassword
        },
        create: {
            username: 'testuser',
            email: 'testuser@reimx.com',
            password: hashedPassword,
            status: 'active',
            isApproved: true,
            role: 'admin'
        }
    });
    console.log('User created/updated:', user.email);
    await prisma.$disconnect();
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
