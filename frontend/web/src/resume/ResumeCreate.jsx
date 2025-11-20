import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import PageLayout from '../layout/PageLayout';
import PersonalInfo from './sections/PersonalInfo';
import Skills from './sections/Skills';
import DesiredPosition from './sections/DesiredPosition';
import WorkExperience from './sections/WorkExperience';
import ProjectExperience from './sections/ProjectExperience';
import Education from './sections/Education';
import Certificates from './sections/Certificates';
import ResumePreview from './ResumePreview';
import EncryptionModeSelector from '../components/EncryptionModeSelector';
import { resumeService, userService } from '../services';
import { transformResumeData, validateResumeData } from '../services/resume.transform';
import { createSubscriptionServiceTx } from '../utils/subscription';
import { usdcToMicroUnits } from '../config/subscription.config';

export default function ResumeCreate() {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const connected = !!currentAccount;
  const publicKey = currentAccount?.address;
  const [activeSection, setActiveSection] = useState('personal');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Seal 加密选项
  const [useSealEncryption, setUseSealEncryption] = useState(false);
  const [encryptionMode, setEncryptionMode] = useState('allowlist'); // 'allowlist' 或 'subscription'
  
  // Allowlist 模式
  const [allowlistId, setAllowlistId] = useState('');
  const [capId, setCapId] = useState('');
  
  // 订阅模式
  const [subscriptionPrice, setSubscriptionPrice] = useState('5'); // 默认 5 USDC
  
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

  // Sidebar navigation
  const sections = [
    { id: 'personal', name: 'Personal Info', icon: '👤' },
    { id: 'skills', name: 'Skills', icon: '⭐' },
    { id: 'desired', name: 'Desired Position', icon: '💼' },
    { id: 'work', name: 'Work Experience', icon: '💻' },
    { id: 'project', name: 'Projects', icon: '📁' },
    { id: 'education', name: 'Education', icon: '🎓' },
    { id: 'certificate', name: 'Certificates', icon: '📜' },
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
    // Check wallet connection
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    // Validate form data
    const validation = validateResumeData(formData);
    if (!validation.valid) {
      alert('Please fill in required fields:\n' + validation.errors.join('\n'));
      return;
    }

    // If using Seal encryption, validate configuration
    if (useSealEncryption) {
      if (encryptionMode === 'allowlist') {
        if (!allowlistId || !capId) {
          alert('Please fill in Allowlist ID and Cap ID\n\nIf you don\'t have an Allowlist yet, please create one first.');
          return;
        }
      } else if (encryptionMode === 'subscription') {
        if (!subscriptionPrice || parseFloat(subscriptionPrice) <= 0) {
          alert('Please set a valid subscription price (greater than 0 USDC)');
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const walletAddress = publicKey;
      
      // 1. Ensure user is registered
      console.log('Registering/getting user info...');
      await userService.registerOrGetUser(walletAddress);
      
      // 2. Transform form data to API format
      const apiData = transformResumeData(formData, walletAddress);
      console.log('Creating resume data:', apiData);
      
      let result;
      
      if (useSealEncryption) {
        if (encryptionMode === 'allowlist') {
          // ===== Allowlist 模式 =====
          console.log('🔐 使用 Seal + Allowlist 模式创建简历...');
          result = await resumeService.createResumeWithSeal(apiData, allowlistId, 'allowlist');
          
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
            `✅ Resume created successfully!\n\n` +
            `Resume ID: ${result.resumeId}\n` +
            `Blob ID: ${result.blobId}\n` +
            `Encryption ID: ${result.encryptionId}\n\n` +
            `🔐 Encryption Mode: Allowlist\n` +
            `✅ You have been automatically added to the access whitelist\n` +
            `Access control managed by Allowlist\n` +
            `Allowlist ID: ${allowlistId}`
          );
          
        } else if (encryptionMode === 'subscription') {
          // ===== 订阅模式 =====
          console.log('💰 使用 Seal + 订阅模式创建简历...');
          
          // 1. 先创建订阅服务，获取 Service ID
          console.log('📦 创建订阅服务...');
          const priceInMicroUnits = usdcToMicroUnits(parseFloat(subscriptionPrice));
          
          const serviceId = await new Promise((resolve, reject) => {
            const tx = createSubscriptionServiceTx({
              fee: priceInMicroUnits,
              ttl: 0, // TTL=0 表示永久访问
              name: `resume_${Date.now()}`, // 临时服务名称
              senderAddress: walletAddress,
            });
            
            signAndExecute(
              { transaction: tx },
              {
                onSuccess: async (txResult) => {
                  try {
                    console.log('✅ 订阅服务创建交易已提交');
                    console.log('Transaction Digest:', txResult.digest);
                    
                    // 使用重试机制查询交易详情（处理 RPC 节点索引延迟）
                    console.log('🔍 查询交易详情...');
                    
                    let txDetails = null;
                    let retryCount = 0;
                    const maxRetries = 5;
                    
                    while (retryCount < maxRetries) {
                      try {
                        txDetails = await suiClient.getTransactionBlock({
                          digest: txResult.digest,
                          options: {
                            showEffects: true,
                            showObjectChanges: true,
                          },
                        });
                        
                        console.log(`✅ 查询成功 (尝试 ${retryCount + 1}/${maxRetries})`);
                        break;
                        
                      } catch (queryError) {
                        retryCount++;
                        
                        if (queryError.message?.includes('Could not find the referenced transaction')) {
                          // 交易还未被索引，等待后重试
                          const waitTime = retryCount * 1000;
                          console.warn(`⏳ 交易尚未索引，等待 ${waitTime/1000} 秒后重试... (${retryCount}/${maxRetries})`);
                          await new Promise(resolve => setTimeout(resolve, waitTime));
                        } else {
                          // 其他错误，直接抛出
                          throw queryError;
                        }
                      }
                    }
                    
                    if (!txDetails) {
                      throw new Error('查询交易超时，请稍后在区块链浏览器中查看 Service ID');
                    }
                    
                    console.log('交易详情:', txDetails);
                    
                    // 从 objectChanges 中查找 Service 对象
                    let serviceId = null;
                    
                    if (txDetails.objectChanges) {
                      console.log('Object Changes:', txDetails.objectChanges);
                      
                      const serviceChange = txDetails.objectChanges.find(
                        change => 
                          change.type === 'created' &&
                          change.objectType &&
                          change.objectType.includes('subscription::Service')
                      );
                      
                      if (serviceChange) {
                        serviceId = serviceChange.objectId;
                        console.log('✅ 找到 Service ID:', serviceId);
                      }
                    }
                    
                    // 备用方案：从 effects 中查找
                    if (!serviceId && txDetails.effects?.created) {
                      console.log('从 effects.created 查找...');
                      const serviceEffect = txDetails.effects.created.find(
                        obj => obj.objectType && obj.objectType.includes('subscription::Service')
                      );
                      
                      if (serviceEffect) {
                        serviceId = serviceEffect.reference?.objectId || serviceEffect.objectId;
                        console.log('✅ 从 effects 找到 Service ID:', serviceId);
                      }
                    }
                    
                    if (!serviceId) {
                      console.error('无法找到 Service ID');
                      console.error('txDetails:', txDetails);
                      reject(new Error('无法获取 Service ID，请在区块链浏览器查看交易'));
                      return;
                    }
                    
                    console.log('📦 最终 Service ID:', serviceId);
                    resolve(serviceId);
                  } catch (error) {
                    console.error('查询交易详情失败:', error);
                    reject(error);
                  }
                },
                onError: (error) => {
                  console.error('❌ 创建订阅服务失败:', error);
                  reject(error);
                }
              }
            );
          });
          
          // 2. 使用 Service ID 创建加密简历
          console.log('🔐 创建加密简历（关联订阅服务）...');
          result = await resumeService.createResumeWithSeal(apiData, serviceId, 'subscription');
          console.log('✅ Seal 加密创建成功:', result);
          
          alert(
            `✅ Resume created successfully!\n\n` +
            `Resume ID: ${result.resumeId}\n` +
            `Blob ID: ${result.blobId}\n` +
            `Encryption ID: ${result.encryptionId}\n\n` +
            `💰 Encryption Mode: Subscription\n` +
            `💵 Subscription Price: ${subscriptionPrice} USDC\n` +
            `⏰ Access Duration: Permanent\n` +
            `📦 Service ID: ${serviceId}\n\n` +
            `✨ Users can permanently view your resume after purchasing subscription`
          );
        }
      } else {
        // Use simple encryption
        console.log('🔒 Using simple encryption to create resume...');
        result = await resumeService.createResume(apiData);
        
        console.log('Resume created successfully:', result);
        
        // Display encryption key and prompt to save
        const saveKey = window.confirm(
          `✅ Resume created successfully!\n\n` +
          `Resume ID: ${result.resumeId}\n` +
          `Blob ID: ${result.blobId}\n\n` +
          `⚠️ Important: Your encryption key is:\n` +
          `${result.encryptionKey}\n\n` +
          `This key is the only way to decrypt your resume, please save it!\n` +
          `Click "OK" to copy the key to clipboard`
        );
        
        if (saveKey) {
          // Copy key to clipboard
          navigator.clipboard.writeText(result.encryptionKey).then(() => {
            alert('✅ Encryption key copied to clipboard!\nPlease save it properly, loss will make resume unrecoverable.');
          }).catch(err => {
            console.error('Copy failed:', err);
            alert('❌ Copy failed, please save the key manually:\n' + result.encryptionKey);
          });
        }
        
        // Save encryption key to localStorage (optional)
        const shouldSaveLocally = window.confirm(
          'Save encryption key to browser local storage?\n\n' +
          '✅ Advantages: Convenient for previewing and editing your own resume\n' +
          '⚠️ Risks: Others using this device may access your resume\n\n' +
          'Recommendation: Only save on personal devices'
        );
        
        if (shouldSaveLocally) {
          const keys = JSON.parse(localStorage.getItem('resumeEncryptionKeys') || '{}');
          keys[result.resumeId] = result.encryptionKey;
          localStorage.setItem('resumeEncryptionKeys', JSON.stringify(keys));
          console.log('✅ Encryption key saved locally');
        }
      }
      
      // Navigate to resume list page
      navigate('/resumes');
      
    } catch (error) {
      console.error('Resume creation failed:', error);
      alert(`Resume creation failed: ${error.message}`);
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
              <h2 className="text-xl font-bold mb-6 text-gray-900">Resume Sections</h2>
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
                  Cancel
                </button>
                <button
                  onClick={handlePreview}
                  className="px-6 py-2 border border-orange-500 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Preview
                </button>
                <button
                  onClick={() => setShowSealOptions(!showSealOptions)}
                  className="px-6 py-2 border border-blue-500 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                  disabled={isSubmitting}
                >
                  {showSealOptions ? 'Hide Advanced Options' : 'Advanced Options'}
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting || !connected}
                >
                  {isSubmitting ? 'Creating...' : connected ? 'Complete' : 'Connect Wallet First'}
                </button>
              </div>

              {/* Seal 加密选项 */}
              {showSealOptions && (
                <EncryptionModeSelector
                  useSealEncryption={useSealEncryption}
                  setUseSealEncryption={setUseSealEncryption}
                  encryptionMode={encryptionMode}
                  setEncryptionMode={setEncryptionMode}
                  allowlistId={allowlistId}
                  setAllowlistId={setAllowlistId}
                  capId={capId}
                  setCapId={setCapId}
                  subscriptionPrice={subscriptionPrice}
                  setSubscriptionPrice={setSubscriptionPrice}
                  isSubmitting={isSubmitting}
                />
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
