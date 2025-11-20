import React from 'react';

export default function Skills({ formData, setFormData }) {
  const handleSkillsChange = (e) => {
    setFormData(prev => ({
      ...prev,
      skills: e.target.value
    }));
  };

  const handlePolish = () => {
    // TODO: Integrate AI service for skill description polishing
    alert('AI polish feature is under development...');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">⭐ Personal Strengths</h2>
        <button
          onClick={handlePolish}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          AI Polish
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personal Skills & Strengths Description
          </label>
          <textarea
            value={formData.skills}
            onChange={handleSkillsChange}
            placeholder="Describe your professional skills, work experience, personal strengths, etc...&#10;&#10;For example:&#10;• 5+ years Web3 development experience, familiar with Solana/Ethereum ecosystem&#10;• Proficient in React, TypeScript, experienced in large-scale frontend architecture&#10;• Good coding standards and teamwork skills"
            rows={12}
            maxLength={1000}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-black"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">
              💡 Tip: Highlight your core competencies, use bullet points for clear skill presentation
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
