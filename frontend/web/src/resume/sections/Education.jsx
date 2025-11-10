import React, { useState } from 'react';

export default function Education({ formData, setFormData }) {
  const [isAdding, setIsAdding] = useState(false);
  const [currentEdu, setCurrentEdu] = useState({
    school: '',
    degree: 'bachelor',
    education_type: 'fulltime',
    major: '',
    start_date: '',
    end_date: '',
    experience: '',
    thesis: '',
    thesisDescription: '',
  });

  const handleAdd = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, currentEdu]
    }));
    setCurrentEdu({
      school: '',
      degree: 'bachelor',
      education_type: 'fulltime',
      major: '',
      start_date: '',
      end_date: '',
      experience: '',
      thesis: '',
      thesisDescription: '',
    });
    setIsAdding(false);
  };

  const handleDelete = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const degreeLabels = {
    bachelor: '本科',
    master: '硕士',
    doctor: '博士',
    associate: '专科',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">教育经历</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加
        </button>
      </div>

      {/* 教育经历列表 */}
      {formData.education.map((edu, index) => (
        <div key={index} className="mb-4 p-6 border-2 border-gray-200 rounded-lg bg-gray-50 flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{edu.school}</h3>
                <p className="text-sm text-gray-600">
                  {edu.major} | {degreeLabels[edu.degree]}·{edu.education_type === 'parttime' ? '非全日制' : '全日制'}
                </p>
                <p className="text-sm text-gray-500">
                  {edu.start_date} - {edu.end_date}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="text-teal-600 hover:text-teal-700">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            {edu.experience && (
              <div className="text-sm text-gray-700 whitespace-pre-line mb-2">
                <strong>在校经历：</strong> {edu.experience}
              </div>
            )}
            {edu.thesis && (
              <div className="text-sm text-gray-700">
                <strong>毕业设计/论文题目：</strong> {edu.thesis}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* 添加/编辑表单 */}
      {isAdding && (
        <div className="border-2 border-teal-300 rounded-lg p-6 bg-teal-50">
          <h3 className="text-xl font-bold text-gray-900 mb-4">编辑教育经历</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学校名称
              </label>
              <input
                type="text"
                value={currentEdu.school}
                onChange={(e) => setCurrentEdu({ ...currentEdu, school: e.target.value })}
                placeholder=""
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学制类型
              </label>
              <select
                value={currentEdu.education_type}
                onChange={(e) => setCurrentEdu({ ...currentEdu, education_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="fulltime">全日制</option>
                <option value="parttime">非全日制</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学历
              </label>
              <select
                value={currentEdu.degree}
                onChange={(e) => setCurrentEdu({ ...currentEdu, degree: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="bachelor">本科</option>
                <option value="master">硕士</option>
                <option value="doctor">博士</option>
                <option value="associate">专科</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                专业
              </label>
              <input
                type="text"
                value={currentEdu.major}
                onChange={(e) => setCurrentEdu({ ...currentEdu, major: e.target.value })}
                placeholder="计算机科学与技术"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                时间段
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={currentEdu.start_date}
                  onChange={(e) => setCurrentEdu({ ...currentEdu, start_date: e.target.value })}
                  placeholder="2020-09"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-gray-500">至</span>
                <input
                  type="month"
                  value={currentEdu.end_date}
                  onChange={(e) => setCurrentEdu({ ...currentEdu, end_date: e.target.value })}
                  placeholder="2024-06"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                在校经历 (选填)
              </label>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">简历亮点关键词</span>
                <button className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  不知道怎么展示教育经历?<br />
                  请试开启简历亮点关键词
                </button>
              </div>
              <textarea
                value={currentEdu.experience}
                onChange={(e) => setCurrentEdu({ ...currentEdu, experience: e.target.value })}
                placeholder="1. 在校担任职务...&#10;2. 获得荣誉...&#10;3. 所学主要课程..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {currentEdu.experience.length}/3000
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                毕业设计/论文题目 (选填)
              </label>
              <input
                type="text"
                value={currentEdu.thesis}
                onChange={(e) => setCurrentEdu({ ...currentEdu, thesis: e.target.value })}
                placeholder="请输入"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                毕业设计/论文描述 (选填)
              </label>
              <textarea
                value={currentEdu.thesisDescription}
                onChange={(e) => setCurrentEdu({ ...currentEdu, thesisDescription: e.target.value })}
                placeholder="描述毕业设计/论文的主要内容，向BOSS展示你的学术能力&#10;例如：&#10;1. 选题的目的及意义...&#10;2. 摘要及关键词...&#10;3. 论文结论或成果"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setIsAdding(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              完成
            </button>
          </div>
        </div>
      )}

      {formData.education.length === 0 && !isAdding && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-5xl mb-4">🎓</div>
          <p>暂无教育经历，点击上方"添加"按钮创建</p>
        </div>
      )}
    </div>
  );
}
