use serde::Serialize;

/// 通用 API 响应
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
            error: None,
        }
    }

    pub fn success_with_message(data: T, message: String) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: Some(message),
            error: None,
        }
    }

    pub fn error(error: String) -> Self {
        Self {
            success: false,
            data: None,
            message: None,
            error: Some(error),
        }
    }
}

/// 天气报告（示例）
#[derive(Debug, Serialize)]
pub struct WeatherReport {
    pub weather: String,
    pub temperature: i32,
}

/// 天气响应（示例）
#[derive(Debug, Serialize)]
pub struct WeatherResponse {
    pub report: WeatherReport,
}

/// 高级内容（示例）
#[derive(Debug, Serialize)]
pub struct PremiumContent {
    pub content: String,
}
