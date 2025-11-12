-- 创建数据库
CREATE DATABASE IF NOT EXISTS resume_vault_sui CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE resume_vault_sui;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    wallet_address VARCHAR(80) UNIQUE NOT NULL COMMENT 'Solana 钱包地址',
    nickname VARCHAR(100) COMMENT '用户昵称',
    user_type VARCHAR(20) NOT NULL COMMENT '用户类型: job_seeker 或 recruiter',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_wallet (wallet_address),
    INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 简历表
CREATE TABLE IF NOT EXISTS resumes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resume_id VARCHAR(64) UNIQUE NOT NULL COMMENT '简历唯一ID',
    owner_id BIGINT NOT NULL COMMENT '所有者用户ID',
    owner_wallet VARCHAR(80) NOT NULL COMMENT '所有者钱包地址',
    ipfs_cid VARCHAR(100) NOT NULL COMMENT 'IPFS/walus blob ID',
    encryption_key TEXT NOT NULL COMMENT '加密密钥',
    summary JSON NOT NULL COMMENT '公开摘要',
    price BIGINT NOT NULL DEFAULT 50000000 COMMENT '解锁价格(lamports)',
    view_count INT NOT NULL DEFAULT 0 COMMENT '浏览次数',
    unlock_count INT NOT NULL DEFAULT 0 COMMENT '解锁次数',
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active, inactive, deleted',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_resume_id (resume_id),
    INDEX idx_owner_wallet (owner_wallet),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='简历表';

-- 解锁记录表
CREATE TABLE IF NOT EXISTS unlock_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resume_id BIGINT NOT NULL COMMENT '简历ID',
    buyer_id BIGINT NOT NULL COMMENT '购买者用户ID',
    buyer_wallet VARCHAR(80) NOT NULL COMMENT '购买者钱包地址',
    seller_wallet VARCHAR(80) NOT NULL COMMENT '卖家钱包地址',
    amount BIGINT NOT NULL COMMENT '支付金额(lamports)',
    transaction_signature VARCHAR(88) UNIQUE NOT NULL COMMENT ' 交易签名',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态: pending, confirmed, failed',
    block_time BIGINT COMMENT '区块时间戳',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_resume_id (resume_id),
    INDEX idx_buyer_wallet (buyer_wallet),
    INDEX idx_seller_wallet (seller_wallet),
    INDEX idx_transaction (transaction_signature),
    INDEX idx_status (status),
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='解锁记录表';
