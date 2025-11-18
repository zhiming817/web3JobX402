import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import PageLayout from '../layout/PageLayout';
import { 
  loadUserSubscriptions as loadUserSubscriptionsHandler,
  loadResumeSummaries as loadResumeSummariesHandler,
  handleUnlock as handleUnlockHandler,
  handleViewResume as handleViewResumeHandler,
  handleDecryptResume as handleDecryptResumeHandler,
} from './resumeBrowseHandlers';

export default function ResumeBrowse() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const connected = !!currentAccount;
  const publicKey = currentAccount?.address;
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 解密相关状态
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [decryptedData, setDecryptedData] = useState(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptKey, setDecryptKey] = useState('');
  
  // 订阅相关状态
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const [filters, setFilters] = useState({
    keyword: '',
    location: '',
    experience: '',
    salary: '',
  });

  // 加载简历列表
  useEffect(() => {
    loadResumeSummaries();
  }, []);

  // 加载用户订阅
  useEffect(() => {
    if (connected && publicKey) {
      loadUserSubscriptions();
    }
  }, [connected, publicKey]);

  const loadUserSubscriptions = async () => {
    try {
      const subscriptions = await loadUserSubscriptionsHandler(suiClient, publicKey);
      setUserSubscriptions(subscriptions);
    } catch (err) {
      console.error('❌ 加载订阅列表失败:', err);
    }
  };

  const loadResumeSummaries = async () => {
    setLoading(true);
    setError(null);

    try {
      const formattedResumes = await loadResumeSummariesHandler();
      setResumes(formattedResumes);
    } catch (err) {
      console.error('加载简历列表失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (resumeId) => {
    await handleUnlockHandler({
      resumeId,
      resumes,
      userSubscriptions,
      connected,
      publicKey,
      suiClient,
      signAndExecute,
      setIsPurchasing,
      setResumes,
      loadUserSubscriptionsCallback: loadUserSubscriptions,
      handleViewResumeCallback: handleViewResume,
    });
  };

  // 查看简历（解锁后）
  const handleViewResume = async (resume) => {
    await handleViewResumeHandler(resume, {
      setSelectedResume,
      setShowDecryptModal,
      setDecryptedData,
      setDecryptKey,
      setError,
      handleDecryptResumeCallback: handleDecryptResume,
    });
  };

  // 解密简历内容
  const handleDecryptResume = async (resume) => {
    await handleDecryptResumeHandler({
      resume,
      currentAccount,
      suiClient,
      signPersonalMessage,
      userSubscriptions,
      resumes,
      decryptKey,
      setIsDecrypting,
      setError,
      setDecryptedData,
      setResumes,
    });
  };

    // 过滤简历
  const filteredResumes = resumes.filter(resume => {
    if (filters.keyword && !resume.name.includes(filters.keyword) && !resume.title.includes(filters.keyword)) {
      return false;
    }
    if (filters.location && !resume.location.includes(filters.location)) {
      return false;
    }
    if (filters.experience && resume.experience !== filters.experience) {
      return false;
    }
    return true;
  });

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">加载简历列表中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadResumeSummaries}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">浏览简历</h1>
          <p className="text-gray-600 mt-2">发现优秀人才，使用 x402 支付解锁完整简历</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关键词
              </label>
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                placeholder="搜索职位、技能..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                城市
              </label>
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">全部</option>
                <option value="上海">上海</option>
                <option value="北京">北京</option>
                <option value="深圳">深圳</option>
                <option value="杭州">杭州</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                经验
              </label>
              <select
                value={filters.experience}
                onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">全部</option>
                <option value="1-3年">1-3年</option>
                <option value="3-5年">3-5年</option>
                <option value="5-10年">5-10年</option>
                <option value="10年以上">10年以上</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ keyword: '', location: '', experience: '', salary: '' })}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                重置筛选
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          找到 <span className="font-semibold text-gray-900">{filteredResumes.length}</span> 份匹配的简历
        </div>

        {/* Resume Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumes.map(resume => (
            <div
              key={resume.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border-2 border-gray-100 hover:border-orange-300"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">{resume.avatar}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">
                      {resume.isLocked ? `${resume.name.substring(0, 1)}**` : resume.name}
                    </h3>
                    <p className="text-orange-100">{resume.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {resume.experience}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {resume.education}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">📍</span>
                    <span className="text-gray-700">{resume.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">💰</span>
                    <span className="text-gray-700 font-semibold">{resume.salary}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">🎯</span>
                    <span className="text-gray-700">{resume.jobStatus}</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">核心技能</p>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.slice(0, resume.isLocked ? 3 : resume.skills.length).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {resume.isLocked && resume.skills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                        +{resume.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Highlights */}
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {resume.isLocked 
                      ? `${resume.highlights.substring(0, 30)}...` 
                      : resume.highlights
                    }
                  </p>
                </div>

                {/* Unlock Button */}
                {(() => {
                  const encryptionMode = resume.rawData?.encryption_mode;
                  
                  console.log('🔍 简历按钮渲染:', {
                    resumeId: resume.id,
                    encryptionMode: encryptionMode,
                    rawData: resume.rawData,
                  });
                  
                  // Allowlist 模式 - 直接显示查看按钮
                  if (encryptionMode === 'allowlist') {
                    return (
                      <button
                        onClick={() => handleViewResume({ ...resume, isLocked: false })}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        查看完整简历
                      </button>
                    );
                  }
                  
                  // Subscription 模式 - 检查是否已购买订阅
                  if (encryptionMode === 'subscription') {
                    const hasSubscription = userSubscriptions.some(
                      sub => sub.service_id === resume.rawData?.policy_object_id
                    );
                    
                    if (hasSubscription || !resume.isLocked) {
                      return (
                        <button
                          onClick={() => handleViewResume({ ...resume, isLocked: false })}
                          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          查看完整简历
                        </button>
                      );
                    }
                    
                    return (
                      <button
                        onClick={() => handleUnlock(resume.id)}
                        disabled={isPurchasing}
                        className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPurchasing ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            购买中...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                            支付 {resume.price} 购买永久访问
                          </>
                        )}
                      </button>
                    );
                  }
                  
                  // 默认情况（简单加密或无加密模式）
                  return (
                    <button
                      onClick={() => handleViewResume({ ...resume, isLocked: false })}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      查看简历
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredResumes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">未找到匹配的简历</h3>
            <p className="text-gray-600">尝试调整筛选条件</p>
          </div>
        )}

        {/* How it works */}
        <div className="mt-12 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-8 border-2 border-orange-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">💡 如何使用订阅模式查看简历</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">1️⃣</div>
              <h4 className="font-bold text-gray-900 mb-2">浏览加密简历</h4>
              <p className="text-gray-700 text-sm">
                查看候选人的技能摘要、经验和期望，详细信息使用 Seal 加密保护
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">2️⃣</div>
              <h4 className="font-bold text-gray-900 mb-2">购买订阅（永久访问）</h4>
              <p className="text-gray-700 text-sm">
                支付小额 USDC，购买后获得永久访问权限，款项直接转给简历所有者
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">3️⃣</div>
              <h4 className="font-bold text-gray-900 mb-2">解密查看完整简历</h4>
              <p className="text-gray-700 text-sm">
                订阅成功后，系统自动验证权限并解密，随时查看完整联系方式和详细信息
              </p>
            </div>
          </div>
          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm font-medium">
              ✨ <strong>特色功能：</strong>
              基于 Seal 订阅模式，一次付费永久访问 • 链上验证权限 • 端到端加密 • 去中心化存储
            </p>
          </div>
        </div>

        {/* 解密模态框 */}
        {showDecryptModal && selectedResume && (
          <div className="fixed inset-0 bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-pink-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">查看简历详情</h2>
                  <p className="text-orange-100 mt-1">
                    {selectedResume.encryption_type === 'seal' ? '🔒 Seal 加密保护' : '🔐 简单加密'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDecryptModal(false);
                    setSelectedResume(null);
                    setDecryptedData(null);
                    setError(null);
                  }}
                  className="text-white hover:text-orange-200 transition-colors text-3xl"
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* 如果是简单加密且未解密，显示密钥输入 */}
                {selectedResume.encryption_type !== 'seal' && !decryptedData && (
                  <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🔑 需要加密密钥</h3>
                    <p className="text-gray-700 mb-4">
                      此简历已使用简单加密保护,请输入密钥以查看内容
                    </p>
                    
                    <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-4 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-600">💡</span>
                        <div className="text-yellow-800">
                          <p className="font-semibold mb-1">密钥在哪里?</p>
                          <ul className="space-y-1 text-xs">
                            <li>• 如果你是简历所有者,密钥在创建简历时显示</li>
                            <li>• 如果你已保存到本地,刷新页面会自动填充</li>
                            <li>• 如果是 HR,请向简历所有者索取密钥</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        加密密钥 *
                      </label>
                      <div className="flex gap-3">
                        <textarea
                          value={decryptKey}
                          onChange={(e) => setDecryptKey(e.target.value)}
                          placeholder="请粘贴您的加密密钥..."
                          rows={4}
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowDecryptModal(false);
                            setSelectedResume(null);
                            setDecryptKey('');
                          }}
                          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                        >
                          返回列表
                        </button>
                        <button
                          onClick={() => handleDecryptResume(selectedResume)}
                          disabled={!decryptKey.trim() || isDecrypting}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                          {isDecrypting ? '解密中...' : '解密'}
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-500 text-center">
                        💡 提示: 如果您在创建简历时选择保存密钥到本地,则无需手动输入。如果忘记密钥,将无法恢复简历内容。
                      </p>
                    </div>
                  </div>
                )}

                {/* 解密中状态 */}
                {isDecrypting && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mb-4"></div>
                    <p className="text-gray-700 font-medium">
                      {selectedResume.encryption_type === 'seal' 
                        ? '正在验证访问权限并解密...' 
                        : '正在解密简历...'}
                    </p>
                  </div>
                )}

                {/* 错误提示 */}
                {error && (
                  <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h4 className="font-bold text-red-900 mb-1">解密失败</h4>
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 解密成功，显示完整简历 */}
                {decryptedData && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-center gap-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <h4 className="font-bold text-green-900">解密成功</h4>
                        <p className="text-green-700 text-sm">简历内容已成功解密</p>
                      </div>
                    </div>

                    {/* 基本信息 */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">📋 基本信息</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">姓名：</span>
                          <span className="font-medium text-gray-900">{decryptedData.personal?.name || '未提供'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">性别：</span>
                          <span className="font-medium text-gray-900">{decryptedData.personal?.gender || '未提供'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">出生日期：</span>
                          <span className="font-medium text-gray-900">{decryptedData.personal?.birth_date || '未提供'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">工作开始日期：</span>
                          <span className="font-medium text-gray-900">{decryptedData.personal?.work_start_date || '未提供'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">联系方式：</span>
                          <span className="font-medium text-gray-900">{decryptedData.personal?.contact || decryptedData.personal?.phone || '未提供'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">求职状态：</span>
                          <span className="font-medium text-gray-900">{decryptedData.personal?.job_status || '未提供'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 求职意向 */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 求职意向</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">职位：</span>
                          <span className="font-medium text-gray-900">{decryptedData.desired_position?.position || '未提供'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">工作类型：</span>
                          <span className="font-medium text-gray-900">{decryptedData.desired_position?.job_type || '未提供'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">期望行业：</span>
                          <span className="font-medium text-gray-900">{decryptedData.desired_position?.industry || '未提供'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">期望城市：</span>
                          <span className="font-medium text-gray-900">{decryptedData.desired_position?.city || '未提供'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">最低薪资：</span>
                          <span className="font-medium text-gray-900">
                            {decryptedData.desired_position?.salary_min ? `${(decryptedData.desired_position.salary_min / 1000).toFixed(0)}K` : '未提供'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">最高薪资：</span>
                          <span className="font-medium text-gray-900">
                            {decryptedData.desired_position?.salary_max ? `${(decryptedData.desired_position.salary_max / 1000).toFixed(0)}K` : '未提供'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 技能 */}
                    {decryptedData.skills && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">️ 技能专长</h3>
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                          {decryptedData.skills}
                        </div>
                      </div>
                    )}

                    {/* 教育背景 */}
                    {decryptedData.education && Array.isArray(decryptedData.education) && decryptedData.education.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">🎓 教育背景</h3>
                        <div className="space-y-4">
                          {decryptedData.education.map((edu, index) => (
                            <div key={index} className="border-l-4 border-blue-500 pl-4">
                              <div className="font-semibold text-gray-900">{edu.school || '未知学校'}</div>
                              <div className="text-gray-700">{edu.major || '未知专业'} · {edu.degree || '未知学历'}</div>
                              <div className="text-sm text-gray-500">
                                {edu.start_date || ''} - {edu.end_date || ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 工作经验 */}
                    {decryptedData.work_experience && Array.isArray(decryptedData.work_experience) && decryptedData.work_experience.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">💼 工作经验</h3>
                        <div className="space-y-4">
                          {decryptedData.work_experience.map((work, index) => (
                            <div key={index} className="border-l-4 border-green-500 pl-4">
                              <div className="font-semibold text-gray-900">{work.company || '未知公司'}</div>
                              <div className="text-gray-700">{work.position || '未知职位'}</div>
                              <div className="text-sm text-gray-500">
                                {work.start_date || ''} - {work.end_date || '至今'}
                              </div>
                              {work.description && (
                                <div className="mt-2 text-gray-600 text-sm whitespace-pre-wrap">{work.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 项目经验 */}
                    {decryptedData.project_experience && Array.isArray(decryptedData.project_experience) && decryptedData.project_experience.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 项目经验</h3>
                        <div className="space-y-4">
                          {decryptedData.project_experience.map((project, index) => (
                            <div key={index} className="border-l-4 border-purple-500 pl-4">
                              <div className="font-semibold text-gray-900">{project.name || '未知项目'}</div>
                              <div className="text-gray-700">{project.role || '项目成员'}</div>
                              <div className="text-sm text-gray-500">
                                {project.start_date || ''} - {project.end_date || ''}
                              </div>
                              {project.description && (
                                <div className="mt-2 text-gray-600 text-sm whitespace-pre-wrap">{project.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 证书 */}
                    {decryptedData.certificates && Array.isArray(decryptedData.certificates) && decryptedData.certificates.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 证书</h3>
                        <div className="space-y-2">
                          {decryptedData.certificates.map((cert, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-blue-600">•</span>
                              <span className="text-gray-700">{cert.name || '未知证书'}</span>
                              {cert.issue_date && (
                                <span className="text-sm text-gray-500">({cert.issue_date})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 自我评价 */}
                    {decryptedData.self_evaluation && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">✨ 自我评价</h3>
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                          {decryptedData.self_evaluation}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 如果是 Seal 加密且未开始解密 */}
                {selectedResume.encryption_type === 'seal' && !decryptedData && !isDecrypting && !error && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔒</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Seal 加密简历</h3>
                    <p className="text-gray-600 mb-4">
                      该简历使用 Seal 阈值加密技术保护,访问权限由链上 Allowlist 控制
                    </p>
                    
                    <div className="max-w-md mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
                      <p className="font-semibold text-blue-900 mb-2">✨ Seal 加密特点:</p>
                      <ul className="space-y-1 text-blue-700">
                        <li>• 无需手动输入密钥</li>
                        <li>• 系统自动验证您的访问权限</li>
                        <li>• 只有白名单中的地址才能解密</li>
                        <li>• 密钥由多个服务器分布式管理</li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleDecryptResume(selectedResume)}
                      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 font-medium transition-colors text-lg"
                    >
                      🔓 验证权限并解密
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-4">
                      点击按钮后,系统将自动创建 SessionKey 并验证您的访问权限
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
