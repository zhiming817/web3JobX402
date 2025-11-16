import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import PageLayout from '../layout/PageLayout';
import { resumeService } from '../services';

export default function ResumeList() {
  const currentAccount = useCurrentAccount();
  const connected = !!currentAccount;
  const publicKey = currentAccount?.address;
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 加载简历列表
  useEffect(() => {
    if (connected && publicKey) {
      loadMyResumes();
    } else {
      setResumes([]);
    }
  }, [connected, publicKey]);

  const loadMyResumes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const walletAddress = publicKey;
      const data = await resumeService.getMyResumes(walletAddress);
      
      // 转换后端数据格式为前端格式
      const formattedResumes = data.map(resume => {
        const encryptionMode = resume.encryption_mode || 'subscription';
        const isSubscription = encryptionMode === 'subscription';
        
        return {
          id: resume.id, // 使用 id 而不是 resume_id
          name: resume.personal?.name || '未命名简历',
          updatedAt: new Date(resume.updated_at * 1000).toLocaleDateString('zh-CN'), // 转换时间戳
          views: resume.view_count || 0,
          unlocks: resume.unlock_count || 0,
          encryptionMode, // 加密模式
          price: resume.price || 0, // 价格（USDC 最小单位，6 decimals）
          priceUSDC: isSubscription ? ((resume.price || 0) / 1_000_000).toFixed(2) + ' USDC' : null, // 仅订阅模式显示价格
          earnings: isSubscription ? (((resume.price || 0) * (resume.unlock_count || 0)) / 1_000_000).toFixed(2) + ' USDC' : null, // 仅订阅模式显示收益
          status: resume.status || 'active',
          rawData: resume, // 保存原始数据
        };
      });
      
      setResumes(formattedResumes);
    } catch (err) {
      console.error('加载简历列表失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这份简历吗？')) {
      return;
    }

    try {
      const walletAddress = publicKey;
      await resumeService.deleteResume(id, walletAddress);
      
      // 从列表中移除
      setResumes(resumes.filter(r => r.id !== id));
      alert('简历删除成功');
    } catch (err) {
      console.error('删除简历失败:', err);
      alert(`删除失败: ${err.message}`);
    }
  };

  const handleSetPrice = async (id) => {
    // 找到当前简历，显示其当前价格
    const resume = resumes.find(r => r.id === id);
    const currentPrice = resume ? ((resume.price || 0) / 1_000_000).toFixed(2) : '5.00';
    
    const price = prompt('请设置简历解锁价格（USDC）：', currentPrice);
    if (price === null) return; // 用户取消
    
    const priceFloat = parseFloat(price);
    if (isNaN(priceFloat) || priceFloat < 0) {
      alert('请输入有效的价格');
      return;
    }

    try {
      const walletAddress = publicKey;
      await resumeService.setResumePrice(id, walletAddress, priceFloat);
      
      alert(`简历价格已设置为 ${priceFloat} USDC`);
      // 重新加载列表以显示更新后的价格
      loadMyResumes();
    } catch (err) {
      console.error('设置简历价格失败:', err);
      alert(`设置价格失败: ${err.message}`);
    }
  };

  if (!connected || !publicKey) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              请先连接钱包
            </h2>
            <p className="text-xl text-gray-600">
              您需要连接 Solana 钱包才能管理简历
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // 加载中状态
  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <p className="mt-4 text-gray-600">加载简历列表中...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // 错误状态
  if (error) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">加载失败</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadMyResumes}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">我的简历</h1>
            <p className="text-gray-600 mt-2">管理您的加密简历</p>
          </div>
          <Link to="/resume/create">
            <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              创建新简历
            </button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">总简历数</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{resumes.length}</p>
              </div>
              <div className="text-4xl">📄</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">总浏览量</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {resumes.reduce((acc, r) => acc + r.views, 0)}
                </p>
              </div>
              <div className="text-4xl">👁️</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">总解锁数</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">
                  {resumes.reduce((acc, r) => acc + r.unlocks, 0)}
                </p>
              </div>
              <div className="text-4xl">🔓</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">总收益</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {resumes
                    .filter(r => r.encryptionMode === 'subscription')
                    .reduce((acc, r) => acc + parseFloat(r.earnings || 0), 0)
                    .toFixed(2)} USDC
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
        </div>

        {/* Resume List */}
        {resumes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">还没有简历</h3>
            <p className="text-gray-600 mb-6">创建您的第一份加密简历，开始赚取收益</p>
            <Link to="/resume/create">
              <button className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors">
                立即创建
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {resumes.map(resume => (
              <div
                key={resume.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{resume.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        resume.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {resume.status === 'active' ? '已发布' : '草稿'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        resume.encryptionMode === 'allowlist'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {resume.encryptionMode === 'allowlist' ? '📋 Allowlist' : '💰 订阅模式'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">简历 ID: {resume.id}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        更新于 {resume.updatedAt}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {resume.views} 次浏览
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                        {resume.unlocks} 次解锁
                      </span>
                      {resume.encryptionMode === 'subscription' && (
                        <>
                          <span className="flex items-center gap-1 font-semibold text-purple-600">
                            💎 单价: {resume.priceUSDC}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-green-600">
                            💰 收益: {resume.earnings}
                          </span>
                        </>
                      )}
                      {resume.encryptionMode === 'allowlist' && (
                        <span className="flex items-center gap-1 font-semibold text-blue-600">
                          🔐 白名单访问
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/resume/preview/${resume.id}`}>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        预览
                      </button>
                    </Link>
                    <Link to={`/resume/edit/${resume.id}`}>
                      <button className="px-4 py-2 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
                        编辑
                      </button>
                    </Link>
                    {resume.encryptionMode === 'subscription' && (
                      <button
                        onClick={() => handleSetPrice(resume.id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        设置价格
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(resume.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
