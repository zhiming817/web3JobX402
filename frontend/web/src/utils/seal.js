/**
 * Seal 加密工具
 * 文档: https://seal-docs.wal.app/GettingStarted/
 * 示例: https://github.com/MystenLabs/seal/tree/main/examples/frontend
 */

/**
 * 生成随机密钥
 * @returns {Promise<CryptoKey>} 加密密钥
 */
async function generateKey() {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * 导出密钥为 Base64 字符串
 * @param {CryptoKey} key - 加密密钥
 * @returns {Promise<string>} Base64 编码的密钥
 */
async function exportKey(key) {
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
}

/**
 * 从 Base64 字符串导入密钥
 * @param {string} keyBase64 - Base64 编码的密钥
 * @returns {Promise<CryptoKey>} 加密密钥
 */
async function importKey(keyBase64) {
  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyBytes,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * 使用 Seal 加密数据
 * @param {object} data - 要加密的数据
 * @param {string} password - 密码（可选，如果不提供则生成随机密钥）
 * @returns {Promise<object>} { encryptedBlob, key, iv }
 */
export async function encryptWithSeal(data, password = null) {
  try {
    console.log('🔐 Encrypting with Seal...');
    
    // 将数据转换为 JSON 字符串
    const jsonString = JSON.stringify(data);
    const dataBytes = new TextEncoder().encode(jsonString);
    
    let key;
    
    if (password) {
      // 使用密码派生密钥
      const encoder = new TextEncoder();
      const passwordBytes = encoder.encode(password);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBytes,
        'PBKDF2',
        false,
        ['deriveKey']
      );
      
      key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    } else {
      // 生成随机密钥
      key = await generateKey();
    }
    
    // 生成随机 IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // 加密数据
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      dataBytes
    );
    
    // 导出密钥
    const keyBase64 = await exportKey(key);
    const ivBase64 = btoa(String.fromCharCode(...iv));
    
    // 组合 IV + 加密数据
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    const encryptedBlob = new Blob([combined], { type: 'application/octet-stream' });
    
    console.log('✅ Encryption complete');
    console.log('📦 Encrypted size:', encryptedBlob.size, 'bytes');
    console.log('🔑 Key (base64):', keyBase64.substring(0, 20) + '...');
    
    return {
      encryptedBlob,
      key: keyBase64,
      iv: ivBase64,
    };
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw new Error(`Seal encryption failed: ${error.message}`);
  }
}

/**
 * 使用 Seal 解密数据
 * @param {Blob} encryptedBlob - 加密的数据
 * @param {string} keyBase64 - Base64 编码的密钥
 * @returns {Promise<object>} 解密后的数据
 */
export async function decryptWithSeal(encryptedBlob, keyBase64) {
  try {
    console.log('🔓 Decrypting with Seal...');
    console.log('📦 Encrypted size:', encryptedBlob.size, 'bytes');
    
    // 读取加密数据
    const arrayBuffer = await encryptedBlob.arrayBuffer();
    const combined = new Uint8Array(arrayBuffer);
    
    // 提取 IV (前 12 字节) 和加密数据
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    // 导入密钥
    const key = await importKey(keyBase64);
    
    // 解密
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedData
    );
    
    // 转换回 JSON
    const jsonString = new TextDecoder().decode(decryptedData);
    const data = JSON.parse(jsonString);
    
    console.log('✅ Decryption complete');
    
    return data;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error(`Seal decryption failed: ${error.message}`);
  }
}

/**
 * 使用密码解密数据
 * @param {Blob} encryptedBlob - 加密的数据
 * @param {string} password - 密码
 * @param {string} saltBase64 - Base64 编码的 salt
 * @returns {Promise<object>} 解密后的数据
 */
export async function decryptWithPassword(encryptedBlob, password, saltBase64) {
  try {
    console.log('🔓 Decrypting with password...');
    
    // 从密码派生密钥
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBytes,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['decrypt']
    );
    
    // 导出密钥为 base64
    const keyBase64 = await exportKey(key);
    
    // 使用密钥解密
    return await decryptWithSeal(encryptedBlob, keyBase64);
  } catch (error) {
    console.error('❌ Decryption with password failed:', error);
    throw new Error(`Password decryption failed: ${error.message}`);
  }
}
