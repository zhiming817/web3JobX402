import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { fetchUserAllowlists } from '../utils/allowlistUtils';

/**
 * Encryption Mode Selector Component
 * Supports two modes:
 * 1. Allowlist Mode - Access control via allowlist
 * 2. Subscription Mode - Access via paid subscription
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
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [userAllowlists, setUserAllowlists] = useState([]);
  const [isLoadingAllowlists, setIsLoadingAllowlists] = useState(false);

  // Fetch user's allowlists when in Allowlist mode
  useEffect(() => {
    if (useSealEncryption && encryptionMode === 'allowlist' && currentAccount?.address) {
      const loadAllowlists = async () => {
        setIsLoadingAllowlists(true);
        try {
          const lists = await fetchUserAllowlists(suiClient, currentAccount.address);
          setUserAllowlists(lists);
          
          // Auto-select first allowlist if none selected and list is not empty
          if (lists.length > 0 && !allowlistId) {
            setAllowlistId(lists[0].allowlistId);
            setCapId(lists[0].capId);
          }
        } catch (error) {
          console.error('Failed to load allowlists:', error);
        } finally {
          setIsLoadingAllowlists(false);
        }
      };
      loadAllowlists();
    }
  }, [useSealEncryption, encryptionMode, currentAccount?.address, suiClient]);

  const handleAllowlistChange = (e) => {
    const selectedId = e.target.value;
    setAllowlistId(selectedId);
    
    // Find corresponding Cap ID
    const selectedList = userAllowlists.find(list => list.allowlistId === selectedId);
    if (selectedList) {
      setCapId(selectedList.capId);
    }
  };

  return (
    <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
            🔐 Seal Encryption & Access Control
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            Use Seal encryption for secure access control and paid unlocking.
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
          <span className="ml-2 text-blue-900 font-medium">Enable</span>
        </label>
      </div>

      {useSealEncryption && (
        <div className="space-y-6 mt-4">
          {/* Encryption Mode Selection */}
          <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
            <label className="block text-sm font-semibold text-blue-900 mb-3">
              🎯 Select Access Control Mode *
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Allowlist Mode */}
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
                      📋 Allowlist Mode
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>✅ Manually manage access list</div>
                      <div>✅ Suitable for specific personnel</div>
                      <div>✅ Add/Remove anytime</div>
                      <div>⚠️ Requires creating an Allowlist</div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Subscription Mode */}
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
                      💰 Subscription Mode
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>✅ Permanent access after payment</div>
                      <div>✅ Automated access control</div>
                      <div>✅ Direct payment to wallet</div>
                      <div>🚀 Recommended for public hiring</div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Allowlist Mode Configuration */}
          {encryptionMode === 'allowlist' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Select Allowlist *
                </label>
                {isLoadingAllowlists ? (
                  <div className="text-sm text-gray-500">Loading allowlists...</div>
                ) : userAllowlists.length > 0 ? (
                  <select
                    value={allowlistId}
                    onChange={handleAllowlistChange}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  >
                    <option value="">-- Select an Allowlist --</option>
                    {userAllowlists.map((list) => (
                      <option key={list.allowlistId} value={list.allowlistId}>
                        {list.name} ({list.allowlistId.slice(0, 6)}...{list.allowlistId.slice(-4)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    No Allowlist found. Please create one first.
                  </div>
                )}
                <p className="text-xs text-blue-600 mt-1">
                  Controls who can access your resume
                </p>
              </div>

              {/* Hidden Cap ID field (managed automatically) */}
              <input type="hidden" value={capId} />

              <div className="bg-white p-4 rounded border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  ℹ️ Allowlist Mode Info
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>✅ You can manually manage the access list</li>
                  <li>✅ Supports dynamic adding/removing of visitors</li>
                  <li>✅ You are automatically added to the allowlist upon creation</li>
                  <li>✅ Suitable for referrals and targeted submissions</li>
                  <li>⚠️ Need to create an Allowlist first (one-time operation)</li>
                </ul>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => navigate('/allowlist')}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🔗 Go to Create Allowlist
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subscription Mode Configuration */}
          {encryptionMode === 'subscription' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Subscription Price (SUI) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={subscriptionPrice}
                    onChange={(e) => setSubscriptionPrice(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="0.1"
                    min="0.000000001"
                    step="0.000000001"
                    className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-blue-900 font-medium">SUI</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Users can view your resume permanently after paying this amount
                </p>
              </div>

              <div className="bg-white p-4 rounded border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  ℹ️ Subscription Mode Info
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>✅ Users get a Subscription NFT after payment</li>
                  <li>✅ Permanent access, no recurring fees</li>
                  <li>✅ Funds automatically transferred to your wallet</li>
                  <li>✅ Blockchain automatically verifies access rights</li>
                  <li>✅ Suitable for public hiring, talent markets, etc.</li>
                  <li>💡 Recommended price: 0.1-1 SUI</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded border border-orange-200">
                <h4 className="text-sm font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  💰 Revenue Estimation
                </h4>
                <div className="text-xs text-orange-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Revenue per subscription:</span>
                    <span className="font-semibold">{subscriptionPrice || '0'} SUI</span>
                  </div>
                  <div className="flex justify-between">
                    <span>10 subscriptions:</span>
                    <span className="font-semibold">{(parseFloat(subscriptionPrice || 0) * 10).toFixed(9)} SUI</span>
                  </div>
                  <div className="flex justify-between">
                    <span>100 subscriptions:</span>
                    <span className="font-semibold">{(parseFloat(subscriptionPrice || 0) * 100).toFixed(9)} SUI</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* General Info */}
          <div className="bg-white p-4 rounded border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              🔐 What is Seal Encryption?
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>✅ Threshold encryption, keys managed by distributed servers</li>
              <li>✅ Access rights verified via blockchain smart contracts</li>
              <li>✅ End-to-end encryption ensures resume content security</li>
              <li>✅ Decentralized architecture, no trusted third party needed</li>
            </ul>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => window.open('https://docs.walrus.site/walrus-sites/seal.html', '_blank')}
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-blue-300 text-blue-700 rounded text-xs font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📖 View Seal Technical Documentation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
