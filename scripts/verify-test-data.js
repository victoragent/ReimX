const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyTestData() {
    try {
        console.log('🔍 验证测试数据...\n');

        // 1. 统计用户数据
        const userStats = await prisma.user.groupBy({
            by: ['role'],
            _count: {
                id: true
            }
        });

        console.log('👥 用户统计:');
        userStats.forEach(stat => {
            console.log(`- ${stat.role}: ${stat._count.id}人`);
        });

        // 2. 统计报销数据
        const reimbursementStats = await prisma.reimbursement.groupBy({
            by: ['status'],
            _count: {
                id: true
            },
            _sum: {
                amountUsdEquivalent: true
            }
        });

        console.log('\n💰 报销统计:');
        reimbursementStats.forEach(stat => {
            console.log(`- ${stat.status}: ${stat._count.id}条, 总金额: $${(stat._sum.amountUsdEquivalent || 0).toFixed(2)}`);
        });

        // 3. 统计工资数据
        const salaryStats = await prisma.salaryPayment.groupBy({
            by: ['status'],
            _count: {
                id: true
            },
            _sum: {
                amountUsdt: true
            }
        });

        console.log('\n💵 工资统计:');
        salaryStats.forEach(stat => {
            console.log(`- ${stat.status}: ${stat._count.id}条, 总金额: ${(stat._sum.amountUsdt || 0).toFixed(2)} USDT`);
        });

        // 4. 显示一些示例数据
        console.log('\n📋 示例用户数据:');
        const sampleUsers = await prisma.user.findMany({
            take: 5,
            select: {
                username: true,
                email: true,
                role: true,
                salaryUsdt: true,
                evmAddress: true,
                solanaAddress: true
            }
        });

        sampleUsers.forEach(user => {
            console.log(`- ${user.username} (${user.email})`);
            console.log(`  角色: ${user.role}, 薪资: ${user.salaryUsdt} USDT`);
            console.log(`  EVM地址: ${user.evmAddress}`);
            console.log(`  Solana地址: ${user.solanaAddress}`);
        });

        console.log('\n📋 示例报销数据:');
        const sampleReimbursements = await prisma.reimbursement.findMany({
            take: 3,
            include: {
                applicant: {
                    select: {
                        username: true
                    }
                }
            }
        });

        sampleReimbursements.forEach(reimbursement => {
            console.log(`- ${reimbursement.title} (${reimbursement.applicant.username})`);
            console.log(`  金额: ${reimbursement.amountOriginal} ${reimbursement.currency}`);
            console.log(`  状态: ${reimbursement.status}`);
            console.log(`  链: ${reimbursement.chain}`);
        });

        console.log('\n✅ 数据验证完成!');
        console.log('\n🌐 访问地址:');
        console.log('- 主页: http://localhost:3000');
        console.log('- 登录: http://localhost:3000/login');
        console.log('- 管理后台: http://localhost:3000/admin');
        console.log('- 用户仪表板: http://localhost:3000/dashboard');

    } catch (error) {
        console.error('❌ 验证数据失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyTestData();
