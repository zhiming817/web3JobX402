import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import PageLayout from '../layout/PageLayout';
import PersonalInfo from './sections/PersonalInfo';
import Skills from './sections/Skills';
import DesiredPosition from './sections/DesiredPosition';
import WorkExperience from './sections/WorkExperience';
import ProjectExperience from './sections/ProjectExperience';
import Education from './sections/Education';
import Certificates from './sections/Certificates';
import ResumePreview from './ResumePreview';
import { resumeService, userService } from '../services';
import { transformResumeData, validateResumeData } from '../services/resume.transform';

export default function ResumeCreate() {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const connected = !!currentAccount;
  const publicKey = currentAccount?.address;
  const [activeSection, setActiveSection] = useState('personal');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Seal 加密选项
  const [useSealEncryption, setUseSealEncryption] = useState(false);
  const [allowlistId, setAllowlistId] = useState('');
  const [capId, setCapId] = useState('');
  const [showSealOptions, setShowSealOptions] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    personal: {
      name: '',
      gender: 'male',
      birthDate: '',
      workStartDate: '',
      jobStatus: 'employed',
      identity: 'professional',
      phone: '',
      wechat: '',
      email: '',
    },
    skills: '',
    desiredPosition: {
      jobType: 'fulltime',
      position: '',
      industry: '',
      salaryMin: '',
      salaryMax: '',
      city: '',
      otherCities: [],
    },
    workExperience: [],
    projectExperience: [],
    education: [],
    certificates: [],
  });

  // 侧边栏导航
  const sections = [
    { id: 'personal', name: '个人信息', icon: '👤' },
    { id: 'skills', name: '个人优势', icon: '⭐' },
    { id: 'desired', name: '期望职位', icon: '💼' },
    { id: 'work', name: '工作经历', icon: '💻' },
    { id: 'project', name: '项目经历', icon: '📁' },
    { id: 'education', name: '教育经历', icon: '🎓' },
    { id: 'certificate', name: '资格证书', icon: '📜' },
  ];

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    // 检查钱包连接
    if (!connected || !publicKey) {
      alert('请先连接钱包');
      return;
    }

    // 验证表单数据
    const validation = validateResumeData(formData);
    if (!validation.valid) {
      alert('请填写必填项:\n' + validation.errors.join('\n'));
      return;
    }

    // 如果使用 Seal 加密，验证 Allowlist 信息
    if (useSealEncryption) {
      if (!allowlistId || !capId) {
        alert('请填写 Allowlist ID 和 Cap ID\n\n如果您还没有 Allowlist，请先创建一个。');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const walletAddress = publicKey;
      
      // 1. 确保用户已注册
      console.log('正在注册/获取用户信息...');
      await userService.registerOrGetUser(walletAddress);
      
      // 2. 转换表单数据为 API 格式
      const apiData = transformResumeData(formData, walletAddress);
      console.log('创建简历数据:', apiData);
      
      let result;
      
      if (useSealEncryption) {
        // 使用 Seal 加密创建
        console.log('🔐 使用 Seal 加密创建简历...');
        result = await resumeService.createResumeWithSeal(apiData, allowlistId);
        
        console.log('✅ Seal 加密创建成功:', result);
        
        // 自动将创建者添加到 Allowlist
        console.log('👤 自动添加创建者到 Allowlist...');
        try {
          await resumeService.addToResumeAllowlist(
            allowlistId,
            capId,
            walletAddress,
            signAndExecute
          );
          console.log('✅ 创建者已添加到 Allowlist');
        } catch (addError) {
          console.warn('添加创建者到 Allowlist 失败 (可能已存在):', addError);
          // 如果添加失败（可能已存在），继续执行
        }
        
        // 关联 Blob 到 Allowlist
        console.log('📎 关联 Blob 到 Allowlist...');
        await resumeService.publishBlobToAllowlist(
          allowlistId,
          capId,
          result.blobId,
          signAndExecute
        );
        
        alert(
          `✅ 简历创建成功！\n\n` +
          `简历 ID: ${result.resumeId}\n` +
          `Blob ID: ${result.blobId}\n` +
          `Encryption ID: ${result.encryptionId}\n\n` +
          `✨ 您的简历已使用 Seal 加密保护\n` +
          `✅ 您已自动添加到访问白名单\n` +
          `访问权限由 Allowlist 控制\n` +
          `Allowlist ID: ${allowlistId}`
        );
      } else {
        // 使用简单加密创建
        console.log('🔒 使用简单加密创建简历...');
        result = await resumeService.createResume(apiData);
        
        console.log('简历创建成功:', result);
        
        // 显示加密密钥并提示保存
        const saveKey = window.confirm(
          `✅ 简历创建成功！\n\n` +
          `简历 ID: ${result.resumeId}\n` +
          `Blob ID: ${result.blobId}\n\n` +
          `⚠️ 重要：您的加密密钥如下\n` +
          `${result.encryptionKey}\n\n` +
          `此密钥是解密简历的唯一方式，请务必保存！\n` +
          `点击"确定"复制密钥到剪贴板`
        );
        
        if (saveKey) {
          // 复制密钥到剪贴板
          navigator.clipboard.writeText(result.encryptionKey).then(() => {
            alert('✅ 加密密钥已复制到剪贴板！\n请妥善保存，丢失将无法恢复简历内容。');
          }).catch(err => {
            console.error('复制失败:', err);
            alert('❌ 复制失败，请手动保存密钥:\n' + result.encryptionKey);
          });
        }
        
        // 将加密密钥保存到 localStorage（可选）
        const shouldSaveLocally = window.confirm(
          '是否将加密密钥保存到浏览器本地？\n\n' +
          '✅ 优点：方便预览和编辑自己的简历\n' +
          '⚠️ 风险：如果其他人使用此设备，可能访问您的简历\n\n' +
          '建议：仅在个人设备上保存'
        );
        
        if (shouldSaveLocally) {
          const keys = JSON.parse(localStorage.getItem('resumeEncryptionKeys') || '{}');
          keys[result.resumeId] = result.encryptionKey;
          localStorage.setItem('resumeEncryptionKeys', JSON.stringify(keys));
          console.log('✅ 加密密钥已保存到本地');
        }
      }
      
      // 跳转到简历列表页
      navigate('/resumes');
      
    } catch (error) {
      console.error('创建简历失败:', error);
      alert(`创建简历失败: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* 左侧导航 */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6 text-gray-900">简历目录</h2>
              <nav className="space-y-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                      activeSection === section.id
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{section.icon}</span>
                    <span className="font-medium">{section.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 右侧内容区 */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-8">
              {/* 个人信息 */}
              {activeSection === 'personal' && (
                <PersonalInfo formData={formData} handleInputChange={handleInputChange} />
              )}

              {/* 个人优势 */}
              {activeSection === 'skills' && (
                <Skills formData={formData} setFormData={setFormData} />
              )}

              {/* 期望职位 */}
              {activeSection === 'desired' && (
                <DesiredPosition formData={formData} handleInputChange={handleInputChange} />
              )}

              {/* 工作经历 */}
              {activeSection === 'work' && (
                <WorkExperience formData={formData} setFormData={setFormData} />
              )}

              {/* 项目经历 */}
              {activeSection === 'project' && (
                <ProjectExperience formData={formData} setFormData={setFormData} />
              )}

              {/* 教育经历 */}
              {activeSection === 'education' && (
                <Education formData={formData} setFormData={setFormData} />
              )}

              {/* 资格证书 */}
              {activeSection === 'certificate' && (
                <Certificates formData={formData} setFormData={setFormData} />
              )}

              {/* 操作按钮 */}
              <div className="mt-8 flex justify-end gap-4">
                <button
                  onClick={() => navigate('/resumes')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  取消
                </button>
                <button
                  onClick={handlePreview}
                  className="px-6 py-2 border border-orange-500 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
                  disabled={isSubmitting}
                >
                  预览
                </button>
                <button
                  onClick={() => setShowSealOptions(!showSealOptions)}
                  className="px-6 py-2 border border-blue-500 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                  disabled={isSubmitting}
                >
                  {showSealOptions ? '隐藏高级选项' : '高级选项'}
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !connected}
                >
                  {isSubmitting ? '创建中...' : connected ? '完成' : '请先连接钱包'}
                </button>
              </div>

              {/* Seal 加密选项 */}
              {showSealOptions && (
                <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                        🔐 Seal 加密和访问控制
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        使用 Seal 加密可以实现基于链上 Allowlist 的访问控制
                      </p>
                    </div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSealEncryption}
                        onChange={(e) => setUseSealEncryption(e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-blue-900 font-medium">启用</span>
                    </label>
                  </div>

                  {useSealEncryption && (
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Allowlist ID *
                        </label>
                        <input
                          type="text"
                          value={allowlistId}
                          onChange={(e) => setAllowlistId(e.target.value)}
                          placeholder="0x..."
                          className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          用于控制谁可以访问您的简历
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Cap ID *
                        </label>
                        <input
                          type="text"
                          value={capId}
                          onChange={(e) => setCapId(e.target.value)}
                          placeholder="0x..."
                          className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          Allowlist 的管理员凭证
                        </p>
                      </div>

                      <div className="bg-white p-4 rounded border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">
                          ℹ️ 什么是 Seal 加密?
                        </h4>
                        <ul className="text-xs text-blue-700 space-y-1">
                          <li>✅ 基于阈值加密,密钥由多个服务器分布式管理</li>
                          <li>✅ 通过链上 Allowlist 控制访问权限</li>
                          <li>✅ 支持动态添加/移除访问者</li>
                          <li>✅ 适合付费解锁、订阅等商业场景</li>
                          <li>✅ 创建后您会自动添加到白名单</li>
                          <li>⚠️ 需要先创建 Allowlist（一次性操作）</li>
                        </ul>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => navigate('/allowlist')}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                          >
                            🔗 前往创建 Allowlist
                          </button>
                          <button
                            onClick={() => window.open('https://docs.walrus.site/walrus-sites/seal.html', '_blank')}
                            className="flex-1 px-4 py-2 border border-blue-300 text-blue-700 rounded text-xs font-medium hover:bg-blue-50 transition-colors"
                          >
                            📖 查看文档
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 预览弹窗 */}
      {showPreview && (
        <ResumePreview 
          formData={formData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </PageLayout>
  );
}
