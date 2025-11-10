#!/bin/bash

# 测试脚本 - ResumeVault API

BASE_URL="http://127.0.0.1:4021"

echo "======================================"
echo "ResumeVault API 测试脚本"
echo "======================================"
echo ""

# 1. 创建简历
echo "1️⃣  测试创建简历..."
echo ""

curl -X POST "${BASE_URL}/api/resumes" \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "personal": {
      "name": "张三",
      "gender": "男",
      "birth_date": "1995-06-15",
      "work_start_date": "2018-07-01",
      "job_status": "在职-考虑机会",
      "phone": "13800138000",
      "wechat": "zhangsan_wx",
      "email": "zhangsan@example.com"
    },
    "skills": "Rust, Solana, Web3, Smart Contract, TypeScript, React, PostgreSQL, Redis",
    "desired_position": {
      "job_type": "全职",
      "position": "Rust 区块链工程师",
      "industry": "区块链/Web3",
      "salary_min": 30000,
      "salary_max": 50000,
      "city": "上海",
      "other_cities": ["北京", "深圳", "杭州"]
    },
    "work_experience": [
      {
        "company": "某Web3公司",
        "position": "高级区块链工程师",
        "start_date": "2021-03",
        "end_date": null,
        "description": "负责 Solana 智能合约开发，参与 DeFi 协议设计和实现"
      },
      {
        "company": "某互联网公司",
        "position": "后端工程师",
        "start_date": "2018-07",
        "end_date": "2021-02",
        "description": "负责微服务架构设计，使用 Rust 开发高性能服务"
      }
    ],
    "project_experience": [
      {
        "name": "去中心化交易所",
        "role": "核心开发",
        "start_date": "2022-01",
        "end_date": "2023-06",
        "link": "https://github.com/example/dex",
        "description": "使用 Anchor 框架开发 Solana DEX，支持 AMM 和订单簿模式"
      },
      {
        "name": "NFT 市场平台",
        "role": "技术负责人",
        "start_date": "2021-06",
        "end_date": "2021-12",
        "link": "https://github.com/example/nft-marketplace",
        "description": "实现 NFT 铸造、交易、拍卖等功能，集成 Metaplex 协议"
      }
    ],
    "education": [
      {
        "school": "某985大学",
        "major": "计算机科学与技术",
        "degree": "本科",
        "education_type": "统招",
        "start_date": "2014-09",
        "end_date": "2018-06",
        "thesis": "基于区块链的分布式存储系统研究"
      }
    ],
    "certificates": [
      {
        "name": "Solana Developer认证",
        "issuer": "Solana Foundation",
        "number": "SOL-DEV-2023-001",
        "issue_date": "2023-03-15",
        "expiry_date": null,
        "no_expiry": true
      },
      {
        "name": "AWS Solution Architect",
        "issuer": "Amazon Web Services",
        "number": "AWS-SA-2022-999",
        "issue_date": "2022-08-20",
        "expiry_date": "2025-08-20",
        "no_expiry": false
      }
    ]
  }' | jq .

echo ""
echo "======================================"
echo ""

# 2. 获取简历摘要列表
echo "2️⃣  测试获取简历摘要列表..."
echo ""

curl -X GET "${BASE_URL}/api/resumes/summaries" | jq .

echo ""
echo "======================================"
echo ""

# 3. 获取我的简历列表
echo "3️⃣  测试获取我的简历列表..."
echo ""

curl -X GET "${BASE_URL}/api/resumes/my/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" | jq .

echo ""
echo "======================================"
echo "测试完成！"
echo "======================================"
