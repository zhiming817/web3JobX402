#!/bin/bash

# 迁移脚本：修改 access_logs.resume_id 类型

# 数据库配置
DB_USER="root"
DB_PASS="Abc123456+"
DB_NAME="resume_vault_sui"
DB_HOST="localhost"

echo "开始迁移 access_logs.resume_id 列类型..."

# 执行迁移 SQL
mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" "$DB_NAME" < migrations/003_change_access_logs_resume_id_to_varchar.sql

if [ $? -eq 0 ]; then
    echo "✅ 迁移成功完成"
    
    # 验证更改
    echo ""
    echo "验证表结构："
    mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" "$DB_NAME" -e "DESCRIBE access_logs;"
    
    echo ""
    echo "检查外键约束："
    mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" "$DB_NAME" -e "
        SELECT 
            CONSTRAINT_NAME,
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = '$DB_NAME'
        AND TABLE_NAME = 'access_logs'
        AND REFERENCED_TABLE_NAME IS NOT NULL;
    "
else
    echo "❌ 迁移失败"
    exit 1
fi
