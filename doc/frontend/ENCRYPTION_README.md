# 前端加密方案实现

## 概述

简历数据采用**前端加密**方案，确保数据隐私安全：

- **加密算法**：AES-256-GCM（Web Crypto API）
- **存储方案**：IPFS（通过 Pinata）
- **密钥管理**：用户自行保管加密密钥

## 架构流程

### 创建简历流程

```
用户输入简历数据
    ↓
前端使用 AES-256-GCM 加密（生成随机密钥 + IV）
    ↓
上传加密数据到 IPFS（Pinata）
    ↓
获取 CID（内容标识符）
    ↓
将 CID 发送到后端 API
    ↓
后端存储 CID 到数据库
    ↓
返回 resumeId 给用户
    ↓
前端返回加密密钥给用户（⚠️ 必须保存！）
```

### 解锁简历流程

```
买家支付费用
    ↓
后端验证支付
    ↓
返回 CID 给买家
    ↓
前端从 IPFS 下载加密数据
    ↓
使用加密密钥解密
    ↓
显示完整简历内容
```

## 文件说明

### 工具类

1. **`src/utils/crypto.js`** - 加密/解密工具
   - `generateEncryptionKey()` - 生成 256 位随机密钥
   - `encryptResume(data, key)` - 加密简历数据
   - `decryptResume(encrypted, iv, key)` - 解密简历数据
   - `prepareResumeForUpload(data)` - 一键加密准备上传
   - `downloadAndDecryptResume(blob, key)` - 一键下载解密

2. **`src/utils/ipfs.js`** - IPFS 上传/下载工具
   - `uploadEncryptedResume(blob)` - 上传到 IPFS
   - `downloadEncryptedResume(cid)` - 从 IPFS 下载
   - `testPinataConnection()` - 测试 Pinata 连接

3. **`src/services/resumeEncryption.js`** - 业务逻辑封装
   - `createEncryptedResume(data, wallet)` - 完整创建流程
   - `purchaseAndDecryptResume(id, wallet, key)` - 完整购买解密流程

### 示例组件

- **`src/components/ResumeEncryptionExample.jsx`** - React 使用示例

## 快速开始

### 1. 安装依赖

```bash
cd frontend/web
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env`，填入 Pinata JWT：

```env
VITE_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

获取 JWT：https://app.pinata.cloud/developers/api-keys

### 3. 使用示例

```javascript
import { createEncryptedResume } from './services/resumeEncryption';

// 创建加密简历
const result = await createEncryptedResume(resumeData, walletAddress);

console.log('Resume ID:', result.resumeId);
console.log('CID:', result.cid);
console.log('⚠️ 加密密钥（请保存）:', result.encryptionKey);
```

## 安全性说明

### ✅ 优势

1. **端到端加密**：数据在前端加密，后端和 IPFS 均无法读取明文
2. **零知识证明**：后端只存储 CID，不知道内容
3. **去中心化存储**：IPFS 确保数据永久可访问
4. **用户控制**：密钥由用户保管，完全自主控制

### ⚠️ 注意事项

1. **密钥丢失 = 数据永久丢失**
   - 加密密钥必须妥善保存
   - 建议多处备份（纸质、密码管理器）

2. **密钥分发问题**
   - 买家需要从卖家获得密钥
   - 可以考虑链上托管或智能合约自动分发

3. **IPFS 可用性**
   - 依赖 Pinata 服务稳定性
   - 可以考虑多个 IPFS 节点备份

## API 变更

### 后端 API 修改

#### 创建简历接口

**请求**：
```json
POST /api/resumes
{
  "owner": "wallet_address",
  "ipfs_cid": "QmXxxxxxx",  // 新增：前端上传后的 CID
  "personal": { ... },
  ...
}
```

**响应**：
```json
{
  "success": true,
  "data": "resume-uuid",
  "message": "Resume created successfully"
}
```

#### 解锁简历接口

**响应**：
```json
{
  "success": true,
  "data": {
    "ipfs_cid": "QmXxxxxxx",  // 返回 CID 给前端
    "message": "Please download and decrypt using your key"
  }
}
```

## 测试

### 测试 Pinata 连接

```javascript
import { testPinataConnection } from './utils/ipfs';

const isConnected = await testPinataConnection();
console.log('Pinata 连接:', isConnected ? '✅' : '❌');
```

### 测试加密/解密

```javascript
import { prepareResumeForUpload, downloadAndDecryptResume } from './utils/crypto';

// 加密
const { key, encryptedBlob } = await prepareResumeForUpload(resumeData);

// 解密
const decrypted = await downloadAndDecryptResume(encryptedBlob, key);

console.log('数据完整性:', JSON.stringify(resumeData) === JSON.stringify(decrypted));
```

## 后续优化方向

1. **密钥托管方案**
   - 使用智能合约托管密钥
   - 支付成功后自动释放给买家

2. **多重加密**
   - 对不同字段使用不同密钥
   - 支持部分内容预览

3. **密钥恢复**
   - 社交恢复（Shamir's Secret Sharing）
   - 硬件钱包集成

4. **备份策略**
   - 多个 IPFS 网关备份
   - Arweave 永久存储

## 相关资源

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Pinata 文档](https://docs.pinata.cloud/)
- [IPFS 文档](https://docs.ipfs.tech/)
- [AES-GCM 说明](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
