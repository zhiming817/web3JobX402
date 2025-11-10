use crate::models::{Resume, ResumeSummary, CreateResumeRequest, ResumeWithPrice, MyResumeSummary};
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
        ipfs_cid: String,  // 前端上传后返回的 CID
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
            ipfs_cid: None, // CID is stored separately in database
        };

        log::info!("Creating resume with CID: {}", ipfs_cid);

        // 3. 创建简历记录(使用前端提供的 CID，不再生成加密密钥)
        // 注意：加密密钥由前端管理，不存储在后端
        let encryption_key = String::new(); // 空字符串，表示前端加密
        
        ResumeDao::create(db, user_id, resume, ipfs_cid, encryption_key)
            .await
            .map_err(|e| format!("Failed to create resume: {}", e))?;
        
        Ok(resume_id)
    }

    /// 获取简历摘要列表
    pub async fn get_resume_summaries(
        db: &DatabaseConnection,
        page: u64,
        page_size: u64
    ) -> Result<Vec<ResumeSummary>, String> {
        let (resumes, _total) = ResumeDao::find_all_active(db, page, page_size)
            .await
            .map_err(|e| format!("Failed to fetch resumes: {}", e))?;
        
        // 转换为摘要
        let summaries: Vec<ResumeSummary> = resumes.iter()
            .filter_map(|r| {
                serde_json::from_value(r.summary.clone()).ok()
            })
            .collect();
        
        Ok(summaries)
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
                    owner: resume.owner,
                    created_at: resume.created_at,
                    updated_at: resume.updated_at,
                    price: r.price,
                    view_count: r.view_count,
                    unlock_count: r.unlock_count,
                    status: r.status.clone(),
                    ipfs_cid: resume.ipfs_cid,
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

        // 4. 添加 IPFS CID（用于前端解密）
        resume_data.ipfs_cid = Some(resume.ipfs_cid.clone());

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

        // 使用新的 CID（如果提供），否则保留旧的 CID
        let new_ipfs_cid = request.ipfs_cid
            .clone()
            .unwrap_or(existing.ipfs_cid.clone());

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
            ipfs_cid: None, // CID is stored separately in database
        };

        let summary = serde_json::to_value(&updated)
            .map_err(|e| format!("Failed to serialize resume: {}", e))?;

        ResumeDao::update(
            db,
            resume_id,
            new_ipfs_cid,  // 使用新的 CID
            existing.encryption_key.clone(),
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
}
