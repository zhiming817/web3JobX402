# 🔧 Seal 访问权限问题排查指南

## ❌ 错误: "您不在此简历的访问白名单中"

### 问题原因

当你看到这个错误时，说明：
1. ✅ Seal 加密和 SessionKey 创建都成功了
2. ✅ Walrus 数据下载成功了  
3. ❌ **但是当前钱包地址不在 Allowlist 中，无法解密**

---

## 🔍 排查步骤

### Step 1: 确认当前钱包地址

```javascript
// 在浏览器控制台执行
console.log('当前钱包地址:', window.suiWallet?.address);
```

记录下这个地址，例如: `0xa1b2c3d4...`

---

### Step 2: 检查简历的 Allowlist 信息

查看简历详情中的 `policy_object_id`:

```javascript
// 在浏览器控制台或网络请求中查看
{
  "id": "resume-xxx",
  "policy_object_id": "0xaf814c9992055e...",  // ← Allowlist ID
  "encryption_type": "seal"
}
```

---

### Step 3: 检查 Allowlist 成员列表

#### 方法 1: 使用 Sui Explorer

1. 访问 Sui Explorer: https://testnet.suivision.xyz/
2. 搜索你的 **Allowlist ID** (policy_object_id)
3. 查看对象详情中的 `members` 字段
4. 确认你的钱包地址是否在列表中

#### 方法 2: 使用 Sui CLI

```bash
# 查看 Allowlist 对象
sui client object <ALLOWLIST_ID>

# 示例输出
{
  "id": "0xaf814c...",
  "members": [
    "0x1234abcd...",  // 成员 1
    "0x5678efgh..."   // 成员 2
  ]
}
```

---

## ✅ 解决方案

### 方案 1: 添加自己到 Allowlist (推荐)

如果你是 Allowlist 的创建者，你拥有 **Cap ID**，可以添加自己：

#### 使用 Web UI

1. 访问 **Allowlist 管理页面**: `/#/allowlist`
2. 在 **"我的 Allowlist"** 列表中找到对应的 Allowlist
3. 点击 **"管理成员"**
4. 输入你的钱包地址
5. 点击 **"添加成员"**
6. 在钱包中确认交易

#### 使用 Sui CLI

```bash
# 添加成员到 Allowlist
sui client call \
  --package 0x55202f19ccbb6d2d518cf11bc1e6751d0762275427665bdd76d1e917aad82b17 \
  --module allowlist \
  --function add \
  --args \
    <CAP_ID> \
    <ALLOWLIST_ID> \
    <YOUR_WALLET_ADDRESS> \
  --gas-budget 10000000

# 示例
sui client call \
  --package 0x55202f19ccbb6d2d518cf11bc1e6751d0762275427665bdd76d1e917aad82b17 \
  --module allowlist \
  --function add \
  --args \
    0x789012abcdef... \
    0xaf814c9992055e... \
    0xa1b2c3d4e5f6... \
  --gas-budget 10000000
```

---

### 方案 2: 请求 Allowlist 创建者添加你

如果你不是创建者：

1. 联系简历的创建者
2. 提供你的钱包地址
3. 请求创建者将你添加到 Allowlist
4. 等待添加完成后重试访问

---

### 方案 3: 使用创建者账号查看

如果简历是你创建的，但使用了不同的钱包地址：

1. **切换到创建简历时使用的钱包**
2. 确保钱包地址匹配
3. 重新尝试访问

---

## 🎯 最佳实践

### 创建 Seal 加密简历时

在创建简历的流程中，**自动将创建者添加到 Allowlist**：

```javascript
// 推荐的创建流程
async function createSealResume(resumeData) {
  // 1. 创建 Allowlist
  const { allowlistId, capId } = await createAllowlist('我的简历访问控制');
  
  // 2. 自动添加创建者到 Allowlist
  await addMemberToAllowlist(capId, allowlistId, currentAccount.address);
  console.log('✅ 创建者已自动添加到 Allowlist');
  
  // 3. 加密并上传简历
  const { blobId, encryptionId } = await encryptAndUploadResume(
    resumeData,
    allowlistId
  );
  
  // 4. 保存到数据库
  await resumeService.createResumeWithSeal(resumeData, {
    blobId,
    encryptionId,
    policyObjectId: allowlistId,
  });
}
```

---

## 🔄 验证访问权限

添加完成后，验证是否生效：

```javascript
// 在浏览器控制台测试
const checkAccess = async () => {
  const allowlistId = '0xaf814c9992055e...';
  const myAddress = window.suiWallet.address;
  
  // 读取 Allowlist 对象
  const allowlist = await suiClient.getObject({
    id: allowlistId,
    options: { showContent: true }
  });
  
  const members = allowlist.data.content.fields.members;
  const hasAccess = members.includes(myAddress);
  
  console.log('我的地址:', myAddress);
  console.log('Allowlist 成员:', members);
  console.log('是否有访问权限:', hasAccess ? '✅ 是' : '❌ 否');
};

checkAccess();
```

---

## 📊 常见场景

### 场景 1: 个人简历（自己查看）

```
创建者地址: 0xa1b2c3d4...
Allowlist 成员: [0xa1b2c3d4...]  ← 只有创建者
访问者地址: 0xa1b2c3d4...      ← 匹配 ✅
```

**解决**: 无需额外操作，可以直接访问

---

### 场景 2: 分享给招聘者

```
创建者地址: 0xa1b2c3d4...
Allowlist 成员: [0xa1b2c3d4...]
访问者地址: 0xRecruiter...    ← 不匹配 ❌
```

**解决**: 使用 Cap 添加招聘者地址到 Allowlist

```bash
sui client call \
  --package 0x55202f19ccbb6d2d518cf11bc1e6751d0762275427665bdd76d1e917aad82b17 \
  --module allowlist \
  --function add \
  --args <CAP_ID> <ALLOWLIST_ID> 0xRecruiter... \
  --gas-budget 10000000
```

---

### 场景 3: 团队共享

```
创建者地址: 0xOwner...
Allowlist 成员: [
  0xOwner...,      // 创建者
  0xHR1...,        // HR 1
  0xHR2...,        // HR 2
  0xManager...     // 招聘经理
]
```

**解决**: 批量添加团队成员

---

## 🛡️ 安全建议

### Cap ID 管理

⚠️ **Cap ID 是管理员凭证，务必妥善保管**

1. **不要分享 Cap ID** - 任何拥有 Cap 的人都可以添加/删除成员
2. **安全存储** - 保存在安全的密码管理器中
3. **定期检查** - 定期审查 Allowlist 成员列表

### Allowlist 成员管理

1. **最小权限原则** - 只添加确实需要访问的地址
2. **及时移除** - 招聘结束后及时移除招聘者地址
3. **审计日志** - 记录谁在何时被添加/移除

---

## 🔗 相关命令速查

```bash
# 创建 Allowlist
sui client call \
  --package 0x55202f19... \
  --module allowlist \
  --function new \
  --gas-budget 10000000

# 添加成员
sui client call \
  --package 0x55202f19... \
  --module allowlist \
  --function add \
  --args <CAP_ID> <ALLOWLIST_ID> <MEMBER_ADDRESS> \
  --gas-budget 10000000

# 移除成员
sui client call \
  --package 0x55202f19... \
  --module allowlist \
  --function remove \
  --args <CAP_ID> <ALLOWLIST_ID> <MEMBER_ADDRESS> \
  --gas-budget 10000000

# 查看 Allowlist 对象
sui client object <ALLOWLIST_ID>
```

---

## 📞 需要帮助?

如果仍然无法解决问题：

1. **检查错误日志** - 浏览器控制台的完整错误信息
2. **验证链上状态** - 使用 Sui Explorer 查看对象状态
3. **确认网络** - 确保使用的是 Testnet
4. **Gas 费用** - 确保账户有足够的 SUI 支付 Gas

---

## ✅ 成功标志

当一切正常时，你应该看到：

```
🔑 创建 SessionKey...
✍️ 请在钱包中签名 SessionKey...
✅ SessionKey 创建并签名成功
📥 下载并解密 Seal 简历...
✅ Download successful!
📦 Size: 1300 bytes
🔓 Step 2: Decrypting with Seal...
✅ Seal 解密成功: { personal: {...}, skills: '...' }
```

如果看到 **"您不在此简历的访问白名单中"**，按照本指南的解决方案操作即可。
