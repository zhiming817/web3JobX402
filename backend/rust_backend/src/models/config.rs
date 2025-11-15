use serde::Deserialize;

/// 环境配置
#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct EnvConfig {
    pub host: String,
    pub port: u16,
}

impl Default for EnvConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 4021,
        }
    }
}
