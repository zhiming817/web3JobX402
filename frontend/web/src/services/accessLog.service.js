import { httpClient } from './http.client';
import { API_ENDPOINTS } from './api.config';

/**
 * 访问记录服务
 */
class AccessLogService {
  /**
   * 创建访问记录
   * @param {Object} data - 访问记录数据
   * @param {number} data.resume_id - 简历 ID
   * @param {string} data.accessor_address - 访问者地址
   * @param {string} data.access_type - 访问类型 (view/download/decrypt)
   * @param {string} data.encryption_type - 加密类型 (simple/seal)
   * @param {boolean} data.success - 是否成功
   * @param {string} [data.error_message] - 错误信息（可选）
   * @returns {Promise<Object>} 创建的访问记录
   */
  async createAccessLog(data) {
    try {
      const response = await httpClient.post(API_ENDPOINTS.accessLogs.create, data);
      return response.data;
    } catch (error) {
      console.error('创建访问记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取简历的访问记录
   * @param {number} resumeId - 简历 ID
   * @param {number} [limit=50] - 返回记录数量限制
   * @returns {Promise<Array>} 访问记录列表
   */
  async getResumeAccessLogs(resumeId, limit = 50) {
    try {
      const response = await httpClient.get(
        `${API_ENDPOINTS.accessLogs.getByResume(resumeId)}?limit=${limit}`
      );
      return response.data || [];
    } catch (error) {
      console.error('获取简历访问记录失败:', error);
      return [];
    }
  }

  /**
   * 获取访问者的访问记录
   * @param {string} accessorAddress - 访问者地址
   * @param {number} [limit=50] - 返回记录数量限制
   * @returns {Promise<Array>} 访问记录列表
   */
  async getAccessorLogs(accessorAddress, limit = 50) {
    try {
      const response = await httpClient.get(
        `${API_ENDPOINTS.accessLogs.getByAccessor(accessorAddress)}?limit=${limit}`
      );
      return response.data || [];
    } catch (error) {
      console.error('获取访问者记录失败:', error);
      return [];
    }
  }

  /**
   * 统计简历访问次数
   * @param {number} resumeId - 简历 ID
   * @returns {Promise<number>} 访问次数
   */
  async countResumeAccess(resumeId) {
    try {
      const response = await httpClient.get(
        API_ENDPOINTS.accessLogs.countAccess(resumeId)
      );
      return response.data?.count || 0;
    } catch (error) {
      console.error('统计访问次数失败:', error);
      return 0;
    }
  }
}

export default new AccessLogService();
