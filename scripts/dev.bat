@echo off
REM ReimX 开发环境管理脚本 (Windows)
REM 用法: scripts\dev.bat [start|stop|restart|status]

setlocal enabledelayedexpansion

REM 设置变量
set "PID_FILE=.dev.pid"
set "LOG_FILE=.dev.log"
set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

REM 检查进程是否运行
:is_running
if exist "%PID_FILE%" (
    for /f %%i in (%PID_FILE%) do set "PID=%%i"
    tasklist /FI "PID eq !PID!" 2>nul | find "!PID!" >nul
    if !errorlevel! equ 0 (
        exit /b 0
    ) else (
        del "%PID_FILE%" 2>nul
        exit /b 1
    )
) else (
    exit /b 1
)

REM 启动开发环境
:start_dev
call :is_running
if !errorlevel! equ 0 (
    echo 开发环境已经在运行中 (PID: !PID!)
    goto :eof
)

echo 🚀 启动 ReimX 开发环境...

REM 检查依赖
if not exist "node_modules" (
    echo 📦 安装依赖...
    call pnpm install
)

REM 生成 Prisma 客户端
echo 🔧 生成 Prisma 客户端...
call pnpm prisma:generate

REM 启动开发服务器
echo 🌟 启动 Next.js 开发服务器...
start /b pnpm dev > "%LOG_FILE%" 2>&1

REM 等待服务器启动
echo ⏳ 等待服务器启动...
timeout /t 3 /nobreak >nul

echo ✅ 开发环境启动成功!
echo 📊 进程信息:
echo    日志: %LOG_FILE%
echo    访问: http://localhost:3000
echo.
echo 💡 使用 'scripts\dev.bat stop' 停止开发环境
echo 💡 使用 'scripts\dev.bat status' 查看状态
goto :eof

REM 停止开发环境
:stop_dev
call :is_running
if !errorlevel! neq 0 (
    echo 开发环境未运行
    goto :eof
)

echo 🛑 停止开发环境 (PID: !PID!)...
taskkill /F /PID !PID! >nul 2>&1
del "%PID_FILE%" 2>nul
echo ✅ 开发环境已停止
goto :eof

REM 重启开发环境
:restart_dev
echo 🔄 重启开发环境...
call :stop_dev
timeout /t 1 /nobreak >nul
call :start_dev
goto :eof

REM 查看状态
:show_status
call :is_running
if !errorlevel! equ 0 (
    echo ✅ 开发环境正在运行
    echo 📊 进程信息:
    echo    PID: !PID!
    echo    日志: %LOG_FILE%
    echo    访问: http://localhost:3000
    echo.
    echo 📋 最近日志:
    if exist "%LOG_FILE%" (
        powershell "Get-Content '%LOG_FILE%' -Tail 10"
    ) else (
        echo    无日志文件
    )
) else (
    echo ❌ 开发环境未运行
)
goto :eof

REM 显示帮助
:show_help
echo ReimX 开发环境管理脚本
echo.
echo 用法: %0 [命令]
echo.
echo 命令:
echo   start    启动开发环境
echo   stop     停止开发环境
echo   restart  重启开发环境
echo   status   查看运行状态
echo   help     显示帮助信息
echo.
echo 示例:
echo   %0 start    # 启动开发环境
echo   %0 stop     # 停止开发环境
echo   %0 restart  # 重启开发环境
echo   %0 status   # 查看状态
goto :eof

REM 主逻辑
if "%1"=="" goto show_help
if "%1"=="start" goto start_dev
if "%1"=="stop" goto stop_dev
if "%1"=="restart" goto restart_dev
if "%1"=="status" goto show_status
if "%1"=="help" goto show_help
if "%1"=="--help" goto show_help
if "%1"=="-h" goto show_help

echo ❌ 未知命令: %1
echo.
goto show_help
