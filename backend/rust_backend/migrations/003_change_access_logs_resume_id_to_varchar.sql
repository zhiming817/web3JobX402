-- 修改 access_logs.resume_id 类型从 BIGINT 改为 VARCHAR(64)
-- 以匹配 resumes.resume_id (UUID 字符串)

-- 1. 删除外键约束
ALTER TABLE access_logs DROP FOREIGN KEY access_logs_resume_id_fk
;

-- 2. 修改 resume_id 列类型
ALTER TABLE access_logs 
MODIFY COLUMN resume_id VARCHAR(64) NOT NULL COMMENT '简历 ID (UUID)';

-- 3. 重新添加外键约束，引用 resumes.resume_id 而不是 resumes.id
ALTER TABLE access_logs 
ADD CONSTRAINT access_logs_resume_id_fk 
FOREIGN KEY (resume_id) REFERENCES resumes(resume_id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 4. 添加索引以提高查询性能
ALTER TABLE access_logs 
ADD INDEX idx_resume_id (resume_id);
