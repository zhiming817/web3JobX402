use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// 解锁记录表
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "unlock_records")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i64,
    
    /// 简历 ID
    pub resume_id: i64,
    
    /// 购买者用户 ID
    pub buyer_id: i64,
    
    /// 购买者钱包地址 - 支持 Sui/Solana
    #[sea_orm(column_type = "String(StringLen::N(100))")]
    pub buyer_wallet: String,
    
    /// 卖家钱包地址 - 支持 Sui/Solana
    #[sea_orm(column_type = "String(StringLen::N(100))")]
    pub seller_wallet: String,
    
    /// 支付金额 (lamports 或其他单位)
    pub amount: i64,
    
    /// 交易签名 - 支持 Sui/Solana
    #[sea_orm(unique, column_type = "String(StringLen::N(150))")]
    pub transaction_signature: String,
    
    /// 支付状态: pending(待确认), confirmed(已确认), failed(失败)
    #[sea_orm(column_type = "String(StringLen::N(20))")]
    pub status: String,
    
    /// 区块时间戳
    pub block_time: Option<i64>,
    
    /// 创建时间
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::resume::Entity",
        from = "Column::ResumeId",
        to = "super::resume::Column::Id"
    )]
    Resume,
    
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::BuyerId",
        to = "super::user::Column::Id"
    )]
    User,
}

impl Related<super::resume::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Resume.def()
    }
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
