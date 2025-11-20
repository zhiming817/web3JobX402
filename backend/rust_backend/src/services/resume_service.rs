use crate::models::{Resume, CreateResumeRequest, MyResumeSummary, ResumeListItem};
use crate::dao::ResumeDao;
use crate::services::UserService;
use sea_orm::DatabaseConnection;

/// 简历服务层
pub struct ResumeService;

impl ResumeService {
    /// 创建简历（前端已加密并上传，后端只存储 CID）
    pub async fn create_resume(
        db: &DatabaseConnection,
        request: CreateResumeRequest,
        blob_id: String,  // Walrus Blob ID
    ) -> Result<String, String> {
        // 1. 先确保用户存在(如果不存在则自动创建)
        let user_id = UserService::create_or_get_user(db, request.owner.clone())
            .await
            .map_err(|e| format!("Failed to create/get user: {}", e))?;

        // 2. 生成简历 ID
        let resume_id = format!("resume-{}", uuid::Uuid::new_v4());
        let now = chrono::Utc::now().timestamp();

        let resume = Resume {
            id: resume_id.clone(),
            owner: request.owner.clone(),
            personal: request.personal,
            skills: request.skills,
            desired_position: request.desired_position,
            work_experience: request.work_experience,
            project_experience: request.project_experience,
            education: request.education,
            certificates: request.certificates,
            created_at: now,
            updated_at: now,
            ipfs_cid: None, // 已废弃
            blob_id: Some(blob_id.clone()),
            encryption_id: request.encryption_id.clone(),
            policy_object_id: request.policy_object_id.clone(),
            encryption_type: request.encryption_type.clone(),
            encryption_mode: request.encryption_mode.clone(),
        };

        log::info!("Creating resume with Blob ID: {}, encryption_type: {:?}, encryption_mode: {:?}", 
                   blob_id, request.encryption_type, request.encryption_mode);

        // 3. 创建简历记录
        // 注意: 简单加密时 encryption_key 由前端管理不存储; Seal 加密时为 None
        let encryption_key = request.encryption_key.unwrap_or_default();
        
        ResumeDao::create(db, user_id, resume, blob_id, encryption_key)
            .await
            .map_err(|e| format!("Failed to create resume: {}", e))?;
        
        Ok(resume_id)
    }

    /// 获取简历摘要列表
    pub async fn get_resume_summaries(
        db: &DatabaseConnection,
        page: u64,
        page_size: u64
    ) -> Result<Vec<ResumeListItem>, String> {
        println!("📋 get_resume_summaries called with page={}, page_size={}", page, page_size);
        
        let (resumes, _total) = ResumeDao::find_all_active(db, page, page_size)
            .await
            .map_err(|e| format!("Failed to fetch resumes: {}", e))?;
        
        println!("📦 Retrieved {} resumes from DAO", resumes.len());
        
        // 只返回基本信息和加密字段，不解密详细内容
        // 详细内容应该通过 Seal 从 Walrus 解密获取
        let list_items: Vec<ResumeListItem> = resumes.iter()
            .map(|r| ResumeListItem {
                id: r.resume_id.clone(),
                name: r.name.clone(), // 映射 name 字段
                owner: r.owner_wallet.clone(),
                price: r.price,
                policy_object_id: r.policy_object_id.clone(),
                encryption_id: r.encryption_id.clone(),
                encryption_type: if r.encryption_type.is_empty() {
                    None
                } else {
                    Some(r.encryption_type.clone())
                },
                encryption_mode: r.encryption_mode.clone(),
                blob_id: if r.blob_id.is_empty() {
                    None
                } else {
                    Some(r.blob_id.clone())
                },
            })
            .collect();
        
        println!("✅ Returning {} list items", list_items.len());
        
        Ok(list_items)
    }

    /// 获取我的简历（只返回摘要信息）
    pub async fn get_my_resumes(
        db: &DatabaseConnection,
        owner: &str
    ) -> Result<Vec<MyResumeSummary>, String> {
        let resumes = ResumeDao::find_by_owner(db, owner)
            .await
            .map_err(|e| format!("Failed to fetch resumes: {}", e))?;
        
        // 只返回摘要信息，不包含详细内容
        let summaries: Vec<MyResumeSummary> = resumes.iter()
            .filter_map(|r| {
                let resume: Resume = serde_json::from_value(r.summary.clone()).ok()?;
                Some(MyResumeSummary {
                    id: resume.id,
                    name: r.name.clone(), // 优先使用数据库中的 name，如果没有则使用 summary 中的
                    owner: resume.owner,
                    created_at: resume.created_at,
                    updated_at: resume.updated_at,
                    price: r.price,
                    view_count: r.view_count,
                    unlock_count: r.unlock_count,
                    status: r.status.clone(),
                    ipfs_cid: resume.ipfs_cid,
                    blob_id: resume.blob_id,
                    encryption_id: resume.encryption_id,
                    policy_object_id: resume.policy_object_id,
                    encryption_type: resume.encryption_type,
                    encryption_mode: resume.encryption_mode,
                })
            })
            .collect();
        
        Ok(summaries)
    }

    /// 根据 owner 和简历 ID 获取简历详情
    pub async fn get_resume_detail(
        db: &DatabaseConnection,
        resume_id: &str,
        owner: &str
    ) -> Result<Resume, String> {
        // 1. 获取简历
        let resume = ResumeDao::find_by_resume_id(db, resume_id)
            .await
            .map_err(|e| format!("Failed to fetch resume: {}", e))?
            .ok_or_else(|| "Resume not found".to_string())?;

        // 2. 验证所有权
        if resume.owner_wallet != owner {
            return Err("Unauthorized: You don't own this resume".to_string());
        }

        // 3. 从 summary 解析完整简历数据
        let mut resume_data: Resume = serde_json::from_value(resume.summary.clone())
            .map_err(|e| format!("Failed to parse resume: {}", e))?;

        // 4. 添加数据库中的加密相关字段（这些字段不在 summary 中）
        resume_data.ipfs_cid = Some(resume.blob_id.clone()); // 向后兼容
        resume_data.blob_id = Some(resume.blob_id.clone());
        resume_data.encryption_id = resume.encryption_id.clone();
        resume_data.policy_object_id = resume.policy_object_id.clone();
        resume_data.encryption_type = Some(resume.encryption_type.clone());
        resume_data.encryption_mode = resume.encryption_mode.clone();

        log::info!("Resume detail: id={}, encryption_type={}, encryption_mode={:?}, policy_object_id={:?}", 
                   resume_id, resume.encryption_type, resume.encryption_mode, resume.policy_object_id);

        Ok(resume_data)
    }

    /// 更新简历
    pub async fn update_resume(
        db: &DatabaseConnection,
        resume_id: &str,
        request: CreateResumeRequest
    ) -> Result<(), String> {
        let existing = ResumeDao::find_by_resume_id(db, resume_id)
            .await
            .map_err(|e| format!("Failed to fetch resume: {}", e))?
            .ok_or_else(|| "Resume not found".to_string())?;

        // 使用新的 blob_id（如果提供），否则保留旧的
        let new_blob_id = request.blob_id
            .clone()
            .or(request.ipfs_cid.clone())  // 向后兼容
            .unwrap_or(existing.blob_id.clone());

        let updated = Resume {
            id: resume_id.to_string(),
            owner: existing.owner_wallet.clone(),
            personal: request.personal,
            skills: request.skills,
            desired_position: request.desired_position,
            work_experience: request.work_experience,
            project_experience: request.project_experience,
            education: request.education,
            certificates: request.certificates,
            created_at: existing.created_at.and_utc().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
            ipfs_cid: None, // 已废弃
            blob_id: Some(new_blob_id.clone()),
            encryption_id: request.encryption_id.clone(),
            policy_object_id: request.policy_object_id.clone(),
            encryption_type: request.encryption_type.clone(),
            encryption_mode: request.encryption_mode.clone(),
        };

        let summary = serde_json::to_value(&updated)
            .map_err(|e| format!("Failed to serialize resume: {}", e))?;

        ResumeDao::update(
            db,
            resume_id,
            new_blob_id,
            existing.encryption_key,
            summary,
            existing.price
        )
        .await
        .map_err(|e| format!("Failed to update resume: {}", e))?;

        Ok(())
    }

    /// 删除简历
    pub async fn delete_resume(
        db: &DatabaseConnection,
        resume_id: &str,
        owner: &str
    ) -> Result<(), String> {
        let resume = ResumeDao::find_by_resume_id(db, resume_id)
            .await
            .map_err(|e| format!("Failed to fetch resume: {}", e))?
            .ok_or_else(|| "Resume not found".to_string())?;

        // 验证所有权
        if resume.owner_wallet != owner {
            return Err("Unauthorized: You don't own this resume".to_string());
        }

        ResumeDao::soft_delete(db, resume_id)
            .await
            .map_err(|e| format!("Failed to delete resume: {}", e))?;

        Ok(())
    }

    /// 设置简历价格
    pub async fn set_resume_price(
        db: &DatabaseConnection,
        resume_id: &str,
        owner: &str,
        price: u64,
    ) -> Result<(), String> {
        let resume = ResumeDao::find_by_resume_id(db, resume_id)
            .await
            .map_err(|e| format!("Failed to fetch resume: {}", e))?
            .ok_or_else(|| "Resume not found".to_string())?;

        // 验证所有权
        if resume.owner_wallet != owner {
            return Err("Unauthorized: You don't own this resume".to_string());
        }

        // 更新价格
        ResumeDao::update_price(db, resume_id, price)
            .await
            .map_err(|e| format!("Failed to update resume price: {}", e))?;

        Ok(())
    }

    /// 更新简历名称
    pub async fn update_resume_name(
        db: &DatabaseConnection,
        resume_id: &str,
        owner: &str,
        name: String,
    ) -> Result<(), String> {
        let resume = ResumeDao::find_by_resume_id(db, resume_id)
            .await
            .map_err(|e| format!("Failed to fetch resume: {}", e))?
            .ok_or_else(|| "Resume not found".to_string())?;

        // 验证所有权
        if resume.owner_wallet != owner {
            return Err("Unauthorized: You don't own this resume".to_string());
        }

        // 更新名称
        ResumeDao::update_name(db, resume_id, name)
            .await
            .map_err(|e| format!("Failed to update resume name: {}", e))?;

        Ok(())
    }
}
