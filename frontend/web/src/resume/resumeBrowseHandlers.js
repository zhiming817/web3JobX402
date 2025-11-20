import { resumeService, userService } from '../services';
import unlockRecordService from '../services/unlockRecord.service';
import accessLogService from '../services/accessLog.service';
import { downloadAndDecryptResume } from '../utils/sealClient';
import { decryptWithSeal } from '../utils/seal';
import { downloadFromWalrus } from '../utils/walrus';
import { 
  purchaseSubscriptionTx, 
  getUserSubscriptions, 
  getServiceDetails,
  isSubscriptionValid,
  constructSubscriptionApprove 
} from '../utils/subscription';
import { SUBSCRIPTION_PACKAGE_ID } from '../config/subscription.config';
import { SessionKey } from '@mysten/seal';
import { SEAL_CONFIG } from '../config/seal.config';

/**
 * 加载用户订阅列表
 */
export const loadUserSubscriptions = async (suiClient, publicKey) => {
  try {
    console.log('🔄 开始加载用户订阅列表...');
    const subscriptions = await getUserSubscriptions(
      suiClient,
      publicKey,
      SUBSCRIPTION_PACKAGE_ID
    );
    console.log('📦 用户订阅列表:', subscriptions);
    console.log('📦 订阅数量:', subscriptions.length);
    subscriptions.forEach((sub, index) => {
      console.log(`📦 订阅 ${index + 1}:`, {
        id: sub.id,
        service_id: sub.service_id,
        created_at: new Date(sub.created_at).toLocaleString()
      });
    });
    console.log('✅ 订阅列表加载完成');
    return subscriptions;
  } catch (err) {
    console.error('❌ 加载订阅列表失败:', err);
    throw err;
  }
};

/**
 * 加载简历摘要列表
 */
export const loadResumeSummaries = async () => {
  try {
    const data = await resumeService.getResumeSummaries();
    
    console.log('📋 后端返回的简历数据:', data);
    
    // 转换后端数据为前端格式
    // 注意：对于 Seal 加密的简历，详细信息需要解密后才能获取
    const formattedResumes = data.map(resume => {
      const isSealed = resume.encryption_type === 'seal';
      const encryptionMode = resume.encryption_mode || 'subscription';
      
      // 根据加密模式生成不同的提示文本
      let highlightsText = 'No introduction available.';
      if (isSealed) {
        if (encryptionMode === 'allowlist') {
          highlightsText = '🔒 This resume is encrypted with Seal; you can view the full content after authorization.';
        } else {
          highlightsText = '🔒 This resume is encrypted using Seal. You can view the full content after purchasing a subscription.';
        }
      }
      
      return {
        id: resume.id,
        resumeId: resume.id,
        // Seal 加密的简历在列表中显示占位符
        name: resume.name ? resume.name : 'unknown',
        title: isSealed ? '-' : 'unknown',
        experience: isSealed ? '-' : 'unknown',
        education: isSealed ? '-' : 'unknown',
        jobStatus: isSealed ? '-' : 'unknown',
        location: isSealed ? '-' : 'unknown',
        salary: isSealed ? '-' : '-',
        skills: isSealed ? ['-'] : [],
        highlights: highlightsText,
        price: ((resume.price || 0) / 1_000_000_000).toFixed(2) + ' SUI',
        priceRaw: resume.price || 0,
        isLocked: true,
        avatar: '/default-avatar.png',
        viewCount: 0,
        unlockCount: 0,
        ownerWallet: resume.owner,
        rawData: {
          ...resume,
          // 确保加密字段存在
          encryption_type: resume.encryption_type,
          encryption_mode: resume.encryption_mode, // 添加 encryption_mode
          encryption_id: resume.encryption_id,
          policy_object_id: resume.policy_object_id,
          blob_id: resume.blob_id,
        },
      };
    });

    return formattedResumes;
  } catch (err) {
    console.error('加载简历列表失败:', err);
    throw err;
  }
};

/**
 * 解锁简历（购买订阅）
 */
export const handleUnlock = async ({
  resumeId,
  resumes,
  userSubscriptions,
  connected,
  publicKey,
  suiClient,
  signAndExecute,
  setIsPurchasing,
  setResumes,
  loadUserSubscriptionsCallback,
  handleViewResumeCallback,
}) => {
  if (!connected || !publicKey) {
    alert('Please connect your wallet first!');
    return;
  }

  const resume = resumes.find(r => r.resumeId === resumeId);
  if (!resume) return;

  // 检查是否已订阅
  const hasSubscription = userSubscriptions.some(
    sub => sub.service_id === resume.rawData.policy_object_id
  );
  
  if (hasSubscription) {
    alert('You have already purchased access to this resume!');
    await handleViewResumeCallback({ ...resume, isLocked: false });
    return;
  }

  // 移除 window.confirm，改由 UI 层处理确认
  // const confirmed = window.confirm(...);
  // if (!confirmed) return;

  setIsPurchasing(true);
  try {
    console.log('📋 开始购买订阅...');
    console.log('简历 ID:', resumeId);
    console.log('Service ID (policy_object_id):', resume.rawData.policy_object_id);
    console.log('价格:', resume.priceRaw);

    // 1. 获取服务详情（验证服务存在）
    const serviceDetails = await getServiceDetails(
      suiClient,
      resume.rawData.policy_object_id
    );
    
    if (!serviceDetails) {
      throw new Error('Resume service does not exist, please contact the owner');
    }
    
    console.log('✅ 服务详情:', serviceDetails);

    // 2. 准备支付
    // 重要：必须使用服务对象中的 fee，而不是简历的 price！
    // 智能合约会验证：fee.value() == service.fee
    const serviceFee = serviceDetails.fee; // 服务对象中的实际 fee
    
    console.log('💰 支付金额对比:', {
      简历价格: resume.priceRaw,
      服务费用: serviceFee,
      使用金额: serviceFee,
    });
    
    const tx = purchaseSubscriptionTx({
      serviceId: resume.rawData.policy_object_id,
      fee: serviceFee, // 使用服务的实际 fee
      buyerAddress: publicKey,
    });

    // 3. 执行交易
    console.log('💰 正在执行支付交易...');
    
    return new Promise((resolve, reject) => {
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log('✅ 支付成功:', result);
            
            // 4. 创建解锁记录（调用后端接口）
            try {
              console.log('📝 开始创建解锁记录...');
              
              // 获取买家和卖家的用户信息
              const [buyerUser, sellerUser] = await Promise.all([
                userService.getUserByWallet(publicKey).catch(err => {
                  console.warn('获取买家用户信息失败:', err);
                  return null;
                }),
                userService.getUserByWallet(resume.owner).catch(err => {
                  console.warn('获取卖家用户信息失败:', err);
                  return null;
                })
              ]);

              if (!buyerUser || !sellerUser) {
                console.warn('⚠️ 无法获取完整用户信息，跳过创建解锁记录');
              } else {
                // 提取交易签名（transaction digest）
                const transactionDigest = result.digest || result.transaction?.digest || '';
                
                const unlockData = {
                  resume_id: parseInt(resumeId),
                  buyer_id: buyerUser.id,
                  buyer_wallet: publicKey,
                  seller_wallet: resume.owner,
                  amount: parseInt(serviceFee),
                  transaction_signature: transactionDigest,
                  block_time: result.timestamp ? parseInt(result.timestamp) : null,
                };

                console.log('📝 解锁记录数据:', unlockData);
                
                await unlockRecordService.createUnlockRecord(unlockData);
                console.log('✅ 解锁记录创建成功');
              }
            } catch (err) {
              // 解锁记录创建失败不影响购买流程
              console.error('❌ 创建解锁记录失败:', err);
            }
            
            // 5. 重新加载订阅列表（带重试，等待区块链索引）
            console.log('🔄 购买成功，正在重新加载订阅列表...');
            
            let retries = 0;
            const maxRetries = 5;
            let newSubscriptions = [];
            
            while (retries < maxRetries) {
              const result = await loadUserSubscriptionsCallback();
              newSubscriptions = result || []; // 确保是数组
              
              // 等待 state 更新
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // 检查是否找到新订阅
              const hasNewSubscription = newSubscriptions.some(
                sub => sub.service_id === resume.rawData?.policy_object_id
              );
              
              if (hasNewSubscription || newSubscriptions.length > 0) {
                console.log(`✅ 第 ${retries + 1} 次尝试：找到订阅`);
                break;
              }
              
              retries++;
              console.log(`⏳ 第 ${retries} 次尝试：未找到订阅，${retries < maxRetries ? '继续重试...' : '放弃重试'}`);
              
              if (retries < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒再重试
              }
            }
            
            // 6. 更新简历状态
            setResumes(resumes.map(r => 
              r.resumeId === resumeId ? { ...r, isLocked: false } : r
            ));
            
            // 订阅模式不需要调用后端 unlockResume 接口
            // 订阅信息已经在区块链上，通过 Subscription NFT 验证
            
            if (retries >= maxRetries) {
              alert('⚠️ Purchase successful, but subscription sync takes time. Please refresh later.');
              resolve();
              return;
            }
            
            alert('🎉 Purchase successful! You can now view the full resume.');
            
            // 7. 自动打开查看
            console.log('🔓 准备解密简历...');
            await handleViewResumeCallback({ ...resume, isLocked: false });
            resolve();
          },
          onError: (error) => {
            console.error('❌ 支付失败:', error);
            alert(`Payment failed: ${error.message}\n\nPossible reasons:\n1. Insufficient balance\n2. User cancelled transaction\n3. Network error`);
            reject(error);
          },
        }
      );
    });

  } catch (err) {
    console.error('购买订阅失败:', err);
    alert(`Purchase failed: ${err.message}`);
    throw err;
  } finally {
    setIsPurchasing(false);
  }
};

/**
 * 查看简历（打开解密模态框）
 */
export const handleViewResume = async (resume, callbacks) => {
  const { 
    setSelectedResume, 
    setShowDecryptModal, 
    setDecryptedData, 
    setDecryptKey,
    setError,
    handleDecryptResumeCallback 
  } = callbacks;
  
  setSelectedResume(resume);
  setShowDecryptModal(true);
  setDecryptedData(null);
  setDecryptKey('');
  setError(null);
  
  // 如果已解锁，自动尝试解密
  if (!resume.isLocked) {
    await handleDecryptResumeCallback(resume);
  }
};

/**
 * 计算工作年限
 */
const calculateExperience = (workStartDate) => {
  if (!workStartDate) return 'unknown';
  
  try {
    const startYear = new Date(workStartDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const years = currentYear - startYear;
    
    if (years < 1) return '< 1 year';
    if (years <= 3) return '1-3 years';
    if (years <= 5) return '3-5 years';
    if (years <= 10) return '5-10 years';
    return '10+ years';
  } catch {
    return 'unknown';
  }
};

/**
 * 获取学历
 */
const getEducationLevel = (educationArray) => {
  if (!educationArray || educationArray.length === 0) return 'unknown';
  return educationArray[0].degree || 'unknown';
};

/**
 * 格式化薪资
 */
const formatSalary = (min, max) => {
  if (!min && !max) return 'Negotiable';
  if (min && max) return `${(min/1000).toFixed(0)}-${(max/1000).toFixed(0)}K`;
  if (min) return `${(min/1000).toFixed(0)}K+`;
  return 'Negotiable';
};

/**
 * 获取头像
 */
const getAvatar = (gender) => {
  if (gender === '男') return '👨‍💻';
  if (gender === '女') return '👩‍💻';
  return '👤';
};

/**
 * 解密简历内容
 */
export const handleDecryptResume = async ({
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
}) => {
  if (!currentAccount) {
    setError('Please connect wallet first');
    return;
  }

  setIsDecrypting(true);
  try {
    console.log('🔍 Resume 对象完整信息:', JSON.stringify(resume, null, 2));
    
    // 尝试从多个来源获取 resume ID
    const possibleIds = {
      'resume.id': resume.id,
      'resume.resumeId': resume.resumeId,
      'resume.rawData?.id': resume.rawData?.id,
      'resume.rawData?.resume_id': resume.rawData?.resume_id,
    };
    console.log('🔍 可能的 Resume ID 来源:', possibleIds);
    
    const encryptionType = resume.rawData?.encryption_type || 'simple';
    const encryptionMode = resume.rawData?.encryption_mode; // 获取加密模式
    
    console.log('🔐 加密信息:', {
      encryptionType,
      encryptionMode,
      blobId: resume.rawData?.blob_id,
      encryptionId: resume.rawData?.encryption_id,
      policyObjectId: resume.rawData?.policy_object_id,
    });
    
    if (encryptionType === 'seal') {
      // Seal 解密
      const blobId = resume.rawData?.blob_id;
      const encryptionId = resume.rawData?.encryption_id;
      const policyObjectId = resume.rawData?.policy_object_id;
      
      if (!blobId || !encryptionId) {
        throw new Error('Seal encrypted resume information is incomplete');
      }

      // Allowlist 模式：直接使用 Allowlist 验证
      if (encryptionMode === 'allowlist') {
        console.log('🔓 使用 Allowlist 模式解密（无需订阅）');
        
        if (!policyObjectId) {
          throw new Error('Allowlist ID missing');
        }

        console.log('📋 Allowlist 解密参数:', {
          blobId,
          encryptionId,
          allowlistId: policyObjectId,
        });

        // 创建 SessionKey
        console.log('🔑 创建 SessionKey...');
        const sessionKey = await SessionKey.create({
          address: currentAccount.address,
          packageId: SEAL_CONFIG.packageId,
          ttlMin: 10, // 10 分钟有效期
          suiClient,
        });
        
        // 签名 SessionKey
        console.log('✍️ 请在钱包中签名 SessionKey...');
        const personalMessage = sessionKey.getPersonalMessage();
        const signResult = await signPersonalMessage({
          message: personalMessage,
        });
        await sessionKey.setPersonalMessageSignature(signResult.signature);
        console.log('✅ SessionKey 创建成功');

        // 下载并使用 Allowlist 解密
        console.log('📥 下载加密数据...');
        const decryptedContent = await downloadAndDecryptResume(
          blobId,
          sessionKey,
          policyObjectId,
          null // moveCallConstructor 为 null 表示使用 Allowlist 模式
        );

        console.log('✅ Allowlist 解密成功');
        const decryptedData = decryptedContent; // downloadAndDecryptResume 已经返回解析后的对象
        setDecryptedData(decryptedData);
        
        // 创建访问日志
        try {
          await accessLogService.createAccessLog({
            resume_id: resume.id || resume.resumeId || resume.rawData?.id || resume.rawData?.resume_id,
            accessor: currentAccount.address,
            access_type: 'decrypt',
            encryption_type: 'seal',
          });
        } catch (err) {
          console.warn('创建访问日志失败:', err);
        }
        
        return;
      }

      // Subscription 模式：需要订阅验证
      console.log('🔒 使用 Seal 订阅模式解密:', {
        blobId,
        encryptionId,
        policyObjectId
      });
      
      if (!policyObjectId) {
        throw new Error('Service ID (policyObjectId) missing');
      }

      // 1. 查找对应的订阅
      console.log('🔍 查找订阅 - 用户订阅列表:', userSubscriptions);
      console.log('🔍 查找订阅 - 目标 policyObjectId:', policyObjectId);
      console.log('🔍 查找订阅 - 订阅详情:', userSubscriptions.map(sub => ({
        id: sub.id,
        service_id: sub.service_id,
        matches: sub.service_id === policyObjectId
      })));
      
      const subscription = userSubscriptions.find(
        sub => sub.service_id === policyObjectId
      );
      
      if (!subscription) {
        throw new Error(`No valid subscription found, please purchase access first.
Existing subscriptions: ${userSubscriptions.map(s => s.service_id).join(', ')}
Required subscription: ${policyObjectId}`);
      }
      
      console.log('✅ 找到订阅:', subscription);

      // 2. 验证订阅是否有效
      const serviceDetails = await getServiceDetails(suiClient, policyObjectId);
      const currentTime = Date.now();
      
      if (!isSubscriptionValid(subscription, serviceDetails, currentTime)) {
        throw new Error('Subscription expired, please repurchase');
      }
      
      console.log('✅ 订阅有效');

      // 3. 创建 SessionKey
      const sessionKey = await SessionKey.create({
        address: currentAccount.address,
        packageId: SEAL_CONFIG.packageId,
        ttlMin: 10,
        suiClient,
      });
      
      // 4. 签名 SessionKey
      console.log('✍️ 请在钱包中签名 SessionKey...');
      const personalMessage = sessionKey.getPersonalMessage();
      
      const result = await signPersonalMessage({
        message: personalMessage,
      });
      
      await sessionKey.setPersonalMessageSignature(result.signature);
      console.log('✅ SessionKey 创建并签名成功');

      // 5. 构建订阅验证的 MoveCall
      const moveCallConstructor = constructSubscriptionApprove({
        blobId: encryptionId,
        subscriptionId: subscription.id,
        serviceId: policyObjectId,
      });

      // 6. 下载并解密
      console.log('📥 下载并解密简历...');
      const decryptedData = await downloadAndDecryptResume(
        blobId,
        sessionKey,
        policyObjectId,
        moveCallConstructor
      );
      
      console.log('✅ 解密成功，解析简历数据...');
      
      // 7. downloadAndDecryptResume 已经返回了解析后的 JSON 对象
      // 不需要再次解码和解析
      const resumeData = decryptedData;
      console.log('📄 解析后的简历数据:', resumeData);
      
      // 8. 更新简历列表中的数据（填充详细信息）
      const currentResumeId = resume.resumeId || resume.id;
      setResumes(resumes.map(r => {
        if (r.resumeId === currentResumeId) {
          const personal = resumeData.personal || {};
          const desiredPosition = resumeData.desired_position || {};
          
          return {
            ...r,
            name: personal.name || r.name,
            title: desiredPosition.position || r.title,
            experience: calculateExperience(personal.work_start_date),
            education: getEducationLevel(resumeData.education),
            jobStatus: personal.job_status || r.jobStatus,
            location: desiredPosition.city || r.location,
            salary: formatSalary(desiredPosition.salary_min, desiredPosition.salary_max),
            skills: (resumeData.skills || '').split(',').map(s => s.trim()).filter(Boolean),
            highlights: resumeData.skills || r.highlights,
            avatar: getAvatar(personal.gender),
            isLocked: false,
            decryptedData: resumeData, // 保存完整的解密数据
          };
        }
        return r;
      }));
      
      setDecryptedData(resumeData);

      // 9. 创建访问记录（Seal 解密成功）
      try {
        console.log('📝 创建访问记录...');
        // 使用 UUID resume_id 字符串
        const resumeIdStr = resume.rawData?.resume_id || resume.resumeId;
        
        console.log('🔍 获取到的 resume_id (UUID):', resumeIdStr);
        console.log('🔍 resume.rawData.resume_id:', resume.rawData?.resume_id);
        console.log('🔍 resume.resumeId:', resume.resumeId);
        
        if (!resumeIdStr) {
          console.warn('⚠️ 无法获取有效的简历 UUID，跳过创建访问记录', {
            resumeIdStr,
          });
        } else {
          const accessLogData = {
            resume_id: resumeIdStr, // 直接使用 UUID 字符串
            accessor_address: currentAccount.address,
            access_type: 'decrypt',
            encryption_type: 'seal',
            success: true,
          };
          console.log('📤 发送访问记录数据:', accessLogData);
          await accessLogService.createAccessLog(accessLogData);
          console.log('✅ 访问记录创建成功');
        }
      } catch (err) {
        console.error('❌ 创建访问记录失败:', err);
        // 不影响主流程
      }

    } else {
      // 简单加密：使用密钥
      if (!decryptKey) {
        throw new Error('Please enter decryption key');
      }

      const blobId = resume.rawData?.blob_id;
      if (!blobId) {
        throw new Error('Resume data incomplete');
      }

      console.log('使用简单加密解密:', blobId);

      // 从 Walrus 下载
      const encryptedBlob = await downloadFromWalrus(blobId);
      
      // 解密
      const decrypted = await decryptWithSeal(encryptedBlob, decryptKey);
      
      setDecryptedData(decrypted);

      // 创建访问记录（简单加密解密成功）
      try {
        console.log('📝 创建访问记录...');
        // 使用 UUID resume_id 字符串
        const resumeIdStr = resume.rawData?.resume_id || resume.resumeId;
        
        console.log('🔍 获取到的 resume_id (UUID):', resumeIdStr);
        
        if (!resumeIdStr) {
          console.warn('⚠️ 无法获取有效的简历 UUID，跳过创建访问记录');
        } else {
          const accessLogData = {
            resume_id: resumeIdStr, // 直接使用 UUID 字符串
            accessor_address: currentAccount.address,
            access_type: 'decrypt',
            encryption_type: 'simple',
            success: true,
          };
          await accessLogService.createAccessLog(accessLogData);
          console.log('✅ 访问记录创建成功');
        }
      } catch (err) {
        console.error('❌ 创建访问记录失败:', err);
        // 不影响主流程
      }
    }

  } catch (err) {
    console.error('解密失败:', err);
    setError(err.message || 'Failed to decrypt resume');
    
    // 创建访问记录（解密失败）
    try {
      // 使用 UUID resume_id 字符串
      const resumeIdStr = resume.rawData?.resume_id || resume.resumeId;
      
      console.log('🔍 失败记录 - 获取到的 resume_id (UUID):', resumeIdStr);
      
      if (resumeIdStr && currentAccount) {
        const encryptionType = resume.rawData?.encryption_type || 'simple';
        const accessLogData = {
          resume_id: resumeIdStr, // 直接使用 UUID 字符串
          accessor_address: currentAccount.address,
          access_type: 'decrypt',
          encryption_type: encryptionType,
          success: false,
          error_message: err.message || '解密失败',
        };
        await accessLogService.createAccessLog(accessLogData);
        console.log('✅ 失败访问记录创建成功');
      } else {
        console.warn('⚠️ 无法获取有效的简历 UUID 或用户信息，跳过创建失败访问记录');
      }
    } catch (logErr) {
      console.error('❌ 创建失败访问记录失败:', logErr);
    }
  } finally {
    setIsDecrypting(false);
  }
};
