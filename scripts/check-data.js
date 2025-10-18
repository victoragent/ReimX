const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('检查现有数据...');
    
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, role: true }
    });
    
    console.log('用户数据:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - ${user.role}`);
    });
    
    const reimbursements = await prisma.reimbursement.findMany({
      select: { 
        id: true, 
        title: true, 
        status: true, 
        reviewerId: true, 
        approverId: true,
        applicant: { select: { username: true } }
      }
    });
    
    console.log('\n报销数据:');
    reimbursements.forEach(reimb => {
      console.log(`- ${reimb.title} (${reimb.status}) - 申请人: ${reimb.applicant.username}`);
      console.log(`  审核人ID: ${reimb.reviewerId || '无'}`);
      console.log(`  批准人ID: ${reimb.approverId || '无'}`);
    });
    
  } catch (error) {
    console.error('检查数据失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
