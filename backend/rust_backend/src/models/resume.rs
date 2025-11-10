use serde::{Deserialize, Serialize};

/// 简历基本信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalInfo {
    pub name: String,
    pub gender: String,
    pub birth_date: Option<String>,
    pub work_start_date: Option<String>,
    pub job_status: String,
    pub phone: String,
    pub wechat: Option<String>,
    pub email: String,
}

/// 期望职位
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesiredPosition {
    pub job_type: String,
    pub position: String,
    pub industry: String,
    pub salary_min: Option<u32>,
    pub salary_max: Option<u32>,
    pub city: String,
    pub other_cities: Vec<String>,
}

/// 工作经历
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkExperience {
    pub company: String,
    pub position: String,
    pub start_date: String,
    pub end_date: Option<String>,
    pub description: Option<String>,
}

/// 项目经历
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectExperience {
    pub name: String,
    pub role: String,
    pub start_date: String,
    pub end_date: Option<String>,
    pub link: Option<String>,
    pub description: Option<String>,
}

/// 教育经历
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Education {
    pub school: String,
    pub major: String,
    pub degree: String,
    pub education_type: String,
    pub start_date: String,
    pub end_date: Option<String>,
    pub thesis: Option<String>,
}

/// 证书
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Certificate {
    pub name: String,
    pub issuer: String,
    pub number: Option<String>,
    pub issue_date: String,
    pub expiry_date: Option<String>,
    pub no_expiry: bool,
}

/// 完整简历
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resume {
    pub id: String,
    pub owner: String, // 钱包地址
    pub personal: PersonalInfo,
    pub skills: String,
    pub desired_position: DesiredPosition,
    pub work_experience: Vec<WorkExperience>,
    pub project_experience: Vec<ProjectExperience>,
    pub education: Vec<Education>,
    pub certificates: Vec<Certificate>,
    pub created_at: i64,
    pub updated_at: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ipfs_cid: Option<String>, // IPFS CID for encrypted resume
}

/// 包含价格的简历（用于"我的简历"列表）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResumeWithPrice {
    #[serde(flatten)]
    pub resume: Resume,
    pub price: i64, // 价格（lamports）
    pub view_count: i32,
    pub unlock_count: i32,
    pub status: String,
}

/// 我的简历摘要（只包含必要字段，不包含详细内容）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MyResumeSummary {
    pub id: String,
    pub owner: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub price: i64,
    pub view_count: i32,
    pub unlock_count: i32,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ipfs_cid: Option<String>,
}

/// 简历摘要（公开信息）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResumeSummary {
    pub id: String,
    pub name: String, // 脱敏后的姓名
    pub position: String,
    pub skills: Vec<String>,
    pub experience: String,
    pub education: String,
    pub city: String,
    pub price: f64, // SOL or USDC
    pub owner: String,
}

/// 设置简历价格请求
#[derive(Debug, Clone, Deserialize)]
pub struct SetPriceRequest {
    pub resume_id: String,
    pub owner: String,
    pub price: u64, // 价格，单位：lamports (1 SOL = 1_000_000_000 lamports)
}

/// 简历创建请求
#[derive(Debug, Clone, Deserialize)]
pub struct CreateResumeRequest {
    pub owner: String,
    pub ipfs_cid: Option<String>,  // 新增：前端上传后的 CID（可选，用于前端加密方案）
    pub personal: PersonalInfo,
    pub skills: String,
    pub desired_position: DesiredPosition,
    pub work_experience: Vec<WorkExperience>,
    pub project_experience: Vec<ProjectExperience>,
    pub education: Vec<Education>,
    pub certificates: Vec<Certificate>,
}
