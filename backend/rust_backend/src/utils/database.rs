use sea_orm::{Database, DatabaseConnection, ConnectOptions, DbErr};
use std::time::Duration;

/// 数据库配置
#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub connect_timeout: u64,  // 秒
    pub idle_timeout: u64,     // 秒
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            url: "mysql://root:123456@localhost:3306/resume_vault".to_string(),
            max_connections: 10,
            min_connections: 1,
            connect_timeout: 30,
            idle_timeout: 600,
        }
    }
}

/// 初始化数据库连接
pub async fn init_db(config: DatabaseConfig) -> Result<DatabaseConnection, DbErr> {
    println!("🔗 连接数据库: {}", &config.url);
    
    let mut opt = ConnectOptions::new(&config.url);
    opt.max_connections(config.max_connections)
        .min_connections(config.min_connections)
        .connect_timeout(Duration::from_secs(config.connect_timeout))
        .idle_timeout(Duration::from_secs(config.idle_timeout))
        .sqlx_logging(true);
    
    let db = Database::connect(opt).await?;
    println!("✅ 数据库连接成功");
    Ok(db)
}

/// 测试数据库连接
#[allow(dead_code)]
pub async fn test_connection(db: &DatabaseConnection) -> Result<(), DbErr> {
    use sea_orm::{Statement, ConnectionTrait};
    db.execute(Statement::from_string(
        sea_orm::DatabaseBackend::MySql,
        "SELECT 1".to_string()
    )).await?;
    println!("✅ 数据库连接测试通过");
    Ok(())
}
