/**
 * 简历加密上传示例组件
 * 展示如何在 React 中使用加密上传功能
 */

import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { createEncryptedResume } from '../services/resumeEncryption';
import { unlockAndDecryptResume } from '../services/resumeEncryption';

export default function ResumeEncryptionExample() {
  const currentAccount = useCurrentAccount();
  const connected = !!currentAccount;
  const publicKey = currentAccount?.address;
  const [encryptionKey, setEncryptionKey] = useState('');
  const [cid, setCid] = useState('');
  const [resumeId, setResumeId] = useState('');
  const [loading, setLoading] = useState(false);

  // 示例：创建加密简历
  const handleCreateResume = async () => {
    // 检查钱包连接
    if (!connected || !publicKey) {
      alert('❌ 请先连接钱包！');
      return;
    }

    setLoading(true);
    
    try {
      // 构造简历数据
      const resumeData = {
        personal: {
          name: '张三',
          gender: 'male',
          birth_date: '1995-01-01',
          work_start_date: '2018-07-01',
          job_status: 'employed',
          phone: '13812345678',
          wechat: 'zhangsan_wx',
          email: 'zhangsan@example.com',
        },
        skills: 'JavaScript, React, Node.js',
        desired_position: {
          position: '前端工程师',
          salary_min: 15000,
          salary_max: 25000,
          city: '深圳',
          job_type: 'full-time',
        },
        work_experience: [],
        project_experience: [],
        education: [],
        certificates: [],
      };

      // 使用当前连接的钱包地址
      const walletAddress = publicKey;

      // 创建加密简历
      const result = await createEncryptedResume(resumeData, walletAddress);

      // 保存结果
      setResumeId(result.resumeId);
      setCid(result.cid);
      setEncryptionKey(result.encryptionKey);

      alert(`✅ 简历创建成功！
      
Resume ID: ${result.resumeId}
CID: ${result.cid}

⚠️ 重要：请妥善保存您的加密密钥！
${result.encryptionKey}

这个密钥是解密简历的唯一方式，丢失将无法恢复！`);
    } catch (error) {
      alert(`❌ 创建失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 示例：解密简历
  const handleDecryptResume = async () => {
    if (!cid || !encryptionKey) {
      alert('请先创建简历或输入 CID 和密钥');
      return;
    }

    setLoading(true);

    try {
      // 直接使用 CID 和密钥解密，不请求后端
      const resumeData = await unlockAndDecryptResume(cid, encryptionKey);

      console.log('✅ 解密成功！', resumeData);
      alert(`✅ 简历解密成功！
      
姓名: ${resumeData.personal.name}
邮箱: ${resumeData.personal.email}
技能: ${resumeData.skills}
      
完整数据已打印到控制台`);
    } catch (error) {
      console.error('解密失败:', error);
      alert(`❌ 解密失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">简历加密上传示例</h1>

      {/* 钱包状态提示 */}
      {!connected ? (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800 font-semibold">⚠️ 请先连接钱包</p>
          <p className="text-sm text-yellow-600 mt-1">
            请点击右上角的 "Select Wallet" 按钮连接您的 Solana 钱包
          </p>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 font-semibold">✅ 钱包已连接</p>
          <p className="text-sm text-green-600 mt-1 font-mono">
            {publicKey?.toString()}
          </p>
        </div>
      )}

      {/* 创建加密简历 */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">1. 创建加密简历</h2>
        <button
          onClick={handleCreateResume}
          disabled={loading || !connected}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '处理中...' : '创建加密简历'}
        </button>

        {resumeId && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="font-semibold text-green-800">✅ 创建成功！</p>
            <p className="text-sm mt-2">
              <strong>Resume ID:</strong> {resumeId}
            </p>
            <p className="text-sm">
              <strong>CID:</strong> {cid}
            </p>
            <p className="text-sm text-red-600 mt-2">
              <strong>⚠️ 加密密钥（请保存）:</strong>
            </p>
            <input
              type="text"
              value={encryptionKey}
              readOnly
              className="w-full p-2 border rounded text-xs font-mono bg-yellow-50"
            />
          </div>
        )}
      </div>

      {/* 解密简历 */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">2. 解密简历（测试）</h2>
        <p className="text-sm text-gray-600 mb-3">
          💡 直接使用 CID 和密钥解密，无需请求后端
        </p>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Resume ID</label>
            <input
              type="text"
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              placeholder="resume-xxx"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">CID</label>
            <input
              type="text"
              value={cid}
              onChange={(e) => setCid(e.target.value)}
              placeholder="Qm..."
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">解密密钥</label>
            <input
              type="text"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              placeholder="Base64 加密密钥"
              className="w-full p-2 border rounded font-mono text-sm"
            />
          </div>

          <button
            onClick={handleDecryptResume}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? '处理中...' : '解密简历'}
          </button>
        </div>
      </div>

      {/* 说明 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">流程说明</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-900">
          <li>
            <strong>创建简历：</strong>前端使用 AES-256-GCM 加密 → 上传到 IPFS → 获取 CID → 传给后端
          </li>
          <li>
            <strong>保存密钥：</strong>加密密钥由前端生成并返回给用户，必须妥善保存
          </li>
          <li>
            <strong>测试解密：</strong>直接使用 CID 从 IPFS 下载 → 使用密钥解密 → 查看完整内容
          </li>
          <li>
            <strong>生产环境：</strong>购买简历需要先支付，后端验证后返回 CID，再进行解密
          </li>
        </ol>
      </div>
    </div>
  );
}
