use actix_web::web;
use crate::controllers::{weather_handler, premium_content_handler, ResumeController, UnlockRecordController, AccessLogController};
use crate::controllers::user_controller;

/// 配置示例路由
#[allow(dead_code)]
pub fn config_example_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            .route("/weather", web::get().to(weather_handler))
            .route("/premium/content", web::get().to(premium_content_handler)),
    );
}

/// 配置用户路由
pub fn config_user_routes(cfg: &mut web::ServiceConfig) {
    user_controller::config(cfg);
}

/// 配置简历路由(包含所有简历相关路由)
pub fn config_resume_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/resumes")
            // 公开路由(无需支付)
            .route("", web::post().to(ResumeController::create))
            .route("/summaries", web::get().to(ResumeController::get_summaries))
            .route("/my/{owner}", web::get().to(ResumeController::get_my_resumes))
            .route("/detail/{resume_id}/{owner}", web::get().to(ResumeController::get_resume_detail))
            
            // 管理路由
            .route("/price", web::put().to(ResumeController::set_price))
            .route("/name", web::put().to(ResumeController::update_name))
            .route("/{resume_id}", web::put().to(ResumeController::update))
            .route("/{resume_id}/{owner}", web::delete().to(ResumeController::delete)),
    );
}

/// 配置解锁简历路由 - 已废弃
#[allow(dead_code)]
pub fn config_unlock_routes(_cfg: &mut web::ServiceConfig) {
    // 此函数已废弃，unlock 路由已从项目中移除
    // 保留此函数是为了不破坏 main.rs 的调用，但它现在是空的
}

/// 配置解锁记录路由
pub fn config_unlock_record_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/unlock-records")
            // 创建解锁记录（支付成功后调用）
            .route("", web::post().to(UnlockRecordController::create))
            // 检查解锁状态
            .route("/check/{resume_id}/{buyer_id}", web::get().to(UnlockRecordController::check_unlock))
            // 获取用户已解锁的简历列表
            .route("/buyer/{buyer_wallet}", web::get().to(UnlockRecordController::get_unlocked_resumes))
            // 获取简历的解锁记录（所有者查看）
            .route("/resume/{resume_id}", web::get().to(UnlockRecordController::get_resume_unlock_records)),
    );
}

/// 配置访问记录路由
pub fn config_access_log_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/access-logs")
            // 创建访问记录
            .route("", web::post().to(AccessLogController::create))
            // 获取简历的访问记录
            .route("/resume/{resume_id}", web::get().to(AccessLogController::get_resume_logs))
            // 获取访问者的访问记录
            .route("/accessor/{accessor}", web::get().to(AccessLogController::get_accessor_logs))
            // 统计简历访问次数
            .route("/count/{resume_id}", web::get().to(AccessLogController::count_resume_access)),
    );
}
