use actix_web::{web, HttpRequest, HttpResponse, Responder};
use crate::models::{ApiResponse, CreateAccessLogRequest, AccessLogResponse};
use crate::services::AccessLogService;
use sea_orm::DatabaseConnection;

/// 访问记录控制器
pub struct AccessLogController;

impl AccessLogController {
    /// 创建访问记录
    pub async fn create(
        req: web::Json<CreateAccessLogRequest>,
        http_req: HttpRequest,
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Create access log endpoint ===");
        println!("Resume ID: {}", req.resume_id);
        println!("Accessor: {}", req.accessor_address);
        println!("Access Type: {}", req.access_type);
        println!("Encryption Type: {}", req.encryption_type);

        let request = req.into_inner();

        // 提取 IP 和 User-Agent
        let ip_address = http_req
            .connection_info()
            .realip_remote_addr()
            .map(|s| s.to_string());

        let user_agent = http_req
            .headers()
            .get("user-agent")
            .and_then(|h| h.to_str().ok())
            .map(|s| s.to_string());

        match AccessLogService::create_access_log(
            &db,
            request.resume_id,
            request.accessor_address,
            request.access_type,
            request.encryption_type,
            request.success,
            request.error_message,
            ip_address,
            user_agent,
        )
        .await
        {
            Ok(log) => {
                let response = ApiResponse::success_with_message(
                    AccessLogResponse::from(log),
                    "Access log created successfully".to_string(),
                );
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::BadRequest().json(response)
            }
        }
    }

    /// 获取简历的访问记录
    pub async fn get_resume_logs(
        path: web::Path<String>,
        query: web::Query<std::collections::HashMap<String, String>>,
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        let resume_id = path.into_inner();
        let limit = query
            .get("limit")
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(50);

        println!("=== Get resume access logs endpoint ===");
        println!("Resume ID: {}, Limit: {}", resume_id, limit);

        match AccessLogService::get_resume_access_logs(&db, &resume_id, limit).await {
            Ok(logs) => {
                let responses: Vec<AccessLogResponse> = logs
                    .into_iter()
                    .map(AccessLogResponse::from)
                    .collect();
                let response = ApiResponse::success(responses);
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::InternalServerError().json(response)
            }
        }
    }

    /// 获取访问者的访问记录
    pub async fn get_accessor_logs(
        accessor: web::Path<String>,
        query: web::Query<std::collections::HashMap<String, String>>,
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        let limit = query
            .get("limit")
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(50);

        println!("=== Get accessor logs endpoint ===");
        println!("Accessor: {}, Limit: {}", accessor, limit);

        match AccessLogService::get_accessor_logs(&db, &accessor, limit).await {
            Ok(logs) => {
                let responses: Vec<AccessLogResponse> = logs
                    .into_iter()
                    .map(AccessLogResponse::from)
                    .collect();
                let response = ApiResponse::success(responses);
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::InternalServerError().json(response)
            }
        }
    }

    /// 统计简历访问次数
    pub async fn count_resume_access(
        resume_id: web::Path<String>,
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Count resume access endpoint ===");
        println!("Resume ID: {}", resume_id);

        match AccessLogService::count_resume_access(&db, &resume_id).await {
            Ok(count) => {
                let response = ApiResponse::success(serde_json::json!({
                    "count": count
                }));
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::InternalServerError().json(response)
            }
        }
    }
}
