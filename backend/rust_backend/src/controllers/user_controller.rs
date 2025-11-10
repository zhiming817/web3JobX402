use actix_web::{web, HttpResponse, Result};
use sea_orm::DatabaseConnection;
use serde::{Deserialize, Serialize};

use crate::services::UserService;

#[derive(Debug, Serialize)]
struct ApiResponse<T> {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Debug, Serialize)]
struct UserResponse {
    id: i64,
    wallet_address: String,
    nickname: Option<String>,
    user_type: String,
    created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    wallet_address: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNicknameRequest {
    nickname: String,
}

/// POST /api/users/register - 创建或获取用户
pub async fn register_user(
    db: web::Data<DatabaseConnection>,
    request: web::Json<RegisterRequest>,
) -> Result<HttpResponse> {
    match UserService::create_or_get_user(db.get_ref(), request.wallet_address.clone()).await {
        Ok(user_id) => {
            // 获取完整用户信息
            match UserService::get_user_by_id(db.get_ref(), user_id).await {
                Ok(Some(user)) => {
                    let response = ApiResponse {
                        success: true,
                        data: Some(UserResponse {
                            id: user.id,
                            wallet_address: user.wallet_address,
                            nickname: user.nickname,
                            user_type: user.user_type,
                            created_at: user.created_at,
                        }),
                        error: None,
                    };
                    Ok(HttpResponse::Ok().json(response))
                }
                Ok(None) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    error: Some("User created but not found".to_string()),
                })),
                Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    error: Some(format!("Failed to fetch user: {}", e)),
                })),
            }
        }
        Err(e) => Ok(HttpResponse::BadRequest().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(format!("Failed to register user: {}", e)),
        })),
    }
}

/// GET /api/users/wallet/:wallet - 通过钱包地址获取用户
pub async fn get_user_by_wallet(
    db: web::Data<DatabaseConnection>,
    wallet: web::Path<String>,
) -> Result<HttpResponse> {
    match UserService::get_user_by_wallet(db.get_ref(), &wallet).await {
        Ok(Some(user)) => {
            let response = ApiResponse {
                success: true,
                data: Some(UserResponse {
                    id: user.id,
                    wallet_address: user.wallet_address,
                    nickname: user.nickname,
                    user_type: user.user_type,
                    created_at: user.created_at,
                }),
                error: None,
            };
            Ok(HttpResponse::Ok().json(response))
        }
        Ok(None) => Ok(HttpResponse::NotFound().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some("User not found".to_string()),
        })),
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(format!("Failed to fetch user: {}", e)),
        })),
    }
}

/// GET /api/users/id/:id - 通过ID获取用户
pub async fn get_user_by_id(
    db: web::Data<DatabaseConnection>,
    user_id: web::Path<i64>,
) -> Result<HttpResponse> {
    match UserService::get_user_by_id(db.get_ref(), *user_id).await {
        Ok(Some(user)) => {
            let response = ApiResponse {
                success: true,
                data: Some(UserResponse {
                    id: user.id,
                    wallet_address: user.wallet_address,
                    nickname: user.nickname,
                    user_type: user.user_type,
                    created_at: user.created_at,
                }),
                error: None,
            };
            Ok(HttpResponse::Ok().json(response))
        }
        Ok(None) => Ok(HttpResponse::NotFound().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some("User not found".to_string()),
        })),
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(format!("Failed to fetch user: {}", e)),
        })),
    }
}

/// POST /api/users/wallet/:wallet/nickname - 更新用户昵称
pub async fn update_nickname(
    db: web::Data<DatabaseConnection>,
    wallet: web::Path<String>,
    request: web::Json<UpdateNicknameRequest>,
) -> Result<HttpResponse> {
    match UserService::update_user_nickname(db.get_ref(), &wallet, request.nickname.clone()).await
    {
        Ok(_) => {
            // 获取更新后的用户信息
            match UserService::get_user_by_wallet(db.get_ref(), &wallet).await {
                Ok(Some(user)) => {
                    let response = ApiResponse {
                        success: true,
                        data: Some(UserResponse {
                            id: user.id,
                            wallet_address: user.wallet_address,
                            nickname: user.nickname,
                            user_type: user.user_type,
                            created_at: user.created_at,
                        }),
                        error: None,
                    };
                    Ok(HttpResponse::Ok().json(response))
                }
                Ok(None) => Ok(HttpResponse::NotFound().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    error: Some("User not found after update".to_string()),
                })),
                Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse::<()> {
                    success: false,
                    data: None,
                    error: Some(format!("Failed to fetch updated user: {}", e)),
                })),
            }
        }
        Err(e) => Ok(HttpResponse::BadRequest().json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(format!("Failed to update nickname: {}", e)),
        })),
    }
}

pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/users")
            .route("/register", web::post().to(register_user))
            .route("/wallet/{wallet}", web::get().to(get_user_by_wallet))
            .route("/id/{id}", web::get().to(get_user_by_id))
            .route("/wallet/{wallet}/nickname", web::post().to(update_nickname)),
    );
}
