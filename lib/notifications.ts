// 通知系统 - 支持邮件和Telegram通知

interface NotificationData {
  type: 'reimbursement_submitted' | 'reimbursement_approved' | 'reimbursement_rejected' | 'payment_executed';
  user: {
    name: string;
    email: string;
    tgAccount?: string;
  };
  reimbursement: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    chain: string;
    txHash?: string;
  };
  comment?: string;
}

// 发送邮件通知
export async function sendEmailNotification(data: NotificationData): Promise<boolean> {
  try {
    // 这里应该集成 Resend API 或其他邮件服务
    // 目前只是模拟实现
    console.log('📧 邮件通知:', {
      to: data.user.email,
      subject: getEmailSubject(data.type),
      body: getEmailBody(data)
    });
    
    // 实际实现应该调用邮件服务API
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'noreply@reimx.com',
    //     to: data.user.email,
    //     subject: getEmailSubject(data.type),
    //     html: getEmailBody(data)
    //   })
    // });
    
    return true;
  } catch (error) {
    console.error('邮件通知发送失败:', error);
    return false;
  }
}

// 发送Telegram通知
export async function sendTelegramNotification(data: NotificationData): Promise<boolean> {
  try {
    if (!data.user.tgAccount) {
      return false;
    }

    // 这里应该集成 Telegram Bot API
    // 目前只是模拟实现
    console.log('📱 Telegram通知:', {
      to: data.user.tgAccount,
      message: getTelegramMessage(data)
    });
    
    // 实际实现应该调用Telegram Bot API
    // const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     chat_id: data.user.tgAccount,
    //     text: getTelegramMessage(data),
    //     parse_mode: 'HTML'
    //   })
    // });
    
    return true;
  } catch (error) {
    console.error('Telegram通知发送失败:', error);
    return false;
  }
}

// 发送通知（邮件 + Telegram）
export async function sendNotification(data: NotificationData): Promise<{ email: boolean; telegram: boolean }> {
  const [emailResult, telegramResult] = await Promise.allSettled([
    sendEmailNotification(data),
    sendTelegramNotification(data)
  ]);

  return {
    email: emailResult.status === 'fulfilled' ? emailResult.value : false,
    telegram: telegramResult.status === 'fulfilled' ? telegramResult.value : false
  };
}

// 获取邮件主题
function getEmailSubject(type: NotificationData['type']): string {
  switch (type) {
    case 'reimbursement_submitted':
      return '报销申请已提交';
    case 'reimbursement_approved':
      return '报销申请已批准';
    case 'reimbursement_rejected':
      return '报销申请已拒绝';
    case 'payment_executed':
      return '报销款项已支付';
    default:
      return '报销系统通知';
  }
}

// 获取邮件内容
function getEmailBody(data: NotificationData): string {
  const { type, user, reimbursement } = data;
  
  let statusText = '';
  let actionText = '';
  
  switch (type) {
    case 'reimbursement_submitted':
      statusText = '已提交';
      actionText = '您的报销申请已成功提交，正在等待审核。';
      break;
    case 'reimbursement_approved':
      statusText = '已批准';
      actionText = '恭喜！您的报销申请已通过审核。';
      break;
    case 'reimbursement_rejected':
      statusText = '已拒绝';
      actionText = '很抱歉，您的报销申请未通过审核。';
      break;
    case 'payment_executed':
      statusText = '已支付';
      actionText = '您的报销款项已成功支付。';
      break;
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">报销系统通知</h2>
      <p>亲爱的 ${user.name}，</p>
      <p>${actionText}</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">报销详情</h3>
        <p><strong>标题：</strong>${reimbursement.title}</p>
        <p><strong>金额：</strong>${reimbursement.amount} ${reimbursement.currency}</p>
        <p><strong>链别：</strong>${reimbursement.chain}</p>
        <p><strong>状态：</strong>${statusText}</p>
        ${reimbursement.txHash ? `<p><strong>交易哈希：</strong><code>${reimbursement.txHash}</code></p>` : ''}
        ${data.comment ? `<p><strong>备注：</strong>${data.comment}</p>` : ''}
      </div>
      
      <p>如有疑问，请联系管理员。</p>
      <p>此邮件由系统自动发送，请勿回复。</p>
    </div>
  `;
}

// 获取Telegram消息
function getTelegramMessage(data: NotificationData): string {
  const { type, user, reimbursement } = data;
  
  let emoji = '';
  let statusText = '';
  
  switch (type) {
    case 'reimbursement_submitted':
      emoji = '📝';
      statusText = '已提交';
      break;
    case 'reimbursement_approved':
      emoji = '✅';
      statusText = '已批准';
      break;
    case 'reimbursement_rejected':
      emoji = '❌';
      statusText = '已拒绝';
      break;
    case 'payment_executed':
      emoji = '💰';
      statusText = '已支付';
      break;
  }

  let message = `${emoji} <b>报销通知</b>\n\n`;
  message += `👤 用户：${user.name}\n`;
  message += `📋 标题：${reimbursement.title}\n`;
  message += `💵 金额：${reimbursement.amount} ${reimbursement.currency}\n`;
  message += `⛓ 链别：${reimbursement.chain}\n`;
  message += `📊 状态：${statusText}\n`;
  
  if (reimbursement.txHash) {
    message += `🔗 交易哈希：<code>${reimbursement.txHash}</code>\n`;
  }
  
  if (data.comment) {
    message += `💬 备注：${data.comment}\n`;
  }
  
  return message;
}
