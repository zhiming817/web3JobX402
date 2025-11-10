# ResumeVault Backend - 分层架构

## 📁 项目结构

```
src/
├── main.rs                 # 应用入口，服务器启动
├── controllers/            # 控制层 - 处理 HTTP 请求
│   ├── mod.rs
│   ├── example_controller.rs    # 示例控制器（天气、高级内容）
│   └── resume_controller.rs     # 简历控制器
├── services/               # 服务层 - 业务逻辑
│   ├── mod.rs
│   ├── resume_service.rs        # 简历业务逻辑
│   └── payment_service.rs       # x402 支付逻辑
├── dao/                    # 数据访问层 - 数据库操作
│   ├── mod.rs
│   └── resume_dao.rs            # 简历数据访问
├── models/                 # 数据模型
│   ├── mod.rs
│   ├── config.rs               # 配置模型
│   ├── resume.rs               # 简历模型
│   └── response.rs             # 响应模型
├── routes/                 # 路由配置
│   └── mod.rs
├── utils/                  # 工具函数
│   ├── mod.rs
│   ├── config.rs               # 配置工具
│   ├── crypto.rs               # 加密工具
│   └── validator.rs            # 验证工具
└── server_example.rs      # 原始示例（保留参考）
```

## 🎯 分层职责

### 1. Controllers（控制层）
- **职责**: 处理 HTTP 请求和响应
- **不应该**: 包含业务逻辑或数据库操作
- **示例**:
  - `ResumeController::create()` - 接收创建简历请求
  - `ResumeController::unlock()` - 处理解锁请求

### 2. Services（服务层）
- **职责**: 实现业务逻辑
- **不应该**: 直接访问数据库（通过 DAO）
- **示例**:
  - `ResumeService::create_resume()` - 创建简历业务逻辑
  - `PaymentService::verify_and_settle_payment()` - 支付验证和结算

### 3. DAO（数据访问层）
- **职责**: 数据库 CRUD 操作
- **不应该**: 包含业务逻辑
- **示例**:
  - `ResumeDao::create()` - 插入简历到数据库
  - `ResumeDao::get_by_id()` - 根据 ID 查询简历

### 4. Models（模型层）
- **职责**: 定义数据结构
- **类型**:
  - 实体模型（Resume, PersonalInfo）
  - 请求模型（CreateResumeRequest）
  - 响应模型（ApiResponse, UnlockResponse）

### 5. Routes（路由层）
- **职责**: 配置 URL 路径与控制器的映射
- **示例**:
  ```rust
  .route("/unlock", web::post().to(ResumeController::unlock))
  ```

### 6. Utils（工具层）
- **职责**: 提供可复用的工具函数
- **示例**:
  - `ConfigUtil::load_env_config()` - 加载环境配置
  - `CryptoUtil::mask_name()` - 姓名脱敏

## 🚀 运行项目

### 1. 配置环境变量

创建 `.env_server` 文件:

```bash
FACILITATOR_URL=https://facilitator.x402.org
ADDRESS=your_solana_wallet_address
NETWORK=solana-devnet
TOKEN_MINT_ADDRESS=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
TOKEN_DECIMALS=6
TOKEN_NAME=USDC
HOST=127.0.0.1
PORT=4021
```

### 2. 安装依赖

```bash
cargo add actix-web serde serde_json dotenv tokio
cargo add x402-sdk-solana-rust
cargo add uuid chrono sha2 base64 rand regex
```

### 3. 运行服务器

```bash
cargo run
```

## 📡 API 端点

### 免费端点

```bash
# 创建简历
POST /api/resumes
Content-Type: application/json
{
  "owner": "wallet_address",
  "personal": {...},
  "skills": "...",
  ...
}

# 获取简历摘要列表
GET /api/resumes/summaries

# 获取我的简历
GET /api/resumes/my/{wallet_address}
```

### 付费端点（需要 x402 支付）

```bash
# 解锁简历（需要支付 0.05 SOL）
POST /api/resumes/unlock
X-PAYMENT: <signed_transaction>
Content-Type: application/json
{
  "resume_id": "resume-xxx",
  "buyer_wallet": "wallet_address"
}
```

## 🔧 扩展性

### 添加新功能

1. **添加新模型**: `models/your_model.rs`
2. **添加 DAO**: `dao/your_dao.rs`
3. **添加服务**: `services/your_service.rs`
4. **添加控制器**: `controllers/your_controller.rs`
5. **配置路由**: `routes/mod.rs`

### 示例：添加评论功能

```rust
// 1. models/comment.rs
pub struct Comment {
    pub id: String,
    pub resume_id: String,
    pub author: String,
    pub content: String,
}

// 2. dao/comment_dao.rs
impl CommentDao {
    pub fn create(&self, comment: Comment) -> Result<Comment, String> {...}
}

// 3. services/comment_service.rs
impl CommentService {
    pub async fn add_comment(&self, comment: Comment) -> Result<Comment, String> {...}
}

// 4. controllers/comment_controller.rs
impl CommentController {
    pub async fn create(req: web::Json<Comment>) -> impl Responder {...}
}

// 5. routes/mod.rs
.route("/resumes/{id}/comments", web::post().to(CommentController::create))
```

## 🎓 最佳实践

1. ✅ **单一职责**: 每个模块只做一件事
2. ✅ **依赖注入**: 通过构造函数传递依赖
3. ✅ **错误处理**: 使用 Result 类型
4. ✅ **异步操作**: 使用 async/await
5. ✅ **类型安全**: 充分利用 Rust 类型系统
6. ✅ **测试**: 为每层编写单元测试

## 🔐 安全性

- x402 支付验证
- Solana 钱包签名验证
- 简历数据加密存储
- 敏感信息脱敏

## 📊 数据流

```
HTTP Request
    ↓
[Routes] - 路由分发
    ↓
[Controllers] - 解析请求，调用服务
    ↓
[Services] - 业务逻辑处理
    ↓
[DAO] - 数据库操作
    ↓
[Database] - 数据持久化
```

## 🛠️ 开发工具

```bash
# 格式化代码
cargo fmt

# 检查代码
cargo clippy

# 运行测试
cargo test

# 开发模式（自动重载）
cargo watch -x run
```
