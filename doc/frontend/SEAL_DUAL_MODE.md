# Seal 双模式加密实现

## 📋 概述

简历创建现在支持两种 Seal 加密模式：
1. **Allowlist 模式** - 手动管理访问白名单
2. **订阅模式** - 付费自动获取永久访问权限

用户在创建简历时可以自由选择其中一种模式。

---

## 🎯 两种模式对比

| 特性 | Allowlist 模式 | 订阅模式 |
|------|---------------|---------|
| **访问控制** | 手动添加白名单 | 付费自动授权 |
| **使用场景** | 定向投递、内推 | 公开招聘、人才市场 |
| **初始设置** | 需要创建 Allowlist | 设置订阅价格 |
| **权限管理** | 手动添加/移除 | 自动化（链上验证） |
| **收费模式** | 免费或线下协商 | 链上自动收款 |
| **访问时限** | 由创建者控制 | 永久访问 |
| **技术复杂度** | 较高（需要管理 Allowlist） | 较低（自动化） |
| **推荐度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🔧 实现细节

### 1. 前端组件修改

**文件**: `frontend/web/src/resume/ResumeCreate.jsx`

#### 新增状态

```javascript
// 加密模式选择
const [encryptionMode, setEncryptionMode] = useState('allowlist'); // 'allowlist' 或 'subscription'

// Allowlist 模式
const [allowlistId, setAllowlistId] = useState('');
const [capId, setCapId] = useState('');

// 订阅模式
const [subscriptionPrice, setSubscriptionPrice] = useState('5'); // 默认 5 USDC
```

#### 创建流程分支

```javascript
if (useSealEncryption) {
  if (encryptionMode === 'allowlist') {
    // ===== Allowlist 模式 =====
    // 1. 创建 Seal 加密简历（关联 Allowlist）
    result = await resumeService.createResumeWithSeal(apiData, allowlistId);
    
    // 2. 自动添加创建者到白名单
    await resumeService.addToResumeAllowlist(allowlistId, capId, walletAddress, signAndExecute);
    
    // 3. 关联 Blob 到 Allowlist
    await resumeService.publishBlobToAllowlist(allowlistId, capId, result.blobId, signAndExecute);
    
  } else if (encryptionMode === 'subscription') {
    // ===== 订阅模式 =====
    // 1. 创建 Seal 加密简历（不关联 Allowlist）
    result = await resumeService.createResumeWithSeal(apiData, null);
    
    // 2. 创建订阅服务
    const tx = createSubscriptionServiceTx(
      usdcToMicroUnits(parseFloat(subscriptionPrice)),
      0, // TTL=0 表示永久访问
      result.resumeId,
      result.blobId
    );
    
    signAndExecute({ transaction: tx });
  }
}
```

---

## 🎨 UI 界面

### 模式选择界面

创建简历时，在"高级选项"中启用 Seal 加密后，会显示模式选择：

```
┌────────────────────────────────────────────────┐
│  🎯 选择访问控制模式                            │
├────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐           │
│  │ 📋 Allowlist │  │ 💰 订阅模式  │           │
│  │              │  │              │           │
│  │ ✅ 手动管理   │  │ ✅ 付费访问   │           │
│  │ ✅ 特定人员   │  │ ✅ 自动化    │           │
│  │ ✅ 随时修改   │  │ ✅ 款项直达   │           │
│  │ ⚠️ 需创建列表 │  │ 🚀 推荐使用  │           │
│  └──────────────┘  └──────────────┘           │
└────────────────────────────────────────────────┘
```

### Allowlist 模式配置

```
┌────────────────────────────────────────────────┐
│  Allowlist ID *                                │
│  [0x...]                                       │
│  用于控制谁可以访问您的简历                      │
│                                                │
│  Cap ID *                                      │
│  [0x...]                                       │
│  Allowlist 的管理员凭证                         │
│                                                │
│  [🔗 前往创建 Allowlist]                       │
└────────────────────────────────────────────────┘
```

### 订阅模式配置

```
┌────────────────────────────────────────────────┐
│  订阅价格 (USDC) *                              │
│  [5.00] USDC                                   │
│  用户支付此金额后可永久查看您的简历              │
│                                                │
│  💰 收益预估                                   │
│  ├─ 每次订阅收益: 5.00 USDC                   │
│  ├─ 10 人订阅: 50.00 USDC                     │
│  └─ 100 人订阅: 500.00 USDC                   │
└────────────────────────────────────────────────┘
```

---

## 🔄 完整创建流程

### Allowlist 模式流程

```
用户填写简历
    ↓
启用 Seal 加密
    ↓
选择 Allowlist 模式
    ↓
填写 Allowlist ID 和 Cap ID
    ↓
点击"完成"
    ↓
① 加密简历内容
    ↓
② 上传到 Walrus
    ↓
③ 调用后端 API（关联 Allowlist）
    ↓
④ 自动添加创建者到白名单
    ↓
⑤ 关联 Blob 到 Allowlist
    ↓
✅ 创建成功
```

### 订阅模式流程

```
用户填写简历
    ↓
启用 Seal 加密
    ↓
选择订阅模式
    ↓
设置订阅价格（如 5 USDC）
    ↓
点击"完成"
    ↓
① 加密简历内容
    ↓
② 上传到 Walrus
    ↓
③ 调用后端 API（不关联 Allowlist）
    ↓
④ 创建订阅服务（链上交易）
    ├─ 设置价格
    ├─ 设置 TTL=0（永久）
    └─ 关联简历 ID 和 Blob ID
    ↓
✅ 创建成功
    ↓
其他用户可以购买订阅查看
```

---

## 📊 数据存储

### 后端数据库

两种模式在后端的存储方式：

```rust
// Allowlist 模式
Resume {
    id: "resume_123",
    blob_id: "blob_abc",
    encryption_type: "seal",
    encryption_id: "enc_xyz",
    policy_object_id: Some("0x...allowlist_id"), // 关联 Allowlist
    // ...
}

// 订阅模式
Resume {
    id: "resume_456",
    blob_id: "blob_def",
    encryption_type: "seal",
    encryption_id: "enc_uvw",
    policy_object_id: None, // 不关联 Allowlist
    // ...
}
```

### 链上对象

**Allowlist 模式**:
- Allowlist 对象（包含访问者地址列表）
- Cap 对象（管理员凭证）

**订阅模式**:
- Service 对象（订阅服务配置）
- Subscription NFT（用户购买后获得）

---

## 🔐 访问验证

### Allowlist 模式

```javascript
// 解密时使用 Allowlist 验证
tx.moveCall({
  target: `${SEAL_PACKAGE}::allowlist::seal_approve`,
  arguments: [
    blobId,       // Blob ID
    allowlistId,  // Allowlist ID
    SUI_CLOCK,    // Clock
  ],
});
```

### 订阅模式

```javascript
// 解密时使用 Subscription 验证
tx.moveCall({
  target: `${SUBSCRIPTION_PACKAGE}::subscription::seal_approve`,
  arguments: [
    blobId,          // Blob ID
    subscriptionId,  // 用户的 Subscription NFT ID
    serviceId,       // Service ID
    SUI_CLOCK,       // Clock
  ],
});
```

---

## 📝 代码关键点

### 1. 创建简历时的分支判断

```javascript
if (useSealEncryption) {
  if (encryptionMode === 'allowlist') {
    // Allowlist 流程
  } else if (encryptionMode === 'subscription') {
    // 订阅流程
  }
}
```

### 2. 订阅服务创建

```javascript
const tx = createSubscriptionServiceTx(
  usdcToMicroUnits(parseFloat(subscriptionPrice)), // 价格（微单位）
  0,                                               // TTL=0（永久）
  result.resumeId,                                 // 服务名称
  result.blobId                                    // 关联标识
);
```

### 3. Seal 加密时的 policyObjectId

```javascript
// Allowlist 模式 - 传入 Allowlist ID
await resumeService.createResumeWithSeal(apiData, allowlistId);

// 订阅模式 - 传入 null（不关联 Allowlist）
await resumeService.createResumeWithSeal(apiData, null);
```

---

## ✅ 优势总结

### Allowlist 模式优势

- ✅ 完全控制访问权限
- ✅ 可以随时添加/移除访问者
- ✅ 适合小范围、定向分享
- ✅ 可以免费分享给特定人员

### 订阅模式优势

- ✅ 自动化付费和访问控制
- ✅ 款项直接转入钱包
- ✅ 永久访问，用户无需重复付费
- ✅ 适合大规模公开招聘
- ✅ 链上验证，去中心化
- ✅ 无需手动管理白名单

---

## 🚀 推荐使用场景

### 使用 Allowlist 模式

- 内推简历（只给特定 HR 查看）
- 定向投递（只给某几家公司查看）
- 私密分享（朋友、导师等）
- 需要随时撤销访问权限

### 使用订阅模式

- 公开招聘市场
- 人才平台展示
- 自由职业者接单
- 批量投递（让感兴趣的公司付费查看）
- 想要赚取简历查看费用

---

## 📖 相关文档

- [订阅模式实现说明](./SUBSCRIPTION_RESUME_IMPLEMENTATION.md)
- [Seal 集成总结](./SEAL_INTEGRATION_SUMMARY.md)
- [简历付费方案](../RESUME_PAYMENT_SOLUTION.md)
- [Allowlist 使用指南](./ALLOWLIST_GUIDE.md)

---

## 🎉 总结

通过支持双模式加密，用户可以根据不同场景灵活选择：

- **需要精确控制**？选择 Allowlist 模式
- **想要自动化赚钱**？选择订阅模式

两种模式都使用 Seal 加密保证安全性，只是访问控制机制不同！
