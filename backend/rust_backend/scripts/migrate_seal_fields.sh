#!/bin/bash

# Seal 加密字段迁移脚本
# 用途: 添加 Seal 加密相关字段到数据库

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Seal 加密字段迁移脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ 错误: DATABASE_URL 环境变量未设置${NC}"
    echo "请设置 DATABASE_URL，例如:"
    echo "export DATABASE_URL='mysql://user:password@localhost:3306/resume_vault_sui'"
    exit 1
fi

echo -e "${YELLOW}📋 数据库连接信息:${NC}"
echo "$DATABASE_URL" | sed 's/:[^:@]*@/:****@/'
echo ""

# 提取数据库连接参数
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo -e "${YELLOW}🔍 检查数据库连接...${NC}"
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" -e "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库连接成功${NC}"
else
    echo -e "${RED}❌ 数据库连接失败${NC}"
    exit 1
fi
echo ""

# 备份提示
echo -e "${YELLOW}⚠️  重要提示:${NC}"
echo "此脚本将修改数据库结构，建议先进行备份。"
read -p "是否继续执行迁移? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}已取消迁移${NC}"
    exit 0
fi

# 执行迁移
echo -e "${GREEN}🚀 开始执行迁移...${NC}"
echo ""

MIGRATION_FILE="./migrations/002_add_seal_fields.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ 迁移文件不存在: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📝 执行迁移文件: $MIGRATION_FILE${NC}"

mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ 迁移执行成功！${NC}"
    echo ""
    echo -e "${GREEN}已添加的功能:${NC}"
    echo "  ✓ wallet_address 字段扩展至 100 字符（支持 Sui 地址）"
    echo "  ✓ blob_id 字段（替代 ipfs_cid，支持 Walrus）"
    echo "  ✓ encryption_id 字段（Seal 加密 ID）"
    echo "  ✓ policy_object_id 字段（Allowlist 对象 ID）"
    echo "  ✓ encryption_type 字段（加密类型：simple/seal）"
    echo "  ✓ allowlist_members 表（白名单成员）"
    echo "  ✓ access_logs 表（访问日志）"
    echo ""
    echo -e "${YELLOW}📊 数据库状态:${NC}"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;"
else
    echo ""
    echo -e "${RED}❌ 迁移执行失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   迁移完成！${NC}"
echo -e "${GREEN}========================================${NC}"
