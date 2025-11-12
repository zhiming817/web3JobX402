# 🔐 Allowlist 使用指南

## 什么是 Allowlist?

**Allowlist** 是 Sui 链上的访问控制列表,用于控制谁可以访问你的加密简历。

### 核心概念

- **Allowlist ID**: 链上共享对象 ID,用于加密时指定访问控制
- **Cap ID**: 管理员凭证对象 ID,用于添加/移除白名单成员
- **访问控制**: 只有在白名单中的地址才能解密查看简历

---

## 📋 完整工作流程

### 第一步: 创建 Allowlist

#### 方法 1: 使用 Web UI (推荐)

1. **访问 Allowlist 管理页面**
   - 导航至: **导航栏 → 🔐 Allowlist**
   - 或直接访问: `/#/allowlist`

2. **创建新的 Allowlist**
   - 点击 **"创建新 Allowlist"** 按钮
   - 输入名称,例如: `我的简历访问控制`
   - 点击 **"创建 Allowlist"**
   - 钱包会弹出签名请求,确认后支付 Gas 费用

3. **获取 Allowlist ID 和 Cap ID**
   - 创建成功后会自动打开 **Sui Explorer**
   - 在交易详情页面找到 **"Created Objects"** 部分
   - 你会看到 2 个新创建的对象:

   ```
   📄 Allowlist (Shared Object)
   ID: 0xabcdef123456...  ← 这是 Allowlist ID
   
   🔑 Cap (Owned Object)  
   ID: 0x789012abcdef...  ← 这是 Cap ID
   ```

4. **复制并保存这两个 ID**
   - ⚠️ 重要: 请妥善保存这两个 ID
   - Cap ID 是私人凭证,不要泄露给他人

#### 方法 2: 使用 Sui CLI

```bash
sui client call \
  --package 0x55202f19ccbb6d2d518cf11bc1e6751d0762275427665bdd76d1e917aad82b17 \
  --module allowlist \
  --function create_allowlist_entry \
  --args "My Resume Access Control" \
  --gas-budget 10000000
```

---

### 第二步: 使用 Seal 加密创建简历

1. **创建简历时启用 Seal**
   - 导航至: **Create Resume**
   - 填写简历信息
   - 点击 **"高级选项"** 按钮

2. **配置 Seal 加密**
   - 勾选 **"启用 Seal 加密"**
   - 填入 **Allowlist ID** (从第一步获取)
   - 填入 **Cap ID** (从第一步获取)

3. **完成创建**
   - 点击 **"完成"** 按钮
   - 确认两次交易:
     1. 创建加密简历
     2. 关联 Blob 到 Allowlist
   - 创建成功!

---

### 第三步: 添加访问者到白名单

#### 场景: HR 购买简历后获得访问权限

1. **获取 HR 的 Sui 地址**
   - HR 在购买后会提供他们的 Sui 钱包地址
   - 例如: `0x1234567890abcdef...`

2. **添加 HR 到白名单**
   
   **方法 1: 使用 Web UI**
   - 访问 Allowlist 管理页面
   - 找到 **"添加地址到白名单"** 部分
   - 填入 **Allowlist ID**
   - 填入 **Cap ID**
   - 填入 **HR 的地址**
   - 点击 **"添加到白名单"**

   **方法 2: 使用 resumeService API**
   ```javascript
   import { resumeService } from './services';
   
   await resumeService.addToResumeAllowlist(
     allowlistId,      // 你的 Allowlist ID
     capId,            // 你的 Cap ID
     hrAddress,        // HR 的 Sui 地址
     signAndExecute    // 钱包签名函数
   );
   ```

3. **通知 HR**
   - 告知 HR 已添加访问权限
   - HR 现在可以使用 Seal 解密查看简历

---

### 第四步: HR 解密查看简历

1. **HR 浏览简历列表**
   - 导航至: **Browse Resumes**
   - 找到你的简历

2. **点击解锁**
   - 系统检测到这是 Seal 加密的简历
   - 自动显示 **Seal 解密弹窗**

3. **自动解密**
   - 如果 HR 在白名单中,系统会自动获取 SessionKey
   - 使用 SessionKey 解密简历内容
   - 显示完整简历

---

## 🎯 两种加密方式对比

### 简单加密 (Simple Encryption)

```
优点:
✅ 简单快速,无需链上操作
✅ 不需要 Gas 费用
✅ 适合个人使用

缺点:
❌ 密钥需要手动分享
❌ 无法动态管理访问权限
❌ 密钥泄露风险

使用场景:
- 个人简历存储
- 临时分享给朋友
```

### Seal 加密 (Threshold Encryption)

```
优点:
✅ 基于链上 Allowlist 控制访问
✅ 支持动态添加/移除访问者
✅ 密钥由多个服务器分布式管理
✅ 适合商业场景(付费解锁)

缺点:
❌ 需要先创建 Allowlist
❌ 需要支付 Gas 费用
❌ 稍微复杂

使用场景:
- HR 付费解锁
- 订阅服务
- 企业级访问控制
```

---

## 🔍 如何在 Sui Explorer 中查看对象

### 查看 Allowlist

```
1. 访问: https://suiscan.xyz/testnet/object/<ALLOWLIST_ID>
2. 可以看到:
   - Object Type: walrus::allowlist::Allowlist
   - 白名单成员列表 (list 字段)
   - 关联的 Blobs
```

### 查看 Cap

```
1. 访问: https://suiscan.xyz/testnet/object/<CAP_ID>
2. 可以看到:
   - Object Type: walrus::allowlist::Cap
   - 关联的 Allowlist ID
   - Owner: 你的地址
```

---

## 💡 最佳实践

### 1. Allowlist 管理

- ✅ 一个 Allowlist 可以控制多份简历
- ✅ 为不同用途创建不同的 Allowlist (例如: 工作简历、学术简历)
- ✅ 定期审查白名单成员
- ✅ 妥善保管 Cap ID (类似私钥)

### 2. 访问控制策略

**方案 A: 一个简历一个 Allowlist**
```
适用场景: 每份简历的访问者不同
优点: 细粒度控制
缺点: 需要管理多个 Allowlist
```

**方案 B: 多个简历共享一个 Allowlist**
```
适用场景: 多份简历的访问者相同
优点: 管理简单
缺点: 无法单独控制某份简历
```

### 3. Gas 费用优化

- 批量添加地址到白名单
- 重用现有的 Allowlist
- 使用主网前在测试网充分测试

---

## 🐛 常见问题

### Q1: 创建 Allowlist 后找不到 ID?

**A**: 
1. 检查 Sui Explorer 的 **"Created Objects"** 标签
2. 找到类型为 `walrus::allowlist::Allowlist` 的对象
3. 找到类型为 `walrus::allowlist::Cap` 的对象

### Q2: 添加地址到白名单失败?

**A**: 确认:
1. Cap ID 是否正确
2. Allowlist ID 是否正确
3. 你是否持有该 Cap (在你的钱包中)
4. 地址格式是否正确 (0x 开头)

### Q3: HR 无法解密简历?

**A**: 检查:
1. HR 地址是否已添加到白名单
2. HR 是否连接了正确的钱包
3. Allowlist ID 是否与简历匹配
4. 网络是否正常

### Q4: Cap 丢失了怎么办?

**A**: 
- ⚠️ Cap 无法恢复!
- 但 Allowlist 仍然有效
- 只是无法再添加/移除成员
- 建议: 备份 Cap ID 到多个安全位置

---

## 📚 相关文档

- [Seal 官方文档](https://docs.walrus.site/walrus-sites/seal.html)
- [Walrus SDK](https://sdk.mystenlabs.com/walrus)
- [Sui Move Allowlist 合约](../../examples/move/sources/allowlist.move)
- [Frontend 集成指南](./SEAL_INTEGRATION_SUMMARY.md)

---

## 🎉 总结

使用 Seal + Allowlist 可以实现:

1. ✅ **链上访问控制** - 通过智能合约控制谁可以访问
2. ✅ **动态权限管理** - 随时添加/移除访问者
3. ✅ **商业化支持** - 适合付费解锁、订阅等场景
4. ✅ **去中心化存储** - 数据存储在 Walrus,加密密钥分布式管理
5. ✅ **安全可靠** - 基于阈值加密,密钥永不暴露

**快速开始**:
1. 导航至 `/#/allowlist` 创建你的第一个 Allowlist
2. 在创建简历时启用 Seal 加密
3. 邀请 HR 购买并添加到白名单
4. HR 自动解密查看!
