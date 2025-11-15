use actix_web::{web, HttpResponse, Responder};
use crate::models::{ApiResponse, CreateUnlockRecordRequest, UnlockRecordResponse};
use crate::services::UnlockRecordService;
use sea_orm::DatabaseConnection;

/// 解锁记录控制器
pub struct UnlockRecordController;

impl UnlockRecordController {
    /// 创建解锁记录（支付成功后调用）
    pub async fn create(
        req: web::Json<CreateUnlockRecordRequest>,
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Create unlock record endpoint ===");
        println!("Resume ID: {}", req.resume_id);
        println!("Buyer: {} (ID: {})", req.buyer_wallet, req.buyer_id);
        println!("Seller: {}", req.seller_wallet);
        println!("Amount: {}", req.amount);
        println!("Transaction: {}", req.transaction_signature);

        let request = req.into_inner();

        match UnlockRecordService::create_unlock_record(
            &db,
            request.resume_id,
            request.buyer_id,
            request.buyer_wallet,
            request.seller_wallet,
            request.amount,
            request.transaction_signature,
            request.block_time,
        )
        .await
        {
            Ok(record) => {
                let response = ApiResponse::success_with_message(
                    UnlockRecordResponse::from(record),
                    "Unlock record created successfully".to_string(),
                );
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::BadRequest().json(response)
            }
        }
    }

    /// 检查用户是否已解锁某简历
    pub async fn check_unlock(
        path: web::Path<(i64, i64)>, // (resume_id, buyer_id)
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        let (resume_id, buyer_id) = path.into_inner();
        
        println!("=== Check unlock status endpoint ===");
        println!("Resume ID: {}, Buyer ID: {}", resume_id, buyer_id);

        match UnlockRecordService::has_unlocked(&db, resume_id, buyer_id).await {
            Ok(unlocked) => {
                let response = ApiResponse::success(serde_json::json!({
                    "unlocked": unlocked
                }));
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::InternalServerError().json(response)
            }
        }
    }

    /// 获取用户已解锁的所有简历
    pub async fn get_unlocked_resumes(
        buyer_wallet: web::Path<String>,
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Get unlocked resumes endpoint ===");
        println!("Buyer wallet: {}", buyer_wallet);

        match UnlockRecordService::get_unlocked_resumes(&db, &buyer_wallet).await {
            Ok(records) => {
                let responses: Vec<UnlockRecordResponse> = records
                    .into_iter()
                    .map(UnlockRecordResponse::from)
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

    /// 获取简历的所有解锁记录（简历所有者查看）
    pub async fn get_resume_unlock_records(
        resume_id: web::Path<i64>,
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Get resume unlock records endpoint ===");
        println!("Resume ID: {}", resume_id);

        match UnlockRecordService::get_resume_unlock_records(&db, *resume_id).await {
            Ok(records) => {
                let responses: Vec<UnlockRecordResponse> = records
                    .into_iter()
                    .map(UnlockRecordResponse::from)
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
}
