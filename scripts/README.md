# 🚀 开发环境管理脚本

这个目录包含了用于管理 ReimX 开发环境的便捷脚本。

## 📁 文件说明

- `dev.sh` - Linux/macOS 开发环境管理脚本
- `dev.bat` - Windows 开发环境管理脚本
- `README.md` - 本说明文档

## 🎯 功能特性

- ✅ **一键启动**：自动安装依赖、生成 Prisma 客户端、启动开发服务器
- ✅ **智能停止**：优雅停止开发环境，清理进程
- ✅ **状态监控**：实时查看开发环境运行状态
- ✅ **日志管理**：自动记录开发服务器日志
- ✅ **跨平台**：支持 Linux、macOS 和 Windows

## 🚀 使用方法

### 方式一：使用 npm 脚本（推荐）

```bash
# 启动开发环境
pnpm dev:start

# 停止开发环境
pnpm dev:stop

# 重启开发环境
pnpm dev:restart

# 查看运行状态
pnpm dev:status
```

### 方式二：直接使用脚本

#### Linux/macOS

```bash
# 启动开发环境
./scripts/dev.sh start

# 停止开发环境
./scripts/dev.sh stop

# 重启开发环境
./scripts/dev.sh restart

# 查看运行状态
./scripts/dev.sh status

# 显示帮助
./scripts/dev.sh help
```

#### Windows

```cmd
# 启动开发环境
scripts\dev.bat start

# 停止开发环境
scripts\dev.bat stop

# 重启开发环境
scripts\dev.bat restart

# 查看运行状态
scripts\dev.bat status

# 显示帮助
scripts\dev.bat help
```

## 📊 脚本功能详解

### 启动开发环境 (`start`)

1. **检查运行状态**：如果已运行，显示当前状态
2. **安装依赖**：自动检查并安装 `node_modules`
3. **生成 Prisma 客户端**：运行 `pnpm prisma:generate`
4. **启动开发服务器**：后台运行 `pnpm dev`
5. **状态确认**：等待服务器启动并确认状态

### 停止开发环境 (`stop`)

1. **检查运行状态**：确认开发环境是否在运行
2. **优雅停止**：发送 TERM 信号停止进程
3. **强制停止**：如果优雅停止失败，强制终止进程
4. **清理资源**：删除 PID 文件和清理临时文件

### 重启开发环境 (`restart`)

1. **停止当前环境**：调用停止功能
2. **等待清理**：等待 1 秒确保资源释放
3. **重新启动**：调用启动功能

### 查看状态 (`status`)

1. **进程检查**：检查开发环境是否在运行
2. **信息显示**：显示 PID、日志文件、访问地址
3. **日志预览**：显示最近的日志内容

## 🔧 技术实现

### 进程管理

- **PID 文件**：使用 `.dev.pid` 文件记录进程 ID
- **日志文件**：使用 `.dev.log` 文件记录开发服务器输出
- **进程检查**：通过 PID 文件检查进程是否运行

### 跨平台支持

- **Linux/macOS**：使用 Bash 脚本和 Unix 命令
- **Windows**：使用批处理脚本和 Windows 命令
- **统一接口**：两种脚本提供相同的命令和功能

### 错误处理

- **依赖检查**：自动检查并安装缺失的依赖
- **进程验证**：启动后验证进程是否正常运行
- **优雅降级**：如果优雅停止失败，使用强制停止

## 📝 日志文件

开发环境运行时会生成以下文件：

- `.dev.pid` - 进程 ID 文件（自动管理）
- `.dev.log` - 开发服务器日志文件

## 🛠️ 故障排除

### 常见问题

1. **权限问题**
   ```bash
   chmod +x scripts/dev.sh
   ```

2. **端口占用**
   ```bash
   # 检查端口占用
   lsof -i :3000
   
   # 停止占用进程
   kill -9 <PID>
   ```

3. **依赖问题**
   ```bash
   # 清理并重新安装
   rm -rf node_modules
   pnpm install
   ```

4. **Prisma 问题**
   ```bash
   # 重新生成客户端
   pnpm prisma:generate
   ```

### 手动清理

如果脚本出现问题，可以手动清理：

```bash
# 停止所有相关进程
pkill -f "next dev"

# 清理文件
rm -f .dev.pid .dev.log

# 重新启动
pnpm dev:start
```

## 💡 最佳实践

1. **开发前**：使用 `pnpm dev:start` 启动环境
2. **开发中**：使用 `pnpm dev:status` 检查状态
3. **开发后**：使用 `pnpm dev:stop` 停止环境
4. **问题排查**：查看 `.dev.log` 文件了解详细日志

## 🔄 更新日志

- **v1.0.0** - 初始版本，支持基本的启动、停止、重启、状态查看功能
- 支持跨平台（Linux/macOS/Windows）
- 集成 npm 脚本支持
- 完整的错误处理和日志记录
