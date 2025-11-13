# 简历创建双模式更新总结

## 🎯 更新内容

实现了简历创建时的 Seal 加密双模式选择：**Allowlist 模式** 和 **订阅模式**。

---

## ✅ 完成的修改

### 1. **前端组件** - `ResumeCreate.jsx`

#### 新增导入
```javascript
import { createSubscriptionServiceTx, SUBSCRIPTION_CONFIG, usdcToMicroUnits } from '../utils/subscription';
import { SUBSCRIPTION_PACKAGE_ID } from '../config/subscription.config';
```

#### 新增状态
```javascript
const [encryptionMode, setEncryptionMode] = useState('allowlist'); // 'allowlist' 或 'subscription'
const [subscriptionPrice, setSubscriptionPrice] = useState('5'); // 默认 5 USDC
```

#### 修改创建流程

**订阅模式流程（关键改进）**:
```
1. 先创建订阅服务 → 获取 Service ID
2. 使用 Service ID 作为 policy_object_id 创建简历
3. 完成创建
```

**为什么这样做？**
- ✅ `policy_object_id` 用于存储访问控制对象的 ID
- ✅ Allowlist 模式：存储 Allowlist ID
- ✅ 订阅模式：存储 Service ID
- ✅ 前端浏览简历时，可以统一通过 `policy_object_id` 判断是哪种模式

---

## 🎨 UI 界面

### 模式选择

用户在"高级选项"中启用 Seal 加密后，会看到两个选项卡：

```
┌─────────────────────────────────────────┐
│  📋 Allowlist 模式   │  💰 订阅模式     │
├─────────────────────────────────────────┤
│  ✅ 手动管理访问     │  ✅ 付费永久访问  │
│  ✅ 适合特定人员     │  ✅ 自动化控制    │
│  ✅ 可随时添加/移除  │  ✅ 款项直达钱包  │
│  ⚠️ 需创建 Allowlist │  🚀 推荐公开招聘  │
└─────────────────────────────────────────┘
```

### Allowlist 模式配置

```
Allowlist ID *: [0x...]
Cap ID *: [0x...]
[前往创建 Allowlist]
```

### 订阅模式配置

```
订阅价格 (USDC) *: [5.00] USDC

💰 收益预估
├─ 每次订阅收益: 5.00 USDC
├─ 10 人订阅: 50.00 USDC
└─ 100 人订阅: 500.00 USDC
```

---

## 🔄 创建流程对比

### Allowlist 模式

```
用户填写简历
    ↓
启用 Seal 加密 → 选择 Allowlist 模式
    ↓
填写 Allowlist ID 和 Cap ID
    ↓
点击"完成"
    ↓
① 使用 Seal 加密简历
    ↓
② 上传到 Walrus
    ↓
③ 调用后端 API（policy_object_id = Allowlist ID）
    ↓
④ 自动添加创建者到白名单
    ↓
⑤ 关联 Blob 到 Allowlist
    ↓
✅ 创建完成
```

### 订阅模式

```
用户填写简历
    ↓
启用 Seal 加密 → 选择订阅模式
    ↓
设置订阅价格（如 5 USDC）
    ↓
点击"完成"
    ↓
① 创建订阅服务（链上交易）
    ├─ 价格: 5 USDC
    ├─ TTL: 0（永久）
    └─ 获取 Service ID
    ↓
② 使用 Seal 加密简历
    ↓
③ 上传到 Walrus
    ↓
④ 调用后端 API（policy_object_id = Service ID）
    ↓
✅ 创建完成
```

---

## 🔐 数据存储

### 数据库字段复用

两种模式都使用相同的字段结构，只是 `policy_object_id` 的含义不同：

```rust
// Allowlist 模式
Resume {
    encryption_type: "seal",
    policy_object_id: Some("0x...allowlist_id"), // Allowlist ID
}

// 订阅模式
Resume {
    encryption_type: "seal",
    policy_object_id: Some("0x...service_id"), // Service ID
}
```

### 如何区分两种模式？

前端在浏览简历时，通过查询 `policy_object_id` 对应的链上对象类型来判断：

```javascript
// 查询对象类型
const objectData = await suiClient.getObject({
  id: resume.policy_object_id,
  options: { showType: true }
});

if (objectData.type.includes('allowlist::Allowlist')) {
  // Allowlist 模式
} else if (objectData.type.includes('subscription::Service')) {
  // 订阅模式
}
```

---

## 🚀 使用建议

### 何时使用 Allowlist 模式？

- ✅ 内推简历（只给特定 HR 查看）
- ✅ 定向投递（只给某几家公司查看）
- ✅ 私密分享（朋友、导师等）
- ✅ 需要随时撤销访问权限
- ✅ 免费或线下协商价格

### 何时使用订阅模式？

- ✅ 公开招聘市场
- ✅ 人才平台展示
- ✅ 自由职业者接单
- ✅ 批量投递（让感兴趣的公司付费查看）
- ✅ 想要通过简历赚取收入
- ✅ 自动化访问控制

---

## 📊 功能对比

| 特性 | Allowlist 模式 | 订阅模式 |
|------|---------------|---------|
| **初始设置** | 需要创建 Allowlist | 设置价格即可 |
| **访问控制** | 手动添加白名单 | 付费自动授权 |
| **费用收取** | 线下协商 | 链上自动收款 |
| **访问时限** | 由创建者控制 | 永久访问 |
| **权限管理** | 可随时添加/移除 | 自动化（NFT） |
| **复杂度** | 较高 | 较低 |
| **适用场景** | 小范围定向 | 大规模公开 |
| **推荐度** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🔧 技术细节

### 订阅服务创建

```javascript
const tx = createSubscriptionServiceTx(
  usdcToMicroUnits(5), // 5 USDC
  0,                   // TTL=0（永久）
  'resume_xxx',        // 服务名称
  ''                   // Blob ID（稍后更新）
);

// 执行交易并获取 Service ID
const serviceId = txResult.effects?.created?.[0]?.reference?.objectId;
```

### 简历加密

```javascript
// Allowlist 模式
await resumeService.createResumeWithSeal(apiData, allowlistId);

// 订阅模式
await resumeService.createResumeWithSeal(apiData, serviceId);
```

两种模式都调用相同的后端接口，只是 `policy_object_id` 参数不同。

---

## ✨ 亮点

1. **统一的数据结构** - 两种模式共用相同的字段
2. **灵活的选择** - 用户根据场景自由选择
3. **自动化流程** - 订阅模式全自动，无需手动管理
4. **收益可见** - 实时显示收益预估
5. **智能推荐** - 根据场景推荐合适模式

---

## 📝 相关文档

- [双模式详细说明](./SEAL_DUAL_MODE.md)
- [订阅模式实现](../SUBSCRIPTION_RESUME_IMPLEMENTATION.md)
- [Allowlist 使用指南](./ALLOWLIST_GUIDE.md)

---

## 🎉 总结

现在用户创建简历时可以：
1. 选择是否启用 Seal 加密
2. 如果启用，选择 Allowlist 或订阅模式
3. 根据选择填写相应的配置
4. 一键完成创建

**推荐流程**：
- 🎯 定向投递 → Allowlist 模式
- 💰 公开招聘 → 订阅模式
