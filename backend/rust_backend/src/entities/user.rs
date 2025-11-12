use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// 用户表
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i64,
    
    /// 钱包地址（唯一标识）- 支持 Sui/Solana
    #[sea_orm(unique, column_type = "String(StringLen::N(100))")]
    pub wallet_address: String,
    
    /// 用户昵称
    #[sea_orm(column_type = "String(StringLen::N(100))")]
    pub nickname: Option<String>,
    
    /// 用户类型: job_seeker(求职者) 或 recruiter(招聘者)
    #[sea_orm(column_type = "String(StringLen::N(20))")]
    pub user_type: String,
    
    /// 创建时间
    pub created_at: DateTime,
    
    /// 更新时间
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::resume::Entity")]
    Resume,
    
    #[sea_orm(has_many = "super::unlock_record::Entity")]
    UnlockRecord,
}

impl Related<super::resume::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Resume.def()
    }
}

impl Related<super::unlock_record::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::UnlockRecord.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
