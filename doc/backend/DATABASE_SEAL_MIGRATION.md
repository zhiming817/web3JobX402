# 数据库迁移状态 - Seal 加密支持

## 📋 迁移概述

**迁移编号**: 002  
**迁移名称**: 添加 Seal 加密支持字段  
**创建时间**: 2025-11-12  
**状态**: ✅ 准备就绪

## 🎯 迁移目标

为简历系统添加 Seal 阈值加密和访问控制支持，使系统能够同时支持：
1. **简单加密模式** - 用户自己管理加密密钥
2. **Seal 加密模式** - 基于链上 Allowlist 的访问控制

## 📊 数据库变更

### 1. `users` 表更新

| 字段 | 变更类型 | 说明 |
|------|---------|------|
| `wallet_address` | 修改长度 | VARCHAR(44) → VARCHAR(100) |

**原因**: 支持 Sui 地址（比 Solana 地址更长）

### 2. `resumes` 表更新

| 字段 | 变更类型 | 原字段/说明 |
|------|---------|-----------|
| `owner_wallet` | 修改长度 | VARCHAR(44) → VARCHAR(100) |
| `blob_id` | 重命名+修改 | `ipfs_cid` → `blob_id` (VARCHAR(150)) |
| `encryption_key` | 修改为可选 | TEXT NOT NULL → TEXT NULL |
| `encryption_id` | 新增 | VARCHAR(150) NULL - Seal 加密 ID |
| `policy_object_id` | 新增 | VARCHAR(100) NULL - Allowlist 对象 ID |
| `encryption_type` | 新增 | VARCHAR(20) NOT NULL DEFAULT 'simple' |

**索引变更**:
- 新增: `idx_policy_object` - policy_object_id
- 新增: `idx_encryption_type` - encryption_type

### 3. `unlock_records` 表更新

| 字段 | 变更类型 | 说明 |
|------|---------|------|
| `buyer_wallet` | 修改长度 | VARCHAR(44) → VARCHAR(100) |
| `seller_wallet` | 修改长度 | VARCHAR(44) → VARCHAR(100) |
| `transaction_signature` | 修改长度 | VARCHAR(88) → VARCHAR(150) |

### 4. 新表：`allowlist_members`

用于同步链上 Allowlist 白名单成员。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT | 主键 |
| `policy_object_id` | VARCHAR(100) | Allowlist 对象 ID |
| `member_address` | VARCHAR(100) | 白名单成员地址 |
| `resume_id` | BIGINT | 关联的简历 ID |
| `added_by` | VARCHAR(100) | 添加者地址 |
| `tx_digest` | VARCHAR(150) | 添加交易哈希 |
| `status` | VARCHAR(20) | active/removed |
| `created_at` | DATETIME | 创建时间 |
| `updated_at` | DATETIME | 更新时间 |

**索引**:
- `idx_policy_object` - policy_object_id
- `idx_member_address` - member_address  
- `idx_resume_id` - resume_id
- `idx_status` - status
- `uk_policy_member` - UNIQUE(policy_object_id, member_address)

### 5. 新表：`access_logs`

记录简历访问日志。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | BIGINT | 主键 |
| `resume_id` | BIGINT | 简历 ID |
| `accessor_address` | VARCHAR(100) | 访问者地址 |
| `access_type` | VARCHAR(20) | view/download/decrypt |
| `encryption_type` | VARCHAR(20) | simple/seal |
| `success` | BOOLEAN | 是否成功 |
| `error_message` | TEXT | 错误信息 |
| `ip_address` | VARCHAR(45) | IP 地址 |
| `user_agent` | TEXT | User Agent |
| `created_at` | DATETIME | 创建时间 |

**索引**:
- `idx_resume_id` - resume_id
- `idx_accessor` - accessor_address
- `idx_access_type` - access_type
- `idx_created_at` - created_at

## 🚀 执行迁移

### 方法 1: 使用迁移脚本（推荐）

```bash
# 1. 设置数据库连接
export DATABASE_URL='mysql://user:password@localhost:3306/resume_vault_sui'

# 2. 执行迁移脚本
cd backend/rust_backend
./scripts/migrate_seal_fields.sh
```

### 方法 2: 手动执行 SQL

```bash
mysql -u user -p resume_vault_sui < migrations/002_add_seal_fields.sql
```

### 方法 3: 使用 MySQL Workbench

1. 打开 `migrations/002_add_seal_fields.sql`
2. 连接到数据库
3. 执行 SQL 脚本

## ✅ 验证迁移

### 1. 检查表结构

```sql
-- 检查 resumes 表
DESCRIBE resumes;

-- 应该看到新字段:
-- - blob_id (VARCHAR(150))
-- - encryption_id (VARCHAR(150))
-- - policy_object_id (VARCHAR(100))
-- - encryption_type (VARCHAR(20))
```

### 2. 检查新表

```sql
-- 检查 allowlist_members 表
SHOW CREATE TABLE allowlist_members;

-- 检查 access_logs 表
SHOW CREATE TABLE access_logs;
```

### 3. 检查索引

```sql
-- 查看 resumes 表索引
SHOW INDEX FROM resumes;

-- 应该看到:
-- - idx_policy_object
-- - idx_encryption_type
```

## 🔄 回滚方案

如果需要回滚迁移：

```sql
-- 1. 删除新表
DROP TABLE IF EXISTS access_logs;
DROP TABLE IF EXISTS allowlist_members;

-- 2. 删除新字段
ALTER TABLE resumes
    DROP COLUMN encryption_type,
    DROP COLUMN policy_object_id,
    DROP COLUMN encryption_id,
    MODIFY COLUMN encryption_key TEXT NOT NULL,
    CHANGE COLUMN blob_id ipfs_cid VARCHAR(100) NOT NULL,
    MODIFY COLUMN owner_wallet VARCHAR(44) NOT NULL;

-- 3. 恢复 unlock_records 表
ALTER TABLE unlock_records
    MODIFY COLUMN buyer_wallet VARCHAR(44) NOT NULL,
    MODIFY COLUMN seller_wallet VARCHAR(44) NOT NULL,
    MODIFY COLUMN transaction_signature VARCHAR(88) UNIQUE NOT NULL;

-- 4. 恢复 users 表
ALTER TABLE users
    MODIFY COLUMN wallet_address VARCHAR(44) UNIQUE NOT NULL;
```

## 📝 Rust 实体更新

已更新以下 Rust 实体文件以匹配新的数据库结构：

### 更新的文件

1. ✅ `src/entities/user.rs` - 扩展 wallet_address 长度
2. ✅ `src/entities/resume.rs` - 添加 Seal 字段
3. ✅ `src/entities/unlock_record.rs` - 扩展地址长度
4. ✅ `src/entities/allowlist_member.rs` - 新建
5. ✅ `src/entities/access_log.rs` - 新建
6. ✅ `src/entities/mod.rs` - 导出新实体

### 关键变更

**resume.rs**:
```rust
// 新增字段
pub blob_id: String,                    // 替代 ipfs_cid
pub encryption_key: Option<String>,     // 改为可选
pub encryption_id: Option<String>,      // Seal 加密 ID
pub policy_object_id: Option<String>,   // Allowlist ID
pub encryption_type: String,            // simple/seal
```

## 🔍 数据兼容性

### 现有数据处理

迁移脚本会自动处理现有数据：

1. **`ipfs_cid` → `blob_id`**: 字段重命名，数据保留
2. **`encryption_key`**: 现有值保留，新记录可为 NULL
3. **`encryption_type`**: 默认值为 'simple'（兼容现有简历）
4. **新字段**: 对现有记录为 NULL

### 新数据格式

**简单加密模式**:
```json
{
  "encryption_type": "simple",
  "blob_id": "blobId123",
  "encryption_key": "base64Key...",
  "encryption_id": null,
  "policy_object_id": null
}
```

**Seal 加密模式**:
```json
{
  "encryption_type": "seal",
  "blob_id": "blobId456",
  "encryption_key": null,
  "encryption_id": "0x...encryptionId",
  "policy_object_id": "0x...allowlistId"
}
```

## 🎯 后续工作

- [ ] 更新 DAO 层支持新字段
- [ ] 更新 Controller 层处理 Seal 相关请求
- [ ] 实现白名单同步逻辑
- [ ] 实现访问日志记录
- [ ] 添加迁移测试
- [ ] 更新 API 文档

## 📚 相关文档

- [Seal 技术文档](./SEAL_RESUME_INTEGRATION.md)
- [前端集成文档](./SEAL_FRONTEND_INTEGRATION.md)
- [数据库设计文档](./README_DB.md)

---

**迁移状态**: ✅ 准备就绪  
**最后更新**: 2025-11-12  
**维护者**: Web3JobX 团队
