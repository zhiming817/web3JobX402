mod controllers;
mod dao;
mod entities;
mod models;
mod routes;
mod services;
mod utils;

use actix_web::{web, App, HttpServer};
use actix_cors::Cors;
use std::env;
use utils::database::{DatabaseConfig, init_db};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // 加载 .env 文件
    dotenv::dotenv().ok();
    
    println!("=== ResumeVault Server ===");
    println!();

    // 初始化数据库连接
    println!("🔗 Initializing database connection...");
    let db_config = DatabaseConfig {
        url: env::var("DATABASE_URL")
            .unwrap_or_else(|_| "mysql://root:root@127.0.0.1:3306/resume_vault".to_string()),
        max_connections: 10,
        min_connections: 1,
        connect_timeout: 30,
        idle_timeout: 600,
    };
    
    let db = init_db(db_config).await
        .expect("Failed to initialize database");
    
    let db_data = web::Data::new(db);
    println!("✅ Database connection established");
    println!();

    // 读取服务器配置
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "4021".to_string());
    let bind_addr = format!("{}:{}", host, port);
    
    println!("Starting server at http://{}", bind_addr);
    println!();
    println!("Available endpoints:");
    println!();
    println!("👤 User Endpoints:");
    println!("  POST /api/users/register             - Create or get user");
    println!("  GET  /api/users/wallet/{{wallet}}      - Get user by wallet");
    println!("  GET  /api/users/id/{{id}}               - Get user by ID");
    println!("  POST /api/users/{{id}}/reputation      - Update reputation");
    println!();
    println!("📄 Resume Endpoints:");
    println!("  POST /api/resumes                    - Create resume");
    println!("  GET  /api/resumes/summaries          - Get all resume summaries");
    println!("  GET  /api/resumes/my/{{owner}}         - Get my resumes");
    println!("  PUT  /api/resumes/{{resume_id}}        - Update resume");
    println!("  DEL  /api/resumes/{{resume_id}}/{{owner}} - Delete resume");
    println!();
    println!("🔓 Unlock Record Endpoints:");
    println!("  POST /api/unlock-records                     - Create unlock record");
    println!("  GET  /api/unlock-records/check/{{id}}/{{buyer}}  - Check unlock status");
    println!("  GET  /api/unlock-records/buyer/{{wallet}}      - Get buyer's unlocked resumes");
    println!("  GET  /api/unlock-records/resume/{{id}}         - Get resume's unlock records");
    println!();
    println!("📊 Access Log Endpoints:");
    println!("  POST /api/access-logs                        - Create access log");
    println!("  GET  /api/access-logs/resume/{{id}}            - Get resume's access logs");
    println!("  GET  /api/access-logs/accessor/{{address}}     - Get accessor's logs");
    println!("  GET  /api/access-logs/count/{{id}}             - Count resume access");
    println!();

    // 启动服务器
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .app_data(db_data.clone())  // SeaORM 数据库连接
            .configure(routes::config_user_routes)
            .configure(routes::config_resume_routes)
            .configure(routes::config_unlock_record_routes)
            .configure(routes::config_access_log_routes)
    })
    .bind(&bind_addr)?
    .run()
    .await
}
