import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
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
  const connected = !!currentAccount;
  const publicKey = currentAccount?.address;
  const [activeSection, setActiveSection] = useState('personal');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    try {
      const walletAddress = publicKey;
      
      // 1. 确保用户已注册
      console.log('正在注册/获取用户信息...');
      await userService.registerOrGetUser(walletAddress);
      
      // 2. 转换表单数据为 API 格式
      const apiData = transformResumeData(formData, walletAddress);
      console.log('创建简历数据:', apiData);
      
      // 3. 调用创建简历 API（包含加密和上传）
      const result = await resumeService.createResume(apiData);
      
      console.log('简历创建成功:', result);
      
      // 4. 显示加密密钥并提示保存
      const saveKey = window.confirm(
        `✅ 简历创建成功！\n\n` +
        `简历 ID: ${result.resumeId}\n` +
        `IPFS CID: ${result.cid}\n\n` +
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
      
      // 5. 将加密密钥保存到 localStorage（可选，用户也可以选择不保存）
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
      
      // 6. 跳转到简历列表页
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
                  onClick={handleSave}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !connected}
                >
                  {isSubmitting ? '创建中...' : connected ? '完成' : '请先连接钱包'}
                </button>
              </div>
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
