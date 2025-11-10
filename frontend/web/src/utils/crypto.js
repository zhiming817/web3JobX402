/**
 * 前端加密工具
 * 使用 Web Crypto API 实现 AES-256-GCM 加密
 */

/**
 * 生成随机加密密钥（256位）
 * @returns {Promise<CryptoKey>} 加密密钥对象
 */
export async function generateEncryptionKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // 可导出
    ['encrypt', 'decrypt']
  );
}

/**
 * 将 CryptoKey 导出为 Base64 字符串（用于存储）
 * @param {CryptoKey} key - 加密密钥
 * @returns {Promise<string>} Base64 编码的密钥
 */
export async function exportKeyToBase64(key) {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  return base64;
}

/**
 * 从 Base64 字符串导入 CryptoKey
 * @param {string} base64Key - Base64 编码的密钥
 * @returns {Promise<CryptoKey>} 加密密钥对象
 */
export async function importKeyFromBase64(base64Key) {
  const binaryString = atob(base64Key);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return await window.crypto.subtle.importKey(
    'raw',
    bytes,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * 加密简历数据
 * @param {Object} resumeData - 简历对象
 * @param {CryptoKey} key - 加密密钥
 * @returns {Promise<{encrypted: ArrayBuffer, iv: Uint8Array}>}
 */
export async function encryptResume(resumeData, key) {
  // 1. 将简历对象转换为 JSON 字符串
  const jsonString = JSON.stringify(resumeData);
  
  // 2. 将字符串转换为 Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  
  // 3. 生成随机 IV (Initialization Vector)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // 4. 加密
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );
  
  return { encrypted, iv };
}

/**
 * 解密简历数据
 * @param {ArrayBuffer} encryptedData - 加密的数据
 * @param {Uint8Array} iv - 初始化向量
 * @param {CryptoKey} key - 解密密钥
 * @returns {Promise<Object>} 解密后的简历对象
 */
export async function decryptResume(encryptedData, iv, key) {
  // 1. 解密
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedData
  );
  
  // 2. 将 ArrayBuffer 转换为字符串
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decrypted);
  
  // 3. 解析 JSON
  return JSON.parse(jsonString);
}

/**
 * 将加密数据和 IV 组合成单个 Blob（用于上传）
 * @param {ArrayBuffer} encrypted - 加密的数据
 * @param {Uint8Array} iv - 初始化向量
 * @returns {Blob}
 */
export function combineEncryptedData(encrypted, iv) {
  // 格式: [IV (12 bytes)][Encrypted Data]
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return new Blob([combined], { type: 'application/octet-stream' });
}

/**
 * 从 Blob 中分离 IV 和加密数据
 * @param {Blob} blob - 组合的加密数据
 * @returns {Promise<{encrypted: ArrayBuffer, iv: Uint8Array}>}
 */
export async function separateEncryptedData(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const combined = new Uint8Array(arrayBuffer);
  
  // 前 12 字节是 IV
  const iv = combined.slice(0, 12);
  
  // 剩余部分是加密数据
  const encrypted = combined.slice(12).buffer;
  
  return { encrypted, iv };
}

/**
 * 完整的加密和上传流程辅助函数
 * @param {Object} resumeData - 简历数据
 * @param {string} [existingKeyBase64] - 可选：已有的 Base64 编码密钥（用于更新时重用密钥）
 * @returns {Promise<{key: string, encryptedBlob: Blob}>}
 */
export async function prepareResumeForUpload(resumeData, existingKeyBase64 = null) {
  // 1. 生成或导入密钥
  let key;
  if (existingKeyBase64) {
    // 使用已有密钥（用于更新简历）
    key = await importKeyFromBase64(existingKeyBase64);
  } else {
    // 生成新密钥（用于创建新简历）
    key = await generateEncryptionKey();
  }
  
  // 2. 加密数据
  const { encrypted, iv } = await encryptResume(resumeData, key);
  
  // 3. 组合数据
  const encryptedBlob = combineEncryptedData(encrypted, iv);
  
  // 4. 导出密钥为 Base64（供用户保存）
  const keyBase64 = await exportKeyToBase64(key);
  
  return {
    key: keyBase64,
    encryptedBlob,
  };
}

/**
 * 完整的下载和解密流程辅助函数
 * @param {Blob} encryptedBlob - 加密的 Blob
 * @param {string} keyBase64 - Base64 编码的密钥
 * @returns {Promise<Object>} 解密后的简历对象
 */
export async function downloadAndDecryptResume(encryptedBlob, keyBase64) {
  // 1. 导入密钥
  const key = await importKeyFromBase64(keyBase64);
  
  // 2. 分离 IV 和加密数据
  const { encrypted, iv } = await separateEncryptedData(encryptedBlob);
  
  // 3. 解密
  const resumeData = await decryptResume(encrypted, iv, key);
  
  return resumeData;
}
