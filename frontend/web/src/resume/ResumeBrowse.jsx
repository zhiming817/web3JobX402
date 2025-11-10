import React, { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import PageLayout from '../layout/PageLayout';
import { resumeService } from '../services';

export default function ResumeBrowse() {
  const currentAccount = useCurrentAccount();
  const connected = !!currentAccount;
  const publicKey = currentAccount?.address;
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const loadResumeSummaries = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await resumeService.getResumeSummaries();
      
      // 转换后端数据为前端格式
      const formattedResumes = data.map(resume => {
        // 直接使用 resume 的字段，不需要通过 summary
        const personal = resume.personal || {};
        const desiredPosition = resume.desired_position || {};
        
        return {
          id: resume.id, // 使用 id 而不是 resume_id
          resumeId: resume.id,
          name: personal.name || '未知',
          title: desiredPosition.position || '未填写职位',
          experience: calculateExperience(personal.work_start_date),
          education: getEducationLevel(resume.education),
          jobStatus: personal.job_status || '未知',
          location: desiredPosition.city || '未知',
          salary: formatSalary(desiredPosition.salary_min, desiredPosition.salary_max),
          skills: (resume.skills || '').split(',').map(s => s.trim()).filter(Boolean),
          highlights: resume.skills || '暂无介绍',
          price: ((resume.price || 0) / 1_000_000_000).toFixed(4) + ' SOL',
          priceRaw: resume.price || 0,
          isLocked: true,
          avatar: getAvatar(personal.gender),
          viewCount: resume.view_count || 0,
          unlockCount: resume.unlock_count || 0,
          ownerWallet: resume.owner,
          rawData: resume,
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

  // 计算工作年限
  const calculateExperience = (workStartDate) => {
    if (!workStartDate) return '未知';
    
    try {
      const startYear = new Date(workStartDate).getFullYear();
      const currentYear = new Date().getFullYear();
      const years = currentYear - startYear;
      
      if (years < 1) return '1年以下';
      if (years <= 3) return '1-3年';
      if (years <= 5) return '3-5年';
      if (years <= 10) return '5-10年';
      return '10年以上';
    } catch {
      return '未知';
    }
  };

  // 获取学历
  const getEducationLevel = (educationArray) => {
    if (!educationArray || educationArray.length === 0) return '未知';
    return educationArray[0].degree || '未知';
  };

  // 格式化薪资
  const formatSalary = (min, max) => {
    if (!min && !max) return '面议';
    if (min && max) return `${(min/1000).toFixed(0)}-${(max/1000).toFixed(0)}K`;
    if (min) return `${(min/1000).toFixed(0)}K+`;
    return '面议';
  };

  // 获取头像
  const getAvatar = (gender) => {
    if (gender === '男') return '👨‍💻';
    if (gender === '女') return '👩‍💻';
    return '👤';
  };

  const handleUnlock = async (resumeId) => {
    if (!connected || !publicKey) {
      alert('请先连接钱包！');
      return;
    }

    const resume = resumes.find(r => r.resumeId === resumeId);
    if (!resume) return;

    const confirmed = window.confirm(
      `解锁简历需要支付 ${resume.price}\n\n支付将通过 x402 直接转账给简历所有者。\n\n确定要解锁吗？`
    );

    if (confirmed) {
      try {
        const buyerWallet = publicKey.toString();
        const result = await resumeService.unlockResume(resumeId, buyerWallet);
        
        console.log('解锁成功:', result);
        alert('简历解锁成功！');
        
        // 更新本地状态
        setResumes(resumes.map(r => 
          r.resumeId === resumeId ? { ...r, isLocked: false } : r
        ));
      } catch (err) {
        console.error('解锁失败:', err);
        alert(`解锁失败: ${err.message}\n\n这可能是因为：\n1. 需要真实的 x402 支付\n2. 钱包余额不足\n3. 网络错误`);
      }
    }
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
                {resume.isLocked ? (
                  <button
                    onClick={() => handleUnlock(resume.id)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    支付 {resume.price} 解锁
                  </button>
                ) : (
                  <div className="text-center p-3 bg-green-50 text-green-700 rounded-lg font-medium">
                    ✓ 已解锁
                  </div>
                )}
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
          <h3 className="text-2xl font-bold text-gray-900 mb-4">💡 如何使用</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">1️⃣</div>
              <h4 className="font-bold text-gray-900 mb-2">浏览匿名简历</h4>
              <p className="text-gray-700 text-sm">
                查看候选人的技能摘要、经验和期望，但详细信息被加密保护
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">2️⃣</div>
              <h4 className="font-bold text-gray-900 mb-2">x402 支付解锁</h4>
              <p className="text-gray-700 text-sm">
                找到合适的候选人？通过 x402 支付小额费用直接解锁完整简历
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">3️⃣</div>
              <h4 className="font-bold text-gray-900 mb-2">查看完整信息</h4>
              <p className="text-gray-700 text-sm">
                支付后立即获得完整联系方式和详细简历，直接联系候选人
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
