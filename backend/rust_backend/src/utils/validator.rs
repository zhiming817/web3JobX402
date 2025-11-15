use regex::Regex;

/// 验证工具
#[allow(dead_code)]
pub struct Validator;

#[allow(dead_code)]
impl Validator {
    /// 验证邮箱格式
    pub fn is_valid_email(email: &str) -> bool {
        let email_regex = Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
            .unwrap();
        email_regex.is_match(email)
    }

    /// 验证电话号码（中国手机号）
    pub fn is_valid_phone(phone: &str) -> bool {
        let phone_regex = Regex::new(r"^1[3-9]\d{9}$").unwrap();
        phone_regex.is_match(phone)
    }

    /// 验证钱包地址（支持 Sui 地址格式）
    pub fn is_valid_wallet_address(address: &str) -> bool {
        // Sui 地址是 0x 开头的 64 位十六进制字符串（总共 66 个字符）
        if address.len() == 66 && address.starts_with("0x") {
            // 检查是否只包含十六进制字符
            return address[2..].chars().all(|c| c.is_ascii_hexdigit());
        }
        
        // 也可以接受其他长度的地址（向后兼容）
        !address.is_empty()
    }

    /// 验证价格
    pub fn is_valid_price(price: f64) -> bool {
        price > 0.0 && price < 1000000.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_email_validation() {
        assert!(Validator::is_valid_email("test@example.com"));
        assert!(!Validator::is_valid_email("invalid-email"));
    }

    #[test]
    fn test_phone_validation() {
        assert!(Validator::is_valid_phone("13800138000"));
        assert!(!Validator::is_valid_phone("12345678901"));
    }
}
