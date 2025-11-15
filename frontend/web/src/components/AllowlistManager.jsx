/**
 * Allowlist 管理组件
 * 用于创建和管理简历访问控制白名单
 */
import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { resumeService } from '../services';
import PublishBlobToAllowlist from './PublishBlobToAllowlist';
import {
  fetchUserAllowlists,
  createAllowlistTransaction,
  createAddMemberTransaction,
  createRemoveMemberTransaction,
  validateSuiAddress,
  extractCreatedObjectIds,
  formatAllowlistCreatedMessage,
  saveAllowlistToLocalStorage,
  loadAllowlistHistoryFromLocalStorage,
  copyToClipboard,
  openSuiExplorer,
  openSuiExplorerTx,
} from '../utils/allowlistUtils';

export default function AllowlistManager({ onAllowlistCreated }) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [isCreating, setIsCreating] = useState(false);
  const [allowlistName, setAllowlistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [allowlistHistory, setAllowlistHistory] = useState(() => {
    // 从 localStorage 加载历史记录
    return loadAllowlistHistoryFromLocalStorage();
  });
  const [isLoadingOnChain, setIsLoadingOnChain] = useState(false);
  const [onChainAllowlists, setOnChainAllowlists] = useState([]);
  const [managingAllowlist, setManagingAllowlist] = useState(null); // 正在管理的 Allowlist
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // 从链上查询用户的 Allowlist Cap 对象
  const loadOnChainAllowlists = async () => {
    if (!currentAccount?.address) {
      console.log('⚠️ 未连接钱包');
      return;
    }

    setIsLoadingOnChain(true);
    try {
      const allowlists = await fetchUserAllowlists(suiClient, currentAccount.address);
      setOnChainAllowlists(allowlists);
    } catch (error) {
      console.error('❌ 查询链上 Allowlist 失败:', error);
      alert('查询链上数据失败: ' + error.message);
    } finally {
      setIsLoadingOnChain(false);
    }
  };

  // 组件加载时自动查询链上数据
  useEffect(() => {
    if (currentAccount?.address) {
      loadOnChainAllowlists();
    }
  }, [currentAccount?.address]);

  // 添加成员到白名单
  const handleAddMember = async (allowlist) => {
    const address = newMemberAddress.trim();
    
    if (!address) {
      alert('请输入地址');
      return;
    }

    // 验证地址格式
    if (!validateSuiAddress(address)) {
      alert('地址格式错误，必须是有效的 Sui 地址（0x 开头的十六进制字符串）');
      return;
    }

    setIsAddingMember(true);
    try {
      console.log('➕ 添加成员到白名单...', {
        allowlistId: allowlist.allowlistId,
        capId: allowlist.capId,
        address,
      });

      const tx = createAddMemberTransaction(allowlist.allowlistId, allowlist.capId, address);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('✅ 成员添加成功!', result);
            alert(`✅ 成功添加到白名单！\n\n地址: ${address}`);
            setNewMemberAddress('');
            setManagingAllowlist(null);
            // 重新加载链上数据
            loadOnChainAllowlists();
          },
          onError: (error) => {
            console.error('❌ 添加失败:', error);
            alert('添加失败: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('❌ 添加失败:', error);
      alert('添加失败: ' + error.message);
    } finally {
      setIsAddingMember(false);
    }
  };

  // 从白名单移除成员
  const handleRemoveMember = async (allowlist, memberAddress) => {
    if (!confirm(`确认要移除这个地址吗？\n\n${memberAddress}`)) {
      return;
    }

    setIsRemovingMember(true);
    try {
      console.log('➖ 从白名单移除成员...', {
        allowlistId: allowlist.allowlistId,
        capId: allowlist.capId,
        address: memberAddress,
      });

      const tx = createRemoveMemberTransaction(allowlist.allowlistId, allowlist.capId, memberAddress);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('✅ 成员移除成功!', result);
            alert(`✅ 成功从白名单移除！\n\n地址: ${memberAddress}`);
            // 重新加载链上数据
            loadOnChainAllowlists();
          },
          onError: (error) => {
            console.error('❌ 移除失败:', error);
            alert('移除失败: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('❌ 移除失败:', error);
      alert('移除失败: ' + error.message);
    } finally {
      setIsRemovingMember(false);
    }
  };

  // 创建新的 Allowlist
  const handleCreateAllowlist = async () => {
    if (!allowlistName.trim()) {
      alert('请输入 Allowlist 名称');
      return;
    }

    setIsCreating(true);

    try {
      console.log('🆕 创建 Allowlist...');
      
      const tx = createAllowlistTransaction(allowlistName);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('✅ Allowlist 创建成功!', result);
            
            // 解析创建的对象获取 allowlistId 和 capId
            const { allowlistId, capId } = extractCreatedObjectIds(result);
            
            // 构建详细的成功消息
            const message = formatAllowlistCreatedMessage(allowlistId, capId, result.digest);
            alert(message);
            
            // 尝试复制 Allowlist ID 到剪贴板
            if (allowlistId) {
              copyToClipboard(allowlistId, 'Allowlist ID');
            }
            
            // 打开浏览器
            openSuiExplorerTx(result.digest);
            
            // 保存到历史记录
            if (allowlistId && capId) {
              const newRecord = saveAllowlistToLocalStorage(
                allowlistName,
                allowlistId,
                capId,
                result.digest
              );
              setAllowlistHistory([newRecord, ...allowlistHistory]);
            }
            
            setAllowlistName('');
            setShowCreateForm(false);
            
            // 重新加载链上数据
            loadOnChainAllowlists();
            
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

      {/* 链上 Allowlist 列表 */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            🔗 链上 Allowlist 列表
          </h3>
          <button
            onClick={loadOnChainAllowlists}
            disabled={isLoadingOnChain || !currentAccount?.address}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
          >
            {isLoadingOnChain ? '加载中...' : '刷新'}
          </button>
        </div>

        {!currentAccount?.address ? (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              ⚠️ 请先连接钱包以查看链上数据
            </p>
          </div>
        ) : isLoadingOnChain ? (
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">正在从链上加载数据...</p>
          </div>
        ) : onChainAllowlists.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-600">📭 暂无 Allowlist</p>
            <p className="text-sm text-gray-500 mt-2">创建第一个 Allowlist 开始使用</p>
          </div>
        ) : (
          <div className="space-y-3">
            {onChainAllowlists.map((allowlist, index) => (
              <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-green-600">🔗</span>
                    {allowlist.name}
                  </h4>
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                    链上数据
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <label className="text-gray-600 block mb-1">Allowlist ID:</label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-200 text-xs break-all">
                        {allowlist.allowlistId}
                      </code>
                      <button
                        onClick={() => {
                          copyToClipboard(allowlist.allowlistId, 'Allowlist ID');
                          alert('✅ Allowlist ID 已复制');
                        }}
                        className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs whitespace-nowrap"
                      >
                        复制
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-600 block mb-1">Cap ID:</label>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-200 text-xs break-all">
                        {allowlist.capId}
                      </code>
                      <button
                        onClick={() => {
                          copyToClipboard(allowlist.capId, 'Cap ID');
                          alert('✅ Cap ID 已复制');
                        }}
                        className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs whitespace-nowrap"
                      >
                        复制
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-600 block mb-1">
                      白名单成员 ({allowlist.members.length}):
                    </label>
                    {allowlist.members.length === 0 ? (
                      <div className="bg-white px-3 py-2 rounded border border-gray-200 text-gray-500 text-xs">
                        暂无成员
                      </div>
                    ) : (
                      <div className="bg-white px-3 py-2 rounded border border-gray-200 max-h-32 overflow-y-auto">
                        {allowlist.members.map((member, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                            <code className="text-xs text-gray-700 font-mono flex-1 truncate">
                              {member}
                            </code>
                            <button
                              onClick={() => handleRemoveMember(allowlist, member)}
                              disabled={isRemovingMember}
                              className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs disabled:opacity-50"
                              title="移除此地址"
                            >
                              移除
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 添加成员表单 */}
                  {managingAllowlist?.allowlistId === allowlist.allowlistId ? (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <h5 className="text-sm font-semibold text-blue-900 mb-2">添加新成员</h5>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMemberAddress}
                          onChange={(e) => setNewMemberAddress(e.target.value)}
                          placeholder="输入 Sui 地址 (0x...)"
                          className="flex-1 px-3 py-2 border border-blue-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => handleAddMember(allowlist)}
                          disabled={isAddingMember || !newMemberAddress.trim()}
                          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs disabled:opacity-50 whitespace-nowrap"
                        >
                          {isAddingMember ? '添加中...' : '添加'}
                        </button>
                        <button
                          onClick={() => {
                            setManagingAllowlist(null);
                            setNewMemberAddress('');
                          }}
                          className="px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 text-xs"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setManagingAllowlist(allowlist)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                    >
                      ➕ 添加成员
                    </button>
                  )}
                </div>

                {/* 关联 Blob 功能 */}
                <div className="mt-3">
                  <PublishBlobToAllowlist
                    allowlistId={allowlist.allowlistId}
                    capId={allowlist.capId}
                    onPublished={(data) => {
                      console.log('✅ Blob 已关联:', data);
                      // 可以选择刷新列表或显示通知
                    }}
                  />
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openSuiExplorer(allowlist.allowlistId)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                  >
                    查看 Allowlist
                  </button>
                  <button
                    onClick={() => openSuiExplorer(allowlist.capId)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                  >
                    查看 Cap
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 历史记录 */}
      {allowlistHistory.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            📚 本地历史记录
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
                          copyToClipboard(record.allowlistId, 'Allowlist ID');
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
                          copyToClipboard(record.capId, 'Cap ID');
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
                      onClick={() => openSuiExplorer(record.allowlistId)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                    >
                      查看 Allowlist
                    </button>
                    <button
                      onClick={() => openSuiExplorerTx(record.txHash)}
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
