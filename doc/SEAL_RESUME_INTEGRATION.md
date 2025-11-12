# Seal 简历加密和访问控制集成方案

## 📋 概述

本文档说明如何基于 `examples` 目录下的 Seal 加密和访问控制实现，将其应用到简历的加密、上传、下载和解密流程中。

## 🎯 技术架构

### 核心技术栈

1. **Seal (@mysten/seal)**: 基于阈值加密的访问控制系统
2. **Walrus**: 去中心化存储
3. **Sui Move**: 智能合约和访问控制
4. **已部署合约**: `0x55202f19ccbb6d2d518cf11bc1e6751d0762275427665bdd76d1e917aad82b17`

### 架构对比

#### 方案 A: 简单加密 (已实现)
```
用户数据 → AES-GCM加密 → Walrus存储 → 用户保存密钥
              ↓
         密钥由用户管理
         解密时需要密钥
```

**优点**: 简单、客户端完全控制
**缺点**: 无法实现细粒度访问控制、密钥管理困难

#### 方案 B: Seal 加密 + 访问控制 (本方案)
```
用户数据 → Seal加密 → Walrus存储 → 链上Allowlist控制访问
              ↓                      ↓
         密钥服务器管理          通过合约验证权限
         阈值解密 (2/2)          无需手动管理密钥
```

**优点**: 
- 细粒度访问控制
- 支持动态添加/移除访问权限
- 密钥由多个服务器分布式管理
- 支持付费解锁等高级功能

**缺点**: 需要 Sui 钱包和交易签名

## 🔧 已创建的文件

### 1. 配置文件: `frontend/web/src/config/seal.config.js`

包含 Seal 的核心配置:
- 合约包 ID: `TESTNET_PACKAGE_ID`
- 密钥服务器配置: `SEAL_SERVER_CONFIGS` (2个服务器)
- 阈值配置: `threshold: 2` (需要2个服务器才能解密)
- Sui 网络配置: `testnet`

### 2. 工具类: `frontend/web/src/utils/sealClient.js`

提供完整的 Seal 功能:

#### 核心功能

**加密和上传**:
```javascript
encryptAndUploadResume(resumeData, policyObjectId)
→ 返回: { blobId, encryptionId, url }
```

**下载和解密**:
```javascript
downloadAndDecryptResume(blobId, sessionKey, policyObjectId)
→ 返回: resumeData (解密后的数据)
```

**批量处理**:
```javascript
downloadAndDecryptBatch(blobIds, sessionKey, policyObjectId)
→ 返回: [{ blobId, data }]
```

#### 访问控制功能

**关联 Blob 到 Allowlist**:
```javascript
createPublishTransaction(allowlistId, capId, blobId)
→ 返回: Transaction
```

**添加地址到白名单**:
```javascript
createAddToAllowlistTransaction(allowlistId, capId, address)
→ 返回: Transaction
```

**移除地址**:
```javascript
createRemoveFromAllowlistTransaction(allowlistId, capId, address)
→ 返回: Transaction
```

### 3. 服务层: `frontend/web/src/services/resume.service.js` (已更新)

新增方法:

**使用 Seal 创建简历**:
```javascript
async createResumeWithSeal(resumeData, policyObjectId)
→ 返回: { success, resumeId, blobId, encryptionId, policyObjectId }
```

**使用 Seal 下载简历**:
```javascript
async downloadResumeWithSeal(blobId, sessionKey, policyObjectId)
→ 返回: resumeData
```

**关联 Blob**:
```javascript
async publishBlobToAllowlist(allowlistId, capId, blobId, signAndExecute)
```

**管理白名单**:
```javascript
async addToResumeAllowlist(allowlistId, capId, address, signAndExecute)
```

## 📖 使用指南

### 场景 1: 创建加密简历 (带访问控制)

```javascript
import { resumeService } from './services';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

// 1. 准备简历数据
const resumeData = {
  owner: walletAddress,
  personal: { name: 'John Doe', ... },
  skills: '...',
  // ...
};

// 2. 创建或获取 Allowlist ID
const allowlistId = '0x...'; // 从合约创建或已有的 allowlist
const capId = '0x...';       // 对应的 cap

// 3. 使用 Seal 加密并创建简历
const result = await resumeService.createResumeWithSeal(
  resumeData,
  allowlistId
);

console.log('Resume ID:', result.resumeId);
console.log('Blob ID:', result.blobId);
console.log('Encryption ID:', result.encryptionId);

// 4. 关联 Blob 到 Allowlist (需要签名)
const { mutate: signAndExecute } = useSignAndExecuteTransaction();
await resumeService.publishBlobToAllowlist(
  allowlistId,
  capId,
  result.blobId,
  signAndExecute
);
```

### 场景 2: 解锁简历 (添加访问权限)

```javascript
// HR 购买简历后，简历所有者需要添加 HR 到白名单
const hrAddress = '0x...';

await resumeService.addToResumeAllowlist(
  allowlistId,
  capId,
  hrAddress,
  signAndExecute
);

console.log('HR 已添加到访问白名单');
```

### 场景 3: 查看加密简历 (访问控制验证)

```javascript
import { getSealClient } from './utils/sealClient';

// 1. 获取简历的 blobId 和 allowlistId
const resume = await resumeService.getResumeDetail(resumeId, owner);
const { ipfs_cid: blobId, policy_object_id: allowlistId } = resume;

// 2. 创建会话密钥 (通过 Sui 钱包)
const sealClient = getSealClient();
const sessionKey = await sealClient.createSessionKey({
  signer: suiSigner,
});

// 3. 下载并解密 (自动验证访问权限)
try {
  const resumeData = await resumeService.downloadResumeWithSeal(
    blobId,
    sessionKey,
    allowlistId
  );
  
  console.log('简历内容:', resumeData);
} catch (error) {
  if (error.message.includes('无权访问')) {
    console.error('您不在此简历的访问白名单中');
  }
}
```

## 🔄 完整工作流程

### 1. 简历创建流程

```
┌─────────────┐
│  用户填写   │
│  简历数据   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ Seal 加密                   │
│ - 生成 nonce               │
│ - 计算 encryptionId        │
│ - 使用阈值加密 (threshold=2)│
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────┐
│ Walrus 上传     │
│ 返回 blobId     │
└──────┬──────────┘
       │
       ▼
┌─────────────────────────┐
│ 后端保存元数据           │
│ - ipfs_cid (blobId)    │
│ - encryption_id        │
│ - policy_object_id     │
└──────┬──────────────────┘
       │
       ▼
┌──────────────────────────┐
│ 链上操作 (需要签名)       │
│ - publish to allowlist  │
│ - 关联 blob 到访问控制   │
└──────────────────────────┘
```

### 2. 简历解锁流程

```
┌─────────────┐
│  HR 购买    │
│  简历访问权  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ 付费交易 (x402 协议)     │
│ 记录购买记录             │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ 简历所有者签名           │
│ 添加 HR 到 allowlist    │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ HR 可以访问             │
│ 使用 sessionKey 解密    │
└─────────────────────────┘
```

### 3. 简历查看流程

```
┌─────────────┐
│  用户请求   │
│  查看简历   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ 创建 SessionKey         │
│ (通过 Sui 钱包签名)     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ 从 Walrus 下载          │
│ 加密的 blob            │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ 调用密钥服务器               │
│ - 构建访问控制交易           │
│ - 验证用户在 allowlist 中    │
│ - 获取解密密钥 (threshold=2) │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────┐
│ Seal 解密   │
│ 显示内容    │
└─────────────┘
```

## 🔒 安全特性

### 1. 阈值加密
- 使用 2/2 阈值配置
- 需要 2 个密钥服务器同时工作才能解密
- 单个服务器无法解密数据

### 2. 访问控制
- 基于链上 Allowlist 合约
- 动态添加/移除访问权限
- 所有访问记录可查

### 3. 加密 ID 生成
```
encryptionId = policy_object_id || random_nonce (5 bytes)
```
- 每次加密都生成唯一 ID
- ID 与策略对象绑定
- 防止重放攻击

### 4. 会话密钥
- 每次访问都需要创建新的 SessionKey
- 通过 Sui 钱包签名验证身份
- 短期有效，提高安全性

## 📊 对比：简单加密 vs Seal 加密

| 特性 | 简单加密 (方案A) | Seal 加密 (方案B) |
|------|----------------|-------------------|
| 加密算法 | AES-GCM-256 | 阈值加密 + AES-GCM |
| 密钥管理 | 用户手动管理 | 密钥服务器分布式管理 |
| 访问控制 | 无 (谁有密钥谁能解密) | 链上 Allowlist 控制 |
| 权限管理 | 不支持 | 动态添加/移除 |
| 付费解锁 | 手动协调 | 智能合约自动化 |
| 审计追踪 | 无 | 链上所有操作可查 |
| 密钥丢失 | 永久无法解密 | 只要有访问权限即可解密 |
| 复杂度 | 低 | 中等 |
| Gas 费用 | 无 | 需要支付 Sui gas |

## 🚀 实施步骤

### Phase 1: 基础集成 ✅
- [x] 创建配置文件 (`seal.config.js`)
- [x] 实现 Seal 客户端工具 (`sealClient.js`)
- [x] 更新服务层 (`resume.service.js`)
- [x] 编写文档

### Phase 2: 前端集成 (待实施)
- [ ] 在 `ResumeCreate.jsx` 中集成 Seal 加密
- [ ] 在 `ResumeEdit.jsx` 中支持 Seal 解密
- [ ] 在 `ResumeBrowse.jsx` 中实现访问控制
- [ ] 添加白名单管理 UI

### Phase 3: 后端集成 (待实施)
- [ ] 数据库添加字段: `encryption_id`, `policy_object_id`
- [ ] 更新 API 支持 Seal 相关字段
- [ ] 实现解锁记录和白名单同步

### Phase 4: 测试和优化
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能优化
- [ ] 错误处理完善

## 📝 注意事项

### 1. 合约已部署
- Package ID: `0x55202f19ccbb6d2d518cf11bc1e6751d0762275427665bdd76d1e917aad82b17`
- 可直接使用，无需重新部署
- 在 Sui Testnet 上

### 2. 依赖包
```json
{
  "@mysten/seal": "^latest",
  "@mysten/sui": "^latest",
  "@mysten/dapp-kit": "^latest",
  "@mysten/walrus": "^latest"
}
```

### 3. 环境变量
```bash
VITE_SUI_NETWORK=testnet
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
```

### 4. Allowlist 创建
需要先创建 Allowlist 和 Cap:
```javascript
// 使用 Sui CLI 或前端创建
import { Transaction } from '@mysten/sui/transactions';

const tx = new Transaction();
tx.moveCall({
  target: `${TESTNET_PACKAGE_ID}::allowlist::create_allowlist_entry`,
  arguments: [tx.pure.string('Resume Access Control')],
});

const result = await signAndExecute({ transaction: tx });
// 从结果中获取 allowlistId 和 capId
```

## 🎉 优势总结

1. **更强的安全性**: 阈值加密 + 链上访问控制
2. **灵活的权限管理**: 动态添加/移除访问者
3. **更好的用户体验**: 无需手动管理加密密钥
4. **支持商业模式**: 付费解锁、订阅访问等
5. **审计和合规**: 所有操作链上可查
6. **分布式架构**: 无单点故障风险

## 📚 参考资料

- [Seal 文档](https://seal-docs.wal.app/GettingStarted/)
- [Seal GitHub](https://github.com/MystenLabs/seal)
- [Examples 实现](examples/frontend/src/)
- [Allowlist 合约](examples/move/sources/allowlist.move)
- [Sui 文档](https://docs.sui.io/)
- [Walrus 文档](https://sdk.mystenlabs.com/walrus)

## 🔮 未来扩展

1. **多级访问控制**: 不同角色不同权限
2. **时间限制访问**: 临时访问权限
3. **订阅模式**: 付费订阅访问多份简历
4. **访问统计**: 谁在什么时候访问了简历
5. **加密字段**: 选择性加密某些敏感字段
6. **联合加密**: 结合其他加密方案

---

**创建时间**: 2025-11-12  
**最后更新**: 2025-11-12  
**维护者**: Web3JobX 团队
