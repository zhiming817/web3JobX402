/**
 * HTTP 请求工具类
 */
import { API_BASE_URL, DEFAULT_HEADERS, REQUEST_TIMEOUT } from './api.config';

/**
 * HTTP 请求类
 */
class HttpClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * 发送 HTTP 请求
   * @param {string} endpoint - API 端点
   * @param {object} options - 请求选项
   * @returns {Promise<any>} 响应数据
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
    };

    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // 解析响应
      const data = await response.json();

      // 检查响应状态
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请稍后重试');
      }
      
      throw error;
    }
  }

  /**
   * GET 请求
   * @param {string} endpoint - API 端点
   * @param {object} options - 请求选项
   * @returns {Promise<any>}
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST 请求
   * @param {string} endpoint - API 端点
   * @param {object} data - 请求数据
   * @param {object} options - 请求选项
   * @returns {Promise<any>}
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT 请求
   * @param {string} endpoint - API 端点
   * @param {object} data - 请求数据
   * @param {object} options - 请求选项
   * @returns {Promise<any>}
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE 请求
   * @param {string} endpoint - API 端点
   * @param {object} options - 请求选项
   * @returns {Promise<any>}
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

// 导出单例
export const httpClient = new HttpClient();
