# 🚀 ResumeVault Backend 快速启动指南

## 📋 前置条件

1. **安装 Rust**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

2. **安装 MySQL**
```bash
# macOS
brew install mysql
brew services start mysql

# Ubuntu/Debian
sudo apt-get install mysql-server
sudo systemctl start mysql
```

3. **设置 MySQL root 密码**
```bash
mysql_secure_installation
```

## 🔧 配置步骤

### 1. 克隆项目并进入目录

```bash
cd backend/rust_backend
```

### 2. 配置环境变量

```bash
# 复制配置文件
cp .env.example .env

# 编辑配置（重要！）
nano .env
```

修改以下内容：
```env
# 修改为你的 MySQL 密码
DATABASE_URL=mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/resume_vault

# 修改为你的 Solana 钱包地址
ADDRESS=YOUR_SOLANA_WALLET_ADDRESS

# 其他配置保持默认即可
```

### 3. 初始化数据库

```bash
# 运行初始化脚本
./init_db.sh

# 如果脚本无法执行，手动运行：
mysql -u root -p < migrations/001_init_schema.sql
```

成功后会看到：
```
✅ 数据库初始化完成！

📋 创建的表:
  - users (用户表)
  - resumes (简历表)
  - unlock_records (解锁记录表)
```

### 4. 安装依赖并运行

```bash
# 构建项目
cargo build

# 运行服务器
cargo run
```

## ✅ 验证运行

成功启动后，你会看到：

```
=== ResumeVault x402 Payment-Protected Server ===

🔗 初始化数据库连接...
📊 数据库配置:
  主机: localhost
  端口: 3306
✅ 数据库连接成功
✅ 数据库连接测试通过

Configuration:
  Facilitator URL: https://facilitator.x402.org
  Pay to address: YOUR_WALLET_ADDRESS
  Network: SolanaDevnet

Starting payment-protected server at http://127.0.0.1:4021

Available endpoints:
  POST /api/resumes                    - Create resume (Free)
  GET  /api/resumes/summaries          - Get all resume summaries (Free)
  POST /api/resumes/unlock             - Unlock resume (💰 0.05 SOL)
```

## 🧪 测试 API

### 创建简历

```bash
curl -X POST http://localhost:4021/api/resumes \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "YOUR_WALLET_ADDRESS",
    "personal": {
      "name": "张三",
      "gender": "male",
      "phone": "13800138000",
      "email": "zhangsan@example.com"
    },
    "skills": "React, Solana, Rust, TypeScript",
    "desired_position": {
      "position": "区块链开发工程师",
      "city": "上海"
    }
  }'
```

### 查看所有简历

```bash
curl http://localhost:4021/api/resumes/summaries
```

### 查询我的简历

```bash
curl http://localhost:4021/api/resumes/my/YOUR_WALLET_ADDRESS
```

## 🐛 常见问题

### 问题 1: 数据库连接失败

```
Error: Failed to connect to database
```

**解决方案：**
1. 检查 MySQL 是否运行：`brew services list` (macOS) 或 `systemctl status mysql` (Linux)
2. 验证 .env 中的 DATABASE_URL 配置
3. 测试连接：`mysql -u root -p -e "SELECT 1;"`

### 问题 2: 编译错误

```
error: could not compile `rust_backend`
```

**解决方案：**
```bash
# 清理并重新构建
cargo clean
cargo build

# 如果还有问题，更新依赖
cargo update
```

### 问题 3: 端口已被占用

```
Error: Address already in use
```

**解决方案：**
修改 .env 中的 PORT 配置：
```env
PORT=8080  # 改为其他端口
```

## 📚 下一步

- 📖 阅读 [README_DB.md](./README_DB.md) 了解数据库详情
- 🔍 查看 [API 文档](#) 了解所有接口
- 🧪 运行测试：`cargo test`
- 📊 查看数据库：`mysql -u root -p resume_vault`

## 💡 开发提示

```bash
# 查看数据库表
mysql -u root -p resume_vault -e "SHOW TABLES;"

# 查看简历数据
mysql -u root -p resume_vault -e "SELECT * FROM resumes;"

# 启用 SQL 日志
RUST_LOG=sea_orm=debug cargo run

# 监听文件变化自动重启 (需要安装 cargo-watch)
cargo install cargo-watch
cargo watch -x run
```

## 🎉 完成！

现在您的 ResumeVault 后端已经成功运行，可以开始开发前端或测试 API 了！
