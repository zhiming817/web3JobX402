use sea_orm::*;
use sea_orm::sea_query::Expr;
use crate::entities::{resume, Resume};
use crate::models::Resume as ResumeModel;
use anyhow::Result;

pub struct ResumeDao;

#[allow(dead_code)]
impl ResumeDao {
    /// 创建简历
    pub async fn create(
        db: &DatabaseConnection,
        user_id: i64,
        resume_data: ResumeModel,
        blob_id: String,
        encryption_key: String,
    ) -> Result<i64> {
        let owner = resume_data.owner.clone();
        let summary = serde_json::to_value(&resume_data).unwrap_or_default();
        
        // 从 resume_data 中获取 encryption_type，默认为 "simple"
        let encryption_type = resume_data.encryption_type.clone().unwrap_or_else(|| "simple".to_string());
        
        // 从 resume_data 中获取 encryption_mode
        let encryption_mode = resume_data.encryption_mode.clone();
        
        // 处理 encryption_key：如果是空字符串则转为 None
        let encryption_key_opt = if encryption_key.is_empty() {
            None
        } else {
            Some(encryption_key)
        };
        
        let resume = resume::ActiveModel {
            resume_id: Set(resume_data.id),
            name: Set(Some(resume_data.personal.name)), // 保存姓名到数据库字段
            owner_id: Set(user_id),
            owner_wallet: Set(owner),
            blob_id: Set(blob_id),
            encryption_key: Set(encryption_key_opt),
            encryption_id: Set(resume_data.encryption_id),
            policy_object_id: Set(resume_data.policy_object_id),
            encryption_type: Set(encryption_type),
            encryption_mode: Set(encryption_mode),
            summary: Set(summary),
            price: Set(0), // 默认 5 USDC = 5,000,000 (USDC has 6 decimals)
            view_count: Set(0),
            unlock_count: Set(0),
            status: Set("active".to_string()),
            created_at: Set(chrono::Utc::now().naive_utc()),
            updated_at: Set(chrono::Utc::now().naive_utc()),
            ..Default::default()
        };
        
        let result = resume.insert(db).await?;
        Ok(result.id)
    }
    
    /// 根据 resume_id 查询
    pub async fn find_by_resume_id(
        db: &DatabaseConnection,
        resume_id: &str
    ) -> Result<Option<resume::Model>> {
        let resume = Resume::find()
            .filter(resume::Column::ResumeId.eq(resume_id))
            .one(db)
            .await?;
        Ok(resume)
    }
    
    /// 根据所有者查询所有简历
    pub async fn find_by_owner(
        db: &DatabaseConnection,
        owner_wallet: &str
    ) -> Result<Vec<resume::Model>> {
        let resumes = Resume::find()
            .filter(resume::Column::OwnerWallet.eq(owner_wallet))
            .filter(resume::Column::Status.eq("active"))
            .order_by_desc(resume::Column::CreatedAt)
            .all(db)
            .await?;
        Ok(resumes)
    }
    
    /// 查询所有激活的简历（带分页）
    pub async fn find_all_active(
        db: &DatabaseConnection,
        page: u64,
        page_size: u64
    ) -> Result<(Vec<resume::Model>, u64)> {
        let paginator = Resume::find()
            .filter(resume::Column::Status.eq("active"))
            .order_by_desc(resume::Column::CreatedAt)
            .paginate(db, page_size);
        
        let total = paginator.num_items().await?;
        let resumes = paginator.fetch_page(page - 1).await?;
        
        Ok((resumes, total))
    }
    
    /// 增加浏览次数
    pub async fn increment_view_count(
        db: &DatabaseConnection,
        resume_id: &str
    ) -> Result<()> {
        Resume::update_many()
            .col_expr(
                resume::Column::ViewCount,
                Expr::col(resume::Column::ViewCount).add(1)
            )
            .filter(resume::Column::ResumeId.eq(resume_id))
            .exec(db)
            .await?;
        Ok(())
    }
    
    /// 增加解锁次数
    #[allow(dead_code)]
    pub async fn increment_unlock_count(
        db: &DatabaseConnection,
        resume_id: &str
    ) -> Result<()> {
        Resume::update_many()
            .col_expr(
                resume::Column::UnlockCount,
                Expr::col(resume::Column::UnlockCount).add(1)
            )
            .filter(resume::Column::ResumeId.eq(resume_id))
            .exec(db)
            .await?;
        Ok(())
    }
    
    /// 更新简历
    pub async fn update(
        db: &DatabaseConnection,
        resume_id: &str,
        blob_id: String,
        encryption_key: Option<String>,
        summary: serde_json::Value,
        price: i64,
    ) -> Result<()> {
        Resume::update_many()
            .col_expr(resume::Column::BlobId, Expr::value(blob_id))
            .col_expr(resume::Column::EncryptionKey, Expr::value(encryption_key))
            .col_expr(resume::Column::Summary, Expr::value(summary))
            .col_expr(resume::Column::Price, Expr::value(price))
            .col_expr(resume::Column::UpdatedAt, Expr::value(chrono::Utc::now().naive_utc()))
            .filter(resume::Column::ResumeId.eq(resume_id))
            .exec(db)
            .await?;
        Ok(())
    }
    
    /// 删除简历（软删除）
    pub async fn soft_delete(db: &DatabaseConnection, resume_id: &str) -> Result<()> {
        Resume::update_many()
            .col_expr(resume::Column::Status, Expr::value("deleted"))
            .col_expr(resume::Column::UpdatedAt, Expr::value(chrono::Utc::now().naive_utc()))
            .filter(resume::Column::ResumeId.eq(resume_id))
            .exec(db)
            .await?;
        Ok(())
    }

    /// 更新简历价格
    pub async fn update_price(db: &DatabaseConnection, resume_id: &str, price: u64) -> Result<()> {
        Resume::update_many()
            .col_expr(resume::Column::Price, Expr::value(price as i64))
            .col_expr(resume::Column::UpdatedAt, Expr::value(chrono::Utc::now().naive_utc()))
            .filter(resume::Column::ResumeId.eq(resume_id))
            .exec(db)
            .await?;
        Ok(())
    }
    
    /// 搜索简历
    #[allow(dead_code)]
    pub async fn search(
        db: &DatabaseConnection,
        keyword: Option<&str>,
        city: Option<&str>,
        page: u64,
        page_size: u64
    ) -> Result<(Vec<resume::Model>, u64)> {
        let mut query = Resume::find()
            .filter(resume::Column::Status.eq("active"));
        
        if let Some(kw) = keyword {
            query = query.filter(
                Condition::any()
                    .add(resume::Column::Summary.contains(kw))
            );
        }
        
        if let Some(ct) = city {
            query = query.filter(resume::Column::Summary.contains(ct));
        }
        
        let paginator = query
            .order_by_desc(resume::Column::CreatedAt)
            .paginate(db, page_size);
        
        let total = paginator.num_items().await?;
        let resumes = paginator.fetch_page(page - 1).await?;
        
        Ok((resumes, total))
    }
    
    /// 获取统计数据
    pub async fn get_stats(
        db: &DatabaseConnection,
        owner_wallet: &str
    ) -> Result<(i64, i64, i64)> {
        let resumes = Self::find_by_owner(db, owner_wallet).await?;
        
        let total_views: i32 = resumes.iter().map(|r| r.view_count).sum();
        let total_unlocks: i32 = resumes.iter().map(|r| r.unlock_count).sum();
        let total_earnings: i64 = resumes.iter()
            .map(|r| r.price * r.unlock_count as i64)
            .sum();
        
        Ok((total_views as i64, total_unlocks as i64, total_earnings))
    }

    /// 更新简历名称
    pub async fn update_name(db: &DatabaseConnection, resume_id: &str, name: String) -> Result<()> {
        Resume::update_many()
            .col_expr(resume::Column::Name, Expr::value(name))
            .col_expr(resume::Column::UpdatedAt, Expr::value(chrono::Utc::now().naive_utc()))
            .filter(resume::Column::ResumeId.eq(resume_id))
            .exec(db)
            .await?;
        Ok(())
    }
}
