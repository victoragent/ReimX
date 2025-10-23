const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 生成真实的测试数据
const users = [
    { username: '张三', email: 'zhangsan@company.com', role: 'user' },
    { username: '李四', email: 'lisi@company.com', role: 'user' },
    { username: '王五', email: 'wangwu@company.com', role: 'user' },
    { username: '赵六', email: 'zhaoliu@company.com', role: 'user' },
    { username: '钱七', email: 'qianqi@company.com', role: 'user' },
    { username: '孙八', email: 'sunba@company.com', role: 'user' },
    { username: '周九', email: 'zhoujiu@company.com', role: 'user' },
    { username: '吴十', email: 'wushi@company.com', role: 'user' },
    { username: '郑十一', email: 'zhengshiyi@company.com', role: 'user' },
    { username: '王十二', email: 'wangshier@company.com', role: 'user' },
    { username: '审核员1', email: 'reviewer1@company.com', role: 'reviewer' },
    { username: '审核员2', email: 'reviewer2@company.com', role: 'reviewer' },
    { username: '管理员1', email: 'admin1@company.com', role: 'admin' }
];

const reimbursementTitles = [
    '出差交通费报销',
    '办公用品采购',
    '客户招待费',
    '会议费用报销',
    '培训费用',
    '设备维护费',
    '软件订阅费',
    '网络服务费',
    '差旅住宿费',
    '餐费补贴',
    '交通补贴',
    '通讯费报销',
    '打印复印费',
    '快递费用',
    '清洁用品采购'
];

const descriptions = [
    '因公出差产生的交通费用，包括机票、火车票、出租车费等',
    '购买办公用品，包括文具、纸张、文件夹等日常办公用品',
    '客户接待产生的费用，包括餐费、礼品等',
    '参加行业会议产生的费用，包括会议费、住宿费等',
    '员工培训相关费用，包括培训费、教材费等',
    '办公设备维护和维修费用',
    '企业软件订阅费用，包括办公软件、云服务等',
    '网络服务费用，包括宽带、专线等',
    '出差期间的住宿费用',
    '工作餐费补贴',
    '上下班交通费用补贴',
    '工作通讯费用，包括电话费、网络费等',
    '办公打印复印费用',
    '快递邮寄费用',
    '办公区域清洁用品采购'
];

const currencies = ['CNY', 'USD', 'EUR', 'JPY'];
const chains = ['ethereum', 'polygon', 'bsc', 'arbitrum'];
const statuses = ['submitted', 'under_review', 'approved', 'rejected'];
const expenseTypePool = ['tech', 'travel', 'admin', 'hr', 'operations', 'other'];

async function generateUsers() {
    console.log('生成用户数据...');
    
    for (const userData of users) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        await prisma.user.upsert({
            where: { email: userData.email },
            update: {},
            create: {
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                role: userData.role,
                status: userData.role === 'admin' ? 'active' : 'pending',
                isApproved: userData.role === 'admin',
                approvedAt: userData.role === 'admin' ? new Date() : null,
                approvedBy: userData.role === 'admin' ? 'system' : null,
                tgAccount: `@${userData.username.toLowerCase()}`,
                evmAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
                solanaAddress: `${Math.random().toString(36).substr(2, 44)}`
            }
        });
    }
    
    console.log('用户数据生成完成');
}

async function generateReimbursements() {
    console.log('生成报销数据...');
    
    // 获取所有用户
    const allUsers = await prisma.user.findMany();
    const regularUsers = allUsers.filter(u => u.role === 'user');
    const reviewers = allUsers.filter(u => u.role === 'reviewer');
    const admins = allUsers.filter(u => u.role === 'admin');
    
    if (regularUsers.length === 0) {
        console.log('没有普通用户，跳过报销数据生成');
        return;
    }
    
    // 生成50个报销记录
    for (let i = 0; i < 50; i++) {
        const applicant = regularUsers[Math.floor(Math.random() * regularUsers.length)];
        const title = reimbursementTitles[Math.floor(Math.random() * reimbursementTitles.length)];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        const currency = currencies[Math.floor(Math.random() * currencies.length)];
        const chain = chains[Math.floor(Math.random() * chains.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // 生成金额（根据货币调整范围）
        let amountOriginal;
        let exchangeRateToUsd;
        
        switch (currency) {
            case 'CNY':
                amountOriginal = Math.floor(Math.random() * 5000) + 100; // 100-5100 CNY
                exchangeRateToUsd = 0.14; // 约7.14 CNY = 1 USD
                break;
            case 'USD':
                amountOriginal = Math.floor(Math.random() * 1000) + 50; // 50-1050 USD
                exchangeRateToUsd = 1.0;
                break;
            case 'EUR':
                amountOriginal = Math.floor(Math.random() * 1000) + 50; // 50-1050 EUR
                exchangeRateToUsd = 1.1; // 约0.91 EUR = 1 USD
                break;
            case 'JPY':
                amountOriginal = Math.floor(Math.random() * 100000) + 5000; // 5000-105000 JPY
                exchangeRateToUsd = 0.0067; // 约150 JPY = 1 USD
                break;
            default:
                amountOriginal = Math.floor(Math.random() * 1000) + 50;
                exchangeRateToUsd = 1.0;
        }
        
        const amountUsdEquivalent = amountOriginal * exchangeRateToUsd;
        
        // 根据状态设置审核信息
        let reviewer = null;
        let approver = null;
        
        if (status === 'under_review' || status === 'approved' || status === 'rejected') {
            reviewer = reviewers.length > 0 ? reviewers[Math.floor(Math.random() * reviewers.length)] : null;
        }
        
        if (status === 'approved' || status === 'rejected') {
            approver = admins.length > 0 ? admins[Math.floor(Math.random() * admins.length)] : null;
        }
        
        await prisma.reimbursement.create({
            data: {
                title,
                description,
                amountOriginal,
                currency,
                chain,
                amountUsdEquivalent,
                exchangeRateToUsd,
                exchangeRateSource: 'manual',
                exchangeRateTime: new Date(),
                isManualRate: true,
                convertedBy: 'system',
                status,
                expenseType: expenseTypePool[Math.floor(Math.random() * expenseTypePool.length)],
                receiptUrl: `https://example.com/receipts/receipt_${i + 1}.pdf`,
                txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
                applicantId: applicant.id,
                reviewerId: reviewer?.id,
                approverId: approver?.id
            }
        });
    }
    
    console.log('报销数据生成完成');
}

async function main() {
    try {
        console.log('开始生成真实测试数据...');
        
        await generateUsers();
        await generateReimbursements();
        
        // 显示统计信息
        const userCount = await prisma.user.count();
        const reimbursementCount = await prisma.reimbursement.count();
        const pendingUsers = await prisma.user.count({ where: { status: 'pending' } });
        const pendingReimbursements = await prisma.reimbursement.count({ where: { status: 'submitted' } });
        
        console.log('\n=== 数据统计 ===');
        console.log(`总用户数: ${userCount}`);
        console.log(`待审核用户: ${pendingUsers}`);
        console.log(`总报销数: ${reimbursementCount}`);
        console.log(`待审核报销: ${pendingReimbursements}`);
        
        const totalAmount = await prisma.reimbursement.aggregate({
            _sum: { amountUsdEquivalent: true }
        });
        console.log(`总金额: $${totalAmount._sum.amountUsdEquivalent?.toFixed(2) || '0.00'} USD`);
        
        console.log('\n数据生成完成！');
        
    } catch (error) {
        console.error('生成数据时出错:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
