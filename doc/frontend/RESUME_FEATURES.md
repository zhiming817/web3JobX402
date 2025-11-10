# ResumeVault - Web3 去中心化简历平台

## 🎯 项目简介

ResumeVault 是一个基于 Solana 区块链和 x402 支付协议的 Web3 去中心化简历平台。求职者可以上传加密简历，猎头/企业需要通过 x402 微支付才能解锁完整简历信息。

## ✨ 核心功能

### 1. 创建简历 (`/resume/create`)
- ✅ 个人信息编辑（姓名、性别、出生年月、联系方式等）
- ✅ 个人优势/技能描述
- ✅ 期望职位设置（职位、薪资、城市等）
- 🚧 工作经历
- 🚧 项目经历
- 🚧 教育经历
- 🚧 资格证书
- ✅ 实时预览功能
- 🚧 导出 PDF 功能

### 2. 我的简历 (`/resumes`)
- ✅ 简历列表展示
- ✅ 数据统计（总浏览量、解锁数、收益等）
- ✅ 编辑/删除简历
- ✅ 设置解锁价格
- ✅ 简历预览

### 3. 浏览简历 (`/resumes/browse`)
- ✅ 简历卡片展示（匿名）
- ✅ 筛选功能（关键词、城市、经验等）
- ✅ 技能标签展示
- ✅ x402 支付解锁功能（开发中）
- ✅ 解锁后查看完整信息

### 4. 模板库 (`/templates`)
- 🚧 简历模板选择
- 🚧 自定义模板样式

## 🚀 技术栈

### 前端
- **React 18** - UI 框架
- **React Router** - 路由管理
- **Tailwind CSS** - 样式框架
- **Vite** - 构建工具

### Web3
- **@solana/wallet-adapter-react** - Solana 钱包连接
- **@solana/web3.js** - Solana 区块链交互
- **x402** - 微支付协议（待集成）

### 区块链功能
- 🚧 IPFS/Arweave - 简历加密存储
- 🚧 x402 Payment - 微支付解锁
- 🚧 AI Agent - 技能提取和匹配

## 📁 项目结构

```
frontend/web/src/
├── resume/
│   ├── Home.jsx              # 首页
│   ├── ResumeCreate.jsx      # 创建/编辑简历
│   ├── ResumeList.jsx        # 我的简历列表
│   └── ResumeBrowse.jsx      # 浏览简历（猎头视角）
├── layout/
│   ├── Navbar.jsx            # 导航栏
│   ├── Footer.jsx            # 页脚
│   └── PageLayout.jsx        # 页面布局容器
├── components/               # 公共组件
├── App.jsx                   # 主应用组件
└── main.jsx                  # 应用入口
```

## 🎨 UI 设计特点

- **渐变色主题**: 橙色到红色的渐变 (from-orange-500 to-red-600)
- **玻璃态效果**: 使用 backdrop-blur 和半透明背景
- **响应式设计**: 支持移动端和桌面端
- **动画效果**: hover 和 transition 增强交互体验

## 🔐 隐私保护

1. **匿名展示**: 浏览时只显示部分信息（姓氏首字母、技能摘要）
2. **付费解锁**: 使用 x402 支付才能查看完整简历
3. **加密存储**: 简历数据加密后存储在 IPFS
4. **钱包认证**: 通过 Solana 钱包进行身份验证

## 💰 收益机制

- 求职者设置简历解锁价格（如 0.01 SOL）
- 猎头/企业通过 x402 支付解锁费用
- 支付直接转账到求职者钱包
- 平台可抽取小额手续费

## 🛠️ 本地开发

```bash
# 安装依赖
cd frontend/web
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 📝 待开发功能

### 高优先级
- [ ] x402 支付集成
- [ ] IPFS 简历存储
- [ ] 工作经历/项目经历编辑
- [ ] PDF 导出功能

### 中优先级
- [ ] AI 技能提取
- [ ] 简历模板系统
- [ ] 搜索和推荐算法
- [ ] 消息通知系统

### 低优先级
- [ ] NFT 简历凭证
- [ ] ZK 学历验证
- [ ] 数据分析面板
- [ ] 移动端 App

## 🎯 赛道匹配

| Hackathon Track | 实现情况 |
|---|---|
| **Best x402 API Integration** | 🟡 开发中 - 已设计支付流程 |
| **Best x402 Agent Application** | 🟡 规划中 - AI 简历分析 |
| **Best Trustless Agent** | 🟡 规划中 - 去信任化权限系统 |

## 📄 License

MIT License

## 👥 团队

ResumeVault Team - Solana Hackathon 2024
