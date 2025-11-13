# 合约部署指南

## 更新内容

### 1. 订阅模式改为永久有效
- ✅ **移除 TTL 时间限制检查**
- ✅ **用户订阅一次，永久可访问**
- ✅ 不再检查 `created_at + ttl` 是否过期
- ✅ 只要持有 Subscription NFT，随时可以解密内容

### 2. 添加完整事件支持

**Allowlist 事件:**
- `AllowlistCreated` - 创建 Allowlist
- `AccountAdded` - 添加账户到白名单
- `AccountRemoved` - 从白名单移除账户
- `BlobPublished` - 发布 Blob

**Subscription 事件:**
- `ServiceCreated` - 创建订阅服务
- `SubscriptionCreated` - 购买订阅
- `ServiceBlobPublished` - 发布 Blob 到服务

### 3. 函数签名变更

由于添加事件支持，以下函数增加了 `ctx: &TxContext` 参数：

```move
// Allowlist
public fun add(allowlist: &mut Allowlist, cap: &Cap, account: address, ctx: &TxContext)
public fun remove(allowlist: &mut Allowlist, cap: &Cap, account: address, ctx: &TxContext)
public fun publish(allowlist: &mut Allowlist, cap: &Cap, blob_id: String, ctx: &TxContext)

// Subscription
public fun publish(service: &mut Service, cap: &Cap, blob_id: String, ctx: &TxContext)
```

### 4. Seal 验证函数简化

```move
// 旧版本需要 Clock 参数
entry fun seal_approve(id: vector<u8>, sub: &Subscription, service: &Service, c: &Clock)

// 新版本不再需要 Clock（永久订阅）
entry fun seal_approve(id: vector<u8>, sub: &Subscription, service: &Service)
```

---

## 部署步骤

### 1. 确认网络环境

```bash
# 查看当前网络
sui client active-env

# 如果不是 testnet，切换到 testnet
sui client switch --env testnet
```

### 2. 检查钱包余额

```bash
# 查看当前活跃地址
sui client active-address

# 查看余额（确保有足够的 SUI 支付 gas）
sui client gas
```

### 3. 构建合约

```bash
cd /Users/zhaozhiming/work/workspace/sui-workspace/web3JobX402/examples/move
sui move build
```

### 4. 部署合约

```bash
sui client publish --gas-budget 100000000
```

**预期输出:**
```
Transaction Digest: <digest>
╭──────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                        │
├──────────────────────────────────────────────────────────────────────┤
│ Created Objects:                                                      │
│  ┌──                                                                  │
│  │ ObjectID: <package_id>                                            │
│  │ Sender: <your_address>                                            │
│  │ Owner: Immutable                                                  │
│  │ ObjectType: 0x2::package::Package                                │
│  └──                                                                  │
╰──────────────────────────────────────────────────────────────────────╯
```

### 5. 记录 Package ID

部署成功后，记录输出中的 `Package ID`，这是新合约的地址。

**重要**: 需要更新前端配置文件中的以下 Package ID:

```javascript
// frontend/web/src/config/subscription.config.js
export const SUBSCRIPTION_PACKAGE_ID = '<新的_PACKAGE_ID>';

// frontend/web/src/networkConfig.ts 或相关配置文件
export const SEAL_PACKAGE_ID = '<新的_PACKAGE_ID>';
```

---

## 部署后验证

### 1. 验证合约是否可用

```bash
# 查看 Package 信息
sui client object <package_id>
```

### 2. 测试创建订阅服务

```bash
# 使用新合约创建一个测试服务
sui client call \
  --package <package_id> \
  --module subscription \
  --function create_service_entry \
  --args 5000000 0 "Test Service" \
  --gas-budget 10000000
```

### 3. 验证事件是否正常发出

```bash
# 查询 ServiceCreated 事件
sui client events \
  --limit 10 \
  --module subscription \
  --type ServiceCreated
```

---

## 前端更新清单

部署新合约后，需要更新前端代码：

### 1. 更新 Package ID

```diff
// subscription.config.js
- export const SUBSCRIPTION_PACKAGE_ID = '0x55202f19ccbb...'
+ export const SUBSCRIPTION_PACKAGE_ID = '<新的_PACKAGE_ID>'
```

### 2. 更新调用 add/remove/publish 的地方

由于函数签名增加了 `ctx` 参数，PTB 构建需要确保传递了 `TxContext`。

**注意**: Move 函数中的 `&TxContext` 参数会自动由 Sui 运行时注入，前端 PTB 不需要显式传递。

### 3. 移除 Clock 参数（如果有的话）

在解密验证流程中，如果之前传递了 `Clock` 对象给 `seal_approve`，现在需要移除：

```diff
// 旧版本
- tx.moveCall({
-   target: `${SEAL_PACKAGE_ID}::subscription::seal_approve`,
-   arguments: [blobId, subscription, service, clock],
- });

// 新版本（不需要 Clock）
+ tx.moveCall({
+   target: `${SEAL_PACKAGE_ID}::subscription::seal_approve`,
+   arguments: [blobId, subscription, service],
+ });
```

---

## 订阅模式说明

### 旧版本（有时间限制）
- 创建服务时设置 `ttl`（如 30 天 = 2592000000 毫秒）
- 用户购买后，订阅在 `created_at + ttl` 之后过期
- 需要重新购买才能继续访问

### 新版本（永久有效）✅
- 创建服务时 `ttl` 参数保留但不生效（建议设置为 0）
- 用户购买一次，获得 Subscription NFT
- **只要持有 NFT，永久可以访问内容**
- 不会过期，无需重复购买

### 对用户的好处
✅ 一次付费，永久访问
✅ 没有订阅到期的烦恼
✅ NFT 可以转让（通过 `transfer` 函数）
✅ 更简单的用户体验

### 对创建者的好处
✅ 更容易吸引用户（永久访问更有吸引力）
✅ 可以设置更高的价格（因为是永久的）
✅ 区块链保证，无法撤销或修改访问权限

---

## 常见问题

### Q: 如果我想保留时间限制怎么办？
A: 可以使用旧版本合约，或者修改代码取消注释 TTL 检查：

```move
fun approve_internal(id: vector<u8>, sub: &Subscription, service: &Service, c: &Clock): bool {
    if (object::id(service) != sub.service_id) {
        return false
    };
    
    // 恢复时间限制检查
    if (service.ttl > 0 && c.timestamp_ms() > sub.created_at + service.ttl) {
        return false
    };

    is_prefix(service.id.to_bytes(), id)
}
```

### Q: 现有的订阅会受影响吗？
A: 不会。新合约是一个全新的 Package，旧合约的数据和订阅不受影响。但建议逐步迁移用户到新合约。

### Q: TTL 字段还需要吗？
A: 保留了 TTL 字段是为了兼容性，但现在不会被检查。建议创建服务时设置 `ttl = 0` 表示永久。

---

## 部署命令总结

```bash
# 1. 切换到 testnet
sui client switch --env testnet

# 2. 构建合约
cd examples/move
sui move build

# 3. 部署合约
sui client publish --gas-budget 100000000

# 4. 记录输出中的 Package ID
# 5. 更新前端配置文件
# 6. 重启前端应用
# 7. 测试创建订阅服务和购买流程
```

---

## 技术支持

如遇到问题，请检查：
1. Sui CLI 版本是否最新 (`sui --version`)
2. 网络连接是否正常
3. 钱包余额是否充足
4. 前端 Package ID 配置是否正确
5. 浏览器控制台是否有错误信息
