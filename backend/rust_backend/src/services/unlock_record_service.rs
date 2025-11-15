use sea_orm::DatabaseConnection;
use crate::dao::UnlockRecordDao;
use crate::entities::unlock_record;

pub struct UnlockRecordService;

impl UnlockRecordService {
    /// 创建解锁记录（支付后调用）
    pub async fn create_unlock_record(
        db: &DatabaseConnection,
        resume_id: i64,
        buyer_id: i64,
        buyer_wallet: String,
        seller_wallet: String,
        amount: i64,
        transaction_signature: String,
        block_time: Option<i64>,
    ) -> Result<unlock_record::Model, String> {
        // 检查是否已存在相同的交易签名（防止重复记录）
        let exists = UnlockRecordDao::exists_by_signature(db, &transaction_signature)
            .await
            .map_err(|e| format!("Failed to check transaction signature: {}", e))?;

        if exists {
            return Err("Transaction already recorded".to_string());
        }

        // 创建解锁记录
        UnlockRecordDao::create(
            db,
            resume_id,
            buyer_id,
            buyer_wallet,
            seller_wallet,
            amount,
            transaction_signature,
            block_time,
        )
        .await
        .map_err(|e| format!("Failed to create unlock record: {}", e))
    }

    /// 检查用户是否已解锁某简历
    pub async fn has_unlocked(
        db: &DatabaseConnection,
        resume_id: i64,
        buyer_id: i64,
    ) -> Result<bool, String> {
        let record = UnlockRecordDao::find_by_resume_and_buyer(db, resume_id, buyer_id)
            .await
            .map_err(|e| format!("Failed to check unlock status: {}", e))?;

        Ok(record.is_some())
    }

    /// 获取用户已解锁的所有简历
    pub async fn get_unlocked_resumes(
        db: &DatabaseConnection,
        buyer_wallet: &str,
    ) -> Result<Vec<unlock_record::Model>, String> {
        UnlockRecordDao::find_unlocked_resumes_by_buyer(db, buyer_wallet)
            .await
            .map_err(|e| format!("Failed to get unlocked resumes: {}", e))
    }

    /// 获取简历的所有解锁记录（简历所有者可查看）
    pub async fn get_resume_unlock_records(
        db: &DatabaseConnection,
        resume_id: i64,
    ) -> Result<Vec<unlock_record::Model>, String> {
        UnlockRecordDao::find_by_resume_id(db, resume_id)
            .await
            .map_err(|e| format!("Failed to get unlock records: {}", e))
    }
}
