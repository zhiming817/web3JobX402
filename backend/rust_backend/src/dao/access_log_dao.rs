use sea_orm::*;
use crate::entities::access_log;

pub struct AccessLogDao;

impl AccessLogDao {
    /// 创建访问记录
    #[allow(dead_code)]
    pub async fn create(
        db: &DatabaseConnection,
        resume_id: String,
        accessor_address: String,
        access_type: String,
        encryption_type: String,
        success: bool,
        error_message: Option<String>,
        ip_address: Option<String>,
        user_agent: Option<String>,
    ) -> Result<access_log::Model, DbErr> {
        let now = chrono::Utc::now();

        let new_log = access_log::ActiveModel {
            resume_id: Set(resume_id),
            accessor_address: Set(accessor_address),
            access_type: Set(access_type),
            encryption_type: Set(encryption_type),
            success: Set(success),
            error_message: Set(error_message),
            ip_address: Set(ip_address),
            user_agent: Set(user_agent),
            created_at: Set(now.naive_utc()),
            ..Default::default()
        };

        new_log.insert(db).await
    }

    /// 获取简历的访问记录
    #[allow(dead_code)]
    pub async fn find_by_resume_id(
        db: &DatabaseConnection,
        resume_id: &str,
        limit: u64,
    ) -> Result<Vec<access_log::Model>, DbErr> {
        access_log::Entity::find()
            .filter(access_log::Column::ResumeId.eq(resume_id))
            .order_by_desc(access_log::Column::CreatedAt)
            .limit(limit)
            .all(db)
            .await
    }

    /// 获取访问者的访问记录
    #[allow(dead_code)]
    pub async fn find_by_accessor(
        db: &DatabaseConnection,
        accessor_address: &str,
        limit: u64,
    ) -> Result<Vec<access_log::Model>, DbErr> {
        access_log::Entity::find()
            .filter(access_log::Column::AccessorAddress.eq(accessor_address))
            .order_by_desc(access_log::Column::CreatedAt)
            .limit(limit)
            .all(db)
            .await
    }

    /// 统计简历的访问次数
    #[allow(dead_code)]
    pub async fn count_by_resume_id(
        db: &DatabaseConnection,
        resume_id: &str,
    ) -> Result<u64, DbErr> {
        access_log::Entity::find()
            .filter(access_log::Column::ResumeId.eq(resume_id))
            .filter(access_log::Column::Success.eq(true))
            .count(db)
            .await
    }
}
