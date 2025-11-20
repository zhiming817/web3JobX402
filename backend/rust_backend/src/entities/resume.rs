use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// 简历表
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "resumes")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i64,
    
    /// 简历唯一 ID (用于链上交易标识)
    #[sea_orm(unique, column_type = "String(StringLen::N(64))")]
    pub resume_id: String,

    /// 简历名称 (公开显示，不加密)
    #[sea_orm(column_type = "String(StringLen::N(255))", nullable)]
    pub name: Option<String>,
    
    /// 所有者用户 ID
    pub owner_id: i64,
    
    /// 所有者钱包地址 - 支持 Sui/Solana
    #[sea_orm(column_type = "String(StringLen::N(100))")]
    pub owner_wallet: String,
    
    /// Walrus Blob ID 或 IPFS CID (加密简历数据)
    #[sea_orm(column_type = "String(StringLen::N(150))")]
    pub blob_id: String,
    
    /// 加密密钥（简单加密模式使用，Seal 模式为 NULL）
    #[sea_orm(column_type = "Text", nullable)]
    pub encryption_key: Option<String>,
    
    /// Seal 加密 ID（Seal 模式使用）
    #[sea_orm(column_type = "String(StringLen::N(150))", nullable)]
    pub encryption_id: Option<String>,
    
    /// Allowlist 对象 ID（访问控制策略，Seal 模式使用）
    #[sea_orm(column_type = "String(StringLen::N(100))", nullable)]
    pub policy_object_id: Option<String>,
    
    /// 加密类型: simple(简单加密) 或 seal(Seal 加密)
    #[sea_orm(column_type = "String(StringLen::N(20))")]
    pub encryption_type: String,
    
    /// Seal 加密模式: allowlist(白名单) 或 subscription(订阅付费)
    #[sea_orm(column_type = "String(StringLen::N(20))", nullable)]
    pub encryption_mode: Option<String>,
    
    /// 公开摘要 (JSON 格式)
    #[sea_orm(column_type = "Json")]
    pub summary: serde_json::Value,
    
    /// 解锁价格 (单位: SOL 的 lamports)
    pub price: i64,
    
    /// 浏览次数
    pub view_count: i32,
    
    /// 解锁次数
    pub unlock_count: i32,
    
    /// 状态: active(激活), inactive(停用), deleted(删除)
    #[sea_orm(column_type = "String(StringLen::N(20))")]
    pub status: String,
    
    /// 创建时间
    pub created_at: DateTime,
    
    /// 更新时间
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::OwnerId",
        to = "super::user::Column::Id"
    )]
    User,
    
    #[sea_orm(has_many = "super::unlock_record::Entity")]
    UnlockRecord,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl Related<super::unlock_record::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::UnlockRecord.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
