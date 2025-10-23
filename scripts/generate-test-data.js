const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 生成随机EVM地址
function generateEVMAddress() {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
        address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
}

// 生成随机Solana地址
function generateSolanaAddress() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
    let address = '';
    for (let i = 0; i < 44; i++) {
        address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
}

// 生成随机金额
function generateAmount() {
    return Math.floor(Math.random() * 5000) + 100; // 100-5100
}

// 生成随机日期
function generateDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
}

async function generateTestData() {
    try {
        console.log('正在生成测试数据...');
        
        // 1. 创建测试用户
        const users = [];
        const userData = [
            { username: '张三', email: 'zhangsan@test.com', role: 'user' },
            { username: '李四', email: 'lisi@test.com', role: 'user' },
            { username: '王五', email: 'wangwu@test.com', role: 'user' },
            { username: '赵六', email: 'zhaoliu@test.com', role: 'user' },
            { username: '钱七', email: 'qianqi@test.com', role: 'user' },
            { username: '孙八', email: 'sunba@test.com', role: 'user' },
            { username: '周九', email: 'zhoujiu@test.com', role: 'user' },
            { username: '吴十', email: 'wushi@test.com', role: 'user' },
            { username: '郑十一', email: 'zhengshiyi@test.com', role: 'user' },
            { username: '王十二', email: 'wangshier@test.com', role: 'user' },
            { username: '审核员1', email: 'reviewer1@test.com', role: 'reviewer' },
            { username: '审核员2', email: 'reviewer2@test.com', role: 'reviewer' },
            { username: '批准员1', email: 'approver1@test.com', role: 'approver' },
            { username: '批准员2', email: 'approver2@test.com', role: 'approver' }
        ];

        for (const user of userData) {
            const hashedPassword = await bcrypt.hash('123456', 12);
            const userRecord = await prisma.user.create({
                data: {
                    username: user.username,
                    email: user.email,
                    password: hashedPassword,
                    role: user.role,
                    status: 'active',
                    isApproved: true,
                    approvedBy: 'system',
                    approvedAt: new Date(),
                    salaryUsdt: user.role === 'user' ? generateAmount() : 0,
                    tgAccount: `@${user.username.toLowerCase()}`,
                    whatsappAccount: `+86${Math.floor(Math.random() * 9000000000) + 1000000000}`,
                    evmAddress: generateEVMAddress(),
                    solanaAddress: generateSolanaAddress()
                }
            });
            users.push(userRecord);
            console.log(`✅ 创建用户: ${user.username} (${user.email})`);
        }

        // 2. 创建报销记录
        const reimbursementTitles = [
            '出差交通费', '办公用品采购', '客户招待费', '培训费用', '设备维修费',
            '会议费用', '差旅住宿费', '通讯费用', '软件订阅费', '快递费用',
            '网络费用', '电费', '水费', '物业管理费', '清洁费用'
        ];

        const currencies = ['CNY', 'USD', 'EUR', 'JPY', 'GBP'];
        const chains = ['Ethereum', 'BSC', 'Polygon', 'Arbitrum', 'Optimism'];
        const statuses = ['submitted', 'under_review', 'approved', 'rejected', 'paid'];
        const expenseTypePool = ['tech', 'travel', 'admin', 'hr', 'operations', 'other'];

        const regularUsers = users.filter(u => u.role === 'user');
        const reviewers = users.filter(u => u.role === 'reviewer');
        const approvers = users.filter(u => u.role === 'approver');

        for (let i = 0; i < 50; i++) {
            const applicant = regularUsers[Math.floor(Math.random() * regularUsers.length)];
            const title = reimbursementTitles[Math.floor(Math.random() * reimbursementTitles.length)];
            const amount = generateAmount();
            const currency = currencies[Math.floor(Math.random() * currencies.length)];
            const chain = chains[Math.floor(Math.random() * chains.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            let reviewerId = null;
            let approverId = null;
            let reviewComment = null;
            
            if (status === 'under_review' || status === 'approved' || status === 'rejected') {
                reviewerId = reviewers[Math.floor(Math.random() * reviewers.length)].id;
                reviewComment = status === 'rejected' ? '报销申请不符合公司政策' : '审核通过';
            }
            
            if (status === 'approved' || status === 'paid') {
                approverId = approvers[Math.floor(Math.random() * approvers.length)].id;
            }

            await prisma.reimbursement.create({
                data: {
                    applicantId: applicant.id,
                    title: title,
                    description: `这是${title}的详细描述，金额为${amount}${currency}`,
                    amountOriginal: amount,
                    currency: currency,
                    exchangeRateToUsd: currency === 'USD' ? 1 : Math.random() * 2 + 0.5,
                    amountUsdEquivalent: currency === 'USD' ? amount : amount * (Math.random() * 2 + 0.5),
                    exchangeRateSource: 'CoinGecko',
                    exchangeRateTime: generateDate(Math.floor(Math.random() * 30)),
                    isManualRate: Math.random() > 0.8,
                    expenseType: expenseTypePool[Math.floor(Math.random() * expenseTypePool.length)],
                    chain: chain,
                    receiptUrl: `https://example.com/receipts/${Math.random().toString(36).substr(2, 9)}.pdf`,
                    status: status,
                    reviewerId: reviewerId,
                    approverId: approverId,
                    reviewComment: reviewComment,
                    txHash: status === 'paid' ? `0x${Math.random().toString(16).substr(2, 64)}` : null
                }
            });
        }
        console.log('✅ 创建了50条报销记录');

        // 3. 创建工资记录
        const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
        const salaryStatuses = ['pending', 'scheduled', 'paid'];

        for (const user of regularUsers) {
            for (const month of months) {
                const status = salaryStatuses[Math.floor(Math.random() * salaryStatuses.length)];
                let scheduledAt = null;
                let paidAt = null;
                let transactionHash = null;

                if (status === 'scheduled') {
                    scheduledAt = generateDate(Math.floor(Math.random() * 10));
                } else if (status === 'paid') {
                    paidAt = generateDate(Math.floor(Math.random() * 5));
                    transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
                }

                await prisma.salaryPayment.create({
                    data: {
                        userId: user.id,
                        month: month,
                        amountUsdt: user.salaryUsdt,
                        status: status,
                        scheduledAt: scheduledAt,
                        paidAt: paidAt,
                        transactionHash: transactionHash,
                        notes: `用户${user.username}的${month}月工资`
                    }
                });
            }
        }
        console.log('✅ 创建了工资记录');

        console.log('\n🎉 测试数据生成完成!');
        console.log('\n📊 数据统计:');
        console.log(`- 用户总数: ${users.length}`);
        console.log(`- 普通用户: ${regularUsers.length}`);
        console.log(`- 审核员: ${reviewers.length}`);
        console.log(`- 批准员: ${approvers.length}`);
        console.log(`- 报销记录: 50条`);
        console.log(`- 工资记录: ${regularUsers.length * months.length}条`);
        
        console.log('\n🔑 测试账号信息:');
        console.log('管理员: admin@reimx.com / admin123456');
        console.log('普通用户: zhangsan@test.com / 123456');
        console.log('审核员: reviewer1@test.com / 123456');
        console.log('批准员: approver1@test.com / 123456');

    } catch (error) {
        console.error('❌ 生成测试数据失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

generateTestData();
