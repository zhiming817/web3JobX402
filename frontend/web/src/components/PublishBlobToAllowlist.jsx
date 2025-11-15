/**
 * 关联 Blob 到 Allowlist 组件
 * 用于将加密的简历 Blob 关联到访问控制列表
 */
import React, { useState } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { TESTNET_PACKAGE_ID, ALLOWLIST_MODULE_NAME } from '../config/seal.config';

export default function PublishBlobToAllowlist({ 
  allowlistId, 
  capId, 
  onPublished,
  className = '' 
}) {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [blobId, setBlobId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handlePublish = async () => {
    const trimmedBlobId = blobId.trim();
    
    if (!trimmedBlobId) {
      alert('请输入 Blob ID');
      return;
    }

    if (!allowlistId || !capId) {
      alert('缺少 Allowlist ID 或 Cap ID');
      return;
    }

    setIsPublishing(true);

    try {
      console.log('📤 关联 Blob 到 Allowlist...', {
        allowlistId,
        capId,
        blobId: trimmedBlobId,
      });

      const tx = new Transaction();
      tx.moveCall({
        target: `${TESTNET_PACKAGE_ID}::${ALLOWLIST_MODULE_NAME}::publish`,
        arguments: [
          tx.object(allowlistId),
          tx.object(capId),
          tx.pure.string(trimmedBlobId),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('✅ Blob 关联成功!', result);
            alert(`✅ 成功关联 Blob 到 Allowlist！\n\nBlob ID: ${trimmedBlobId}\n交易哈希: ${result.digest}`);
            
            setBlobId('');
            setShowForm(false);
            
            if (onPublished) {
              onPublished({ blobId: trimmedBlobId, result });
            }
          },
          onError: (error) => {
            console.error('❌ 关联失败:', error);
            alert('关联失败: ' + error.message);
          },
        }
      );
    } catch (error) {
      console.error('❌ 关联失败:', error);
      alert('关联失败: ' + error.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-purple-200 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-purple-900">
              🔗 关联 Blob 到 Allowlist
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              将加密的简历 Blob 与此 Allowlist 关联
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs"
          >
            {showForm ? '取消' : '关联 Blob'}
          </button>
        </div>

        {showForm && (
          <div className="mt-3 space-y-3 bg-purple-50 p-3 rounded border border-purple-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Blob ID *
              </label>
              <input
                type="text"
                value={blobId}
                onChange={(e) => setBlobId(e.target.value)}
                placeholder="输入 Walrus Blob ID"
                className="w-full px-3 py-2 border border-purple-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                这是上传到 Walrus 后返回的 Blob ID
              </p>
            </div>

            <div className="bg-white p-3 rounded border border-purple-100">
              <h5 className="text-xs font-semibold text-gray-900 mb-2">📝 说明</h5>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 关联后，此 Blob 受当前 Allowlist 保护</li>
                <li>• 只有白名单成员可以解密查看</li>
                <li>• 一个 Allowlist 可以关联多个 Blob</li>
                <li>• 需要持有 Cap 才能执行关联操作</li>
              </ul>
            </div>

            <button
              onClick={handlePublish}
              disabled={isPublishing || !blobId.trim()}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
            >
              {isPublishing ? '关联中...' : '确认关联'}
            </button>
          </div>
        )}

        {!showForm && (
          <div className="mt-3 bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-600">
              <strong>Allowlist ID:</strong>
            </p>
            <code className="text-xs text-gray-700 break-all block mt-1">
              {allowlistId || '未提供'}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
