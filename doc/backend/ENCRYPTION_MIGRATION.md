# 后端加密方案变更说明

## 变更概述

从 **后端加密** 改为 **前端加密** 方案。

### 变更前（后端加密）

```rust
// 后端负责加密
create_resume(db, request) -> {
    生成加密密钥
    ↓
    加密简历数据
    ↓
    上传到 Irys
    ↓
    存储 CID + 密钥
}
```

### 变更后（前端加密）

```rust
// 后端只存储 CID
create_resume(db, request, ipfs_cid) -> {
    验证 CID
    ↓
    存储 CID（密钥为空）
}
```

## 代码变更

### 1. ResumeService 简化

**文件**: `src/services/resume_service.rs`

#### `create_resume` 方法

```rust
// 新增参数：ipfs_cid (前端上传后的 CID)
pub async fn create_resume(
    db: &DatabaseConnection,
    request: CreateResumeRequest,
    ipfs_cid: String,  // 新增
) -> Result<String, String>

// 不再执行：
// ❌ 生成加密密钥
// ❌ 加密数据
// ❌ 上传到 Irys
```

#### `unlock_resume` 方法

```rust
// 返回 CID 给前端，不再下载和解密
pub async fn unlock_resume(
    db: &DatabaseConnection,
    resume_id: &str,
    buyer_wallet: &str,
) -> Result<UnlockResponse, String>

// 不再执行：
// ❌ 从 Irys 下载
// ❌ 解密数据
// ✅ 返回 ipfs_cid 字段
```

### 2. 数据模型更新

**文件**: `src/models/resume.rs`

```rust
// CreateResumeRequest 新增字段
pub struct CreateResumeRequest {
    pub ipfs_cid: Option<String>,  // 新增：前端上传的 CID
    // ... 其他字段
}

// UnlockResponse 新增字段
pub struct UnlockResponse {
    pub ipfs_cid: Option<String>,  // 新增：返回 CID 给前端
    // ... 其他字段
}
```

### 3. Controller 更新

**文件**: `src/controllers/resume_controller.rs`

```rust
pub async fn create(
    req: web::Json<CreateResumeRequest>,
    db: web::Data<DatabaseConnection>,
) -> impl Responder {
    // 验证 ipfs_cid 是否提供
    let ipfs_cid = match request.ipfs_cid.as_ref() {
        Some(cid) if !cid.is_empty() => cid.clone(),
        _ => return error_response()
    };
    
    // 调用 Service
    ResumeService::create_resume(&db, request, ipfs_cid).await
}
```

## 依赖移除

以下依赖不再必需（但保留用于其他功能）：

```toml
# Cargo.toml - 不再必需但保留
aes-gcm = "0.10"      # 加密库（前端使用 Web Crypto API）
reqwest = { ... }      # HTTP 客户端（不再上传到 Irys）
solana-sdk = "3.0"    # Solana SDK（不再需要钱包签名）
```

## 环境变量

以下配置不再使用：

```env
# .env - 不再需要
IRYS_NODE_URL=https://devnet.irys.xyz
SOLANA_WALLET_PATH=/path/to/wallet.json
```

## API 接口变更

### 创建简历

**请求示例**：

```bash
POST /api/resumes
Content-Type: application/json

{
  "owner": "CjisaxtyK4n43PBhCATyydWQU93ruN1KJTRkcEhkGVyR",
  "ipfs_cid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",  # 必需
  "personal": {
    "name": "张三",
    ...
  },
  ...
}
```

**响应示例**：

```json
{
  "success": true,
  "data": "resume-550e8400-e29b-41d4-a716-446655440000",
  "message": "Resume created successfully"
}
```

**错误响应**（未提供 CID）：

```json
{
  "success": false,
  "error": "IPFS CID is required. Please encrypt and upload the resume on frontend first."
}
```

### 解锁简历

**请求示例**：

```bash
POST /api/resumes/unlock
Content-Type: application/json

{
  "resume_id": "resume-550e8400-e29b-41d4-a716-446655440000",
  "buyer_wallet": "BuyerWalletAddress..."
}
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "success": true,
    "ipfs_cid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    "message": "Resume unlocked. Please download from IPFS using the CID and decrypt with your key.",
    "resume": null,
    "decryption_key": null
  }
}
```

## 数据库影响

### `resumes` 表

- `ipfs_cid` 字段：存储前端上传的 CID
- `encryption_key` 字段：设为空字符串（前端管理密钥）

```sql
-- 示例数据
INSERT INTO resumes VALUES (
  'resume-xxx',
  'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',  -- CID
  '',  -- encryption_key 为空
  ...
);
```

## 测试

### 编译检查

```bash
cd backend/rust_backend
cargo check
```

预期：✅ 编译通过（会有一些未使用的导入警告）

### 清理未使用的代码

可以移除以下文件（如果不再需要）：

- `src/utils/crypto.rs` - 加密工具（已改为前端实现）
- `src/utils/irys_client.rs` - Irys 客户端（已改为前端上传）
- `src/encryption_test.rs` - 加密测试（已不适用）

## 迁移建议

### 现有数据迁移

如果已有加密数据，需要：

1. 下载现有 Irys 数据
2. 使用后端密钥解密
3. 在前端重新加密
4. 上传到 IPFS
5. 更新数据库 CID

### 向后兼容

可以保留后端加密逻辑作为降级方案：

```rust
pub async fn create_resume(
    db: &DatabaseConnection,
    request: CreateResumeRequest,
    ipfs_cid: Option<String>,  // 可选
) -> Result<String, String> {
    match ipfs_cid {
        Some(cid) => {
            // 前端加密模式
            save_cid_only(db, request, cid).await
        }
        None => {
            // 后端加密模式（降级）
            encrypt_and_upload(db, request).await
        }
    }
}
```

## 优势对比

| 特性 | 后端加密 | 前端加密 |
|------|---------|---------|
| **安全性** | 后端可访问明文 | 端到端加密 ✅ |
| **隐私** | 依赖后端可信度 | 零知识证明 ✅ |
| **复杂度** | 后端复杂 | 前端复杂 |
| **密钥管理** | 后端存储 | 用户自行保管 ⚠️ |
| **性能** | 后端处理慢 | 前端并行 ✅ |
| **可扩展性** | 后端负载重 | 后端轻量 ✅ |

## 相关文档

- 前端实现：`frontend/web/ENCRYPTION_README.md`
- 示例代码：`frontend/web/src/services/resumeEncryption.js`
- API 文档：待补充
