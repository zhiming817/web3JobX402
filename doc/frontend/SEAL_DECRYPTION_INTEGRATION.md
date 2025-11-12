# Seal 解密功能集成完成

## 概述

已完成在 `ResumeEdit` 和 `ResumeBrowse` 组件中集成完整的 Seal 解密功能，支持两种加密模式：
- **简单加密**（simple）：用户自行管理密钥
- **Seal 加密**（seal）：基于 Allowlist 的访问控制

## 功能特性

### 1. ResumeEdit - 简历编辑解密

#### 功能流程
1. **加载简历** → 检测 `encryption_type` 字段
2. **Seal 模式**：
   - 验证必需字段：`blob_id`, `encryption_id`, `policy_object_id`
   - 创建 SessionKey 交易
   - 执行交易获取访问权限
   - 使用 `downloadAndDecryptResume` 下载并解密
3. **简单模式**：
   - 从 localStorage 读取密钥
   - 如未找到，提示用户输入
   - 使用 `decryptWithSeal` 解密

#### 关键代码

```javascript
const loadResumeDetail = async () => {
  const resume = await resumeService.getResumeDetail(id, owner);
  const encType = resume.encryption_type || 'simple';
  
  if (encType === 'seal') {
    await decryptSealResume(
      resume.blob_id, 
      resume.encryption_id, 
      resume.policy_object_id
    );
  } else {
    // 简单加密流程
    await decryptAndLoadResume(blobId, key);
  }
};
```

#### Seal 解密流程

```javascript
const decryptSealResume = async (blobId, encryptionId, policyObjectId) => {
  // 1. 创建 SessionKey
  const sealClient = getSealClient();
  const sessionKeyTx = await sealClient.createSessionKey({
    policyObjectId,
    encryptionId,
  });

  // 2. 执行交易
  await signAndExecute({ transaction: sessionKeyTx }, {
    onSuccess: async (result) => {
      // 3. 下载并解密
      const decrypted = await downloadAndDecryptResume(
        blobId,
        encryptionId,
        policyObjectId,
        currentAccount.address
      );
      
      // 4. 加载到表单
      setFormData(transformResumeToFormData(decrypted));
    },
    onError: (err) => {
      // 处理权限错误
      if (err.message.includes('NoAccess')) {
        alert('您不在简历的访问白名单中');
      }
    }
  });
};
```

### 2. ResumeBrowse - 简历浏览解密

#### 功能流程
1. **解锁简历** → 支付后更新状态
2. **自动打开解密模态框**
3. **Seal 模式**：
   - 自动创建 SessionKey
   - 验证 Allowlist 权限
   - 解密并显示完整内容
4. **简单模式**：
   - 显示密钥输入框
   - 用户输入密钥后解密

#### 解锁后自动查看

```javascript
const handleUnlock = async (resumeId) => {
  const result = await resumeService.unlockResume(resumeId, publicKey);
  
  if (result.success) {
    // 解锁后自动打开查看
    const unlockedResume = resumes.find(r => r.resumeId === resumeId);
    handleViewResume({ ...unlockedResume, isLocked: false });
  }
};
```

#### 解密模态框

```javascript
const handleViewResume = async (resume) => {
  setSelectedResume(resume);
  setShowDecryptModal(true);
  
  // 如果已解锁，自动尝试解密
  if (!resume.isLocked) {
    await handleDecryptResume(resume);
  }
};
```

#### 解密逻辑

```javascript
const handleDecryptResume = async (resume) => {
  const encryptionType = resume.encryption_type || 'simple';
  
  if (encryptionType === 'seal') {
    // Seal 解密：创建 SessionKey → 下载 → 解密
    const sealClient = getSealClient();
    const sessionKeyTx = await sealClient.createSessionKey({
      policyObjectId: resume.policy_object_id,
      encryptionId: resume.encryption_id,
    });
    
    await signAndExecute({ transaction: sessionKeyTx }, {
      onSuccess: async () => {
        const decrypted = await downloadAndDecryptResume(
          resume.blob_id,
          resume.encryption_id,
          resume.policy_object_id,
          currentAccount.address
        );
        setDecryptedData(decrypted);
      }
    });
  } else {
    // 简单加密：需要用户输入密钥
    if (!decryptKey) throw new Error('请输入解密密钥');
    
    const encryptedBlob = await downloadFromWalrus(resume.blob_id);
    const decrypted = await decryptWithSeal(encryptedBlob, decryptKey);
    setDecryptedData(decrypted);
  }
};
```

## UI 设计

### ResumeBrowse 解密模态框

#### 模态框结构
- **Header**：显示加密类型（Seal/简单）
- **Content**：根据状态显示不同内容
  - 简单加密 + 未解密：显示密钥输入框
  - 解密中：显示加载动画
  - 解密失败：显示错误提示
  - 解密成功：显示完整简历内容

#### 简历内容展示
- 📋 基本信息：姓名、性别、年龄、联系方式、邮箱、所在地
- 🎯 求职意向：职位、期望薪资
- 💼 工作经验
- 🛠️ 技能专长
- 🎓 教育背景
- 🚀 项目经验
- ✨ 自我评价

```jsx
{showDecryptModal && selectedResume && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
        <h2 className="text-2xl font-bold">查看简历详情</h2>
        <p className="text-orange-100">
          {selectedResume.encryption_type === 'seal' ? '🔒 Seal 加密保护' : '🔐 简单加密'}
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* 简单加密密钥输入 */}
        {selectedResume.encryption_type !== 'seal' && !decryptedData && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">🔑 输入解密密钥</h3>
            <input
              type="password"
              value={decryptKey}
              onChange={(e) => setDecryptKey(e.target.value)}
              placeholder="输入解密密钥"
            />
            <button onClick={() => handleDecryptResume(selectedResume)}>
              {isDecrypting ? '解密中...' : '解密'}
            </button>
          </div>
        )}

        {/* 解密成功内容 */}
        {decryptedData && (
          <div className="space-y-6">
            {/* 基本信息、工作经验、技能等各个部分 */}
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

## 错误处理

### Seal 访问控制错误

```javascript
try {
  await downloadAndDecryptResume(...);
} catch (err) {
  if (err.message.includes('NoAccess')) {
    throw new Error('您不在简历的访问白名单中');
  }
}
```

### 简单加密密钥错误

```javascript
try {
  await decryptWithSeal(encryptedBlob, key);
} catch (err) {
  if (err.message.includes('decrypt') || err.message.includes('OperationError')) {
    alert('⚠️ 解密失败，密钥可能不正确');
    
    // 清除错误的密钥
    const savedKeys = JSON.parse(localStorage.getItem('resumeEncryptionKeys') || '{}');
    delete savedKeys[id];
    localStorage.setItem('resumeEncryptionKeys', JSON.stringify(savedKeys));
    
    setNeedsKey(true);
  }
}
```

## 依赖工具函数

### sealClient.js
- `getSealClient()` - 获取 Seal 客户端实例
- `downloadAndDecryptResume()` - Seal 完整解密流程

### seal.js
- `decryptWithSeal()` - 简单加密解密

### walrus.js
- `downloadFromWalrus()` - 从 Walrus 下载加密数据

## 状态管理

### ResumeEdit 新增状态
```javascript
const [encryptionType, setEncryptionType] = useState('simple');
const [policyObjectId, setPolicyObjectId] = useState(null);
const [isDecrypting, setIsDecrypting] = useState(false);
```

### ResumeBrowse 新增状态
```javascript
const [showDecryptModal, setShowDecryptModal] = useState(false);
const [selectedResume, setSelectedResume] = useState(null);
const [decryptedData, setDecryptedData] = useState(null);
const [isDecrypting, setIsDecrypting] = useState(false);
const [decryptKey, setDecryptKey] = useState('');
```

## 测试场景

### 1. Seal 加密简历编辑
- ✅ 检测到 `encryption_type: 'seal'`
- ✅ 创建 SessionKey 成功
- ✅ 下载并解密成功
- ✅ 加载到表单可编辑
- ✅ 无权限时显示错误

### 2. 简单加密简历编辑
- ✅ 从 localStorage 读取密钥
- ✅ 密钥不存在时提示输入
- ✅ 密钥错误时清除并重新输入
- ✅ 解密成功后加载表单

### 3. Seal 加密简历浏览
- ✅ 解锁后自动打开模态框
- ✅ 自动验证 Allowlist 权限
- ✅ 显示解密进度
- ✅ 解密成功显示完整内容
- ✅ 无权限时显示错误提示

### 4. 简单加密简历浏览
- ✅ 解锁后打开模态框
- ✅ 显示密钥输入框
- ✅ 输入密钥后解密
- ✅ 显示完整简历内容

## 用户体验优化

### 加载状态
- 显示 "正在验证访问权限并解密..." (Seal)
- 显示 "正在解密简历..." (简单)

### 成功反馈
- ✅ 绿色成功提示框
- 显示 "解密成功"

### 错误反馈
- ⚠️ 红色错误提示框
- 明确的错误原因说明
- 针对 Seal：提示检查访问权限
- 针对简单：提示密钥可能不正确

### 自动化
- 解锁后自动打开查看
- Seal 模式自动解密（无需用户操作）
- 本地密钥自动加载（简单模式）

## 安全性

### Seal 模式
- ✅ 基于智能合约的访问控制
- ✅ 需要创建 SessionKey 才能解密
- ✅ Allowlist 验证在链上执行
- ✅ 无权限用户无法解密

### 简单模式
- ⚠️ 密钥存储在 localStorage
- ⚠️ 需要用户妥善保管密钥
- ⚠️ 密钥泄露可能导致数据泄露

## 后续优化建议

1. **后端支持**
   - 确保 API 返回 `encryption_type`, `blob_id`, `encryption_id`, `policy_object_id` 字段
   - 数据库迁移脚本已准备好（`002_add_seal_fields.sql`）

2. **权限预检**
   - 在解密前检查用户是否在 Allowlist 中
   - 提前显示访问状态，避免无效尝试

3. **批量操作**
   - 支持批量解密多份简历
   - 使用 `downloadAndDecryptBatch` 提高效率

4. **缓存机制**
   - 缓存已解密的内容（Seal 模式）
   - 避免重复创建 SessionKey

5. **用户体验**
   - 添加解密进度条
   - 优化大文件解密性能
   - 提供解密历史记录

## 总结

✅ **已完成集成**
- ResumeEdit 支持 Seal 和简单加密解密
- ResumeBrowse 支持解锁后查看和解密
- 完整的错误处理和用户反馈
- 美观的 UI 设计和加载状态

🎯 **核心价值**
- 安全：基于 Seal 的去中心化访问控制
- 隐私：端到端加密保护
- 灵活：支持两种加密模式
- 易用：自动化解密流程，最小化用户操作

📦 **技术栈**
- @mysten/seal - Sui 链上访问控制
- Walrus - 去中心化存储
- @mysten/dapp-kit - 钱包集成
- React - 前端框架
