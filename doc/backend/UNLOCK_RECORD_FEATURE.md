# 解锁记录功能文档

## 概述

实现了前端支付解锁后调用后端接口添加解锁记录的完整功能。该功能记录用户购买简历的支付信息，便于追踪和管理。

## 功能特点

- ✅ 支付成功后自动创建解锁记录
- ✅ 防止重复记录（通过交易签名去重）
- ✅ 支持查询用户已解锁的简历列表
- ✅ 支持查询简历的所有解锁记录
- ✅ 支持检查特定用户是否已解锁某简历

## 后端实现

### 1. 数据库模型

**表名**: `unlock_records`

**字段**:
- `id` - 主键，自增
- `resume_id` - 简历 ID
- `buyer_id` - 购买者用户 ID
- `buyer_wallet` - 购买者钱包地址
- `seller_wallet` - 卖家钱包地址
- `amount` - 支付金额
- `transaction_signature` - 交易签名（Sui transaction digest）
- `status` - 支付状态（pending/confirmed/failed）
- `block_time` - 区块时间戳
- `created_at` - 创建时间

### 2. API 接口

#### 创建解锁记录
```
POST /api/unlock-records
```

**请求体**:
```json
{
  "resume_id": 123,
  "buyer_id": 456,
  "buyer_wallet": "0x123...",
  "seller_wallet": "0x456...",
  "amount": 1000000,
  "transaction_signature": "abc123...",
  "block_time": 1234567890
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "resume_id": 123,
    "buyer_id": 456,
    "buyer_wallet": "0x123...",
    "seller_wallet": "0x456...",
    "amount": 1000000,
    "transaction_signature": "abc123...",
    "status": "confirmed",
    "block_time": 1234567890,
    "created_at": "2025-01-15 10:30:00"
  },
  "message": "Unlock record created successfully"
}
```

#### 检查解锁状态
```
GET /api/unlock-records/check/{resume_id}/{buyer_id}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "unlocked": true
  }
}
```

#### 获取用户已解锁的简历
```
GET /api/unlock-records/buyer/{buyer_wallet}
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "resume_id": 123,
      "buyer_id": 456,
      "buyer_wallet": "0x123...",
      "seller_wallet": "0x456...",
      "amount": 1000000,
      "transaction_signature": "abc123...",
      "status": "confirmed",
      "block_time": 1234567890,
      "created_at": "2025-01-15 10:30:00"
    }
  ]
}
```

#### 获取简历的解锁记录
```
GET /api/unlock-records/resume/{resume_id}
```

**响应**: 同上

### 3. 代码结构

```
backend/rust_backend/src/
├── dao/
│   ├── unlock_record_dao.rs       # 数据访问层
│   └── mod.rs
├── services/
│   ├── unlock_record_service.rs   # 业务逻辑层
│   └── mod.rs
├── controllers/
│   ├── unlock_record_controller.rs # 控制器层
│   └── mod.rs
├── models/
│   ├── unlock_record.rs           # 请求/响应模型
│   └── mod.rs
├── entities/
│   ├── unlock_record.rs           # 数据库实体
│   └── mod.rs
└── routes/
    └── mod.rs                     # 路由配置
```

## 前端实现

### 1. 服务层

**文件**: `frontend/web/src/services/unlockRecord.service.js`

**主要方法**:
- `createUnlockRecord(data)` - 创建解锁记录
- `checkUnlockStatus(resumeId, buyerId)` - 检查解锁状态
- `getUnlockedResumes(buyerWallet)` - 获取已解锁简历列表
- `getResumeUnlockRecords(resumeId)` - 获取简历的解锁记录

### 2. 业务逻辑集成

**文件**: `frontend/web/src/resume/resumeBrowseHandlers.js`

在 `handleUnlock` 函数中，支付成功后：

1. ✅ 提取交易结果（transaction digest、timestamp）
2. ✅ 获取买家和卖家的用户信息
3. ✅ 构造解锁记录数据
4. ✅ 调用后端接口创建记录
5. ✅ 失败不影响主流程（容错处理）

**关键代码**:
```javascript
onSuccess: async (result) => {
  console.log('✅ 支付成功:', result);
  
  // 创建解锁记录
  try {
    const [buyerUser, sellerUser] = await Promise.all([
      userService.getUserByWallet(publicKey),
      userService.getUserByWallet(resume.owner)
    ]);

    const unlockData = {
      resume_id: parseInt(resumeId),
      buyer_id: buyerUser.id,
      buyer_wallet: publicKey,
      seller_wallet: resume.owner,
      amount: parseInt(serviceFee),
      transaction_signature: result.digest,
      block_time: result.timestamp ? parseInt(result.timestamp) : null,
    };

    await unlockRecordService.createUnlockRecord(unlockData);
    console.log('✅ 解锁记录创建成功');
  } catch (err) {
    console.error('❌ 创建解锁记录失败:', err);
    // 不影响主流程
  }
  
  // 继续后续流程...
}
```

### 3. API 配置

**文件**: `frontend/web/src/services/api.config.js`

```javascript
unlockRecords: {
  create: '/api/unlock-records',
  checkUnlock: (resumeId, buyerId) => `/api/unlock-records/check/${resumeId}/${buyerId}`,
  getUnlockedByBuyer: (buyerWallet) => `/api/unlock-records/buyer/${buyerWallet}`,
  getByResume: (resumeId) => `/api/unlock-records/resume/${resumeId}`,
}
```

## 使用流程

### 1. 用户购买简历流程

```
用户点击购买
    ↓
前端调用 handleUnlock
    ↓
执行 Sui 链上支付交易
    ↓
支付成功回调
    ↓
获取买卖双方用户信息
    ↓
调用后端创建解锁记录
    ↓
继续原有流程（重新加载订阅等）
```

### 2. 数据流

```
Sui 链上交易 → 交易签名/摘要
      ↓
前端收集信息:
  - resume_id (简历 ID)
  - buyer_id (买家用户 ID)
  - buyer_wallet (买家钱包地址)
  - seller_wallet (卖家钱包地址)
  - amount (支付金额)
  - transaction_signature (交易签名)
  - block_time (区块时间)
      ↓
后端接收并验证
      ↓
检查交易签名是否重复
      ↓
保存到数据库
      ↓
返回创建结果
```

## 错误处理

1. **重复记录**: 通过交易签名去重，返回错误 "Transaction already recorded"
2. **用户信息缺失**: 前端容错处理，记录警告但不中断流程
3. **数据库错误**: 捕获并返回详细错误信息
4. **网络错误**: 前端捕获异常，不影响主流程

## 安全性

- ✅ 交易签名唯一性验证
- ✅ 数据库字段类型验证
- ✅ API 参数验证
- ✅ 错误信息不泄露敏感数据

## 测试建议

### 1. 单元测试
- DAO 层的数据库操作
- Service 层的业务逻辑
- Controller 层的请求处理

### 2. 集成测试
- 完整的支付→记录流程
- 重复交易的处理
- 并发请求的处理

### 3. 前端测试
- 支付成功后的解锁记录创建
- 用户信息获取失败的容错
- 网络错误的处理

## 后续优化建议

1. **性能优化**
   - 添加数据库索引（transaction_signature, buyer_wallet, resume_id）
   - 批量查询优化

2. **功能扩展**
   - 添加分页支持
   - 添加时间范围查询
   - 添加统计功能（总销售额、热门简历等）

3. **监控告警**
   - 记录创建失败告警
   - 异常交易检测
   - 性能监控

## 部署说明

1. 确保数据库中存在 `unlock_records` 表
2. 重启后端服务以加载新路由
3. 前端无需额外部署步骤（已集成到现有流程）

## 总结

本次实现完成了完整的解锁记录功能，包括：
- ✅ 后端完整的三层架构（DAO/Service/Controller）
- ✅ 前端服务封装和业务集成
- ✅ 容错处理和错误处理
- ✅ 防重复机制
- ✅ 完整的 API 文档

功能已完全集成到现有的支付流程中，支付成功后会自动创建解锁记录，不影响原有业务逻辑。
