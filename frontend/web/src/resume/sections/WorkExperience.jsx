import React, { useState } from 'react';
import DatePicker from '../../components/DatePicker';

export default function WorkExperience({ formData, setFormData }) {
  const [isAdding, setIsAdding] = useState(false);
  const [currentWork, setCurrentWork] = useState({
    company: '',
    industry: '',
    department: '',
    position: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  });

  const handleAdd = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, currentWork]
    }));
    setCurrentWork({
      company: '',
      industry: '',
      department: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    });
    setIsAdding(false);
  };

  const handleDelete = (index) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
      </div>

      {/* Work Experience List */}
      {formData.workExperience.map((work, index) => (
        <div key={index} className="mb-4 p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {work.company} - {work.position}
              </h3>
              <p className="text-sm text-gray-600">
                {work.startDate} - {work.current ? 'Present' : work.endDate}
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
          <div className="text-sm text-gray-700 whitespace-pre-line">
            {work.description}
          </div>
        </div>
      ))}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="border-2 border-teal-300 rounded-lg p-6 bg-teal-50">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Work Experience</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={currentWork.company}
                onChange={(e) => setCurrentWork({ ...currentWork, company: e.target.value })}
                placeholder="ABC Technology Co., Ltd."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <input
                type="text"
                value={currentWork.industry}
                onChange={(e) => setCurrentWork({ ...currentWork, industry: e.target.value })}
                placeholder="Internet"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department (Optional)
              </label>
              <input
                type="text"
                value={currentWork.department}
                onChange={(e) => setCurrentWork({ ...currentWork, department: e.target.value })}
                placeholder="e.g.: Product Department"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <input
                type="text"
                value={currentWork.position}
                onChange={(e) => setCurrentWork({ ...currentWork, position: e.target.value })}
                placeholder="Full Stack"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment Period
              </label>
              <div className="flex items-center gap-2">
                <DatePicker
                  value={currentWork.startDate}
                  onChange={(value) => setCurrentWork({ ...currentWork, startDate: value })}
                  placeholder="Start Date"
                  showMonthYearPicker
                  className="flex-1"
                />
                <span className="text-gray-500">to</span>
                <DatePicker
                  value={currentWork.endDate}
                  onChange={(value) => setCurrentWork({ ...currentWork, endDate: value })}
                  disabled={currentWork.current}
                  placeholder="Present"
                  showMonthYearPicker
                  className="flex-1"
                />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Resume Highlights Keywords</span>
                <button className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  Polish
                </button>
              </div>
              <textarea
                value={currentWork.description}
                onChange={(e) => setCurrentWork({ ...currentWork, description: e.target.value })}
                placeholder="1. Complete module development;&#10;2. Coordinate with testers to complete module testing;&#10;3. Participate in technical challenge discussions and provide suggestions;&#10;4. Write relevant development documentation."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {currentWork.description.length}/3000
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setIsAdding(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              Complete
            </button>
          </div>
        </div>
      )}

      {formData.workExperience.length === 0 && !isAdding && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-5xl mb-4">💼</div>
          <p>No work experience yet, click the "Add" button above to create</p>
        </div>
      )}
    </div>
  );
}
