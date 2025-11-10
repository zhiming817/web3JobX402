# 数据库迁移状态报告

## 问题总结

由于 `x402-sdk-solana-rust` 的依赖限制，**所有主流 Rust ORM/数据库框架**都与项目存在不兼容问题。

## 依赖冲突详情

### 根本原因

`x402-sdk-solana-rust 0.1.3` 依赖：
```
x402-sdk → solana-client ^1.18 → curve25519-dalek 3.2.1 → zeroize <1.4
```

### 尝试的ORM框架及失败原因

#### 1. SeaORM 1.1 ❌
```
sea-orm 1.1 → sqlx 0.8.2 → rsa 0.9 → zeroize ^1.5
```
- **冲突**: zeroize <1.4 vs ^1.5
- **结果**: 无法编译

#### 2. SeaORM 0.12 ❌
```
sea-orm 0.12 → sqlx 0.7.x → rsa → zeroize ^1.5
```
- **冲突**: 同样的 zeroize 版本冲突
- **结果**: 无法编译

#### 3. SQLx 0.7 ❌
```
sqlx 0.7 → rsa 0.9 → zeroize ^1.5
```
- **冲突**: zeroize <1.4 vs ^1.5
- **结果**: 无法编译

#### 4. SQLx 0.6 ❌
```
sqlx 0.6 → 内部版本冲突
```
- **问题**: sqlx-core 版本不匹配
- **结果**: 无法编译

#### 5. SQLx 0.5 ❌
```
sqlx 0.5 编译但存在多个问题：
- serde_json::Value 不支持 Encode/Decode traits
- API 变更: acquire_timeout → idle_timeout
- 需要额外的依赖 (rand, sha2, base64, regex)
```
- **问题**: JSON字段不支持 + API不兼容
- **结果**: 需要大量代码重写

#### 6. Diesel 2.x ❌
```
diesel 2.x → mysqlclient-sys → 需要系统级 MySQL 客户端库
```
- **问题**: 需要安装 libmysqlclient (macOS 上不存在)
- **结果**: 无法编译

## 技术根源

所有现代 Rust 加密库（包括 rsa, ed25519 等）都依赖 `zeroize ^1.5`，而 Solana 1.18 生态系统锁定在旧版本 `curve25519-dalek 3.2.1`，该版本依赖 `zeroize <1.4`。

这是一个**生态系统级别的不兼容问题**，无法通过简单的版本选择解决。

## 解决方案对比

### 方案 1: 等待上游更新 ⏳
**优点**:
- 最终会有完整的 ORM 支持
- 符合最佳实践

**缺点**:
- 等待时间未知（可能数月）
- 需要 Solana 生态更新 curve25519-dalek
- 项目进度被阻塞

### 方案 2: 使用文件存储（JSON） ✅ 推荐
**优点**:
- ✅ 立即可用，无依赖冲突
- ✅ 开发简单，调试方便
- ✅ 适合 MVP 和原型阶段
- ✅ 易于迁移到数据库

**缺点**:
- 不适合高并发场景
- 缺少事务支持
- 不适合生产环境大规模使用

**实现**:
```rust
// 简历存储结构
data/
  resumes/
    {resume_id}.json
  users/
    {wallet_address}.json
  unlocks/
    {unlock_record_id}.json
```

### 方案 3: Fork x402-sdk 并更新依赖 🔧
**优点**:
- 可以使用现代 ORM
- 完全控制依赖链

**缺点**:
- 维护负担重
- 与上游 x402-sdk 不同步
- 可能破坏 Solana 兼容性

### 方案 4: 使用直接 MySQL 连接（无 ORM） 🔨
**优点**:
- 可以选择非常旧的 MySQL 驱动
- 避开 ORM 依赖

**缺点**:
- 失去类型安全
- 手写 SQL，开发效率低
- 仍可能有 zeroize 冲突

## 推荐方案：文件存储

对于 ResumeVault MVP 阶段，**强烈推荐使用方案2（文件存储）**，原因：

1. **快速开发**: 专注于业务逻辑和 x402 支付集成
2. **零依赖冲突**: 不依赖任何数据库驱动
3. **易于测试**: 直接查看文件内容，无需数据库工具
4. **完美过渡**: 后续可通过数据导入脚本迁移到数据库

### 实现计划

```rust
// src/storage/file_storage.rs
pub struct FileStorage {
    base_path: PathBuf,
}

impl FileStorage {
    pub fn new(base_path: impl AsRef<Path>) -> Self {
        // 初始化文件存储
    }
    
    pub async fn save_resume(&self, resume: &Resume) -> Result<()> {
        // 保存简历到 {base_path}/resumes/{resume_id}.json
    }
    
    pub async fn load_resume(&self, resume_id: &str) -> Result<Option<Resume>> {
        // 从文件加载简历
    }
    
    pub async fn list_resumes(&self, owner_wallet: &str) -> Result<Vec<Resume>> {
        // 列出用户的所有简历
    }
}
```

### 数据结构

```json
// data/resumes/uuid-xxx.json
{
  "id": "uuid-xxx",
  "owner_wallet": "EPjFWdd5...",
  "ipfs_cid": "Qm...",
  "encryption_key": "base64...",
  "summary": {
    "name": "张三",
    "desired_position": "Rust 开发工程师",
    "skills": "Rust, Actix-Web, Solana"
  },
  "price": 50000,
  "view_count": 10,
  "unlock_count": 3,
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

## 后续数据库迁移路径

当 Solana 生态升级或项目需要数据库时：

1. **编写数据导入脚本**: `scripts/import_from_files.rs`
2. **读取所有 JSON 文件**: 扫描 `data/` 目录
3. **批量插入数据库**: 使用当时兼容的 ORM
4. **验证数据完整性**: 比对文件和数据库数据
5. **切换存储层**: 替换 `FileStorage` 为 `DbStorage`

## 结论

**建议立即采用文件存储方案**，将精力集中在：
- ✅ x402 支付流程集成
- ✅ Irys 加密存储
- ✅ 前端业务功能完善
- ✅ 用户体验优化

数据库集成可作为**后续优化任务**，在 Solana 生态更新或项目进入生产阶段时再处理。

---

**状态**: 数据库集成暂时搁置，切换至文件存储方案  
**更新时间**: 2025-01-20  
**下一步**: 实现 FileStorage 模块
