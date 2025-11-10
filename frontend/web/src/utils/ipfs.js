/**
 * IPFS 上传工具（使用 Pinata）
 */

import { PinataSDK } from 'pinata';

// 从环境变量读取 Pinata 配置
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'gateway.pinata.cloud';

let pinataClient = null;

/**
 * 初始化 Pinata 客户端
 */
function initPinata() {
  if (!pinataClient && PINATA_JWT) {
    pinataClient = new PinataSDK({
      pinataJwt: PINATA_JWT,
      pinataGateway: PINATA_GATEWAY,
    });
  }
  return pinataClient;
}

/**
 * 上传加密的简历数据到 IPFS (通过 Pinata)
 * @param {Blob} encryptedBlob - 加密后的数据 Blob
 * @param {Object} metadata - 元数据（不含敏感信息）
 * @returns {Promise<{cid: string, url: string}>}
 */
export async function uploadEncryptedResume(encryptedBlob, metadata = {}) {
  const pinata = initPinata();
  
  if (!pinata) {
    throw new Error('Pinata not configured. Please set VITE_PINATA_JWT in .env');
  }

  try {
    // 将 Blob 转换为 File 对象
    const file = new File(
      [encryptedBlob],
      `resume-${Date.now()}.encrypted`,
      { type: 'application/octet-stream' }
    );

    // 上传到 Pinata - 使用新的 API: upload.public.file()
    const upload = await pinata.upload.public.file(file);

    console.log('✅ Uploaded to IPFS:', upload);

    // 返回 CID 和访问 URL
    return {
      cid: upload.cid,
      url: `https://${PINATA_GATEWAY}/ipfs/${upload.cid}`,
    };
  } catch (error) {
    console.error('❌ IPFS upload failed:', error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
}

/**
 * 从 IPFS 下载加密的简历数据
 * @param {string} cid - IPFS CID
 * @returns {Promise<Blob>}
 */
export async function downloadEncryptedResume(cid) {
  try {
    // 直接使用 fetch 从 Gateway 下载
    const url = `https://${PINATA_GATEWAY}/ipfs/${cid}`;
    console.log('📥 Downloading from:', url);
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('✅ Downloaded blob size:', blob.size, 'bytes');
    
    return blob;
  } catch (error) {
    console.error('❌ IPFS download failed:', error);
    throw new Error(`Failed to download from IPFS: ${error.message}`);
  }
}

/**
 * 测试 Pinata 连接
 * @returns {Promise<boolean>}
 */
export async function testPinataConnection() {
  const pinata = initPinata();
  
  if (!pinata) {
    return false;
  }

  try {
    // 尝试上传一个测试文件
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const result = await pinata.upload.public.file(testFile);
    console.log('✅ Pinata connection test successful:', result.cid);
    return true;
  } catch (error) {
    console.error('❌ Pinata connection test failed:', error);
    return false;
  }
}
