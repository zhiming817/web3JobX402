/**
 * 简历加密上传服务
 * 整合加密、IPFS 上传和后端 API 调用
 */

import {
  prepareResumeForUpload,
  downloadAndDecryptResume,
} from '../utils/crypto';
import {
  uploadEncryptedResume,
  downloadEncryptedResume,
} from '../utils/ipfs';
import { resumeService } from './resume.service';

/**
 * 创建加密简历并上传
 * @param {Object} resumeData - 简历数据
 * @param {string} ownerWallet - 所有者钱包地址
 * @returns {Promise<{resumeId: string, encryptionKey: string, cid: string}>}
 */
export async function createEncryptedResume(resumeData, ownerWallet) {
  try {
    console.log('🔐 Step 1: Encrypting resume...');
    
    // 1. 加密简历数据
    const { key, encryptedBlob } = await prepareResumeForUpload(resumeData);
    
    console.log('✅ Encryption complete');
    console.log('🔑 Encryption Key (SAVE THIS!):', key);
    console.log('📦 Encrypted size:', encryptedBlob.size, 'bytes');

    console.log('☁️  Step 2: Uploading to IPFS...');
    
    // 2. 上传到 IPFS
    const { cid, url } = await uploadEncryptedResume(encryptedBlob, {
      owner: ownerWallet,
      encrypted: true,
      timestamp: new Date().toISOString(),
    });
    
    console.log('✅ Upload complete');
    console.log('📝 CID:', cid);
    console.log('🔗 URL:', url);

    console.log('📤 Step 3: Saving to backend...');
    
    // 3. 调用后端 API，传递 CID（使用现有的 resumeService）
    const response = await resumeService.createResume({
      owner: ownerWallet,
      ipfs_cid: cid,  // 前端上传后的 CID
      ...resumeData,
    });

    console.log('✅ Resume created successfully!');
    console.log('🎉 Resume ID:', response.resumeId);

    // 返回重要信息
    return {
      resumeId: response.resumeId,
      encryptionKey: key,  // ⚠️ 用户必须保存这个密钥！
      cid: cid,
      url: url,
    };
  } catch (error) {
    console.error('❌ Create encrypted resume failed:', error);
    throw error;
  }
}

/**
 * 解锁并解密简历
 * @param {string} cid - IPFS CID
 * @param {string} encryptionKey - Base64 编码的解密密钥
 * @returns {Promise<Object>} 解密后的简历数据
 */
export async function unlockAndDecryptResume(cid, encryptionKey) {
  try {
    console.log('📥 Step 1: Downloading from IPFS...');
    console.log('📝 CID:', cid);
    
    // 1. 从 IPFS 下载加密数据
    const encryptedBlob = await downloadEncryptedResume(cid);
    
    console.log('✅ Download complete');
    console.log('📦 Encrypted size:', encryptedBlob.size, 'bytes');

    console.log('🔓 Step 2: Decrypting resume...');
    
    // 2. 解密数据
    const resumeData = await downloadAndDecryptResume(encryptedBlob, encryptionKey);
    
    console.log('✅ Decryption successful!');
    console.log('👤 Resume owner:', resumeData.owner);
    console.log('📄 Resume name:', resumeData.personal?.name);

    return resumeData;
  } catch (error) {
    console.error('❌ Unlock and decrypt failed:', error);
    throw error;
  }
}

/**
 * 从后端获取 CID（需要先支付）
 * @param {string} resumeId - 简历 ID
 * @param {string} buyerWallet - 购买者钱包地址
 * @returns {Promise<string>} IPFS CID
 */
export async function getResumeCID(resumeId, buyerWallet) {
  try {
    // 调用后端解锁接口
    const response = await fetch('/api/resumes/unlock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_id: resumeId,
        buyer_wallet: buyerWallet,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unlock resume');
    }

    const result = await response.json();
    
    if (!result.data?.ipfs_cid) {
      throw new Error('No CID returned from backend');
    }

    return result.data.ipfs_cid;
  } catch (error) {
    console.error('❌ Get resume CID failed:', error);
    throw error;
  }
}

/**
 * 完整的购买和解密流程
 * @param {string} resumeId - 简历 ID
 * @param {string} buyerWallet - 购买者钱包地址
 * @param {string} encryptionKey - 解密密钥（从卖家获得）
 * @returns {Promise<Object>} 解密后的简历数据
 */
export async function purchaseAndDecryptResume(resumeId, buyerWallet, encryptionKey) {
  try {
    console.log('💰 Step 1: Unlocking resume...');
    
    // 1. 支付并获取 CID（后端会验证支付）
    const cid = await getResumeCID(resumeId, buyerWallet);
    
    console.log('✅ Resume unlocked');
    console.log('📝 CID:', cid);

    // 2. 下载并解密
    const resumeData = await unlockAndDecryptResume(cid, encryptionKey);
    
    console.log('🎉 Purchase complete!');
    
    return resumeData;
  } catch (error) {
    console.error('❌ Purchase and decrypt failed:', error);
    throw error;
  }
}
