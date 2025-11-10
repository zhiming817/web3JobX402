# ResumeVault Backend - SeaORM + MySQL 集成

基于 Rust + Actix-Web + SeaORM + MySQL 的简历管理系统后端。

## 🏗️ 技术栈

- **Web 框架**: Actix-Web 4.x
- **ORM**: SeaORM 1.x
- **数据库**: MySQL 8.0+
- **支付**: x402 Protocol (Solana)
- **加密**: AES-256-GCM

## 📁 项目结构

```
backend/rust_backend/
├── src/
│   ├── main.rs              # 应用入口
│   ├── controllers/         # 控制器层
│   │   ├── mod.rs
│   │   ├── resume_controller.rs
│   │   └── payment_controller.rs
│   ├── services/            # 业务逻辑层
│   │   ├── mod.rs
│   │   ├── resume_service.rs
│   │   └── payment_service.rs
│   ├── dao/                 # 数据访问层
│   │   ├── mod.rs
│   │   └── resume_dao.rs
│   ├── entities/            # SeaORM 实体
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   ├── resume.rs
│   │   └── unlock_record.rs
│   ├── models/              # 数据模型
│   │   └── mod.rs
│   ├── routes/              # 路由配置
│   │   └── mod.rs
│   └── utils/               # 工具类
│       ├── mod.rs
│       ├── config.rs
│       ├── crypto.rs
│       ├── validator.rs
│       └── database.rs
├── migrations/              # 数据库迁移
│   └── 001_init_schema.sql
├── Cargo.toml
├── .env.example
├── init_db.sh              # 数据库初始化脚本
└── README_DB.md            # 本文档
```

## 🚀 快速开始

### 1. 安装 MySQL

```bash
# macOS
brew install mysql
brew services start mysql

# Ubuntu/Debian
sudo apt-get install mysql-server
sudo systemctl start mysql

# 设置 root 密码
mysql_secure_installation
```

### 2. 配置环境变量

```bash
cd backend/rust_backend

# 复制配置文件
cp .env.example .env

# 编辑配置
vim .env
```

配置示例：
```env
DATABASE_URL=mysql://root:your_password@localhost:3306/resume_vault
FACILITATOR_URL=https://facilitator.x402.org
ADDRESS=your_solana_wallet_address
NETWORK=solana-devnet
HOST=127.0.0.1
PORT=4021
```

### 3. 初始化数据库

```bash
# 运行初始化脚本
./init_db.sh

# 或手动执行
mysql -u root -p < migrations/001_init_schema.sql
```

### 4. 安装依赖并运行

```bash
# 安装依赖
cargo build

# 运行开发服务器
cargo run

# 或运行特定 binary
cargo run --bin rust_backend
```

## 📊 数据库表结构

### users (用户表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| wallet_address | VARCHAR(44) | Solana 钱包地址 (唯一) |
| nickname | VARCHAR(100) | 用户昵称 |
| user_type | VARCHAR(20) | 用户类型: job_seeker/recruiter |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### resumes (简历表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| resume_id | VARCHAR(64) | 简历唯一ID (唯一) |
| owner_id | BIGINT | 所有者用户ID |
| owner_wallet | VARCHAR(44) | 所有者钱包地址 |
| ipfs_cid | VARCHAR(100) | IPFS/Irys CID |
| encryption_key | TEXT | 加密密钥 |
| summary | JSON | 公开摘要 |
| price | BIGINT | 解锁价格 (lamports) |
| view_count | INT | 浏览次数 |
| unlock_count | INT | 解锁次数 |
| status | VARCHAR(20) | 状态: active/inactive/deleted |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### unlock_records (解锁记录表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT | 主键 |
| resume_id | BIGINT | 简历ID |
| buyer_id | BIGINT | 购买者用户ID |
| buyer_wallet | VARCHAR(44) | 购买者钱包地址 |
| seller_wallet | VARCHAR(44) | 卖家钱包地址 |
| amount | BIGINT | 支付金额 (lamports) |
| transaction_signature | VARCHAR(88) | Solana 交易签名 (唯一) |
| status | VARCHAR(20) | 状态: pending/confirmed/failed |
| block_time | BIGINT | 区块时间戳 |
| created_at | DATETIME | 创建时间 |

## 🔧 SeaORM 使用示例

### 创建简历

```rust
use sea_orm::*;
use crate::dao::ResumeDao;

// 创建简历
let resume_id = ResumeDao::create(&db, resume_data).await?;
```

### 查询简历

```rust
// 根据 resume_id 查询
let resume = ResumeDao::find_by_resume_id(&db, "resume-001").await?;

// 根据所有者查询
let resumes = ResumeDao::find_by_owner(&db, "wallet_address").await?;

// 分页查询
let (resumes, total) = ResumeDao::find_all_active(&db, 1, 10).await?;
```

### 更新简历

```rust
// 增加浏览次数
ResumeDao::increment_view_count(&db, "resume-001").await?;

// 更新简历内容
ResumeDao::update(&db, "resume-001", ipfs_cid, key, summary, price).await?;
```

## 📡 API 端点

### 简历相关

- `POST /api/resumes` - 创建简历
- `GET /api/resumes/:id` - 获取简历详情
- `GET /api/resumes/owner/:wallet` - 获取用户的简历列表
- `PUT /api/resumes/:id` - 更新简历
- `DELETE /api/resumes/:id` - 删除简历
- `GET /api/resumes` - 浏览所有简历 (分页)

### 支付相关

- `POST /api/payment/unlock` - x402 支付解锁简历
- `GET /api/payment/verify/:signature` - 验证支付状态
- `GET /api/payment/history/:wallet` - 获取支付历史

## 🧪 测试

```bash
# 运行所有测试
cargo test

# 运行特定测试
cargo test resume_dao_tests

# 带日志输出
cargo test -- --nocapture
```

## 🔍 数据库查询示例

```sql
-- 查看所有简历
SELECT * FROM resumes WHERE status = 'active';

-- 统计某用户的收益
SELECT 
    owner_wallet,
    COUNT(*) as total_resumes,
    SUM(unlock_count) as total_unlocks,
    SUM(price * unlock_count) / 1000000000.0 as earnings_sol
FROM resumes
WHERE owner_wallet = 'your_wallet_address'
GROUP BY owner_wallet;

-- 查看解锁记录
SELECT 
    ur.*,
    r.resume_id,
    u.nickname as buyer_name
FROM unlock_records ur
JOIN resumes r ON ur.resume_id = r.id
JOIN users u ON ur.buyer_id = u.id
WHERE ur.status = 'confirmed'
ORDER BY ur.created_at DESC
LIMIT 10;
```

## 🛠️ 常用命令

```bash
# 查看数据库连接
cargo run -- --check-db

# 重置数据库
mysql -u root -p -e "DROP DATABASE resume_vault; CREATE DATABASE resume_vault;"
./init_db.sh

# 查看 SQL 日志 (需要在代码中启用)
RUST_LOG=sea_orm=debug cargo run

# 生成新的迁移
# (手动创建 migrations/002_xxx.sql)
```

## 📝 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| DATABASE_URL | MySQL 连接字符串 | mysql://user:pass@localhost:3306/db |
| FACILITATOR_URL | x402 facilitator 地址 | https://facilitator.x402.org |
| ADDRESS | Solana 钱包地址 | 7xKXt...UipQ |
| NETWORK | Solana 网络 | solana-devnet |
| HOST | 服务器地址 | 127.0.0.1 |
| PORT | 服务器端口 | 4021 |
| ENCRYPTION_SALT | 加密盐值 | random_salt_string |

## 🐛 故障排除

### 连接数据库失败

```bash
# 检查 MySQL 服务
brew services list  # macOS
systemctl status mysql  # Linux

# 测试连接
mysql -u root -p -e "SELECT 1;"

# 检查配置
cat .env | grep DATABASE_URL
```

### SeaORM 迁移错误

```bash
# 查看详细错误
RUST_LOG=debug cargo run

# 手动检查表结构
mysql -u root -p resume_vault -e "SHOW TABLES;"
mysql -u root -p resume_vault -e "DESCRIBE resumes;"
```

## 📚 相关文档

- [SeaORM 官方文档](https://www.sea-ql.org/SeaORM/)
- [Actix-Web 文档](https://actix.rs/)
- [x402 Protocol](https://x402.org/)
- [Solana 开发文档](https://docs.solana.com/)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
