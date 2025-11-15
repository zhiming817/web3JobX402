/**
 * API 配置
 */

// 从环境变量或配置文件读取 API 基础 URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4021';

// API 端点
export const API_ENDPOINTS = {
  // 用户相关
  users: {
    register: '/api/users/register',
    getByWallet: (wallet) => `/api/users/wallet/${wallet}`,
    getById: (id) => `/api/users/id/${id}`,
    updateNickname: (wallet) => `/api/users/wallet/${wallet}/nickname`,
  },
  
  // 简历相关
  resumes: {
    create: '/api/resumes',
    getSummaries: '/api/resumes/summaries',
    getMyResumes: (owner) => `/api/resumes/my/${owner}`,
    update: (resumeId) => `/api/resumes/${resumeId}`,
    delete: (resumeId, owner) => `/api/resumes/${resumeId}/${owner}`,
    unlock: '/api/resumes/unlock',
  },

  // 解锁记录相关
  unlockRecords: {
    create: '/api/unlock-records',
    checkUnlock: (resumeId, buyerId) => `/api/unlock-records/check/${resumeId}/${buyerId}`,
    getUnlockedByBuyer: (buyerWallet) => `/api/unlock-records/buyer/${buyerWallet}`,
    getByResume: (resumeId) => `/api/unlock-records/resume/${resumeId}`,
  },
};

// HTTP 请求配置
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// 请求超时时间 (毫秒)
export const REQUEST_TIMEOUT = 30000;
