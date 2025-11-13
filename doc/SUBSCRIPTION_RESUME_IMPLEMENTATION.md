# 简历订阅解锁功能实现说明

## 🎯 功能概述

基于 Seal 订阅模式实现简历付费查看功能，用户购买订阅后可以永久访问简历。

---

## 📋 实现的功能

### 1. 订阅购买流程

```
用户浏览简历列表
    ↓
点击"支付 5 USDC 购买永久访问"
    ↓
① 验证服务存在（getServiceDetails）
    ↓
② 调用智能合约购买订阅（subscribe）
    ├─ 支付 USDC
    ├─ 创建 Subscription NFT
    └─ 款项直接转给简历所有者
    ↓
③ Subscription NFT 自动转移给买家
    ↓
④ 重新加载用户订阅列表
    ↓
⑤ 更新简历状态为"已购买"
    ↓
⑥ 自动打开查看模式
```

### 2. 解密查看流程

```
用户点击"查看完整简历"
    ↓
① 检查用户订阅列表
    ├─ 查找匹配的 Subscription
    └─ 验证订阅是否有效（TTL=0 永久有效）
    ↓
② 创建并签名 SessionKey
    ↓
③ 构建订阅验证 MoveCall
    └─ 调用 subscription::seal_approve
    ↓
④ Seal 服务器验证订阅
    ├─ 检查 Subscription 存在
    ├─ 检查是否过期（TTL=0 不过期）
    └─ 返回解密密钥份额
    ↓
⑤ 从 Walrus 下载加密简历
    ↓
⑥ 使用密钥份额解密
    ↓
⑦ 显示完整简历内容 ✅
```

---

## 🔧 技术实现

### 核心文件

#### 1. **配置文件**

**`src/config/subscription.config.js`**
```javascript
export const SUBSCRIPTION_CONFIG = {
  defaultTTL: 0,  // 0 = 永久访问
  defaultPrice: 5_000_000,  // 5 USDC
};
```

#### 2. **工具函数**

**`src/utils/subscription.js`**

主要功能：
- `purchaseSubscriptionTx()` - 创建购买订阅交易
- `getUserSubscriptions()` - 查询用户订阅列表
- `getServiceDetails()` - 查询服务详情
- `isSubscriptionValid()` - 验证订阅是否有效
- `constructSubscriptionApprove()` - 构建 Seal 验证 MoveCall

#### 3. **前端组件**

**`src/resume/ResumeBrowse.jsx`**

新增状态：
```javascript
const [userSubscriptions, setUserSubscriptions] = useState([]);
const [isPurchasing, setIsPurchasing] = useState(false);
```

关键函数：
- `loadUserSubscriptions()` - 加载用户订阅
- `handleUnlock()` - 处理购买订阅
- `handleDecryptResume()` - 处理解密（订阅模式）

---

## 🔐 智能合约调用

### 1. 购买订阅

```javascript
// 调用 subscription::subscribe
tx.moveCall({
  target: `${PACKAGE_ID}::subscription::subscribe`,
  arguments: [
    coinObject,   // 支付的 USDC
    serviceId,    // 简历服务 ID
    SUI_CLOCK,    // Sui Clock
  ],
});

// 转移 Subscription 给买家
tx.moveCall({
  target: `${PACKAGE_ID}::subscription::transfer`,
  arguments: [
    subscriptionObj,
    buyerAddress,
  ],
});
```

### 2. 验证订阅权限

```javascript
// Seal 解密时调用
tx.moveCall({
  target: `${PACKAGE_ID}::subscription::seal_approve`,
  arguments: [
    blobId,          // 加密 Blob ID
    subscriptionId,  // 用户的 Subscription ID
    serviceId,       // 简历服务 ID
    SUI_CLOCK,       // Sui Clock
  ],
});
```

---

## 📊 数据结构

### Subscription NFT

```move
public struct Subscription has key {
    id: UID,
    service_id: ID,      // 简历服务 ID
    created_at: u64,     // 购买时间戳
}
```

### Service 对象

```move
public struct Service has key {
    id: UID,
    fee: u64,        // 订阅费用
    ttl: u64,        // 时间限制（0 = 永久）
    owner: address,  // 简历所有者
    name: String,    // 简历 ID
}
```

---

## 🎨 UI 交互

### 按钮状态

1. **未购买** - 显示"支付 5 USDC 购买永久访问"
2. **购买中** - 显示加载动画 + "购买中..."
3. **已购买** - 显示"查看完整简历"按钮（绿色）

### 订阅状态检查

```javascript
const hasSubscription = userSubscriptions.some(
  sub => sub.service_id === resume.policy_object_id
);
```

---

## ✅ 优势特点

### vs 传统付费模式

| 特性 | 传统模式 | 订阅模式 |
|------|---------|---------|
| 访问时限 | 一次性 | 永久访问 |
| 链上验证 | ❌ | ✅ Subscription NFT |
| 可转移性 | ❌ | ✅ 可转移 NFT |
| 权限管理 | 中心化 | 去中心化 |

### 技术优势

- ✅ **永久访问** - TTL=0，无需重复付费
- ✅ **去中心化** - 权限记录在链上
- ✅ **自动验证** - Seal 服务器自动验证 Subscription
- ✅ **端到端加密** - 简历内容端到端加密
- ✅ **直接转账** - 款项直达简历所有者
- ✅ **可转移** - Subscription 是 NFT，可转移

---

## 🚀 使用流程

### 买家视角

1. 浏览加密简历列表
2. 点击"购买永久访问"
3. 钱包确认支付
4. 获得 Subscription NFT
5. 随时查看完整简历

### 卖家（简历所有者）视角

1. 创建简历并上传到 Walrus
2. 使用 Seal 加密
3. 创建订阅服务（Service）
4. 设置价格和 TTL（0=永久）
5. 买家购买后自动收到款项

---

## 📝 待完善功能

### 短期优化

1. **自动添加到白名单** - 购买成功后自动调用 `allowlist::add`
2. **订阅管理页面** - 显示用户所有订阅
3. **退款机制** - 质量不符可申请退款
4. **批量购买** - 一次购买多份简历享受折扣

### 长期扩展

1. **时限订阅** - 支持月度/年度订阅模式
2. **订阅套餐** - 不同等级的访问权限
3. **转售市场** - 允许转售 Subscription NFT
4. **收益分成** - 平台抽成机制

---

## 🔍 调试信息

### 查看用户订阅

```bash
# 在浏览器控制台
console.log('用户订阅列表:', userSubscriptions);
```

### 查看简历服务

```bash
# 查询 Service 对象
sui client object <SERVICE_ID>
```

### 查看 Subscription NFT

```bash
# 查询用户拥有的 Subscription
sui client objects --owned-by <ADDRESS> --filter 'subscription::Subscription'
```

---

## 📚 相关文档

- [Seal 订阅模式文档](../examples/move/sources/subscription.move)
- [简历付费方案](./RESUME_PAYMENT_SOLUTION.md)
- [Seal 集成总结](./SEAL_INTEGRATION_SUMMARY.md)

---

## ✨ 总结

通过 Seal 订阅模式实现了：
- ✅ 一次付费，永久访问
- ✅ 链上权限验证
- ✅ 去中心化支付
- ✅ 端到端加密
- ✅ 自动化解密

用户体验流畅，技术架构清晰，完全基于区块链和加密技术实现！
