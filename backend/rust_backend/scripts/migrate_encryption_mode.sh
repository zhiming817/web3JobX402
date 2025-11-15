#!/bin/bash

# 数据库迁移脚本 - 添加 encryption_mode 字段

echo "🔄 Starting database migration: Add encryption_mode field"

# 数据库连接信息
DB_HOST="127.0.0.1"
DB_PORT="3306"
DB_USER="root"
DB_PASS="root"
DB_NAME="resume_vault_sui"

# 执行迁移
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" < migrations/004_add_encryption_mode.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi

# 验证字段是否添加成功
echo ""
echo "📊 Verifying new column..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "DESCRIBE resumes;"

echo ""
echo "✅ Done!"
