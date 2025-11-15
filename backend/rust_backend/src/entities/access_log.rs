use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// 访问日志表
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "access_logs")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = true)]
    pub id: i64,
    
    /// 简历 ID (UUID 字符串)
    #[sea_orm(column_type = "String(StringLen::N(64))")]
    pub resume_id: String,
    
    /// 访问者地址
    #[sea_orm(column_type = "String(StringLen::N(100))")]
    pub accessor_address: String,
    
    /// 访问类型: view(查看), download(下载), decrypt(解密)
    #[sea_orm(column_type = "String(StringLen::N(20))")]
    pub access_type: String,
    
    /// 加密类型: simple(简单加密), seal(Seal 加密)
    #[sea_orm(column_type = "String(StringLen::N(20))")]
    pub encryption_type: String,
    
    /// 是否成功
    pub success: bool,
    
    /// 错误信息
    #[sea_orm(column_type = "Text", nullable)]
    pub error_message: Option<String>,
    
    /// IP 地址
    #[sea_orm(column_type = "String(StringLen::N(45))", nullable)]
    pub ip_address: Option<String>,
    
    /// User Agent
    #[sea_orm(column_type = "Text", nullable)]
    pub user_agent: Option<String>,
    
    /// 创建时间
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::resume::Entity",
        from = "Column::ResumeId",
        to = "super::resume::Column::ResumeId"
    )]
    Resume,
}

impl Related<super::resume::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Resume.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
