import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 加密模式选择组件
 * 支持两种模式：
 * 1. Allowlist 模式 - 白名单访问控制
 * 2. Subscription 模式 - 付费订阅访问
 */
export default function EncryptionModeSelector({
  useSealEncryption,
  setUseSealEncryption,
  encryptionMode,
  setEncryptionMode,
  allowlistId,
  setAllowlistId,
  capId,
  setCapId,
  subscriptionPrice,
  setSubscriptionPrice,
  isSubmitting = false,
}) {
  const navigate = useNavigate();

  return (
    <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
            🔐 Seal 加密和访问控制
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            使用 Seal 加密可以实现安全的访问控制和付费解锁
          </p>
        </div>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={useSealEncryption}
            onChange={(e) => setUseSealEncryption(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <span className="ml-2 text-blue-900 font-medium">启用</span>
        </label>
      </div>

      {useSealEncryption && (
        <div className="space-y-6 mt-4">
          {/* 加密模式选择 */}
          <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
            <label className="block text-sm font-semibold text-blue-900 mb-3">
              🎯 选择访问控制模式 *
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Allowlist 模式 */}
              <button
                type="button"
                onClick={() => setEncryptionMode('allowlist')}
                disabled={isSubmitting}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  encryptionMode === 'allowlist'
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-300 hover:border-blue-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    checked={encryptionMode === 'allowlist'}
                    onChange={() => setEncryptionMode('allowlist')}
                    disabled={isSubmitting}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      📋 Allowlist 模式
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>✅ 手动管理访问名单</div>
                      <div>✅ 适合特定人员访问</div>
                      <div>✅ 可随时添加/移除</div>
                      <div>⚠️ 需要创建 Allowlist</div>
                    </div>
                  </div>
                </div>
              </button>

              {/* 订阅模式 */}
              <button
                type="button"
                onClick={() => setEncryptionMode('subscription')}
                disabled={isSubmitting}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  encryptionMode === 'subscription'
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-300 hover:border-blue-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    checked={encryptionMode === 'subscription'}
                    onChange={() => setEncryptionMode('subscription')}
                    disabled={isSubmitting}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      💰 订阅模式
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>✅ 付费即可永久访问</div>
                      <div>✅ 自动化访问控制</div>
                      <div>✅ 款项直达钱包</div>
                      <div>🚀 推荐用于公开招聘</div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Allowlist 模式配置 */}
          {encryptionMode === 'allowlist' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Allowlist ID *
                </label>
                <input
                  type="text"
                  value={allowlistId}
                  onChange={(e) => setAllowlistId(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-blue-600 mt-1">
                  用于控制谁可以访问您的简历
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Cap ID *
                </label>
                <input
                  type="text"
                  value={capId}
                  onChange={(e) => setCapId(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-blue-600 mt-1">
                  Allowlist 的管理员凭证
                </p>
              </div>

              <div className="bg-white p-4 rounded border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  ℹ️ Allowlist 模式说明
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>✅ 您可以手动管理访问名单</li>
                  <li>✅ 支持动态添加/移除访问者</li>
                  <li>✅ 创建后您会自动添加到白名单</li>
                  <li>✅ 适合内推、定向投递等场景</li>
                  <li>⚠️ 需要先创建 Allowlist（一次性操作）</li>
                </ul>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => navigate('/allowlist')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🔗 前往创建 Allowlist
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 订阅模式配置 */}
          {encryptionMode === 'subscription' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  订阅价格 (USDC) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={subscriptionPrice}
                    onChange={(e) => setSubscriptionPrice(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="5"
                    min="0.01"
                    step="0.01"
                    className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-blue-900 font-medium">USDC</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  用户支付此金额后可永久查看您的简历
                </p>
              </div>

              <div className="bg-white p-4 rounded border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  ℹ️ 订阅模式说明
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>✅ 用户支付后获得 Subscription NFT</li>
                  <li>✅ 永久访问，无需重复付费</li>
                  <li>✅ 款项自动转入您的钱包</li>
                  <li>✅ 区块链自动验证访问权限</li>
                  <li>✅ 适合公开招聘、人才市场等场景</li>
                  <li>💡 推荐价格：3-10 USDC</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded border border-orange-200">
                <h4 className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  💰 收益预估
                </h4>
                <div className="text-xs text-orange-700 space-y-1">
                  <div className="flex justify-between">
                    <span>每次订阅收益:</span>
                    <span className="font-semibold">{subscriptionPrice || '0'} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>10 人订阅:</span>
                    <span className="font-semibold">{(parseFloat(subscriptionPrice || 0) * 10).toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>100 人订阅:</span>
                    <span className="font-semibold">{(parseFloat(subscriptionPrice || 0) * 100).toFixed(2)} USDC</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 通用说明 */}
          <div className="bg-white p-4 rounded border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              🔐 什么是 Seal 加密?
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>✅ 基于阈值加密，密钥由多个服务器分布式管理</li>
              <li>✅ 通过区块链智能合约验证访问权限</li>
              <li>✅ 端到端加密，确保简历内容安全</li>
              <li>✅ 去中心化架构，无需信任第三方</li>
            </ul>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => window.open('https://docs.walrus.site/walrus-sites/seal.html', '_blank')}
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-blue-300 text-blue-700 rounded text-xs font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📖 查看 Seal 技术文档
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
