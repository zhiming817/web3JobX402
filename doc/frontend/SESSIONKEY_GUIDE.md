# 🔑 Seal SessionKey 完整指南

## 📖 问题历史

### 错误 1: `sealClient.createSessionKey is not a function`
```javascript
// ❌ 错误
const sealClient = getSealClient();
const sessionKey = await sealClient.createSessionKey({...});
```

**问题**: SealClient 没有 `createSessionKey` 方法

---

### 错误 2: `SessionKey.fromSigner is not a function`
```javascript
// ❌ 错误
const { SessionKey } = await import('@mysten/seal');
const sessionKey = SessionKey.fromSigner(currentAccount.address);
```

**问题**: SessionKey 没有 `fromSigner` 静态方法

---

## ✅ 正确用法

### 完整代码示例

```javascript
import { useSignPersonalMessage } from '@mysten/dapp-kit';

function MyComponent() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  const decryptSealResume = async (blobId, encryptionId, policyObjectId) => {
    try {
      // 1. 检查钱包连接
      if (!currentAccount?.address) {
        throw new Error('请先连接钱包');
      }

      // 2. 导入依赖
      const { SessionKey } = await import('@mysten/seal');
      const { getSuiClient } = await import('../utils/sealClient');
      const { SEAL_CONFIG } = await import('../config/seal.config');
      
      const suiClient = getSuiClient();
      
      // 3. 创建 SessionKey (配置参数)
      console.log('🔑 创建 SessionKey...');
      const sessionKey = await SessionKey.create({
        address: currentAccount.address,    // 用户地址
        packageId: SEAL_CONFIG.packageId,   // Seal 包 ID
        ttlMin: 10,                         // 有效期 10 分钟 (Seal 限制 1-30)
        suiClient,                          // Sui 客户端
      });

      // 4. 获取待签名消息
      const personalMessage = sessionKey.getPersonalMessage();
      
      // 5. 请求用户签名 (钱包弹窗)
      console.log('✍️ 请在钱包中签名...');
      const result = await signPersonalMessage({
        message: personalMessage,
      });
      
      // 6. 设置签名
      await sessionKey.setPersonalMessageSignature(result.signature);
      console.log('✅ SessionKey 创建并签名成功');

      // 7. 使用 SessionKey 解密
      const decrypted = await downloadAndDecryptResume(
        blobId,
        sessionKey,      // 传递已签名的 SessionKey
        policyObjectId
      );

      return decrypted;
    } catch (error) {
      console.error('❌ 解密失败:', error);
      throw error;
    }
  };

  return (
    // ... 组件 UI
  );
}
```

---

## 🔄 完整流程图

```
用户操作
  ↓
1. 连接钱包
   currentAccount.address
  ↓
2. 创建 SessionKey 配置
   SessionKey.create({
     address,
     packageId,
     ttlMin: 60,
     suiClient
   })
  ↓
3. 获取待签名消息
   sessionKey.getPersonalMessage()
  ↓
4. 钱包签名 (用户确认)
   signPersonalMessage({ message })
  ↓
5. 设置签名
   sessionKey.setPersonalMessageSignature(signature)
  ↓
6. SessionKey 就绪 ✅
  ↓
7. 下载 Walrus 数据
   downloadFromWalrus(blobId)
  ↓
8. Seal 解密
   sealClient.decrypt({
     sessionKey,
     encryptedObject,
     policyObjectId
   })
  ↓
9. 返回明文数据 ✨
```

---

## 📋 关键参数说明

### SessionKey.create() 参数

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `address` | string | 用户的 Sui 地址 | `currentAccount.address` |
| `packageId` | string | Seal 包 ID | `0x5520...2b17` |
| `ttlMin` | number | 有效期(分钟) **范围 1-30** | `10` (建议) |
| `suiClient` | SuiClient | Sui 客户端实例 | `getSuiClient()` |

### downloadAndDecryptResume() 参数

| 参数 | 类型 | 说明 | 来源 |
|------|------|------|------|
| `blobId` | string | Walrus blob ID | 后端 API 返回 |
| `sessionKey` | SessionKey | 已签名的会话密钥 | `SessionKey.create()` |
| `policyObjectId` | string | Allowlist 对象 ID | 后端 API 返回 |

---

## ⚠️ 常见错误

### 1. 忘记签名
```javascript
// ❌ 错误: 没有调用 setPersonalMessageSignature
const sessionKey = await SessionKey.create({...});
// 直接使用会报错!
await downloadAndDecryptResume(blobId, sessionKey, policyObjectId);
```

```javascript
// ✅ 正确: 必须先签名
const sessionKey = await SessionKey.create({...});
const message = sessionKey.getPersonalMessage();
const result = await signPersonalMessage({ message });
await sessionKey.setPersonalMessageSignature(result.signature);
// 现在可以使用了
await downloadAndDecryptResume(blobId, sessionKey, policyObjectId);
```

---

### 2. 缺少必要的 Hook
```javascript
// ❌ 错误: 没有导入 useSignPersonalMessage
function MyComponent() {
  const currentAccount = useCurrentAccount();
  // signPersonalMessage 未定义!
  const result = await signPersonalMessage({...}); // 报错
}
```

```javascript
// ✅ 正确: 导入所需 Hook
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';

function MyComponent() {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  
  // 现在可以使用了
  const result = await signPersonalMessage({...});
}
```

---

```javascript
// ❌ 错误: ttlMin 超出范围 (1-30)
const sessionKey = await SessionKey.create({
  address: currentAccount.address,
  packageId: SEAL_CONFIG.packageId,
  ttlMin: 60, // 错误! 必须在 1-30 之间
  suiClient,
});
// 报错: Invalid TTL 60, must be between 1 and 30
```

```javascript
// ✅ 正确: 使用有效的 ttlMin 值
const sessionKey = await SessionKey.create({
  address: currentAccount.address,
  packageId: SEAL_CONFIG.packageId,
  ttlMin: 10, // 正确: 10 分钟
  suiClient,
});
```

---

### 4. 参数类型错误
```javascript
// ❌ 错误: packageId 格式不正确
const sessionKey = await SessionKey.create({
  address: currentAccount.address,
  packageId: 'seal-package', // 错误! 需要完整的对象 ID
  ttlMin: 60,
  suiClient,
});
```

```javascript
// ✅ 正确: 使用完整的对象 ID
const sessionKey = await SessionKey.create({
  address: currentAccount.address,
  packageId: '0x55202f19ccbb6d2d518cf11bc1e6751d0762275427665bdd76d1e917aad82b17',
  ttlMin: 60,
  suiClient,
});
```

---

## 💡 最佳实践

### 1. SessionKey 缓存
SessionKey 有 10 分钟有效期,可以缓存复用:

```javascript
import { useState, useCallback } from 'react';

function useSessionKey() {
  const [cachedSessionKey, setCachedSessionKey] = useState(null);
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  const getOrCreateSessionKey = useCallback(async () => {
    // 检查缓存是否有效
    if (cachedSessionKey && !cachedSessionKey.isExpired()) {
      console.log('♻️ 使用缓存的 SessionKey');
      return cachedSessionKey;
    }

    // 创建新的 SessionKey
    console.log('🔑 创建新的 SessionKey');
    const { SessionKey } = await import('@mysten/seal');
    const { getSuiClient } = await import('../utils/sealClient');
    const { SEAL_CONFIG } = await import('../config/seal.config');
    
    const suiClient = getSuiClient();
    
    const sessionKey = await SessionKey.create({
      address: currentAccount.address,
      packageId: SEAL_CONFIG.packageId,
      ttlMin: 10, // 10 分钟有效期
      suiClient,
    });

    const message = sessionKey.getPersonalMessage();
    const result = await signPersonalMessage({ message });
    await sessionKey.setPersonalMessageSignature(result.signature);

    // 缓存
    setCachedSessionKey(sessionKey);
    return sessionKey;
  }, [cachedSessionKey, currentAccount, signPersonalMessage]);

  return getOrCreateSessionKey;
}
```

---

### 2. 错误处理
```javascript
const decryptWithRetry = async (blobId, policyObjectId, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const sessionKey = await getOrCreateSessionKey();
      const decrypted = await downloadAndDecryptResume(
        blobId,
        sessionKey,
        policyObjectId
      );
      return decrypted;
    } catch (error) {
      if (error.message.includes('NoAccess')) {
        // 权限错误不重试
        throw new Error('您不在简历的访问白名单中');
      }
      
      if (error.message.includes('expired')) {
        // SessionKey 过期,清除缓存并重试
        console.log('🔄 SessionKey 已过期,重新创建...');
        setCachedSessionKey(null);
        continue;
      }
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      console.log(`⚠️ 解密失败,重试 ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};
```

---

### 3. 用户体验优化
```javascript
const [isSigningSessionKey, setIsSigningSessionKey] = useState(false);
const [isDecrypting, setIsDecrypting] = useState(false);

const decryptResume = async (blobId, policyObjectId) => {
  try {
    // 第一步: 创建并签名 SessionKey
    setIsSigningSessionKey(true);
    const sessionKey = await getOrCreateSessionKey();
    setIsSigningSessionKey(false);
    
    // 第二步: 解密
    setIsDecrypting(true);
    const decrypted = await downloadAndDecryptResume(
      blobId,
      sessionKey,
      policyObjectId
    );
    
    return decrypted;
  } catch (error) {
    throw error;
  } finally {
    setIsSigningSessionKey(false);
    setIsDecrypting(false);
  }
};

// UI 显示
{isSigningSessionKey && (
  <div className="alert">
    🔑 请在钱包中签名 SessionKey...
  </div>
)}

{isDecrypting && (
  <div className="alert">
    🔓 正在解密简历数据...
  </div>
)}
```

---

## 🔗 参考资料

- [Seal 官方文档](https://docs.walrus.site/walrus-sites/seal.html)
- [@mysten/seal SDK](https://www.npmjs.com/package/@mysten/seal)
- [@mysten/dapp-kit](https://sdk.mystenlabs.com/dapp-kit)
- [SessionKey API Reference](https://github.com/MystenLabs/sui/tree/main/sdk/seal)
- [示例代码](../examples/frontend/src/SubscriptionView.tsx)

---

## 📝 已修复的文件

1. ✅ `frontend/web/src/resume/ResumeEdit.jsx`
2. ✅ `frontend/web/src/resume/ResumeBrowse.jsx`
3. ✅ `frontend/web/src/resume/ResumePreviewPage.jsx`

现在可以正常创建 SessionKey 并解密 Seal 加密的简历了! 🎉
