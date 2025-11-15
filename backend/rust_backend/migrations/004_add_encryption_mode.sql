-- 添加 encryption_mode 字段到 resumes 表
USE resume_vault_sui;

-- 添加 encryption_mode 字段
ALTER TABLE resumes 
ADD COLUMN encryption_mode VARCHAR(20) NULL COMMENT 'Seal加密模式: allowlist 或 subscription' AFTER encryption_type;

-- 为现有数据设置默认值
-- 如果 policy_object_id 不为空且 encryption_type='seal'，根据数据特征推断模式
UPDATE resumes 
SET encryption_mode = 'subscription' 
WHERE encryption_type = 'seal' AND policy_object_id IS NOT NULL;

-- 创建索引以提升查询性能
CREATE INDEX idx_encryption_mode ON resumes(encryption_mode);

-- 添加注释
ALTER TABLE resumes 
MODIFY COLUMN encryption_mode VARCHAR(20) NULL COMMENT 'Seal加密模式: allowlist(白名单) 或 subscription(订阅付费)';
