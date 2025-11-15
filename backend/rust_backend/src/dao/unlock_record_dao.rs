use sea_orm::*;
use crate::entities::unlock_record;

pub struct UnlockRecordDao;

impl UnlockRecordDao {
    /// 创建解锁记录
    #[allow(dead_code)]
    pub async fn create(
        db: &DatabaseConnection,
        resume_id: i64,
        buyer_id: i64,
        buyer_wallet: String,
        seller_wallet: String,
        amount: i64,
        transaction_signature: String,
        block_time: Option<i64>,
    ) -> Result<unlock_record::Model, DbErr> {
        let now = chrono::Utc::now();

        let new_record = unlock_record::ActiveModel {
            resume_id: Set(resume_id),
            buyer_id: Set(buyer_id),
            buyer_wallet: Set(buyer_wallet),
            seller_wallet: Set(seller_wallet),
            amount: Set(amount),
            transaction_signature: Set(transaction_signature),
            status: Set("confirmed".to_string()),
            block_time: Set(block_time),
            created_at: Set(now.naive_utc()),
            ..Default::default()
        };

        new_record.insert(db).await
    }

    /// 检查是否已经存在相同的交易签名（防止重复记录）
    #[allow(dead_code)]
    pub async fn exists_by_signature(
        db: &DatabaseConnection,
        transaction_signature: &str,
    ) -> Result<bool, DbErr> {
        let count = unlock_record::Entity::find()
            .filter(unlock_record::Column::TransactionSignature.eq(transaction_signature))
            .count(db)
            .await?;
        
        Ok(count > 0)
    }

    /// 根据简历 ID 和购买者 ID 查询解锁记录
    #[allow(dead_code)]
    pub async fn find_by_resume_and_buyer(
        db: &DatabaseConnection,
        resume_id: i64,
        buyer_id: i64,
    ) -> Result<Option<unlock_record::Model>, DbErr> {
        unlock_record::Entity::find()
            .filter(unlock_record::Column::ResumeId.eq(resume_id))
            .filter(unlock_record::Column::BuyerId.eq(buyer_id))
            .filter(unlock_record::Column::Status.eq("confirmed"))
            .one(db)
            .await
    }

    /// 根据购买者钱包地址查询所有已解锁的简历
    #[allow(dead_code)]
    pub async fn find_unlocked_resumes_by_buyer(
        db: &DatabaseConnection,
        buyer_wallet: &str,
    ) -> Result<Vec<unlock_record::Model>, DbErr> {
        unlock_record::Entity::find()
            .filter(unlock_record::Column::BuyerWallet.eq(buyer_wallet))
            .filter(unlock_record::Column::Status.eq("confirmed"))
            .order_by_desc(unlock_record::Column::CreatedAt)
            .all(db)
            .await
    }

    /// 根据简历 ID 查询所有解锁记录
    #[allow(dead_code)]
    pub async fn find_by_resume_id(
        db: &DatabaseConnection,
        resume_id: i64,
    ) -> Result<Vec<unlock_record::Model>, DbErr> {
        unlock_record::Entity::find()
            .filter(unlock_record::Column::ResumeId.eq(resume_id))
            .filter(unlock_record::Column::Status.eq("confirmed"))
            .order_by_desc(unlock_record::Column::CreatedAt)
            .all(db)
            .await
    }
}
