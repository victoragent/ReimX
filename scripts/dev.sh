#!/bin/bash

# ReimX 开发环境管理脚本
# 用法: ./scripts/dev.sh [start|stop|restart|status]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# PID 文件路径
PID_FILE=".dev.pid"
LOG_FILE=".dev.log"

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 检查进程是否运行
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# 启动开发环境
start_dev() {
    if is_running; then
        print_message $YELLOW "开发环境已经在运行中 (PID: $(cat $PID_FILE))"
        return 0
    fi

    print_message $BLUE "🚀 启动 ReimX 开发环境..."
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        print_message $YELLOW "📦 安装依赖..."
        pnpm install
    fi

    # 生成 Prisma 客户端
    print_message $BLUE "🔧 生成 Prisma 客户端..."
    pnpm prisma:generate

    # 启动开发服务器
    print_message $GREEN "🌟 启动 Next.js 开发服务器..."
    nohup pnpm dev > "$LOG_FILE" 2>&1 &
    local pid=$!
    echo $pid > "$PID_FILE"

    # 等待服务器启动
    print_message $BLUE "⏳ 等待服务器启动..."
    sleep 3

    if is_running; then
        print_message $GREEN "✅ 开发环境启动成功!"
        print_message $BLUE "📊 进程信息:"
        echo "   PID: $pid"
        echo "   日志: $LOG_FILE"
        echo "   访问: http://localhost:3000"
        echo ""
        print_message $YELLOW "💡 使用 './scripts/dev.sh stop' 停止开发环境"
        print_message $YELLOW "💡 使用 './scripts/dev.sh status' 查看状态"
    else
        print_message $RED "❌ 开发环境启动失败!"
        print_message $YELLOW "📋 查看日志: tail -f $LOG_FILE"
        return 1
    fi
}

# 停止开发环境
stop_dev() {
    if ! is_running; then
        print_message $YELLOW "开发环境未运行"
        return 0
    fi

    local pid=$(cat "$PID_FILE")
    print_message $BLUE "🛑 停止开发环境 (PID: $pid)..."
    
    # 优雅停止
    kill -TERM "$pid" 2>/dev/null || true
    
    # 等待进程结束
    local count=0
    while ps -p "$pid" > /dev/null 2>&1 && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    # 强制停止（如果需要）
    if ps -p "$pid" > /dev/null 2>&1; then
        print_message $YELLOW "强制停止进程..."
        kill -KILL "$pid" 2>/dev/null || true
    fi
    
    # 清理
    rm -f "$PID_FILE"
    
    print_message $GREEN "✅ 开发环境已停止"
}

# 重启开发环境
restart_dev() {
    print_message $BLUE "🔄 重启开发环境..."
    stop_dev
    sleep 1
    start_dev
}

# 查看状态
show_status() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        print_message $GREEN "✅ 开发环境正在运行"
        print_message $BLUE "📊 进程信息:"
        echo "   PID: $pid"
        echo "   日志: $LOG_FILE"
        echo "   访问: http://localhost:3000"
        echo ""
        print_message $YELLOW "📋 最近日志:"
        tail -n 10 "$LOG_FILE" 2>/dev/null || echo "   无日志文件"
    else
        print_message $RED "❌ 开发环境未运行"
    fi
}

# 显示帮助
show_help() {
    print_message $BLUE "ReimX 开发环境管理脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  start    启动开发环境"
    echo "  stop     停止开发环境"
    echo "  restart  重启开发环境"
    echo "  status   查看运行状态"
    echo "  help     显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start    # 启动开发环境"
    echo "  $0 stop     # 停止开发环境"
    echo "  $0 restart  # 重启开发环境"
    echo "  $0 status   # 查看状态"
}

# 主逻辑
case "${1:-help}" in
    start)
        start_dev
        ;;
    stop)
        stop_dev
        ;;
    restart)
        restart_dev
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_message $RED "❌ 未知命令: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
