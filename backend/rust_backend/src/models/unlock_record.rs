use serde::{Deserialize, Serialize};

/// 创建解锁记录请求
#[derive(Debug, Deserialize, Serialize)]
pub struct CreateUnlockRecordRequest {
    /// 简历 ID
    pub resume_id: i64,
    
    /// 购买者用户 ID
    pub buyer_id: i64,
    
    /// 购买者钱包地址
    pub buyer_wallet: String,
    
    /// 卖家钱包地址
    pub seller_wallet: String,
    
    /// 支付金额
    pub amount: i64,
    
    /// 交易签名（Sui transaction digest）
    pub transaction_signature: String,
    
    /// 区块时间戳（可选）
    pub block_time: Option<i64>,
}

/// 解锁记录响应
#[derive(Debug, Serialize)]
pub struct UnlockRecordResponse {
    pub id: i64,
    pub resume_id: i64,
    pub buyer_id: i64,
    pub buyer_wallet: String,
    pub seller_wallet: String,
    pub amount: i64,
    pub transaction_signature: String,
    pub status: String,
    pub block_time: Option<i64>,
    pub created_at: String,
}

impl From<crate::entities::unlock_record::Model> for UnlockRecordResponse {
    fn from(model: crate::entities::unlock_record::Model) -> Self {
        Self {
            id: model.id,
            resume_id: model.resume_id,
            buyer_id: model.buyer_id,
            buyer_wallet: model.buyer_wallet,
            seller_wallet: model.seller_wallet,
            amount: model.amount,
            transaction_signature: model.transaction_signature,
            status: model.status,
            block_time: model.block_time,
            created_at: model.created_at.format("%Y-%m-%d %H:%M:%S").to_string(),
        }
    }
}

/// 检查解锁状态请求
#[derive(Debug, Deserialize)]
pub struct CheckUnlockRequest {
    pub resume_id: i64,
    pub buyer_id: i64,
}
