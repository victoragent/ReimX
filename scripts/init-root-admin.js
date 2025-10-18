const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function initRootAdmin() {
    try {
        // 从环境变量获取根管理员信息
        const rootAdminEmail = process.env.ROOT_ADMIN_EMAIL || 'admin@reimx.com';
        const rootAdminPassword = process.env.ROOT_ADMIN_PASSWORD || 'admin123456';
        
        console.log('正在初始化根管理员...');
        console.log('邮箱:', rootAdminEmail);
        
        // 检查是否已存在根管理员
        const existingAdmin = await prisma.user.findUnique({
            where: { email: rootAdminEmail }
        });
        
        if (existingAdmin) {
            console.log('根管理员已存在，跳过初始化');
            return;
        }
        
        // 加密密码
        const hashedPassword = await bcrypt.hash(rootAdminPassword, 12);
        
        // 创建根管理员
        const rootAdmin = await prisma.user.create({
            data: {
                username: 'Root Admin',
                email: rootAdminEmail,
                password: hashedPassword,
                role: 'admin',
                status: 'active',
                isApproved: true,
                approvedAt: new Date()
            }
        });
        
        console.log('根管理员创建成功!');
        console.log('ID:', rootAdmin.id);
        console.log('邮箱:', rootAdmin.email);
        console.log('角色:', rootAdmin.role);
        
    } catch (error) {
        console.error('初始化根管理员失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

initRootAdmin();
