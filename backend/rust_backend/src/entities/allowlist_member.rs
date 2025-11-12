use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Allowlist 成员表（用于同步链上白名单）
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "allowlist_members")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i64,
    
    /// Allowlist 对象 ID（策略 ID）
    #[sea_orm(column_type = "String(StringLen::N(100))")]
    pub policy_object_id: String,
    
    /// 白名单成员地址
    #[sea_orm(column_type = "String(StringLen::N(100))")]
    pub member_address: String,
    
    /// 关联的简历 ID
    pub resume_id: i64,
    
    /// 添加者地址
    #[sea_orm(column_type = "String(StringLen::N(100))")]
    pub added_by: String,
    
    /// 添加交易哈希
    #[sea_orm(column_type = "String(StringLen::N(150))")]
    pub tx_digest: String,
    
    /// 状态: active(激活), removed(已移除)
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
        belongs_to = "super::resume::Entity",
        from = "Column::ResumeId",
        to = "super::resume::Column::Id"
    )]
    Resume,
}

impl Related<super::resume::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Resume.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
