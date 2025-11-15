use sha2::{Sha256, Digest};
use base64::{Engine as _, engine::general_purpose};
use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use rand::RngCore;

/// 加密工具
#[allow(dead_code)]
pub struct CryptoUtil;

#[allow(dead_code)]
impl CryptoUtil {
    /// 生成随机密钥 (32 字节 = 256 位)
    pub fn generate_encryption_key() -> String {
        let mut key = [0u8; 32];
        OsRng.fill_bytes(&mut key);
        hex::encode(key)
    }

    /// 生成随机 nonce (12 字节，AES-GCM 标准)
    fn generate_nonce() -> [u8; 12] {
        let mut nonce = [0u8; 12];
        OsRng.fill_bytes(&mut nonce);
        nonce
    }

    /// 加密内容（AES-256-GCM）
    /// 
    /// # 参数
    /// - `plaintext`: 明文字符串
    /// - `key_hex`: 十六进制格式的密钥（64 字符）
    /// 
    /// # 返回
    /// - `Ok(Vec<u8>)`: nonce (12 bytes) + 密文 + tag (16 bytes)
    /// - `Err(String)`: 错误信息
    pub fn encrypt_content(plaintext: &str, key_hex: &str) -> Result<Vec<u8>, String> {
        // 解码密钥
        let key_bytes = hex::decode(key_hex)
            .map_err(|e| format!("Invalid key format: {}", e))?;
        
        if key_bytes.len() != 32 {
            return Err("Key must be 32 bytes (256 bits)".to_string());
        }

        // 创建加密器
        let cipher = Aes256Gcm::new_from_slice(&key_bytes)
            .map_err(|e| format!("Failed to create cipher: {}", e))?;

        // 生成随机 nonce
        let nonce_bytes = Self::generate_nonce();
        let nonce = Nonce::from(nonce_bytes);

        // 加密
        let ciphertext = cipher
            .encrypt(&nonce, plaintext.as_bytes())
            .map_err(|e| format!("Encryption failed: {}", e))?;

        // 组合: nonce + ciphertext (已包含 tag)
        let mut result = Vec::with_capacity(12 + ciphertext.len());
        result.extend_from_slice(&nonce_bytes);
        result.extend_from_slice(&ciphertext);

        Ok(result)
    }

    /// 解密内容（AES-256-GCM）
    /// 
    /// # 参数
    /// - `encrypted`: nonce (12 bytes) + 密文 + tag (16 bytes)
    /// - `key_hex`: 十六进制格式的密钥（64 字符）
    /// 
    /// # 返回
    /// - `Ok(String)`: 解密后的明文
    /// - `Err(String)`: 错误信息
    pub fn decrypt_content(encrypted: &[u8], key_hex: &str) -> Result<String, String> {
        // 检查最小长度: 12 (nonce) + 16 (tag) = 28 bytes
        if encrypted.len() < 28 {
            return Err("Invalid encrypted data: too short".to_string());
        }

        // 解码密钥
        let key_bytes = hex::decode(key_hex)
            .map_err(|e| format!("Invalid key format: {}", e))?;
        
        if key_bytes.len() != 32 {
            return Err("Key must be 32 bytes (256 bits)".to_string());
        }

        // 创建解密器
        let cipher = Aes256Gcm::new_from_slice(&key_bytes)
            .map_err(|e| format!("Failed to create cipher: {}", e))?;

        // 分离 nonce 和密文
        let (nonce_bytes, ciphertext) = encrypted.split_at(12);
        let nonce_array: [u8; 12] = nonce_bytes.try_into()
            .map_err(|_| "Invalid nonce length".to_string())?;
        let nonce = Nonce::from(nonce_array);

        // 解密
        let plaintext_bytes = cipher
            .decrypt(&nonce, ciphertext)
            .map_err(|e| format!("Decryption failed: {}", e))?;

        // 转换为字符串
        String::from_utf8(plaintext_bytes)
            .map_err(|e| format!("Invalid UTF-8: {}", e))
    }

    /// 基于公钥派生加密密钥
    pub fn derive_key_from_pubkey(pubkey: &str, salt: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(pubkey.as_bytes());
        hasher.update(salt.as_bytes());
        let result = hasher.finalize();
        general_purpose::STANDARD.encode(result)
    }

    /// 脱敏姓名（只显示姓）
    pub fn mask_name(name: &str) -> String {
        if name.is_empty() {
            return "***".to_string();
        }
        let chars: Vec<char> = name.chars().collect();
        if chars.len() > 0 {
            format!("{}**", chars[0])
        } else {
            "***".to_string()
        }
    }

    /// 脱敏电话号码
    pub fn mask_phone(phone: &str) -> String {
        if phone.len() >= 11 {
            format!("{}****{}", &phone[0..3], &phone[7..11])
        } else {
            "***".to_string()
        }
    }

    /// 脱敏邮箱
    pub fn mask_email(email: &str) -> String {
        if let Some(at_pos) = email.find('@') {
            let username = &email[0..at_pos];
            let domain = &email[at_pos..];
            if username.len() > 2 {
                format!("{}***{}", &username[0..1], domain)
            } else {
                format!("***{}", domain)
            }
        } else {
            "***".to_string()
        }
    }
}
