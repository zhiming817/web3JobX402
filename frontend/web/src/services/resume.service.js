/**
 * 简历相关 API 服务
 */
import { httpClient } from './http.client';
import { API_ENDPOINTS } from './api.config';
import { encryptWithSeal, decryptWithSeal } from '../utils/seal';
import { uploadToWalrus, downloadFromWalrus } from '../utils/walrus';

/**
 * 简历 API 服务类
 */
class ResumeService {
  /**
   * 创建简历(带加密和 Walrus 上传)
   * @param {object} resumeData - 简历数据
   * @param {string} resumeData.owner - 钱包地址
   * @param {object} resumeData.personal - 个人信息
   * @param {string} resumeData.skills - 个人优势
   * @param {object} resumeData.desired_position - 期望职位
   * @param {array} resumeData.work_experience - 工作经历
   * @param {array} resumeData.project_experience - 项目经历
   * @param {array} resumeData.education - 教育经历
   * @param {array} resumeData.certificates - 资格证书
   * @returns {Promise<object>} 创建结果 { success, resumeId, encryptionKey, blobId }
   */
  async createResume(resumeData) {
    try {
      console.log('🔐 Step 1: Encrypting resume with Seal...');
      
      // 1. 使用 Seal 加密简历数据
      const { encryptedBlob, key, salt } = await encryptWithSeal(resumeData);
      
      console.log('✅ Encryption complete');
      console.log('🔑 Encryption Key (SAVE THIS!):', key);
      console.log('📦 Encrypted size:', encryptedBlob.size, 'bytes');

      console.log('☁️  Step 2: Uploading to Walrus...');
      
      // 2. 上传到 Walrus
      const { blobId, url, info } = await uploadToWalrus(encryptedBlob, {
        owner: resumeData.owner,
        encrypted: true,
        timestamp: new Date().toISOString(),
      });
      
      console.log('✅ Upload complete');
      console.log('📝 Blob ID:', blobId);
      console.log('🔗 URL:', url);

      console.log('📤 Step 3: Saving to backend...');
      
      // 3. 调用后端 API，传递 Blob ID
      const response = await httpClient.post(API_ENDPOINTS.resumes.create, {
        ...resumeData,
        ipfs_cid: blobId,  // 使用 blob_id 替代 ipfs_cid (后端字段兼容)
        encryption_salt: salt,  // 保存 salt 用于解密
      });
      
      if (response.success) {
        console.log('✅ Resume created successfully!');
        
        return {
          success: true,
          resumeId: response.data,
          encryptionKey: key,  // ⚠️ 返回加密密钥，用户必须保存！
          blobId: blobId,
          message: '简历创建成功',
        };
      } else {
        throw new Error(response.error || '创建简历失败');
      }
    } catch (error) {
      console.error('创建简历失败:', error);
      throw error;
    }
  }

  /**
   * 获取简历摘要列表
   * @returns {Promise<array>} 简历摘要列表
   */
  async getResumeSummaries() {
    try {
      const response = await httpClient.get(API_ENDPOINTS.resumes.getSummaries);
      
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.error || '获取简历列表失败');
      }
    } catch (error) {
      console.error('获取简历列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取我的简历列表
   * @param {string} walletAddress - 钱包地址
   * @returns {Promise<Array>} 简历列表
   */
  async getMyResumes(walletAddress) {
    try {
      const response = await httpClient.get(`/api/resumes/my/${walletAddress}`);
      
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.error || '获取我的简历列表失败');
      }
    } catch (error) {
      console.error('获取我的简历列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取简历详情 (需要 owner 验证)
   * @param {string} resumeId - 简历 ID
   * @param {string} owner - 所有者钱包地址
   * @returns {Promise<Object>} 简历详情
   */
  async getResumeDetail(resumeId, owner) {
    try {
      const response = await httpClient.get(`/api/resumes/detail/${resumeId}/${owner}`);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || '获取简历详情失败');
      }
    } catch (error) {
      console.error('获取简历详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新简历
   * @param {string} resumeId - 简历 ID
   * @param {object} resumeData - 简历数据
   * @returns {Promise<object>} 更新结果
   */
  async updateResume(resumeId, resumeData) {
    try {
      const response = await httpClient.put(
        API_ENDPOINTS.resumes.update(resumeId),
        resumeData
      );
      
      if (response.success) {
        return {
          success: true,
          message: '简历更新成功',
        };
      } else {
        throw new Error(response.error || '更新简历失败');
      }
    } catch (error) {
      console.error('更新简历失败:', error);
      throw error;
    }
  }

  /**
   * 删除简历
   * @param {string} resumeId - 简历 ID
   * @param {string} owner - 所有者钱包地址
   * @returns {Promise<object>} 删除结果
   */
  async deleteResume(resumeId, owner) {
    try {
      const response = await httpClient.delete(
        API_ENDPOINTS.resumes.delete(resumeId, owner)
      );
      
      if (response.success) {
        return {
          success: true,
          message: '简历删除成功',
        };
      } else {
        throw new Error(response.error || '删除简历失败');
      }
    } catch (error) {
      console.error('删除简历失败:', error);
      throw error;
    }
  }

  /**
   * 解锁简历 (需要 x402 支付)
   * @param {string} resumeId - 简历 ID
   * @param {string} buyerWallet - 买家钱包地址
   * @returns {Promise<object>} 解锁结果
   */
  async unlockResume(resumeId, buyerWallet) {
    try {
      const response = await httpClient.post(API_ENDPOINTS.resumes.unlock, {
        resume_id: resumeId,
        buyer_wallet: buyerWallet,
      });
      
      if (response.success) {
        return {
          success: true,
          resume: response.data.resume,
          message: '简历解锁成功',
        };
      } else {
        throw new Error(response.error || '解锁简历失败');
      }
    } catch (error) {
      console.error('解锁简历失败:', error);
      throw error;
    }
  }

  /**
   * 设置简历价格
   * @param {string} resumeId - 简历 ID
   * @param {string} owner - 所有者钱包地址
   * @param {number} priceInUSDC - 价格（USDC）
   * @returns {Promise<object>} 设置结果
   */
  async setResumePrice(resumeId, owner, priceInUSDC) {
    try {
      // 将 USDC 转换为 units (1 USDC = 1,000,000 units, 6 decimals)
      const priceInUnits = Math.floor(priceInUSDC * 1_000_000);

      const response = await httpClient.put('/api/resumes/price', {
        resume_id: resumeId,
        owner: owner,
        price: priceInUnits,
      });
      
      if (response.success) {
        return {
          success: true,
          message: `简历价格已设置为 ${priceInUSDC} USDC`,
        };
      } else {
        throw new Error(response.error || '设置简历价格失败');
      }
    } catch (error) {
      console.error('设置简历价格失败:', error);
      throw error;
    }
  }

  /**
   * 从 Walrus 下载并解密简历
   * @param {string} blobId - Walrus blob ID
   * @param {string} encryptionKey - 加密密钥
   * @returns {Promise<object>} 解密后的简历数据
   */
  async downloadAndDecryptResume(blobId, encryptionKey) {
    try {
      console.log('⬇️  Step 1: Downloading from Walrus...');
      
      // 1. 从 Walrus 下载加密的 blob
      const encryptedBlob = await downloadFromWalrus(blobId);
      
      console.log('✅ Download complete');
      console.log('📦 Encrypted size:', encryptedBlob.size, 'bytes');

      console.log('🔓 Step 2: Decrypting with Seal...');
      
      // 2. 使用 Seal 解密
      const resumeData = await decryptWithSeal(encryptedBlob, encryptionKey);
      
      console.log('✅ Decryption complete');
      
      return resumeData;
    } catch (error) {
      console.error('下载或解密简历失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const resumeService = new ResumeService();
