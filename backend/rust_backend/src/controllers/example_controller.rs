use actix_web::{HttpResponse, Responder};
use crate::models::{ApiResponse, WeatherResponse, WeatherReport, PremiumContent};

/// 天气端点（示例）
#[allow(dead_code)]
pub async fn weather_handler() -> impl Responder {
    println!("=== Weather endpoint called ===");
    
    let response = ApiResponse::success(WeatherResponse {
        report: WeatherReport {
            weather: "sunny".to_string(),
            temperature: 70,
        },
    });
    HttpResponse::Ok().json(response)
}

/// 高级内容端点（示例）
pub async fn premium_content_handler() -> impl Responder {
    println!("=== Premium content endpoint called ===");
    
    let response = ApiResponse::success(PremiumContent {
        content: "This is premium content".to_string(),
    });
    HttpResponse::Ok().json(response)
}
