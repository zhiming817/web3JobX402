use actix_web::{web, HttpResponse, Responder};
use crate::models::{
    ApiResponse, CreateResumeRequest, SetPriceRequest, UpdateResumeNameRequest,
};
use crate::services::ResumeService;
use sea_orm::DatabaseConnection;

/// 简历控制器
pub struct ResumeController;

impl ResumeController {
    /// 创建简历
    pub async fn create(
        req: web::Json<CreateResumeRequest>,
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Create resume endpoint ===");

        let request = req.into_inner();
        
        // 检查是否提供了 blob_id（Walrus 存储）
        let blob_id = match request.blob_id.as_ref() {
            Some(id) if !id.is_empty() => id.clone(),
            _ => {
                // 向后兼容：检查旧的 ipfs_cid 字段
                match request.ipfs_cid.as_ref() {
                    Some(cid) if !cid.is_empty() => cid.clone(),
                    _ => {
                        let response = ApiResponse::<()>::error(
                            "Blob ID is required. Please encrypt and upload the resume to Walrus first.".to_string()
                        );
                        return HttpResponse::BadRequest().json(response);
                    }
                }
            }
        };

        println!("Creating resume with blob_id: {}, encryption_type: {:?}", 
                 blob_id, request.encryption_type);

        match ResumeService::create_resume(&db, request, blob_id).await {
            Ok(resume_id) => {
                let response = ApiResponse::success_with_message(
                    resume_id,
                    "Resume created successfully".to_string(),
                );
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::BadRequest().json(response)
            }
        }
    }

    /// 获取简历摘要列表（公开，无需支付）
    pub async fn get_summaries(
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Get resume summaries endpoint ===");

        match ResumeService::get_resume_summaries(&db, 1, 20).await {
            Ok(summaries) => {
                let response = ApiResponse::success(summaries);
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::InternalServerError().json(response)
            }
        }
    }

    /// 获取我的简历列表
    pub async fn get_my_resumes(
        owner: web::Path<String>,
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Get my resumes endpoint ===");

        match ResumeService::get_my_resumes(&db, &owner).await {
            Ok(resumes) => {
                let response = ApiResponse::success(resumes);
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::InternalServerError().json(response)
            }
        }
    }

    /// 根据 owner 和简历 ID 获取简历详情
    pub async fn get_resume_detail(
        path: web::Path<(String, String)>, // (resume_id, owner)
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Get resume detail endpoint ===");

        let (resume_id, owner) = path.into_inner();

        match ResumeService::get_resume_detail(&db, &resume_id, &owner).await {
            Ok(resume) => {
                let response = ApiResponse::success(resume);
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::InternalServerError().json(response)
            }
        }
    }

    /// 更新简历
    pub async fn update(
        resume_id: web::Path<String>,
        request: web::Json<CreateResumeRequest>,
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Update resume endpoint ===");

        match ResumeService::update_resume(&db, &resume_id, request.into_inner()).await {
            Ok(_) => {
                let response = ApiResponse::<()>::success_with_message(
                    (),
                    "Resume updated successfully".to_string(),
                );
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::BadRequest().json(response)
            }
        }
    }

    /// 删除简历
    pub async fn delete(
        path: web::Path<(String, String)>, // (resume_id, owner)
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Delete resume endpoint ===");

        let (resume_id, owner) = path.into_inner();

        match ResumeService::delete_resume(&db, &resume_id, &owner).await {
            Ok(_) => {
                let response = ApiResponse::<()>::success_with_message(
                    (),
                    "Resume deleted successfully".to_string(),
                );
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::BadRequest().json(response)
            }
        }
    }

    /// 设置简历价格
    pub async fn set_price(
        request: web::Json<SetPriceRequest>,
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Set resume price endpoint ===");
        println!("Resume ID: {}", request.resume_id);
        println!("Owner: {}", request.owner);
        println!("Price: {} lamports ({} SOL)", request.price, request.price as f64 / 1_000_000_000.0);

        match ResumeService::set_resume_price(
            &db,
            &request.resume_id,
            &request.owner,
            request.price,
        ).await {
            Ok(_) => {
                let response = ApiResponse::<()>::success_with_message(
                    (),
                    format!("Resume price set to {} lamports successfully", request.price),
                );
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::BadRequest().json(response)
            }
        }
    }

    /// 更新简历名称
    pub async fn update_name(
        request: web::Json<UpdateResumeNameRequest>,
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Update resume name endpoint ===");
        println!("Resume ID: {}", request.resume_id);
        println!("Owner: {}", request.owner);
        println!("Name: {}", request.name);

        match ResumeService::update_resume_name(
            &db,
            &request.resume_id,
            &request.owner,
            request.name.clone(),
        ).await {
            Ok(_) => {
                let response = ApiResponse::<()>::success_with_message(
                    (),
                    format!("Resume name updated to '{}' successfully", request.name),
                );
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::BadRequest().json(response)
            }
        }
    }
}
