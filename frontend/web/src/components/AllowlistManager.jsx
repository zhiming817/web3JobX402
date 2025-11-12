/**
 * Allowlist 管理组件
 * 用于创建和管理简历访问控制白名单
 */
import React, { useState } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { TESTNET_PACKAGE_ID, ALLOWLIST_MODULE_NAME } from '../config/seal.config';
import { resumeService } from '../services';

export default function AllowlistManager({ onAllowlistCreated }) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [isCreating, setIsCreating] = useState(false);
  const [allowlistName, setAllowlistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [allowlistHistory, setAllowlistHistory] = useState(() => {
    // 从 localStorage 加载历史记录
    const saved = localStorage.getItem('allowlistHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // 创建新的 Allowlist
  const handleCreateAllowlist = async () => {
    if (!allowlistName.trim()) {
      alert('请输入 Allowlist 名称');
      return;
    }

    setIsCreating(true);

    try {
      console.log('🆕 创建 Allowlist...');
      
      const tx = new Transaction();
      tx.moveCall({
        target: `${TESTNET_PACKAGE_ID}::${ALLOWLIST_MODULE_NAME}::create_allowlist_entry`,
        arguments: [tx.pure.string(allowlistName)],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('✅ Allowlist 创建成功!', result);
            
            // 解析创建的对象获取 allowlistId 和 capId
            const createdObjects = result.effects?.created || [];
            console.log('Created Objects:', createdObjects);
            
            // 找到 Allowlist 和 Cap 对象
            let allowlistId = '';
            let capId = '';
            
            createdObjects.forEach(obj => {
              const objectType = obj.owner?.Shared ? 'Allowlist' : 
                                obj.owner?.AddressOwner ? 'Cap' : '';
              
              if (obj.owner?.Shared) {
                allowlistId = obj.reference?.objectId || '';
              } else if (obj.owner?.AddressOwner) {
                capId = obj.reference?.objectId || '';
              }
            });
            
            // 构建详细的成功消息
            const message = [
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
              `交易哈希: ${result.digest}`,
            ].join('\n');
            
            alert(message);
            
            // 尝试复制 Allowlist ID 到剪贴板
            if (allowlistId) {
              navigator.clipboard.writeText(allowlistId).then(() => {
                console.log('✅ Allowlist ID 已复制到剪贴板');
              }).catch(err => {
                console.error('复制失败:', err);
              });
            }
            
            // 打开浏览器
            window.open(`https://suiscan.xyz/testnet/tx/${result.digest}`, '_blank');
            
            // 保存到历史记录
            if (allowlistId && capId) {
              const newRecord = {
                name: allowlistName,
                allowlistId,
                capId,
                createdAt: new Date().toISOString(),
                txHash: result.digest,
              };
              const updatedHistory = [newRecord, ...allowlistHistory];
              setAllowlistHistory(updatedHistory);
              localStorage.setItem('allowlistHistory', JSON.stringify(updatedHistory));
            }
            
            setAllowlistName('');
            setShowCreateForm(false);
            
            if (onAllowlistCreated) {
              onAllowlistCreated({ allowlistId, capId, result });
            }
          },
          onError: (error) => {
            console.error('❌ 创建失败:', error);
            alert('创建失败: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('❌ 创建失败:', error);
      alert('创建失败: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Allowlist 管理</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? '取消' : '创建新 Allowlist'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            创建访问控制列表
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowlist 名称 *
              </label>
              <input
                type="text"
                value={allowlistName}
                onChange={(e) => setAllowlistName(e.target.value)}
                placeholder="例如: My Resume Access Control"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white p-4 rounded border border-blue-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                📝 说明
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Allowlist 用于控制谁可以访问您的加密简历</li>
                <li>• 创建后会生成 Allowlist ID 和 Cap ID</li>
                <li>• Allowlist ID 用于加密简历</li>
                <li>• Cap ID 用于管理白名单（添加/移除地址）</li>
                <li>• 这是链上操作，需要支付 Gas 费用</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateAllowlist}
                disabled={isCreating || !allowlistName.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? '创建中...' : '创建 Allowlist'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 历史记录 */}
      {allowlistHistory.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            📚 我的 Allowlist 列表
          </h3>
          <div className="space-y-3">
            {allowlistHistory.map((record, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{record.name}</h4>
                  <span className="text-xs text-gray-500">
                    {new Date(record.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <label className="text-gray-600 font-medium">🔗 Allowlist ID:</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 text-xs break-all">
                        {record.allowlistId}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(record.allowlistId);
                          alert('✅ Allowlist ID 已复制到剪贴板');
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                      >
                        复制
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-gray-600 font-medium">🔑 Cap ID:</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-300 text-xs break-all">
                        {record.capId}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(record.capId);
                          alert('✅ Cap ID 已复制到剪贴板');
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                      >
                        复制
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => window.open(`https://suiscan.xyz/testnet/object/${record.allowlistId}`, '_blank')}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                    >
                      查看 Allowlist
                    </button>
                    <button
                      onClick={() => window.open(`https://suiscan.xyz/testnet/tx/${record.txHash}`, '_blank')}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-xs"
                    >
                      查看交易
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          使用指南
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm text-gray-600">
          <p><strong>步骤 1:</strong> 创建 Allowlist（获取 Allowlist ID 和 Cap ID）</p>
          <p><strong>步骤 2:</strong> 在创建简历时启用 Seal 加密并填入 Allowlist ID 和 Cap ID</p>
          <p><strong>步骤 3:</strong> HR 购买简历后，使用 Cap ID 添加 HR 地址到白名单</p>
          <p><strong>步骤 4:</strong> HR 可以使用 SessionKey 解密查看简历</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 添加地址到白名单组件
 */
export function AddToAllowlist({ allowlistId, capId, onAddressAdded }) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [address, setAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!address.trim()) {
      alert('请输入地址');
      return;
    }

    setIsAdding(true);

    try {
      await resumeService.addToResumeAllowlist(
        allowlistId,
        capId,
        address.trim(),
        signAndExecute
      );

      alert(`✅ 地址已添加到白名单！\n\n地址: ${address}`);
      setAddress('');
      
      if (onAddressAdded) {
        onAddressAdded(address);
      }
    } catch (error) {
      console.error('添加失败:', error);
      alert('添加失败: ' + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h4 className="text-sm font-semibold text-green-900 mb-3">
        添加地址到白名单
      </h4>
      
      <div className="space-y-3">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Sui 地址 (0x...)"
          className="w-full px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        
        <button
          onClick={handleAdd}
          disabled={isAdding || !address.trim()}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          {isAdding ? '添加中...' : '添加到白名单'}
        </button>
      </div>
    </div>
  );
}
