-- 添加 Seal 加密相关字段
-- 迁移时间: 2025-11-12
-- 说明: 支持 Seal 阈值加密和访问控制

USE resume_vault_sui;

-- 1. 修改 users 表：将 wallet_address 长度从 80 增加到 100 以支持 Sui 地址
ALTER TABLE users 
    MODIFY COLUMN wallet_address VARCHAR(100) UNIQUE NOT NULL COMMENT 'Sui/Solana 钱包地址';

-- 2. 修改 resumes 表
ALTER TABLE resumes
    -- 修改 owner_wallet 长度以支持 Sui 地址
    MODIFY COLUMN owner_wallet VARCHAR(100) NOT NULL COMMENT '所有者钱包地址',
    
    -- 修改 ipfs_cid 列名为 blob_id 并增加长度（保持向后兼容，可以存储 IPFS CID 或 Walrus Blob ID）
    CHANGE COLUMN ipfs_cid blob_id VARCHAR(150) NOT NULL COMMENT 'IPFS CID 或 Walrus Blob ID',
    
    -- encryption_key 改为可选（使用 Seal 加密时不需要存储密钥）
    MODIFY COLUMN encryption_key TEXT NULL COMMENT '加密密钥（简单加密模式）',
    
    -- 添加 Seal 加密相关字段
    ADD COLUMN encryption_id VARCHAR(150) NULL COMMENT 'Seal 加密 ID' AFTER encryption_key,
    ADD COLUMN policy_object_id VARCHAR(100) NULL COMMENT 'Allowlist 对象 ID（访问控制策略）' AFTER encryption_id,
    ADD COLUMN encryption_type VARCHAR(20) NOT NULL DEFAULT 'simple' COMMENT '加密类型: simple, seal' AFTER policy_object_id,
    
    -- 添加索引
    ADD INDEX idx_policy_object (policy_object_id),
    ADD INDEX idx_encryption_type (encryption_type);

-- 3. 修改 unlock_records 表：将钱包地址长度增加以支持 Sui 地址
ALTER TABLE unlock_records
    MODIFY COLUMN buyer_wallet VARCHAR(100) NOT NULL COMMENT '购买者钱包地址（Sui/Solana）',
    MODIFY COLUMN seller_wallet VARCHAR(100) NOT NULL COMMENT '卖家钱包地址（Sui/Solana）',
    MODIFY COLUMN transaction_signature VARCHAR(150) UNIQUE NOT NULL COMMENT '交易签名（Sui/Solana）';

-- 4. 创建 Allowlist 成员表（用于同步链上白名单）
CREATE TABLE IF NOT EXISTS allowlist_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    policy_object_id VARCHAR(100) NOT NULL COMMENT 'Allowlist 对象 ID',
    member_address VARCHAR(100) NOT NULL COMMENT '白名单成员地址',
    resume_id BIGINT NOT NULL COMMENT '关联的简历 ID',
    added_by VARCHAR(100) NOT NULL COMMENT '添加者地址',
    tx_digest VARCHAR(150) NOT NULL COMMENT '添加交易哈希',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active, removed',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_policy_object (policy_object_id),
    INDEX idx_member_address (member_address),
    INDEX idx_resume_id (resume_id),
    INDEX idx_status (status),
    UNIQUE KEY uk_policy_member (policy_object_id, member_address),
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Allowlist 成员表';

-- 5. 创建访问日志表（记录解密访问）
CREATE TABLE IF NOT EXISTS access_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resume_id BIGINT NOT NULL COMMENT '简历 ID',
    accessor_address VARCHAR(100) NOT NULL COMMENT '访问者地址',
    access_type VARCHAR(20) NOT NULL COMMENT '访问类型: view, download, decrypt',
    encryption_type VARCHAR(20) NOT NULL COMMENT '加密类型: simple, seal',
    success BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否成功',
    error_message TEXT NULL COMMENT '错误信息',
    ip_address VARCHAR(45) NULL COMMENT 'IP 地址',
    user_agent TEXT NULL COMMENT 'User Agent',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_resume_id (resume_id),
    INDEX idx_accessor (accessor_address),
    INDEX idx_access_type (access_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访问日志表';

-- 6. 添加注释说明
ALTER TABLE resumes COMMENT = '简历表（支持简单加密和 Seal 加密）';

-- 完成迁移
SELECT '✅ Migration 002: Seal 加密字段已成功添加' AS status;
