/**
 * Allowlist 工具函数
 * 处理链上 Allowlist 的查询和操作
 */
import { Transaction } from '@mysten/sui/transactions';
import { TESTNET_PACKAGE_ID, ALLOWLIST_MODULE_NAME } from '../config/seal.config';

/**
 * 从链上查询用户的所有 Allowlist
 * @param {Object} suiClient - Sui 客户端
 * @param {string} userAddress - 用户地址
 * @returns {Promise<Array>} Allowlist 列表
 */
export async function fetchUserAllowlists(suiClient, userAddress) {
  if (!userAddress) {
    console.log('⚠️ 未提供用户地址');
    return [];
  }

  try {
    console.log('🔍 查询链上 Allowlist Cap 对象...');
    
    // 查询用户拥有的所有 Cap 对象
    const result = await suiClient.getOwnedObjects({
      owner: userAddress,
      options: {
        showContent: true,
        showType: true,
      },
      filter: {
        StructType: `${TESTNET_PACKAGE_ID}::${ALLOWLIST_MODULE_NAME}::Cap`,
      },
    });

    console.log('📡 链上查询结果:', result);

    if (!result.data || result.data.length === 0) {
      console.log('📭 未找到 Cap 对象');
      return [];
    }

    // 解析 Cap 对象，获取关联的 Allowlist ID
    const caps = result.data
      .map(obj => {
        const content = obj.data?.content;
        if (content?.dataType === 'moveObject' && content?.fields) {
          return {
            capId: obj.data.objectId,
            allowlistId: content.fields.allowlist_id,
          };
        }
        return null;
      })
      .filter(Boolean);

    console.log('✅ 找到', caps.length, '个 Cap 对象:', caps);

    // 查询每个 Allowlist 的详细信息
    const allowlistsWithDetails = await Promise.all(
      caps.map(async (cap) => {
        try {
          const allowlistObj = await suiClient.getObject({
            id: cap.allowlistId,
            options: { showContent: true },
          });

          const allowlistContent = allowlistObj.data?.content;
          if (allowlistContent?.dataType === 'moveObject' && allowlistContent?.fields) {
            return {
              capId: cap.capId,
              allowlistId: cap.allowlistId,
              name: allowlistContent.fields.name || '未命名',
              members: allowlistContent.fields.list || [],
            };
          }
        } catch (err) {
          console.error('❌ 查询 Allowlist 详情失败:', err);
        }
        return null;
      })
    );

    const validAllowlists = allowlistsWithDetails.filter(Boolean);
    console.log('✅ 加载', validAllowlists.length, '个 Allowlist 详情:', validAllowlists);
    
    return validAllowlists;
  } catch (error) {
    console.error('❌ 查询链上 Allowlist 失败:', error);
    throw error;
  }
}

/**
 * 创建 Allowlist 的交易
 * @param {string} allowlistName - Allowlist 名称
 * @returns {Transaction} Sui 交易对象
 */
export function createAllowlistTransaction(allowlistName) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${TESTNET_PACKAGE_ID}::${ALLOWLIST_MODULE_NAME}::create_allowlist_entry`,
    arguments: [tx.pure.string(allowlistName)],
  });
  return tx;
}

/**
 * 创建添加成员到白名单的交易
 * @param {string} allowlistId - Allowlist 对象 ID
 * @param {string} capId - Cap 对象 ID
 * @param {string} memberAddress - 要添加的成员地址
 * @returns {Transaction} Sui 交易对象
 */
export function createAddMemberTransaction(allowlistId, capId, memberAddress) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${TESTNET_PACKAGE_ID}::${ALLOWLIST_MODULE_NAME}::add`,
    arguments: [
      tx.object(allowlistId),
      tx.object(capId),
      tx.pure.address(memberAddress),
    ],
  });
  return tx;
}

/**
 * 创建从白名单移除成员的交易
 * @param {string} allowlistId - Allowlist 对象 ID
 * @param {string} capId - Cap 对象 ID
 * @param {string} memberAddress - 要移除的成员地址
 * @returns {Transaction} Sui 交易对象
 */
export function createRemoveMemberTransaction(allowlistId, capId, memberAddress) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${TESTNET_PACKAGE_ID}::${ALLOWLIST_MODULE_NAME}::remove`,
    arguments: [
      tx.object(allowlistId),
      tx.object(capId),
      tx.pure.address(memberAddress),
    ],
  });
  return tx;
}

/**
 * 创建关联 Blob 到 Allowlist 的交易
 * @param {string} allowlistId - Allowlist 对象 ID
 * @param {string} capId - Cap 对象 ID
 * @param {string} blobId - Walrus Blob ID
 * @returns {Transaction} Sui 交易对象
 */
export function createPublishBlobTransaction(allowlistId, capId, blobId) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${TESTNET_PACKAGE_ID}::${ALLOWLIST_MODULE_NAME}::publish`,
    arguments: [
      tx.object(allowlistId),
      tx.object(capId),
      tx.pure.string(blobId),
    ],
  });
  return tx;
}

/**
 * 验证 Sui 地址格式
 * @param {string} address - 地址字符串
 * @returns {boolean} 是否有效
 */
export function validateSuiAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  const trimmed = address.trim();
  
  // 必须以 0x 开头
  if (!trimmed.startsWith('0x')) {
    return false;
  }
  
  // 0x 后面必须有内容
  if (trimmed.length <= 2) {
    return false;
  }
  
  // 检查是否只包含十六进制字符
  const hexPart = trimmed.slice(2);
  return /^[0-9a-fA-F]+$/.test(hexPart);
}

/**
 * 从交易结果中提取创建的对象 ID
 * @param {Object} result - 交易执行结果
 * @returns {Object} { allowlistId, capId }
 */
export function extractCreatedObjectIds(result) {
  const createdObjects = result.effects?.created || [];
  
  let allowlistId = '';
  let capId = '';
  
  createdObjects.forEach(obj => {
    if (obj.owner?.Shared) {
      // Shared 对象是 Allowlist
      allowlistId = obj.reference?.objectId || '';
    } else if (obj.owner?.AddressOwner) {
      // AddressOwner 对象是 Cap
      capId = obj.reference?.objectId || '';
    }
  });
  
  return { allowlistId, capId };
}

/**
 * 格式化 Allowlist 创建成功消息
 * @param {string} allowlistId - Allowlist ID
 * @param {string} capId - Cap ID
 * @param {string} txHash - 交易哈希
 * @returns {string} 格式化的消息
 */
export function formatAllowlistCreatedMessage(allowlistId, capId, txHash) {
  return [
    '✅ Allowlist 创建成功！',
    '',
    '📋 请复制以下 ID 用于创建简历:',
    '',
    '🔗 Allowlist ID:',
    allowlistId || '(请在 Explorer 中查看)',
    '',
    '🔑 Cap ID:',
    capId || '(请在 Explorer 中查看)',
    '',
    '📝 这两个 ID 需要在创建简历时填入',
    '',
    `交易哈希: ${txHash}`,
  ].join('\n');
}

/**
 * 保存 Allowlist 到本地存储
 * @param {string} name - Allowlist 名称
 * @param {string} allowlistId - Allowlist ID
 * @param {string} capId - Cap ID
 * @param {string} txHash - 交易哈希
 * @returns {Object} 保存的记录
 */
export function saveAllowlistToLocalStorage(name, allowlistId, capId, txHash) {
  const newRecord = {
    name,
    allowlistId,
    capId,
    createdAt: new Date().toISOString(),
    txHash,
  };
  
  const saved = localStorage.getItem('allowlistHistory');
  const history = saved ? JSON.parse(saved) : [];
  const updatedHistory = [newRecord, ...history];
  
  localStorage.setItem('allowlistHistory', JSON.stringify(updatedHistory));
  
  return newRecord;
}

/**
 * 从本地存储加载 Allowlist 历史
 * @returns {Array} Allowlist 历史记录
 */
export function loadAllowlistHistoryFromLocalStorage() {
  const saved = localStorage.getItem('allowlistHistory');
  return saved ? JSON.parse(saved) : [];
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @param {string} label - 文本标签（用于提示）
 */
export async function copyToClipboard(text, label = '内容') {
  try {
    await navigator.clipboard.writeText(text);
    console.log(`✅ ${label} 已复制到剪贴板`);
    return true;
  } catch (err) {
    console.error('复制失败:', err);
    return false;
  }
}

/**
 * 打开 Sui Explorer 查看对象
 * @param {string} objectId - 对象 ID
 * @param {string} network - 网络（testnet/mainnet）
 */
export function openSuiExplorer(objectId, network = 'testnet') {
  const url = `https://suiscan.xyz/${network}/object/${objectId}`;
  window.open(url, '_blank');
}

/**
 * 打开 Sui Explorer 查看交易
 * @param {string} txHash - 交易哈希
 * @param {string} network - 网络（testnet/mainnet）
 */
export function openSuiExplorerTx(txHash, network = 'testnet') {
  const url = `https://suiscan.xyz/${network}/tx/${txHash}`;
  window.open(url, '_blank');
}
