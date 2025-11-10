/**
 * 用户相关 API 服务
 */
import { httpClient } from './http.client';
import { API_ENDPOINTS } from './api.config';

/**
 * 用户 API 服务类
 */
class UserService {
  /**
   * 注册或获取用户
   * @param {string} walletAddress - 钱包地址
   * @returns {Promise<object>} 用户信息
   */
  async registerOrGetUser(walletAddress) {
    try {
      const response = await httpClient.post(API_ENDPOINTS.users.register, {
        wallet_address: walletAddress,
      });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || '用户注册失败');
      }
    } catch (error) {
      console.error('用户注册失败:', error);
      throw error;
    }
  }

  /**
   * 通过钱包地址获取用户信息
   * @param {string} walletAddress - 钱包地址
   * @returns {Promise<object>} 用户信息
   */
  async getUserByWallet(walletAddress) {
    try {
      const response = await httpClient.get(
        API_ENDPOINTS.users.getByWallet(walletAddress)
      );
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || '获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 通过 ID 获取用户信息
   * @param {number} userId - 用户 ID
   * @returns {Promise<object>} 用户信息
   */
  async getUserById(userId) {
    try {
      const response = await httpClient.get(
        API_ENDPOINTS.users.getById(userId)
      );
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || '获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户昵称
   * @param {string} walletAddress - 钱包地址
   * @param {string} nickname - 新昵称
   * @returns {Promise<object>} 更新后的用户信息
   */
  async updateNickname(walletAddress, nickname) {
    try {
      const response = await httpClient.post(
        API_ENDPOINTS.users.updateNickname(walletAddress),
        { nickname }
      );
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || '更新昵称失败');
      }
    } catch (error) {
      console.error('更新昵称失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const userService = new UserService();
