# 📧 邮件配置指南

## 当前状态

密码重置功能已完全实现，但邮件发送目前处于**开发预览模式**。您可以在控制台看到邮件内容，但没有实际发送到邮箱。

## 🔧 解决方案

### 方案1：开发环境邮件预览（当前使用）

在开发环境中，系统会自动创建邮件预览文件：

1. **查看邮件预览**：
   ```bash
   # 查看生成的预览文件
   ls -la .email-previews/
   
   # 在浏览器中打开预览文件
   open .email-previews/email-preview-*.html
   ```

2. **服务器日志**：
   - 在控制台查看邮件内容和预览链接
   - 包含完整的重置链接和令牌

### 方案2：配置 Resend API（推荐用于生产）

Resend 是专为开发者设计的邮件服务，每月有免费额度。

**配置步骤：**

1. **注册 Resend 账号**
   - 访问 https://resend.com
   - 注册免费账号
   - 获取 API Key

2. **配置环境变量**
   ```bash
   # 复制环境变量模板
   cp env.example .env.local
   
   # 编辑 .env.local 文件，添加：
   RESEND_API_KEY="你的-resend-api-key"
   EMAIL_FROM="noreply@reimx.com"  # 需要先在 Resend 验证域名
   ```

3. **验证域名（可选）**
   - 在 Resend 控制台添加并验证你的域名
   - 或者使用 Resend 提供的测试域名

### 方案3：使用其他邮件服务

您也可以配置其他邮件服务：

#### SMTP 配置
```bash
# 在 .env.local 中添加
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="your-email@gmail.com"
```

#### SendGrid 配置
```bash
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM="noreply@reimx.com"
```

## 🧪 测试邮件发送

### 开发环境测试
1. 访问 http://localhost:3000/forgot-password
2. 输入测试邮箱（如：zhangsan@test.com）
3. 查看控制台输出和预览文件

### 生产环境测试
配置 Resend 后：
1. 使用真实邮箱地址测试
2. 检查收件箱中的重置邮件

## 📋 邮件模板内容

密码重置邮件包含：
- 用户友好的问候
- 清晰的重置按钮
- 手动复制链接选项
- 安全提醒（1小时过期）
- 品牌标识

## 🔒 安全注意事项

- 重置令牌1小时后自动过期
- 每个令牌只能使用一次
- 防止重放攻击
- 错误信息模糊化保护用户隐私

## 🚀 生产部署

部署到生产环境时：
1. 配置真实的邮件服务（Resend 推荐）
2. 验证发送域名
3. 设置适当的发送频率限制
4. 监控邮件发送成功率

## 📞 故障排除

### 常见问题

**Q: 没有收到邮件？**
A: 检查环境变量配置和邮件服务状态

**Q: 邮件进入垃圾箱？**
A: 配置 SPF/DKIM 记录，验证发送域名

**Q: API 调用失败？**
A: 检查 API Key 权限和配额

---

**当前状态**: 开发预览模式可用  
**推荐升级**: 配置 Resend API 用于生产环境
