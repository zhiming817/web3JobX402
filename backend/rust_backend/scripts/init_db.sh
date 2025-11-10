#!/bin/bash

# ResumeVault 数据库初始化脚本

echo "=== ResumeVault 数据库初始化 ==="
echo ""

# 检查环境变量
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，从 .env.example 复制..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请编辑配置"
    exit 1
fi

# 读取数据库配置
source .env

# 提取数据库信息
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo "📊 数据库配置:"
echo "  主机: $DB_HOST"
echo "  端口: $DB_PORT"
echo "  用户: $DB_USER"
echo ""

# 检查 MySQL 是否运行
echo "🔍 检查 MySQL 服务..."
if ! command -v mysql &> /dev/null; then
    echo "❌ 未找到 mysql 命令，请先安装 MySQL"
    exit 1
fi

# 测试连接
if ! mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS -e "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ 无法连接到 MySQL，请检查配置"
    exit 1
fi

echo "✅ MySQL 连接成功"
echo ""

# 执行迁移脚本
echo "📦 执行数据库迁移..."
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS < migrations/001_init_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ 数据库初始化完成！"
    echo ""
    echo "📋 创建的表:"
    echo "  - users (用户表)"
    echo "  - resumes (简历表)"
    echo "  - unlock_records (解锁记录表)"
    echo ""
    echo "🚀 现在可以运行: cargo run"
else
    echo "❌ 数据库初始化失败"
    exit 1
fi
