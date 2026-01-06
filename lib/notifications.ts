// 通知系统 - 支持邮件和Telegram通知

import { Resend } from 'resend';

interface NotificationData {
  type: 'reimbursement_submitted' | 'reimbursement_approved' | 'reimbursement_rejected' | 'payment_executed' | 'password_reset';
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
  resetToken?: string;
}

// 发送邮件通知
export async function sendEmailNotification(data: NotificationData): Promise<boolean> {
  try {
    // 优先使用 Resend API（如果配置了API Key）
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your-resend-api-key-here') {
      const resend = new Resend(process.env.RESEND_API_KEY);

      const { data: result, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@reimx.com',
        to: data.user.email,
        subject: getEmailSubject(data.type),
        html: getEmailBody(data)
      });

      if (error) {
        console.error('❌ 邮件发送失败:', error);
        return false;
      }

      console.log(`✅ 邮件发送成功: ${data.user.email}, ID: ${result?.id}`);
      return true;
    }

    // 开发环境：显示邮件预览链接
    if (process.env.NODE_ENV === 'development') {
      const emailContent = getEmailBody(data);
      const previewUrl = await createEmailPreview(data.user.email, getEmailSubject(data.type), emailContent);
      console.log('📧 邮件通知 (开发环境):');
      console.log(`   收件人: ${data.user.email}`);
      console.log(`   主题: ${getEmailSubject(data.type)}`);
      console.log(`   预览链接: ${previewUrl}`);
      console.log('   邮件内容已保存到临时文件，可在浏览器中查看');

      return true;
    }

    // 如果没有配置邮件服务，使用模拟模式
    console.log('📧 邮件通知 (模拟模式):', {
      to: data.user.email,
      subject: getEmailSubject(data.type),
      body: getEmailBody(data)
    });

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
    case 'password_reset':
      return '密码重置请求';
    default:
      return '报销系统通知';
  }
}

// 获取邮件内容
function getEmailBody(data: NotificationData): string {
  const { type, user, reimbursement, resetToken } = data;

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
    case 'password_reset':
      const resetUrl = `${process.env.NEXTAUTH_URL || 'https://reim-x.vercel.app'}/reset-password?token=${resetToken}`;
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">密码重置请求</h2>
          <p>亲爱的 ${user.name}，</p>
          <p>我们收到了您的密码重置请求。请点击下面的链接来重置您的密码：</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              重置密码
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            如果按钮无法点击，请复制以下链接到浏览器地址栏：<br>
            <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; word-break: break-all;">${resetUrl}</code>
          </p>
          
          <p style="color: #999; font-size: 12px;">
            此链接将在1小时后过期。如果您没有请求重置密码，请忽略此邮件。
          </p>
          
          <p>此邮件由系统自动发送，请勿回复。</p>
        </div>
      `;
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

// 创建邮件预览（开发环境）
async function createEmailPreview(to: string, subject: string, html: string): Promise<string> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    // 创建临时预览文件
    const previewDir = path.join(process.cwd(), '.email-previews');
    await fs.mkdir(previewDir, { recursive: true });

    const timestamp = new Date().getTime();
    const filename = `email-preview-${timestamp}.html`;
    const filepath = path.join(previewDir, filename);

    // 创建完整的HTML预览文件
    const previewHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>邮件预览: ${subject}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5;
        }
        .preview-header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .email-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .info-item {
            margin: 8px 0;
            font-size: 14px;
        }
        .info-label {
            font-weight: bold;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="preview-header">
        <h2>📧 邮件预览</h2>
        <div class="info-item"><span class="info-label">收件人:</span> ${to}</div>
        <div class="info-item"><span class="info-label">主题:</span> ${subject}</div>
        <div class="info-item"><span class="info-label">时间:</span> ${new Date().toLocaleString('zh-CN')}</div>
        <div class="info-item"><span class="info-label">文件:</span> ${filename}</div>
    </div>
    <div class="email-content">
        ${html}
    </div>
</body>
</html>`;

    await fs.writeFile(filepath, previewHtml, 'utf-8');

    // 返回本地文件URL（可在浏览器中打开）
    return `file://${filepath}`;
  } catch (error) {
    console.error('创建邮件预览失败:', error);
    return '无法创建预览文件';
  }
}
