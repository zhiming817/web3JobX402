import { resumeService } from '../services';
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
      
      return {
        id: resume.id,
        resumeId: resume.id,
        // Seal 加密的简历在列表中显示占位符
        name: isSealed ? '🔐 加密简历' : '未知',
        title: isSealed ? '需要订阅查看' : '未填写职位',
        experience: isSealed ? '-' : '未知',
        education: isSealed ? '-' : '未知',
        jobStatus: isSealed ? '-' : '未知',
        location: isSealed ? '-' : '未知',
        salary: isSealed ? '-' : '-',
        skills: isSealed ? ['订阅后可见'] : [],
        highlights: isSealed ? '🔒 此简历使用 Seal 加密，购买订阅后可查看完整内容' : '暂无介绍',
        price: ((resume.price || 0) / 1_000_000).toFixed(2) + ' USDC',
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
    alert('请先连接钱包！');
    return;
  }

  const resume = resumes.find(r => r.resumeId === resumeId);
  if (!resume) return;

  // 检查是否已订阅
  const hasSubscription = userSubscriptions.some(
    sub => sub.service_id === resume.rawData.policy_object_id
  );
  
  if (hasSubscription) {
    alert('您已购买此简历的访问权限！');
    await handleViewResumeCallback({ ...resume, isLocked: false });
    return;
  }

  const confirmed = window.confirm(
    `购买简历访问权限需要支付 ${resume.price}\n\n✅ 支付后可永久查看此简历\n✅ 支付直接转给简历所有者\n\n确定要购买吗？`
  );

  if (!confirmed) return;

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
      throw new Error('简历服务不存在，请联系简历所有者');
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
            
            // 4. 重新加载订阅列表（带重试，等待区块链索引）
            console.log('🔄 购买成功，正在重新加载订阅列表...');
            
            let retries = 0;
            const maxRetries = 5;
            let newSubscriptions = [];
            
            while (retries < maxRetries) {
              newSubscriptions = await loadUserSubscriptionsCallback();
              
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
            
            // 5. 更新简历状态
            setResumes(resumes.map(r => 
              r.resumeId === resumeId ? { ...r, isLocked: false } : r
            ));
            
            // 订阅模式不需要调用后端 unlockResume 接口
            // 订阅信息已经在区块链上，通过 Subscription NFT 验证
            
            if (retries >= maxRetries) {
              alert('⚠️ 购买成功，但订阅信息同步需要时间，请稍后刷新页面重试');
              resolve();
              return;
            }
            
            alert('🎉 购买成功！现在可以查看完整简历了');
            
            // 6. 自动打开查看
            console.log('🔓 准备解密简历...');
            await handleViewResumeCallback({ ...resume, isLocked: false });
            resolve();
          },
          onError: (error) => {
            console.error('❌ 支付失败:', error);
            alert(`支付失败: ${error.message}\n\n可能原因：\n1. 钱包余额不足\n2. 用户取消交易\n3. 网络错误`);
            reject(error);
          },
        }
      );
    });

  } catch (err) {
    console.error('购买订阅失败:', err);
    alert(`购买失败: ${err.message}`);
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

/**
 * 获取学历
 */
const getEducationLevel = (educationArray) => {
  if (!educationArray || educationArray.length === 0) return '未知';
  return educationArray[0].degree || '未知';
};

/**
 * 格式化薪资
 */
const formatSalary = (min, max) => {
  if (!min && !max) return '面议';
  if (min && max) return `${(min/1000).toFixed(0)}-${(max/1000).toFixed(0)}K`;
  if (min) return `${(min/1000).toFixed(0)}K+`;
  return '面议';
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
    setError('请先连接钱包');
    return;
  }

  setIsDecrypting(true);
  try {
    const encryptionType = resume.rawData?.encryption_type || 'simple';
    
    if (encryptionType === 'seal') {
      // Seal 解密：使用订阅验证
      const blobId = resume.rawData?.blob_id;
      const encryptionId = resume.rawData?.encryption_id;
      const policyObjectId = resume.rawData?.policy_object_id;
      
      if (!blobId || !encryptionId || !policyObjectId) {
        throw new Error('Seal 加密简历信息不完整');
      }

      console.log('🔒 使用 Seal 订阅模式解密:', {
        blobId,
        encryptionId,
        policyObjectId
      });

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
        throw new Error(`未找到有效订阅，请先购买访问权限。
已有订阅: ${userSubscriptions.map(s => s.service_id).join(', ')}
需要订阅: ${policyObjectId}`);
      }
      
      console.log('✅ 找到订阅:', subscription);

      // 2. 验证订阅是否有效
      const serviceDetails = await getServiceDetails(suiClient, policyObjectId);
      const currentTime = Date.now();
      
      if (!isSubscriptionValid(subscription, serviceDetails, currentTime)) {
        throw new Error('订阅已过期，请重新购买');
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

    } else {
      // 简单加密：使用密钥
      if (!decryptKey) {
        throw new Error('请输入解密密钥');
      }

      const blobId = resume.rawData?.blob_id;
      if (!blobId) {
        throw new Error('简历数据不完整');
      }

      console.log('使用简单加密解密:', blobId);

      // 从 Walrus 下载
      const encryptedBlob = await downloadFromWalrus(blobId);
      
      // 解密
      const decrypted = await decryptWithSeal(encryptedBlob, decryptKey);
      
      setDecryptedData(decrypted);
    }

  } catch (err) {
    console.error('解密失败:', err);
    setError(err.message || '解密简历失败');
  } finally {
    setIsDecrypting(false);
  }
};
