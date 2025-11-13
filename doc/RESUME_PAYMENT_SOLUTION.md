# 简历付费查看技术方案

## 📋 方案概述

基于 Seal + Walrus 的付费简历查看系统，参考 examples 中的订阅模式，但改造为**一次付费，永久访问**的模式。

---

## 🎯 核心需求

1. **一次付费，永久访问** - 用户支付后可以无限次查看简历
2. **隐私保护** - 简历加密存储，只有付费用户能解密
3. **直接转账** - 支付款项直接转给简历所有者
4. **链上验证** - 访问权限记录在链上，可验证

---

## 🔄 现有订阅模式分析

### Example 中的订阅模式

```move
public struct Service has key {
    id: UID,
    fee: u64,        // 订阅费用
    ttl: u64,        // 时间限制（毫秒）
    owner: address,
    name: String,
}

public struct Subscription has key {
    id: UID,
    service_id: ID,
    created_at: u64,  // 创建时间
}
```

**访问验证逻辑：**
```move
fun approve_internal(id: vector<u8>, sub: &Subscription, service: &Service, c: &Clock): bool {
    // 检查订阅是否过期
    if (c.timestamp_ms() > sub.created_at + service.ttl) {
        return false  // ❌ 时间到期后无法访问
    };
    // ... 其他验证
}
```

**问题：** TTL（Time To Live）限制了访问时间，过期后无法访问。

---

## ✅ 改进方案：永久访问模式

### 方案 1：设置 TTL = 0 表示永久

**修改 Move 合约：**

```move
public struct ResumeService has key {
    id: UID,
    fee: u64,        // 解锁费用（USDC micro-units）
    ttl: u64,        // 设为 0 表示永久访问
    owner: address,  // 简历所有者
    resume_id: String,
}

public struct ResumeAccess has key {
    id: UID,
    resume_id: String,
    buyer: address,
    purchased_at: u64,
}

// 创建简历服务（永久访问）
public fun create_resume_service(
    fee: u64, 
    resume_id: String, 
    ctx: &mut TxContext
): Cap {
    let service = ResumeService {
        id: object::new(ctx),
        fee: fee,
        ttl: 0,  // ✅ 设为 0 表示永久访问
        owner: ctx.sender(),
        resume_id: resume_id,
    };
    // ...
}

// 购买访问权限
public fun purchase_access(
    fee: Coin<SUI>,  // 或 USDC
    service: &ResumeService,
    c: &Clock,
    ctx: &mut TxContext,
): ResumeAccess {
    assert!(fee.value() == service.fee, EInvalidFee);
    
    // 💰 支付直接转给简历所有者
    transfer::public_transfer(fee, service.owner);
    
    ResumeAccess {
        id: object::new(ctx),
        resume_id: service.resume_id,
        buyer: ctx.sender(),
        purchased_at: c.timestamp_ms(),
    }
}

// 验证访问权限（永久有效）
fun approve_internal(
    id: vector<u8>, 
    access: &ResumeAccess, 
    service: &ResumeService, 
    c: &Clock
): bool {
    // 检查 resume_id 是否匹配
    if (service.resume_id != access.resume_id) {
        return false
    };
    
    // ✅ 如果 ttl = 0，永久有效
    if (service.ttl == 0) {
        return true
    };
    
    // 否则检查时间限制
    if (c.timestamp_ms() > access.purchased_at + service.ttl) {
        return false
    };
    
    true
}

entry fun seal_approve(
    id: vector<u8>, 
    access: &ResumeAccess, 
    service: &ResumeService, 
    c: &Clock
) {
    assert!(approve_internal(id, access, service, c), ENoAccess);
}
```

---

### 方案 2：使用 Allowlist 模式（推荐）

**更简单直接的方案：购买后直接添加到 Allowlist**

```move
// 使用现有的 allowlist.move
public fun purchase_and_add_to_allowlist(
    fee: Coin<SUI>,
    allowlist: &mut Allowlist,
    cap: &Cap,
    buyer: address,
    ctx: &mut TxContext,
) {
    // 验证费用
    assert!(fee.value() >= RESUME_FEE, EInvalidFee);
    
    // 💰 支付给简历所有者
    let owner = get_allowlist_owner(allowlist);
    transfer::public_transfer(fee, owner);
    
    // ✅ 直接将买家添加到白名单（永久访问）
    add_to_allowlist(allowlist, cap, buyer);
}
```

**优势：**
- 复用现有 Allowlist 合约
- 逻辑简单清晰
- 无需修改 Seal 验证逻辑
- 天然支持永久访问

---

## 🏗️ 实现架构

### 1. Move 智能合约层

```
walrus/
├── allowlist.move       (已存在，用于访问控制)
├── resume_payment.move  (新增，处理付费逻辑)
```

**resume_payment.move 核心功能：**

```move
module walrus::resume_payment;

// 简历付费配置
public struct ResumePricing has key {
    id: UID,
    resume_id: String,
    price: u64,           // USDC micro-units (6 decimals)
    owner: address,       // 简历所有者
    allowlist_id: ID,     // 关联的 Allowlist
}

// 购买简历访问权限
public fun purchase_resume_access(
    payment: Coin<SUI>,   // 或 Coin<USDC>
    pricing: &ResumePricing,
    allowlist: &mut Allowlist,
    cap: &Cap,
    ctx: &mut TxContext,
) {
    // 1. 验证金额
    assert!(payment.value() == pricing.price, EInvalidPayment);
    
    // 2. 转账给简历所有者
    transfer::public_transfer(payment, pricing.owner);
    
    // 3. 添加买家到白名单（永久访问）
    let buyer = tx_context::sender(ctx);
    allowlist::add(allowlist, cap, buyer);
}

// 检查是否已购买
public fun has_purchased(
    allowlist: &Allowlist,
    buyer: address,
): bool {
    allowlist::contains(allowlist, buyer)
}
```

---

### 2. 后端 Rust API

**新增接口：**

```rust
// src/controllers/resume_controller.rs

/// 检查用户是否已购买简历访问权限
pub async fn check_resume_access(
    resume_id: web::Path<String>,
    buyer: web::Query<BuyerQuery>,
) -> Result<HttpResponse> {
    let has_access = ResumeService::check_access(
        &resume_id,
        &buyer.wallet_address
    ).await?;
    
    Ok(HttpResponse::Ok().json(json!({
        "has_access": has_access
    })))
}

/// 购买简历访问权限（前端调用智能合约后记录）
pub async fn record_purchase(
    data: web::Json<PurchaseRecord>,
) -> Result<HttpResponse> {
    // 验证链上交易
    let tx_verified = verify_purchase_tx(
        &data.tx_digest,
        &data.resume_id,
        &data.buyer_wallet,
    ).await?;
    
    if tx_verified {
        // 更新数据库：unlock_count++
        ResumeDao::increment_unlock_count(&data.resume_id).await?;
        
        Ok(HttpResponse::Ok().json(json!({
            "success": true,
            "message": "Purchase recorded"
        })))
    } else {
        Err(AppError::InvalidTransaction)
    }
}
```

---

### 3. 前端实现

**购买流程（ResumeBrowse.jsx）：**

```typescript
const handlePurchaseResume = async (resumeId: string, price: number) => {
  try {
    // 1. 构建购买交易
    const tx = new Transaction();
    tx.setGasBudget(10000000);
    
    // 2. 调用付费合约
    const payment = coinWithBalance({
      balance: BigInt(price), // USDC micro-units
    });
    
    tx.moveCall({
      target: `${PACKAGE_ID}::resume_payment::purchase_resume_access`,
      arguments: [
        payment,
        tx.object(resumePricingId),
        tx.object(allowlistId),
        tx.object(capId),
      ],
    });
    
    // 3. 执行交易
    const result = await signAndExecute({
      transaction: tx,
    });
    
    // 4. 通知后端记录购买
    await resumeService.recordPurchase({
      resume_id: resumeId,
      buyer_wallet: currentAccount.address,
      tx_digest: result.digest,
    });
    
    // 5. 更新 UI
    toast.success('购买成功！现在可以查看完整简历');
    
    // 6. 自动解密并显示
    await handleViewResume(resumeId);
    
  } catch (error) {
    console.error('购买失败:', error);
    toast.error('购买失败: ' + error.message);
  }
};
```

**访问验证流程：**

```typescript
const handleViewResume = async (resumeId: string) => {
  try {
    // 1. 检查是否已购买
    const { has_access } = await resumeService.checkAccess(
      resumeId,
      currentAccount.address
    );
    
    if (!has_access) {
      // 显示购买提示
      setShowPurchaseModal(true);
      return;
    }
    
    // 2. 创建 SessionKey（用于 Seal 解密）
    const sessionKey = await SessionKey.create({
      address: currentAccount.address,
      packageId: SEAL_PACKAGE_ID,
      ttlMin: 10,
      suiClient,
    });
    
    // 3. 签名 SessionKey
    const result = await signPersonalMessage({
      message: sessionKey.getPersonalMessage(),
    });
    await sessionKey.setPersonalMessageSignature(result.signature);
    
    // 4. 下载并解密简历
    const moveCallConstructor = (tx: Transaction, id: string) => {
      tx.moveCall({
        target: `${PACKAGE_ID}::allowlist::seal_approve`,
        arguments: [
          tx.pure.vector('u8', fromHex(id)),
          tx.object(allowlistId),
        ],
      });
    };
    
    const decryptedData = await downloadAndDecryptResume(
      resume.blob_id,
      sessionKey,
      allowlistId,
      moveCallConstructor
    );
    
    // 5. 显示解密后的简历
    setDecryptedResume(decryptedData);
    setShowResumeModal(true);
    
  } catch (error) {
    console.error('查看失败:', error);
    toast.error('查看失败: ' + error.message);
  }
};
```

---

## 📊 数据流程图

```
用户浏览简历列表
    ↓
看到加密的简历摘要（姓名部分隐藏）
    ↓
点击"支付 5 USDC 解锁"
    ↓
① 调用智能合约 purchase_resume_access
    ├─ 验证支付金额
    ├─ 转账给简历所有者
    └─ 添加用户到 Allowlist（永久）
    ↓
② 前端记录购买记录到后端
    └─ 更新 unlock_count
    ↓
③ 创建 SessionKey 并签名
    ↓
④ 调用 Seal 服务器验证权限
    ├─ 检查用户是否在 Allowlist
    └─ 返回解密密钥份额
    ↓
⑤ 从 Walrus 下载加密简历
    ↓
⑥ 使用解密密钥解密
    ↓
⑦ 显示完整简历（✅ 永久访问）
```

---

## 🔐 安全考虑

### 1. 防止重复付费
```typescript
// 前端检查
const { has_access } = await checkAccess(resumeId, wallet);
if (has_access) {
  // 直接查看，无需再次付费
  return handleViewResume(resumeId);
}
```

### 2. 链上验证
```rust
// 后端验证交易真实性
async fn verify_purchase_tx(
    tx_digest: &str,
    resume_id: &str,
    buyer: &str,
) -> Result<bool> {
    let tx = sui_client.get_transaction(tx_digest).await?;
    
    // 验证：
    // 1. 交易成功
    // 2. 调用了正确的合约函数
    // 3. 金额正确
    // 4. 买家地址正确
    
    Ok(verified)
}
```

### 3. 防止绕过付费
- 所有解密都需要 Seal 服务器验证
- 服务器检查 Allowlist（链上数据）
- 无法伪造 Allowlist 成员资格

---

## 💾 数据库设计

```sql
-- 简历访问记录表
CREATE TABLE resume_access_records (
    id VARCHAR(64) PRIMARY KEY,
    resume_id VARCHAR(64) NOT NULL,
    buyer_wallet VARCHAR(66) NOT NULL,
    price BIGINT NOT NULL,            -- USDC micro-units
    tx_digest VARCHAR(64) NOT NULL,    -- Sui 交易哈希
    purchased_at BIGINT NOT NULL,      -- Unix 时间戳（毫秒）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_resume_buyer (resume_id, buyer_wallet),
    INDEX idx_buyer (buyer_wallet),
    FOREIGN KEY (resume_id) REFERENCES resumes(id)
);

-- 快速查询是否已购买
SELECT COUNT(*) > 0 as has_access
FROM resume_access_records
WHERE resume_id = ? AND buyer_wallet = ?;
```

---

## 🚀 实施步骤

### Phase 1: Move 合约开发
1. ✅ 复用 `allowlist.move`（已有）
2. 🆕 开发 `resume_payment.move`
3. 🧪 编写单元测试
4. 🚀 部署到 Sui 测试网

### Phase 2: 后端 API
1. 🆕 添加 `check_resume_access` 接口
2. 🆕 添加 `record_purchase` 接口
3. 🆕 添加购买记录数据库表
4. 🔗 集成 Sui RPC 验证交易

### Phase 3: 前端集成
1. 🆕 实现购买流程 UI
2. 🔄 修改 `handleUnlock` 调用合约
3. ✅ 添加访问检查逻辑
4. 🎨 优化用户体验（加载状态、错误提示）

### Phase 4: 测试上线
1. 🧪 集成测试
2. 👥 用户体验测试
3. 🐛 Bug 修复
4. 🌐 主网部署

---

## 📝 核心代码片段

### Move 合约示例

```move
// resume_payment.move
module walrus::resume_payment;

use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::tx_context::{Self, TxContext};
use sui::transfer;
use walrus::allowlist::{Self, Allowlist, Cap};

const EInvalidPayment: u64 = 1;

public struct ResumePricing has key {
    id: UID,
    resume_id: vector<u8>,
    price: u64,
    owner: address,
    allowlist_id: ID,
}

public fun create_pricing(
    resume_id: vector<u8>,
    price: u64,
    allowlist: &Allowlist,
    ctx: &mut TxContext,
): ResumePricing {
    ResumePricing {
        id: object::new(ctx),
        resume_id,
        price,
        owner: tx_context::sender(ctx),
        allowlist_id: object::id(allowlist),
    }
}

public fun purchase(
    payment: Coin<SUI>,
    pricing: &ResumePricing,
    allowlist: &mut Allowlist,
    cap: &Cap,
    ctx: &mut TxContext,
) {
    assert!(coin::value(&payment) == pricing.price, EInvalidPayment);
    
    // 转账给简历所有者
    transfer::public_transfer(payment, pricing.owner);
    
    // 添加到白名单（永久访问）
    let buyer = tx_context::sender(ctx);
    allowlist::add(allowlist, cap, buyer);
}
```

---

## 🎉 优势总结

### vs 订阅模式
- ✅ **永久访问** - 无需重复付费
- ✅ **简单直观** - 用户体验更好
- ✅ **适合简历** - 查看简历是一次性需求

### vs 中心化方案
- ✅ **去中心化** - 无需信任第三方
- ✅ **直接转账** - 款项直达简历所有者
- ✅ **链上验证** - 访问记录不可篡改
- ✅ **隐私保护** - 端到端加密

---

## 🔮 未来扩展

1. **批量购买折扣**
   - 一次购买多份简历享受折扣
   
2. **订阅制 + 永久制混合**
   - 月度订阅：查看所有简历
   - 单次购买：永久查看特定简历
   
3. **转售机制**
   - 允许用户转售访问权限（需修改 Allowlist）
   
4. **退款机制**
   - 简历质量不符可申请退款（托管合约）

---

## 📚 参考资源

- [Seal 文档](https://docs.walrus.site/seal/)
- [Sui Move 文档](https://docs.sui.io/guides/developer/sui-101)
- [Example 订阅模式代码](../examples/move/sources/subscription.move)
- [Allowlist 模式代码](../examples/move/sources/allowlist.move)

---

**总结：通过将 TTL 设为 0 或直接使用 Allowlist 模式，可以轻松实现"一次付费，永久访问"的简历查看系统。推荐使用 Allowlist 方案，因为它更简单、更可靠，且完全复用现有代码。**
