import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { resumeService } from '../services';
import { transformResumeData, validateResumeData } from '../services/resume.transform';
import { encryptWithSeal, decryptWithSeal } from '../utils/seal';
import { uploadToWalrus, downloadFromWalrus } from '../utils/walrus';

export default function ResumeEdit() {
  const navigate = useNavigate();
  const { id } = useParams(); // 获取简历 ID
  const currentAccount = useCurrentAccount();
  const connected = !!currentAccount;
  const publicKey = currentAccount?.address;
  const [activeSection, setActiveSection] = useState('personal');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [currentCid, setCurrentCid] = useState(null); // 保存当前的 CID

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

  // 加载简历数据
  useEffect(() => {
    if (!connected || !publicKey) {
      navigate('/resumes');
      return;
    }

    loadResumeDetail();
  }, [id, connected, publicKey]);

  const loadResumeDetail = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const owner = publicKey;
      const resume = await resumeService.getResumeDetail(id, owner);
      
      console.log('加载的简历数据:', resume);
      
      // 检查是否有 IPFS CID（表示加密简历）
      const ipfsCid = resume.ipfs_cid || resume.cid;
      setCurrentCid(ipfsCid); // 保存 CID
      
      if (!ipfsCid) {
        // 没有 CID，说明是旧版本未加密的简历，直接显示
        console.log('⚠️ 未加密的简历，直接显示');
        setFormData(transformResumeToFormData(resume));
        setIsLoading(false);
        return;
      }
      
      console.log('🔐 检测到加密简历，CID:', ipfsCid);
      
      // 1. 尝试从 localStorage 读取密钥
      const savedKeys = JSON.parse(localStorage.getItem('resumeEncryptionKeys') || '{}');
      let key = savedKeys[id];
      
      if (!key) {
        console.log('⚠️ 本地未找到密钥，需要用户输入');
        setNeedsKey(true);
        setIsLoading(false);
        return;
      }
      
      console.log('✅ 找到本地密钥，开始解密...');
      setEncryptionKey(key); // 保存密钥供后续更新使用
      
      // 2. 下载并解密
      await decryptAndLoadResume(ipfsCid, key);
      
    } catch (err) {
      console.error('加载简历失败:', err);
      setLoadError(err.message);
      
      if (err.message.includes('Unauthorized')) {
        alert('无权编辑此简历');
        navigate('/resumes');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const decryptAndLoadResume = async (cid, key) => {
    try {
      setIsDecrypting(true);
      
      console.log('📥 从 Walrus 下载加密数据...');
      const encryptedBlob = await downloadFromWalrus(cid);
      console.log('✅ 下载完成:', encryptedBlob.size, 'bytes');
      
      console.log('🔓 使用 Seal 解密中...');
      const decryptedData = await decryptWithSeal(encryptedBlob, key);
      console.log('✅ 解密成功:', decryptedData);
      
      // 3. 转换为表单格式
      setFormData(transformResumeToFormData(decryptedData));
      setNeedsKey(false);
      
    } catch (err) {
      console.error('解密失败:', err);
      
      // 如果解密失败，可能是密钥错误，提示用户重新输入
      if (err.message.includes('decrypt') || err.message.includes('OperationError')) {
        alert('⚠️ 解密失败，密钥可能不正确。请重新输入正确的密钥。');
        
        // 清除错误的密钥
        const savedKeys = JSON.parse(localStorage.getItem('resumeEncryptionKeys') || '{}');
        delete savedKeys[id];
        localStorage.setItem('resumeEncryptionKeys', JSON.stringify(savedKeys));
        
        setEncryptionKey('');
        setNeedsKey(true);
      } else {
        throw err;
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleKeySubmit = async () => {
    if (!encryptionKey.trim()) {
      alert('请输入加密密钥');
      return;
    }
    
    try {
      const owner = publicKey;
      const resume = await resumeService.getResumeDetail(id, owner);
      const ipfsCid = resume.ipfs_cid || resume.cid;
      
      await decryptAndLoadResume(ipfsCid, encryptionKey.trim());
      
      // 解密成功后，询问是否保存密钥
      const shouldSave = window.confirm(
        '✅ 解密成功！\n\n是否将此密钥保存到本地浏览器？\n' +
        '（保存后下次可自动解密）'
      );
      
      if (shouldSave) {
        const savedKeys = JSON.parse(localStorage.getItem('resumeEncryptionKeys') || '{}');
        savedKeys[id] = encryptionKey.trim();
        localStorage.setItem('resumeEncryptionKeys', JSON.stringify(savedKeys));
        console.log('✅ 密钥已保存到本地');
      }
      
    } catch (err) {
      console.error('解密失败:', err);
      alert('❌ 解密失败: ' + err.message);
    }
  };

  const transformResumeToFormData = (resume) => {
    return {
      personal: {
        name: resume.personal?.name || '',
        gender: resume.personal?.gender === '女' ? 'female' : 'male',
        birthDate: resume.personal?.birth_date || resume.personal?.birthDate || '',
        workStartDate: resume.personal?.work_start_date || resume.personal?.workStartDate || '',
        jobStatus: resume.personal?.job_status || resume.personal?.jobStatus || 'employed',
        identity: resume.personal?.identity || 'professional',
        phone: resume.personal?.phone || '',
        wechat: resume.personal?.wechat || '',
        email: resume.personal?.email || '',
      },
      skills: resume.skills || '',
      desiredPosition: {
        jobType: resume.desired_position?.job_type || resume.desiredPosition?.jobType || 'fulltime',
        position: resume.desired_position?.position || resume.desiredPosition?.position || '',
        industry: resume.desired_position?.industry || resume.desiredPosition?.industry || '',
        salaryMin: resume.desired_position?.salary_min || resume.desiredPosition?.salaryMin || '',
        salaryMax: resume.desired_position?.salary_max || resume.desiredPosition?.salaryMax || '',
        city: resume.desired_position?.city || resume.desiredPosition?.city || '',
        otherCities: resume.desired_position?.other_cities || resume.desiredPosition?.otherCities || [],
      },
      workExperience: resume.work_experience || resume.workExperience || [],
      projectExperience: resume.project_experience || resume.projectExperience || [],
      education: (resume.education || []).map(edu => ({
        school: edu.school || '',
        major: edu.major || '',
        degree: edu.degree || 'bachelor',
        education_type: edu.education_type || edu.educationType || 'fulltime',
        start_date: edu.start_date || edu.startDate || '',
        end_date: edu.end_date || edu.endDate || '',
        thesis: edu.thesis || '',
        experience: '',
        thesisDescription: '',
      })),
      certificates: resume.certificates || [],
    };
  };

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

  const handleUpdate = async () => {
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
      
      // 如果有加密密钥和 CID，说明原来是加密简历，需要重新加密
      let newBlobId = null;
      let newSalt = null;
      if (encryptionKey && currentCid) {
        console.log('🔐 检测到加密简历，开始重新加密...');
        
        // 转换表单数据为 API 格式（用于加密）
        const dataToEncrypt = transformResumeData(formData, walletAddress);
        
        // 1. 使用相同的密钥重新加密 (Seal 会生成新的 salt)
        const { encryptedBlob, salt } = await encryptWithSeal(dataToEncrypt, encryptionKey);
        console.log('✅ 重新加密完成:', encryptedBlob.size, 'bytes');
        
        // 2. 上传到 Walrus
        console.log('☁️  上传到 Walrus...');
        const { blobId, url } = await uploadToWalrus(encryptedBlob, {
          owner: walletAddress,
          encrypted: true,
          timestamp: new Date().toISOString(),
          resumeId: id,
        });
        console.log('✅ 上传完成');
        console.log('📝 新 Blob ID:', blobId);
        console.log('🔗 URL:', url);
        
        newBlobId = blobId;
        newSalt = salt;
        setCurrentCid(blobId); // 更新当前 Blob ID
      }
      
      // 准备更新请求数据
      const updateData = transformResumeData(formData, walletAddress);
      
      // 如果有新的 Blob ID 和 Salt，添加到请求中
      if (newBlobId) {
        updateData.ipfs_cid = newBlobId;  // 后端字段兼容
        updateData.encryption_salt = newSalt;
      }
      
      console.log('更新简历数据:', updateData);
      
      // 调用更新简历 API
      await resumeService.updateResume(id, updateData);
      
      console.log('简历更新成功');
      alert('✅ 简历更新成功！');
      
      // 跳转到简历列表页
      navigate('/resumes');
      
    } catch (error) {
      console.error('更新简历失败:', error);
      alert(`❌ 更新简历失败: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  // 加载中状态
  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-gray-600">{isDecrypting ? '正在解密简历...' : '加载简历数据中...'}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // 需要输入密钥
  if (needsKey) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">需要加密密钥</h2>
              <p className="text-gray-600">
                此简历已加密，请输入密钥以编辑内容
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  加密密钥
                </label>
                <textarea
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  placeholder="请粘贴您的加密密钥..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/resumes')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  返回列表
                </button>
                <button
                  onClick={handleKeySubmit}
                  disabled={isDecrypting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDecrypting ? '解密中...' : '解密'}
                </button>
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>提示：</strong> 如果您在创建简历时选择保存密钥到本地，则无需手动输入。
                  如果忘记密钥，将无法编辑简历内容。
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // 加载错误状态
  if (loadError) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">加载失败</h3>
            <p className="text-gray-600 mb-4">{loadError}</p>
            <button
              onClick={() => navigate('/resumes')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              返回列表
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

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
              {/* 编辑提示 */}
              <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✏️</span>
                  <div>
                    <h3 className="font-semibold text-blue-900">编辑模式</h3>
                    <p className="text-sm text-blue-700">正在编辑简历 ID: {id}</p>
                  </div>
                </div>
              </div>

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
                  onClick={handleUpdate}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !connected}
                >
                  {isSubmitting ? '保存中...' : '保存更新'}
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
          resumeId={id}
          onClose={() => setShowPreview(false)}
        />
      )}
    </PageLayout>
  );
}
