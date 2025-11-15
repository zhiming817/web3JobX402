use serde::{Deserialize, Serialize};

/// 创建访问记录请求
#[derive(Debug, Deserialize, Serialize)]
pub struct CreateAccessLogRequest {
    /// 简历 ID (UUID 字符串)
    pub resume_id: String,
    
    /// 访问者地址
    pub accessor_address: String,
    
    /// 访问类型: view(查看), download(下载), decrypt(解密)
    pub access_type: String,
    
    /// 加密类型: simple(简单加密), seal(Seal 加密)
    pub encryption_type: String,
    
    /// 是否成功
    pub success: bool,
    
    /// 错误信息（可选）
    pub error_message: Option<String>,
}

/// 访问记录响应
#[derive(Debug, Serialize)]
pub struct AccessLogResponse {
    pub id: i64,
    pub resume_id: String,
    pub accessor_address: String,
    pub access_type: String,
    pub encryption_type: String,
    pub success: bool,
    pub error_message: Option<String>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: String,
}

impl From<crate::entities::access_log::Model> for AccessLogResponse {
    fn from(model: crate::entities::access_log::Model) -> Self {
        Self {
            id: model.id,
            resume_id: model.resume_id,
            accessor_address: model.accessor_address,
            access_type: model.access_type,
            encryption_type: model.encryption_type,
            success: model.success,
            error_message: model.error_message,
            ip_address: model.ip_address,
            user_agent: model.user_agent,
            created_at: model.created_at.format("%Y-%m-%d %H:%M:%S").to_string(),
        }
    }
}
