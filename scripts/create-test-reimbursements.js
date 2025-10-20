const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestReimbursements() {
  try {
    console.log('开始创建测试报销数据...');

    // 首先检查是否有用户
    const users = await prisma.user.findMany();
    console.log('现有用户:', users.length);

    if (users.length === 0) {
      console.log('没有用户，先创建测试用户...');
      
      // 创建测试用户
      const testUser = await prisma.user.create({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          role: 'user',
          status: 'active'
        }
      });

      const adminUser = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@example.com',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          role: 'admin',
          status: 'active'
        }
      });

      console.log('创建了测试用户:', testUser.username, adminUser.username);
    }

    // 获取用户
    const testUser = await prisma.user.findFirst({ where: { email: 'test@example.com' } });
    const adminUser = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });

    if (!testUser || !adminUser) {
      throw new Error('无法找到测试用户');
    }

    // 创建测试报销记录
    const reimbursements = [
      {
        applicantId: testUser.id,
        title: '差旅费报销',
        description: '出差北京的费用报销',
        amountOriginal: 1200.50,
        currency: 'CNY',
        exchangeRateToUsd: 0.14,
        amountUsdEquivalent: 168.07,
        exchangeRateSource: 'manual',
        exchangeRateTime: new Date(),
        isManualRate: true,
        convertedBy: 'user',
        expenseType: 'travel',
        chain: 'evm',
        receiptUrl: 'https://example.com/receipt1.pdf',
        status: 'submitted'
      },
      {
        applicantId: testUser.id,
        title: '办公用品采购',
        description: '购买办公用品的费用',
        amountOriginal: 500.00,
        currency: 'USD',
        exchangeRateToUsd: 1.0,
        amountUsdEquivalent: 500.00,
        exchangeRateSource: 'manual',
        exchangeRateTime: new Date(),
        isManualRate: true,
        convertedBy: 'user',
        expenseType: 'operations',
        chain: 'solana',
        receiptUrl: 'https://example.com/receipt2.pdf',
        status: 'approved',
        reviewerId: adminUser.id,
        approverId: adminUser.id
      },
      {
        applicantId: testUser.id,
        title: '会议费用',
        description: '参加技术会议的注册费',
        amountOriginal: 800.00,
        currency: 'USD',
        exchangeRateToUsd: 1.0,
        amountUsdEquivalent: 800.00,
        exchangeRateSource: 'manual',
        exchangeRateTime: new Date(),
        isManualRate: true,
        convertedBy: 'user',
        expenseType: 'tech',
        chain: 'evm',
        receiptUrl: 'https://example.com/receipt3.pdf',
        status: 'rejected',
        reviewerId: adminUser.id
      }
    ];

    for (const reimbursement of reimbursements) {
      const created = await prisma.reimbursement.create({
        data: reimbursement
      });
      console.log(`创建报销记录: ${created.title} (${created.status})`);
    }

    console.log('测试数据创建完成！');
    console.log('用户信息:');
    console.log('- 普通用户:', testUser.email);
    console.log('- 管理员:', adminUser.email);
    console.log('密码都是: password');

  } catch (error) {
    console.error('创建测试数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestReimbursements();
