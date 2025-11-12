# Seal 简历预览集成文档

## 概述

已完成 `ResumePreviewPage` 组件的 Seal 解密集成，支持预览页面自动解密和显示加密简历。

## 功能特性

### 1. ResumePreviewPage - 简历预览页面

#### 访问路径
```
/resume/preview/:id
```

#### 功能流程
1. **加载简历元数据** → 获取 `encryption_type`, `blob_id`, `encryption_id`, `policy_object_id`
2. **检测加密类型**：
   - **未加密**：直接显示
   - **Seal 加密**：自动创建 SessionKey 并解密
   - **简单加密**：检查 localStorage，找不到密钥则提示输入
3. **解密完成** → 显示完整简历预览
4. **导出 PDF** → 可导出解密后的简历

## 代码实现

### 引入依赖

```javascript
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { getSealClient, downloadAndDecryptResume } from '../utils/sealClient';
import { decryptWithSeal } from '../utils/seal';
import { downloadFromWalrus } from '../utils/walrus';
```

### 状态管理

```javascript
const [encryptionType, setEncryptionType] = useState('simple');
const [policyObjectId, setPolicyObjectId] = useState(null);
const [isDecrypting, setIsDecrypting] = useState(false);
const [needsKey, setNeedsKey] = useState(false);
```

### 加载简历逻辑

```javascript
const loadResumeDetail = async () => {
  const resume = await resumeService.getResumeDetail(id, owner);
  
  // 保存加密信息
  const encType = resume.encryption_type || 'simple';
  const policyId = resume.policy_object_id;
  setEncryptionType(encType);
  setPolicyObjectId(policyId);
  
  const blobId = resume.blob_id;
  const ipfsCid = resume.ipfs_cid || resume.cid;
  
  if (!blobId && !ipfsCid) {
    // 未加密简历
    setFormData(transformResumeData(resume));
    return;
  }
  
  if (encType === 'seal') {
    // Seal 解密流程
    await decryptSealResume(
      resume.blob_id,
      resume.encryption_id,
      resume.policy_object_id
    );
  } else {
    // 简单加密流程
    const savedKeys = JSON.parse(localStorage.getItem('resumeEncryptionKeys') || '{}');
    const key = savedKeys[id];
    
    if (!key) {
      setNeedsKey(true);
      return;
    }
    
    await decryptAndLoadResume(blobId || ipfsCid, key);
  }
};
```

### Seal 解密实现

```javascript
const decryptSealResume = async (blobId, encryptionId, policyObjectId) => {
  setIsDecrypting(true);
  
  try {
    // 1. 创建 SessionKey
    const sealClient = getSealClient();
    const sessionKeyTx = await sealClient.createSessionKey({
      policyObjectId,
      encryptionId,
    });

    // 2. 执行交易
    await new Promise((resolve, reject) => {
      signAndExecute(
        { transaction: sessionKeyTx },
        {
          onSuccess: async (result) => {
            try {
              // 3. 下载并解密
              const decrypted = await downloadAndDecryptResume(
                blobId,
                encryptionId,
                policyObjectId,
                currentAccount.address
              );
              
              // 4. 显示内容
              setFormData(transformResumeData(decrypted));
              resolve(decrypted);
            } catch (err) {
              if (err.message.includes('NoAccess')) {
                reject(new Error('您不在简历的访问白名单中'));
              } else {
                reject(err);
              }
            }
          },
          onError: (err) => {
            reject(new Error('创建 SessionKey 失败，请检查访问权限'));
          },
        }
      );
    });
  } catch (err) {
    console.error('Seal 解密失败:', err);
    throw err;
  } finally {
    setIsDecrypting(false);
  }
};
```

### 简单加密解密

```javascript
const decryptAndLoadResume = async (storageId, key) => {
  setIsDecrypting(true);
  
  try {
    // 从 Walrus 下载
    const encryptedBlob = await downloadFromWalrus(storageId);
    
    // 使用密钥解密
    const decryptedData = await decryptWithSeal(encryptedBlob, key);
    
    // 显示内容
    setFormData(transformResumeData(decryptedData));
    setNeedsKey(false);
  } catch (err) {
    if (err.message.includes('decrypt')) {
      alert('⚠️ 解密失败，密钥可能不正确');
      
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
```

## UI 界面

### 1. 加载状态

```jsx
if (isLoading) {
  return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600">
            {isDecrypting ? '正在解密简历...' : '加载简历数据中...'}
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
```

### 2. 简单加密密钥输入

```jsx
if (needsKey && encryptionType !== 'seal') {
  return (
    <PageLayout>
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold">需要加密密钥</h2>
          <p className="text-gray-600">
            此简历已使用简单加密保护，请输入密钥以查看内容
          </p>
        </div>
        
        <textarea
          value={encryptionKey}
          onChange={(e) => setEncryptionKey(e.target.value)}
          placeholder="请粘贴您的加密密钥..."
          rows={4}
        />
        
        <button onClick={handleKeySubmit}>
          {isDecrypting ? '解密中...' : '解密'}
        </button>
      </div>
    </PageLayout>
  );
}
```

### 3. Seal 自动解密中

```jsx
if (needsKey && encryptionType === 'seal') {
  return (
    <PageLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🔒</div>
          <h2 className="text-2xl font-bold">Seal 加密简历</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600">正在验证访问权限并解密...</p>
          <p className="text-sm text-gray-500 mt-2">请稍候，这可能需要几秒钟</p>
        </div>
      </div>
    </PageLayout>
  );
}
```

### 4. 解密成功 - 显示预览

```jsx
return (
  <ResumePreview 
    formData={formData}
    resumeId={id}
    onClose={handleClose}
    isFullPage={true}
  />
);
```

## 数据转换

### transformResumeData 函数

将后端返回的简历数据转换为前端组件所需格式：

```javascript
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
```

## 错误处理

### 1. 访问权限错误

```javascript
if (err.message.includes('NoAccess')) {
  alert('您不在简历的访问白名单中');
  navigate('/resumes');
}
```

### 2. 密钥错误

```javascript
if (err.message.includes('decrypt') || err.message.includes('OperationError')) {
  alert('⚠️ 解密失败，密钥可能不正确。请重新输入正确的密钥。');
  
  // 清除错误的密钥
  const savedKeys = JSON.parse(localStorage.getItem('resumeEncryptionKeys') || '{}');
  delete savedKeys[id];
  localStorage.setItem('resumeEncryptionKeys', JSON.stringify(savedKeys));
  
  setNeedsKey(true);
}
```

### 3. 未授权访问

```javascript
if (err.message.includes('Unauthorized')) {
  alert('无权查看此简历');
  navigate('/resumes');
}
```

## 用户体验优化

### 1. 自动化流程
- ✅ Seal 加密自动验证权限，无需用户操作
- ✅ 简单加密优先使用 localStorage 缓存的密钥
- ✅ 解密成功后自动显示预览

### 2. 加载状态提示
- 🔄 "加载简历数据中..." - 初始加载
- 🔄 "正在解密简历..." - 解密过程
- 🔒 "正在验证访问权限并解密..." - Seal 模式

### 3. 错误反馈
- ⚠️ 密钥错误：清除缓存，提示重新输入
- 🚫 无权限：明确提示原因，返回列表
- ❌ 其他错误：显示具体错误信息

### 4. 密钥管理
- 💾 解密成功后询问是否保存密钥
- 🗑️ 错误密钥自动清除
- 🔑 下次访问自动使用缓存密钥

## 与其他组件对比

| 功能 | ResumeEdit | ResumeBrowse | ResumePreviewPage |
|------|-----------|--------------|-------------------|
| **用途** | 编辑简历 | 浏览和解锁 | 预览和导出 |
| **权限** | 仅所有者 | 需解锁 | 所有者/授权者 |
| **Seal 支持** | ✅ 完整支持 | ✅ 完整支持 | ✅ 完整支持 |
| **解密模式** | 编辑前解密 | 解锁后解密 | 访问时解密 |
| **UI 模式** | 表单编辑 | 模态框查看 | 全屏预览 |
| **导出功能** | ❌ | ❌ | ✅ PDF 导出 |

## 测试场景

### 1. Seal 加密简历预览
- ✅ 自动创建 SessionKey
- ✅ 验证 Allowlist 权限
- ✅ 下载并解密成功
- ✅ 显示完整预览
- ✅ 可导出 PDF

### 2. 简单加密简历预览
- ✅ 使用缓存密钥自动解密
- ✅ 无缓存时提示输入
- ✅ 密钥正确后显示预览
- ✅ 询问是否保存密钥

### 3. 未加密简历预览
- ✅ 直接显示内容
- ✅ 正常导出 PDF

### 4. 错误场景
- ✅ 无 Allowlist 权限：显示错误并返回
- ✅ 密钥错误：清除并重新输入
- ✅ 网络错误：显示错误信息

## 完整的解密流程图

```
用户访问 /resume/preview/:id
         ↓
   加载简历元数据
         ↓
    检测加密类型
         ↓
    ┌────┴────┐
    ↓         ↓         ↓
 未加密   简单加密   Seal加密
    ↓         ↓         ↓
直接显示  检查密钥  创建SessionKey
              ↓         ↓
         有密钥?   验证权限
         ↙    ↘       ↓
       是      否   下载解密
       ↓       ↓       ↓
   自动解密  提示输入  显示预览
       ↓       ↓       ↓
   显示预览  手动解密  导出PDF
       ↓       ↓
   导出PDF  保存密钥?
```

## 安全性考虑

### Seal 模式
- ✅ 基于智能合约的访问控制
- ✅ 需要链上验证权限
- ✅ SessionKey 机制确保安全
- ✅ 无需本地存储敏感密钥

### 简单模式
- ⚠️ 密钥存储在 localStorage
- ⚠️ 需要用户妥善保管
- ⚠️ 密钥泄露可能导致数据泄露
- ℹ️ 适合个人使用场景

## 后续优化建议

1. **预加载优化**
   - 在列表页面预获取加密类型
   - 提前显示访问状态标识

2. **缓存机制**
   - 缓存已解密的内容（内存）
   - 避免重复解密操作

3. **导出增强**
   - 支持加密后的 PDF 导出
   - 添加水印和版权信息

4. **权限预检**
   - 在访问前检查 Allowlist
   - 显示预计解密时间

5. **批量预览**
   - 支持多份简历的批量预览
   - 使用 Seal 批量解密 API

## 总结

✅ **已完成功能**
- ResumePreviewPage 完整集成 Seal 解密
- 支持 Seal 和简单加密两种模式
- 自动化解密流程和错误处理
- 完整的 UI 状态和用户反馈
- PDF 导出功能正常工作

🎯 **核心价值**
- 安全：Seal 访问控制保护隐私
- 便捷：自动解密，最小化用户操作
- 灵活：支持多种加密模式
- 完整：预览、导出一站式体验

📋 **相关组件**
- ResumeEdit - 编辑支持 Seal 解密 ✅
- ResumeBrowse - 浏览支持 Seal 解密 ✅
- ResumePreviewPage - 预览支持 Seal 解密 ✅
- ResumePreview - 显示组件（纯展示）

🔗 **相关文档**
- [SEAL_DECRYPTION_INTEGRATION.md](./SEAL_DECRYPTION_INTEGRATION.md) - 编辑和浏览集成
- [SEAL_FRONTEND_INTEGRATION.md](./SEAL_FRONTEND_INTEGRATION.md) - 创建集成
- [SEAL_RESUME_INTEGRATION.md](../WALRUS_SEAL_INTEGRATION.md) - 整体架构
