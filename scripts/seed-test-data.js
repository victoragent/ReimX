const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTestData() {
    try {
        console.log('开始添加测试数据...');

        // 创建测试用户
        const testUser = await prisma.user.upsert({
            where: { email: 'testuser@example.com' },
            update: {},
            create: {
                username: 'testuser',
                email: 'testuser@example.com',
                password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
                role: 'user',
                status: 'active'
            }
        });

        console.log('测试用户创建成功:', testUser.email);

        // 创建测试报销数据
        const testReimbursement = await prisma.reimbursement.create({
            data: {
                applicantId: testUser.id,
                title: '测试报销申请',
                description: '这是一个测试报销申请',
                amountOriginal: 100.50,
                currency: 'USD',
                exchangeRateToUsd: 1.0,
                amountUsdEquivalent: 100.50,
                exchangeRateSource: 'manual',
                exchangeRateTime: new Date(),
                isManualRate: true,
                chain: 'ethereum',
                status: 'submitted'
            }
        });

        console.log('测试报销数据创建成功:', testReimbursement.id);

        // 创建更多测试数据
        const testReimbursement2 = await prisma.reimbursement.create({
            data: {
                applicantId: testUser.id,
                title: '商务午餐报销',
                description: '与客户商务午餐费用',
                amountOriginal: 50.00,
                currency: 'USD',
                exchangeRateToUsd: 1.0,
                amountUsdEquivalent: 50.00,
                exchangeRateSource: 'manual',
                exchangeRateTime: new Date(),
                isManualRate: true,
                chain: 'ethereum',
                status: 'approved'
            }
        });

        console.log('第二个测试报销数据创建成功:', testReimbursement2.id);

        console.log('测试数据添加完成！');
    } catch (error) {
        console.error('添加测试数据时出错:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedTestData();
