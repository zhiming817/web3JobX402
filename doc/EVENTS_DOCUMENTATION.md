# 智能合约事件文档 (Contract Events Documentation)

本文档说明 `allowlist.move` 和 `subscription.move` 合约中定义的所有事件。

## Allowlist 事件

### 1. AllowlistCreated - Allowlist 创建事件

**触发时机**: 调用 `create_allowlist()` 创建新的 Allowlist 时

**字段**:
```move
public struct AllowlistCreated has copy, drop {
    allowlist_id: ID,      // Allowlist 对象的 ID
    name: String,          // Allowlist 名称
    creator: address,      // 创建者地址
}
```

**用途**: 
- 前端监听以获取新创建的 Allowlist ID
- 追踪谁创建了哪些 Allowlist
- 构建 Allowlist 索引

---

### 2. AccountAdded - 账户添加事件

**触发时机**: 调用 `add()` 向 Allowlist 添加账户时

**字段**:
```move
public struct AccountAdded has copy, drop {
    allowlist_id: ID,      // Allowlist 对象的 ID
    account: address,      // 被添加的账户地址
    operator: address,     // 执行添加操作的管理员地址
}
```

**用途**:
- 实时通知用户被添加到白名单
- 审计日志记录
- 前端同步 Allowlist 成员列表

---

### 3. AccountRemoved - 账户移除事件

**触发时机**: 调用 `remove()` 从 Allowlist 移除账户时

**字段**:
```move
public struct AccountRemoved has copy, drop {
    allowlist_id: ID,      // Allowlist 对象的 ID
    account: address,      // 被移除的账户地址
    operator: address,     // 执行移除操作的管理员地址
}
```

**用途**:
- 通知用户访问权限被撤销
- 审计日志记录
- 前端同步 Allowlist 成员列表

---

### 4. BlobPublished - Blob 发布事件

**触发时机**: 调用 `publish()` 将 Blob 关联到 Allowlist 时

**字段**:
```move
public struct BlobPublished has copy, drop {
    allowlist_id: ID,      // Allowlist 对象的 ID
    blob_id: String,       // Walrus Blob ID
    publisher: address,    // 发布者地址
}
```

**用途**:
- 追踪哪些 Blob 使用了哪个 Allowlist
- 构建内容索引
- 审计内容发布历史

---

## Subscription 事件

### 1. ServiceCreated - 订阅服务创建事件

**触发时机**: 调用 `create_service()` 创建新的订阅服务时

**字段**:
```move
public struct ServiceCreated has copy, drop {
    service_id: ID,        // Service 对象的 ID
    name: String,          // 服务名称
    fee: u64,              // 订阅费用 (micro-SUI)
    ttl: u64,              // 订阅有效期 (毫秒，0 = 永久)
    owner: address,        // 服务所有者地址
}
```

**用途**:
- 前端监听以获取新创建的 Service ID
- 构建服务市场索引
- 追踪服务创建者和定价

---

### 2. SubscriptionCreated - 订阅购买事件

**触发时机**: 调用 `subscribe()` 购买订阅时

**字段**:
```move
public struct SubscriptionCreated has copy, drop {
    subscription_id: ID,   // Subscription NFT 的 ID
    service_id: ID,        // 关联的 Service ID
    subscriber: address,   // 订阅者地址
    fee_paid: u64,         // 支付的费用金额
    created_at: u64,       // 创建时间戳 (毫秒)
}
```

**用途**:
- 通知服务所有者有新订阅
- 构建订阅历史和统计
- 计算服务收入
- 前端展示订阅成功通知

---

### 3. ServiceBlobPublished - 服务 Blob 发布事件

**触发时机**: 调用 `publish()` 将 Blob 关联到 Service 时

**字段**:
```move
public struct ServiceBlobPublished has copy, drop {
    service_id: ID,        // Service 对象的 ID
    blob_id: String,       // Walrus Blob ID
    publisher: address,    // 发布者地址
}
```

**用途**:
- 追踪哪些内容使用了哪个订阅服务
- 构建内容索引
- 审计内容发布历史

---

## 前端事件监听示例

### 监听 Service 创建事件

```typescript
import { SuiClient } from '@mysten/sui.js/client';

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });

// 订阅事件
const unsubscribe = await client.subscribeEvent({
  filter: {
    MoveEventType: `${PACKAGE_ID}::subscription::ServiceCreated`
  },
  onMessage: (event) => {
    console.log('新服务创建:', {
      serviceId: event.parsedJson.service_id,
      name: event.parsedJson.name,
      fee: event.parsedJson.fee,
      ttl: event.parsedJson.ttl,
      owner: event.parsedJson.owner,
    });
  }
});
```

### 查询历史事件

```typescript
// 查询某个 Service 的所有订阅事件
const events = await client.queryEvents({
  query: {
    MoveEventType: `${PACKAGE_ID}::subscription::SubscriptionCreated`,
    MoveEventField: {
      path: '/service_id',
      value: serviceId
    }
  }
});

console.log(`共有 ${events.data.length} 个订阅`);
```

### 监听特定 Allowlist 的成员变更

```typescript
// 监听账户添加事件
await client.subscribeEvent({
  filter: {
    MoveEventType: `${PACKAGE_ID}::allowlist::AccountAdded`,
    MoveEventField: {
      path: '/allowlist_id',
      value: allowlistId
    }
  },
  onMessage: (event) => {
    console.log('新账户添加:', {
      account: event.parsedJson.account,
      operator: event.parsedJson.operator,
    });
  }
});
```

---

## 智能合约函数签名变更

由于添加了事件支持，某些函数签名发生了变更（增加了 `ctx: &TxContext` 参数）:

### Allowlist 模块

```move
// 旧签名
public fun add(allowlist: &mut Allowlist, cap: &Cap, account: address)
public fun remove(allowlist: &mut Allowlist, cap: &Cap, account: address)
public fun publish(allowlist: &mut Allowlist, cap: &Cap, blob_id: String)

// 新签名 (添加了 ctx 参数)
public fun add(allowlist: &mut Allowlist, cap: &Cap, account: address, ctx: &TxContext)
public fun remove(allowlist: &mut Allowlist, cap: &Cap, account: address, ctx: &TxContext)
public fun publish(allowlist: &mut Allowlist, cap: &Cap, blob_id: String, ctx: &TxContext)
```

### Subscription 模块

```move
// 旧签名
public fun publish(service: &mut Service, cap: &Cap, blob_id: String)

// 新签名 (添加了 ctx 参数)
public fun publish(service: &mut Service, cap: &Cap, blob_id: String, ctx: &TxContext)
```

**重要**: 前端调用这些函数时，需要更新交易构建代码以传递 `TxContext`。

---

## 应用场景

### 1. 实时通知系统
- 用户购买订阅后立即通知服务所有者
- 用户被添加到 Allowlist 后发送邮件通知

### 2. 数据分析仪表板
- 统计每个 Service 的订阅数量和收入
- 分析 Allowlist 的使用频率
- 追踪内容发布趋势

### 3. 审计和合规
- 记录所有权限变更历史
- 追踪资金流向
- 生成访问日志报告

### 4. 前端状态同步
- 实时更新 Allowlist 成员列表
- 显示订阅购买成功提示
- 自动刷新用户的订阅状态

---

## 事件索引建议

为了高效查询事件，建议建立以下索引:

1. **按 Service ID 索引订阅事件** - 快速查询某个服务的所有订阅者
2. **按订阅者地址索引** - 查询用户购买了哪些订阅
3. **按 Allowlist ID 索引成员变更** - 追踪 Allowlist 的完整历史
4. **按时间戳索引** - 生成时间序列分析报告

可以使用 Sui 的 GraphQL 服务或自建索引器来实现这些功能。
