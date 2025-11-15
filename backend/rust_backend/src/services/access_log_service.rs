use sea_orm::DatabaseConnection;
use crate::dao::AccessLogDao;
use crate::entities::access_log;

pub struct AccessLogService;

impl AccessLogService {
    /// 创建访问记录
    pub async fn create_access_log(
        db: &DatabaseConnection,
        resume_id: String,
        accessor_address: String,
        access_type: String,
        encryption_type: String,
        success: bool,
        error_message: Option<String>,
        ip_address: Option<String>,
        user_agent: Option<String>,
    ) -> Result<access_log::Model, String> {
        AccessLogDao::create(
            db,
            resume_id,
            accessor_address,
            access_type,
            encryption_type,
            success,
            error_message,
            ip_address,
            user_agent,
        )
        .await
        .map_err(|e| format!("Failed to create access log: {}", e))
    }

    /// 获取简历的访问记录
    pub async fn get_resume_access_logs(
        db: &DatabaseConnection,
        resume_id: &str,
        limit: u64,
    ) -> Result<Vec<access_log::Model>, String> {
        AccessLogDao::find_by_resume_id(db, resume_id, limit)
            .await
            .map_err(|e| format!("Failed to get access logs: {}", e))
    }

    /// 获取访问者的访问记录
    pub async fn get_accessor_logs(
        db: &DatabaseConnection,
        accessor_address: &str,
        limit: u64,
    ) -> Result<Vec<access_log::Model>, String> {
        AccessLogDao::find_by_accessor(db, accessor_address, limit)
            .await
            .map_err(|e| format!("Failed to get accessor logs: {}", e))
    }

    /// 统计简历的访问次数
    pub async fn count_resume_access(
        db: &DatabaseConnection,
        resume_id: &str,
    ) -> Result<u64, String> {
        AccessLogDao::count_by_resume_id(db, resume_id)
            .await
            .map_err(|e| format!("Failed to count access: {}", e))
    }
}
