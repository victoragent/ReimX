const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function initAdmin() {
    try {
        console.log('正在初始化管理员账号...');
        
        // 检查是否已存在管理员
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'admin' }
        });
        
        if (existingAdmin) {
            console.log('管理员账号已存在:', existingAdmin.email);
            return;
        }
        
        // 从环境变量获取管理员信息，如果没有则使用默认值
        const adminEmail = process.env.ROOT_ADMIN_EMAIL || 'admin@reimx.com';
        const adminPassword = process.env.ROOT_ADMIN_PASSWORD || 'admin123456';
        const adminUsername = process.env.ROOT_ADMIN_USERNAME || '系统管理员';
        
        // 加密密码
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        
        // 创建管理员账号
        const admin = await prisma.user.create({
            data: {
                username: adminUsername,
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                status: 'active',
                isApproved: true,
                approvedBy: 'system',
                approvedAt: new Date(),
                salaryUsdt: 0
            }
        });
        
        console.log('✅ 管理员账号创建成功!');
        console.log('📧 邮箱:', adminEmail);
        console.log('🔑 密码:', adminPassword);
        console.log('👤 用户名:', adminUsername);
        console.log('');
        console.log('请使用以上信息登录管理后台: http://localhost:3000/admin');
        
    } catch (error) {
        console.error('❌ 创建管理员账号失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

initAdmin();
