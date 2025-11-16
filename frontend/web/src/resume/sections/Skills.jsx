import React from 'react';

export default function Skills({ formData, setFormData }) {
  const handleSkillsChange = (e) => {
    setFormData(prev => ({
      ...prev,
      skills: e.target.value
    }));
  };

  const handlePolish = () => {
    // TODO: 接入 AI 服务进行技能描述润色
    alert('AI 润色功能开发中...');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">⭐ 个人优势</h2>
        <button
          onClick={handlePolish}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          AI 润色
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            个人技能与优势描述
          </label>
          <textarea
            value={formData.skills}
            onChange={handleSkillsChange}
            placeholder="请描述你的专业技能、工作经验、个人特长等优势...&#10;&#10;例如：&#10;• 5年+ Web3 开发经验，熟悉 Solana/Ethereum 生态&#10;• 精通 React、TypeScript，有大型前端项目架构经验&#10;• 良好的代码规范和团队协作能力"
            rows={12}
            maxLength={1000}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-black"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">
              💡 提示：突出你的核心竞争力，建议使用列表形式，清晰展示技能点
            </p>
            <span className="text-sm text-gray-500">
              {formData.skills.length} / 1000
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
