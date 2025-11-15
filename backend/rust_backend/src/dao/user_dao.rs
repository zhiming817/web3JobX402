use sea_orm::*;
use crate::entities::{user, User};
use anyhow::Result;

pub struct UserDao;

#[allow(dead_code)]
impl UserDao {
    /// 创建或获取用户，返回用户ID
    /// 如果钱包地址已存在则返回现有用户ID，否则创建新用户
    pub async fn create_or_get(
        db: &DatabaseConnection,
        wallet_address: String,
    ) -> Result<i64> {
        // 先查找是否存在
        if let Some(user) = Self::find_by_wallet(db, &wallet_address).await? {
            return Ok(user.id);
        }

        // 不存在则创建
        let nickname = Some(format!("User_{}", &wallet_address[..8]));
        Self::create(db, wallet_address, nickname).await
    }

    /// 创建用户
    pub async fn create(
        db: &DatabaseConnection,
        wallet_address: String,
        nickname: Option<String>,
    ) -> Result<i64> {
        let user = user::ActiveModel {
            wallet_address: Set(wallet_address),
            nickname: Set(nickname),
            user_type: Set("job_seeker".to_string()),
            created_at: Set(chrono::Utc::now().naive_utc()),
            updated_at: Set(chrono::Utc::now().naive_utc()),
            ..Default::default()
        };
        
        let result = user.insert(db).await?;
        Ok(result.id)
    }
    
    /// 根据钱包地址查询用户
    pub async fn find_by_wallet(
        db: &DatabaseConnection,
        wallet_address: &str
    ) -> Result<Option<user::Model>> {
        let user = User::find()
            .filter(user::Column::WalletAddress.eq(wallet_address))
            .one(db)
            .await?;
        
        Ok(user)
    }
    
    /// 根据 ID 查询用户
    pub async fn find_by_id(
        db: &DatabaseConnection,
        user_id: i64
    ) -> Result<Option<user::Model>> {
        let user = User::find_by_id(user_id)
            .one(db)
            .await?;
        
        Ok(user)
    }
    
    /// 获取或创建用户（如果不存在则创建）
    pub async fn get_or_create(
        db: &DatabaseConnection,
        wallet_address: String,
        nickname: Option<String>,
    ) -> Result<user::Model> {
        // 先尝试查找
        if let Some(user) = Self::find_by_wallet(db, &wallet_address).await? {
            return Ok(user);
        }
        
        // 不存在则创建
        let user_id = Self::create(db, wallet_address.clone(), nickname).await?;
        
        // 返回创建的用户
        Self::find_by_id(db, user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to find created user"))
    }
    
    /// 更新用户昵称
    pub async fn update_nickname(
        db: &DatabaseConnection,
        wallet_address: &str,
        nickname: String,
    ) -> Result<()> {
        let user = Self::find_by_wallet(db, wallet_address)
            .await?
            .ok_or_else(|| anyhow::anyhow!("User not found"))?;
        
        let mut user: user::ActiveModel = user.into();
        user.nickname = Set(Some(nickname));
        user.updated_at = Set(chrono::Utc::now().naive_utc());
        
        user.update(db).await?;
        Ok(())
    }
    
    /// 获取用户统计
    pub async fn get_user_stats(
        _db: &DatabaseConnection,
        _user_id: i64
    ) -> Result<(i64, i64, i64)> {
        // 这里返回 (简历数, 总浏览数, 总解锁数)
        // 实际实现需要联表查询，这里先返回模拟数据
        // TODO: 实现真实的统计查询
        Ok((0, 0, 0))
    }
}
