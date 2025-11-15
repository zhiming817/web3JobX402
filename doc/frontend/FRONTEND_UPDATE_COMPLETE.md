# 前端配置更新完成

## ✅ 已更新的配置

### 1. 新合约地址
```
Package ID: 0x62b4422e6a76cda57489f31a90e5e73878f9e9af7f97471f4e257d8006df58af
Version: 1
Modules: allowlist, subscription, utils
```

### 2. 更新的文件

#### `/frontend/web/src/config/seal.config.js`
```javascript
export const TESTNET_PACKAGE_ID = '0x62b4422e6a76cda57489f31a90e5e73878f9e9af7f97471f4e257d8006df58af';
```
- ✅ 更新 Seal/Allowlist 合约地址
- ✅ 配置密钥服务器
- ✅ 设置加密阈值

#### `/frontend/web/src/config/subscription.config.js`
```javascript
export const SUBSCRIPTION_PACKAGE_ID = '0x62b4422e6a76cda57489f31a90e5e73878f9e9af7f97471f4e257d8006df58af';

export const SUBSCRIPTION_CONFIG = {
  defaultTTL: 0, // 永久访问
  minTTL: 0,
  defaultPrice: 5_000_000, // 5 USDC
};
```
- ✅ 更新 Subscription 合约地址
- ✅ 设置永久订阅（TTL = 0）
- ✅ 默认价格 5 USDC

#### `/frontend/web/src/utils/subscription.js`
```javascript
export function constructSubscriptionApprove(params) {
  const { blobId, subscriptionId, serviceId } = params;
  
  return (tx, id) => {
    tx.moveCall({
      target: getSubscriptionTarget('seal_approve'),
      arguments: [
        tx.pure.vector('u8', Array.from(Buffer.from(id, 'hex'))),
        tx.object(subscriptionId),
        tx.object(serviceId),
        // 移除了 Clock 参数 - 新合约支持永久订阅
      ],
    });
  };
}
```
- ✅ 移除 `SUI_CLOCK_OBJECT_ID` 参数
- ✅ 适配新合约的永久订阅模式

### 3. 不需要更新的文件

以下文件使用 Allowlist 的 `seal_approve`，只需要 2 个参数（id + allowlist），无需修改：
- ✅ `/frontend/web/src/utils/sealClient.js`
- ✅ `/frontend/web/src/components/AllowlistManager.jsx`
- ✅ `/frontend/web/src/resume/ResumeBrowse.jsx`

---

## 🎯 核心改进

### 永久订阅模式
- **旧版本**: 订阅有时间限制，需要定期续费
- **新版本**: 一次购买，永久访问 ✨

### 函数签名变更
```diff
// Subscription::seal_approve
- entry fun (id: vector<u8>, sub: &Subscription, service: &Service, c: &Clock)
+ entry fun seal_approve(id: vector<u8>, sub: &Subscription, service: &Service)
```

### 前端影响
```diff
// 旧代码
- tx.object(SUI_CLOCK_OBJECT_ID),

// 新代码（移除 Clock）
+ // 新合约支持永久订阅，不需要 Clock
```

---

## 🧪 测试清单

### 1. Allowlist 模式测试
- [ ] 创建新的 Allowlist
- [ ] 添加用户到白名单
- [ ] 上传加密简历
- [ ] 白名单用户解密查看

### 2. Subscription 模式测试
- [ ] 创建订阅服务（价格 5 USDC，TTL = 0）
- [ ] 上传加密简历
- [ ] 购买订阅（支付 5 USDC）
- [ ] 解密查看简历
- [ ] **关键**: 等待 1 小时后，再次解密验证永久访问 ✅

### 3. 前端功能测试
- [ ] 简历列表正常显示
- [ ] 创建简历流程完整
- [ ] 双模式切换正常
- [ ] 价格显示正确（USDC）
- [ ] 支付流程顺畅
- [ ] 解密成功率高

---

## 🚀 启动应用

```bash
# 前端
cd frontend/web
npm run dev

# 后端
cd backend/rust_backend
cargo run
```

访问: http://localhost:5173

---

## 📊 合约部署信息

### 测试网信息
- **Network**: Sui Testnet
- **Package ID**: `0x62b4422e6a76cda57489f31a90e5e73878f9e9af7f97471f4e257d8006df58af`
- **Version**: 1
- **Digest**: `DfzQikxcrvvo5BN8pRceVnYa42F1Hgbpc6PsCMASf3bN`
- **Modules**: `allowlist`, `subscription`, `utils`

### 浏览器查看
```
https://suiscan.xyz/testnet/object/0x62b4422e6a76cda57489f31a90e5e73878f9e9af7f97471f4e257d8006df58af
```

### 事件监听
```javascript
// 监听 ServiceCreated 事件
const events = await suiClient.queryEvents({
  query: {
    MoveEventType: `0x62b4422e6a76cda57489f31a90e5e73878f9e9af7f97471f4e257d8006df58af::subscription::ServiceCreated`
  }
});

// 监听 SubscriptionCreated 事件
const events = await suiClient.queryEvents({
  query: {
    MoveEventType: `0x62b4422e6a76cda57489f31a90e5e73878f9e9af7f97471f4e257d8006df58af::subscription::SubscriptionCreated`
  }
});
```

---

## ⚠️ 重要提示

1. **旧合约数据不受影响**: 旧 Package 的 Allowlist 和 Subscription 仍然有效
2. **需要重新创建**: 使用新合约需要创建新的 Service 和 Allowlist
3. **不可降级**: 新合约部署后，建议所有新用户使用新合约
4. **永久订阅**: TTL 参数仍然存在但不生效，建议设置为 0

---

## 🎉 完成状态

✅ 合约部署成功  
✅ 前端配置更新完成  
✅ Clock 参数移除完成  
✅ 永久订阅模式启用  
✅ 事件系统完整  
✅ 文档更新完整  

**可以开始测试了！** 🚀
