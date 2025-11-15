use crate::dao::UserDao;
use crate::entities::user;
use sea_orm::{DatabaseConnection, DbErr};

pub struct UserService;

#[allow(dead_code)]
impl UserService {
    /// 创建或获取用户,返回用户ID
    /// 如果钱包地址已存在则返回现有用户ID,否则创建新用户
    pub async fn create_or_get_user(
        db: &DatabaseConnection,
        wallet_address: String,
    ) -> Result<i64, DbErr> {
        // 验证钱包地址格式(基本验证)
        if wallet_address.is_empty() {
            return Err(DbErr::Custom("Wallet address cannot be empty".to_string()));
        }

        UserDao::create_or_get(db, wallet_address).await
            .map_err(|e| DbErr::Custom(e.to_string()))
    }

    /// 通过钱包地址获取用户
    pub async fn get_user_by_wallet(
        db: &DatabaseConnection,
        wallet_address: &str,
    ) -> Result<Option<user::Model>, DbErr> {
        UserDao::find_by_wallet(db, wallet_address).await
            .map_err(|e| DbErr::Custom(e.to_string()))
    }

    /// 通过ID获取用户
    pub async fn get_user_by_id(
        db: &DatabaseConnection,
        user_id: i64,
    ) -> Result<Option<user::Model>, DbErr> {
        UserDao::find_by_id(db, user_id).await
            .map_err(|e| DbErr::Custom(e.to_string()))
    }

    /// 更新用户昵称
    pub async fn update_user_nickname(
        db: &DatabaseConnection,
        wallet_address: &str,
        nickname: String,
    ) -> Result<(), DbErr> {
        UserDao::update_nickname(db, wallet_address, nickname).await
            .map_err(|e| DbErr::Custom(e.to_string()))
    }

    /// 验证用户是否存在
    pub async fn user_exists(
        db: &DatabaseConnection,
        wallet_address: &str,
    ) -> Result<bool, DbErr> {
        let user = Self::get_user_by_wallet(db, wallet_address).await?;
        Ok(user.is_some())
    }
}
