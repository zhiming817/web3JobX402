# 🔧 Seal 集成修复总结

## ✅ 已修复的问题

### 1. **后端 API 字段缺失**

#### 问题
- 前端发送 `ipfs_cid` 而不是 `blob_id`
- 数据库记录 `encryption_type` 始终为 "simple"
- API 返回数据缺少 `encryption_type` 和 `policy_object_id`

#### 修复
**后端模型层** (`backend/rust_backend/src/models/resume.rs`):
```rust
// CreateResumeRequest 添加字段
pub blob_id: Option<String>,
pub encryption_key: Option<String>,
pub encryption_id: Option<String>,
pub policy_object_id: Option<String>,
pub encryption_type: Option<String>,

// Resume 模型添加字段
pub blob_id: Option<String>,
pub encryption_id: Option<String>,
pub policy_object_id: Option<String>,
pub encryption_type: Option<String>,
```

**DAO 层** (`backend/rust_backend/src/dao/resume_dao.rs`):
```rust
// 从 resume_data 读取 encryption_type
let encryption_type = resume_data.encryption_type.clone().unwrap_or_else(|| "simple".to_string());

// 设置 Seal 相关字段
encryption_id: Set(resume_data.encryption_id),
policy_object_id: Set(resume_data.policy_object_id),
encryption_type: Set(encryption_type),
```

**Service 层** (`backend/rust_backend/src/services/resume_service.rs`):
```rust
// get_resume_detail 添加字段
resume_data.blob_id = Some(resume.blob_id.clone());
resume_data.encryption_id = resume.encryption_id.clone();
resume_data.policy_object_id = resume.policy_object_id.clone();
resume_data.encryption_type = Some(resume.encryption_type.clone());
```

**Controller 层** (`backend/rust_backend/src/controllers/resume_controller.rs`):
```rust
// 支持 blob_id 和 ipfs_cid (向后兼容)
let blob_id = match request.blob_id.as_ref() {
    Some(id) if !id.is_empty() => id.clone(),
    _ => {
        match request.ipfs_cid.as_ref() {
            Some(cid) if !cid.is_empty() => cid.clone(),
            _ => return error
        }
    }
};
```

---

### 2. **前端 API 调用错误**

#### 问题
- `createResumeWithSeal` 发送 `ipfs_cid` 而不是 `blob_id`
- 缺少 `encryption_type` 字段
- `createResume` (简单加密) 同样的问题

#### 修复
**Seal 加密** (`frontend/web/src/services/resume.service.js`):
```javascript
const response = await httpClient.post(API_ENDPOINTS.resumes.create, {
  ...resumeData,
  blob_id: blobId,           // 使用 blob_id
  encryption_id: encryptionId,
  policy_object_id: policyObjectId,
  encryption_type: 'seal',   // 明确标记
  encryption_key: null,
});
```

**简单加密**:
```javascript
const response = await httpClient.post(API_ENDPOINTS.resumes.create, {
  ...resumeData,
  blob_id: blobId,
  encryption_type: 'simple',
  encryption_key: null,
  encryption_id: null,
  policy_object_id: null,
});
```

---

### 3. **Seal SessionKey 创建错误**

#### 问题 1: `sealClient.createSessionKey` 不存在
```javascript
// ❌ 错误 1
const sessionKeyTx = await sealClient.createSessionKey({...});
```

#### 问题 2: `SessionKey.fromSigner` 不是函数
```javascript
// ❌ 错误 2
const { SessionKey } = await import('@mysten/seal');
const sessionKey = SessionKey.fromSigner(currentAccount.address);
```

#### 修复
**正确的 SessionKey 创建** (3 个文件):
- `frontend/web/src/resume/ResumeEdit.jsx`
- `frontend/web/src/resume/ResumeBrowse.jsx`
- `frontend/web/src/resume/ResumePreviewPage.jsx`

```javascript
// ✅ 正确: 使用 SessionKey.create() 并签名
const { SessionKey } = await import('@mysten/seal');
const { getSuiClient } = await import('../utils/sealClient');
const { SEAL_CONFIG } = await import('../config/seal.config');

const suiClient = getSuiClient();

// 1. 创建 SessionKey
const sessionKey = await SessionKey.create({
  address: currentAccount.address,
  packageId: SEAL_CONFIG.packageId,
  ttlMin: 60, // 60 分钟有效期
  suiClient,
});

// 2. 获取待签名消息并签名
const personalMessage = sessionKey.getPersonalMessage();

const result = await signPersonalMessage({
  message: personalMessage,
});

await sessionKey.setPersonalMessageSignature(result.signature);

// 3. 然后用 SessionKey 解密
const decrypted = await downloadAndDecryptResume(
  blobId,
  sessionKey,
  policyObjectId
);
```

**关键改变:**
1. 使用 `SessionKey.create()` 而不是 `fromSigner()`
2. 需要调用 `signPersonalMessage()` 让用户在钱包中签名
3. 签名后调用 `sessionKey.setPersonalMessageSignature()`
4. SessionKey 有 60 分钟有效期,可以缓存复用

---

## 📋 完整数据流程

### Seal 加密创建流程

```
前端 (ResumeCreate.jsx)
  ↓
createResumeWithSeal(resumeData, policyObjectId)
  ↓
1. encryptAndUploadResume() → { blobId, encryptionId }
  ↓
2. POST /api/resumes/create
   {
     blob_id: blobId,
     encryption_id: encryptionId,
     policy_object_id: policyObjectId,
     encryption_type: 'seal',
     ...resumeData
   }
  ↓
后端 Controller
  ↓
Service.create_resume()
  ↓
DAO.create()
  ↓
数据库插入:
  - blob_id: "6X6Qek..."
  - encryption_id: "af814c..."
  - policy_object_id: "0xaf814c..."
  - encryption_type: "seal"
```

### Seal 解密流程

```
前端 (ResumeEdit.jsx / ResumeBrowse.jsx)
  ↓
GET /api/resumes/detail/:id/:owner
  ↓
后端返回:
  {
    blob_id: "6X6Qek...",
    encryption_id: "af814c...",
    policy_object_id: "0xaf814c...",
    encryption_type: "seal"
  }
  ↓
前端检测 encryption_type === 'seal'
  ↓
1. SessionKey.fromSigner(address) - 本地创建
  ↓
2. downloadAndDecryptResume(blobId, sessionKey, policyObjectId)
   ├─ downloadFromWalrus(blobId)
   ├─ sealClient.fetchKeys() - 从密钥服务器获取
   └─ sealClient.decrypt() - 解密
  ↓
3. 显示简历内容
```

---

## 🎯 关键修复点总结

### Backend (Rust)

| 文件 | 修复内容 |
|------|---------|
| `models/resume.rs` | 添加 Seal 字段到 `CreateResumeRequest` 和 `Resume` |
| `dao/resume_dao.rs` | 从 `resume_data` 读取 `encryption_type`,设置 Seal 字段 |
| `services/resume_service.rs` | `get_resume_detail` 返回 Seal 字段 |
| `controllers/resume_controller.rs` | 支持 `blob_id`,向后兼容 `ipfs_cid` |

### Frontend (JavaScript)

| 文件 | 修复内容 |
|------|---------|
| `services/resume.service.js` | 发送 `blob_id` 和 `encryption_type` |
| `resume/ResumeEdit.jsx` | 修复 SessionKey 创建,使用正确的解密参数 |
| `resume/ResumeBrowse.jsx` | 同上 |
| `resume/ResumePreviewPage.jsx` | 同上 |

---

## ✅ 验证清单

### 后端
- [x] 编译成功 (`cargo build`)
- [x] 服务器启动成功 (`cargo run`)
- [x] API 接收 Seal 字段
- [x] 数据库正确保存 `encryption_type: seal`
- [x] API 返回包含 `encryption_type` 和 `policy_object_id`

### 前端
- [ ] 创建 Seal 加密简历
- [ ] 数据库记录正确
- [ ] 编辑 Seal 加密简历
- [ ] 浏览 Seal 加密简历
- [ ] 解密成功

---

## 🚀 下一步

### 立即测试
1. 重启后端服务器
2. 创建新的 Seal 加密简历
3. 检查数据库记录
4. 测试编辑和浏览功能

### 可选优化
1. 添加数据库迁移脚本 (`002_add_seal_fields.sql`)
2. 清理旧的 `ipfs_cid` 字段引用
3. 添加更详细的错误处理
4. 完善日志记录

---

## 📚 相关文档

- [Seal 官方文档](https://docs.walrus.site/walrus-sites/seal.html)
- [SessionKey API](https://sdk.mystenlabs.com/seal)
- [后端修改指南](./SEAL_BACKEND_CHANGES.md)
- [解密指南](./DECRYPTION_GUIDE.md)
- [Allowlist 使用指南](./ALLOWLIST_GUIDE.md)
