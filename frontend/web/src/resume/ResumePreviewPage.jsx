import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import PageLayout from '../layout/PageLayout';
import ResumePreview from './ResumePreview';
import { resumeService } from '../services';
import { downloadEncryptedResume } from '../utils/ipfs';
import { downloadAndDecryptResume } from '../utils/crypto';

export default function ResumePreviewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentAccount = useCurrentAccount();
  const connected = !!currentAccount;
  const publicKey = currentAccount?.address;
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsKey, setNeedsKey] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    if (!connected || !publicKey) {
      navigate('/resumes');
      return;
    }

    loadResumeDetail();
  }, [id, connected, publicKey]);

  const loadResumeDetail = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const owner = publicKey;
      const resume = await resumeService.getResumeDetail(id, owner);
      
      console.log('加载的简历数据:', resume);
      
      // 检查是否有 IPFS CID（表示加密简历）
      const ipfsCid = resume.ipfs_cid || resume.cid;
      
      if (!ipfsCid) {
        // 没有 CID，说明是旧版本未加密的简历，直接显示
        console.log('⚠️ 未加密的简历，直接显示',ipfsCid);
        setFormData(transformResumeData(resume));
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
      
      // 2. 下载并解密
      await decryptAndLoadResume(ipfsCid, key);
      
    } catch (err) {
      console.error('加载简历失败:', err);
      setError(err.message);
      
      if (err.message.includes('Unauthorized')) {
        alert('无权查看此简历');
        navigate('/resumes');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const decryptAndLoadResume = async (cid, key) => {
    try {
      setIsDecrypting(true);
      
      console.log('📥 下载加密数据...');
      const encryptedBlob = await downloadEncryptedResume(cid);
      console.log('✅ 下载完成:', encryptedBlob.size, 'bytes');
      
      console.log('🔓 解密中...');
      const decryptedData = await downloadAndDecryptResume(encryptedBlob, key);
      console.log('✅ 解密成功:', decryptedData);
      
      // 3. 转换为前端格式
      setFormData(transformResumeData(decryptedData));
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

  const transformResumeData = (resume) => {
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
      education: resume.education || [],
      certificates: resume.certificates || [],
    };
  };

  const handleClose = () => {
    navigate('/resumes');
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
                此简历已加密，请输入密钥以查看内容
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
                  如果忘记密钥，将无法恢复简历内容。
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // 错误状态
  if (error) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">加载失败</h3>
            <p className="text-gray-600 mb-4">{error}</p>
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

  // 预览模式:不使用弹窗,直接全屏显示
  if (!formData) {
    return null;
  }

  return (
    <ResumePreview 
      formData={formData}
      resumeId={id}
      onClose={handleClose}
      isFullPage={true}
    />
  );
}
