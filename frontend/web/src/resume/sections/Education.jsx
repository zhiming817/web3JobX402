import React, { useState } from 'react';
import DatePicker from '../../components/DatePicker';

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
    bachelor: 'Bachelor',
    master: 'Master',
    doctor: 'Doctor',
    associate: 'Associate',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Education</h2>
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

      {/* Education List */}
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
                  {edu.major} | {degreeLabels[edu.degree]}·{edu.education_type === 'parttime' ? 'Part-time' : 'Full-time'}
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
                <strong>Campus Experience:</strong> {edu.experience}
              </div>
            )}
            {edu.thesis && (
              <div className="text-sm text-gray-700">
                <strong>Thesis/Capstone Project:</strong> {edu.thesis}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="border-2 border-teal-300 rounded-lg p-6 bg-teal-50">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Education</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name
              </label>
              <input
                type="text"
                value={currentEdu.school}
                onChange={(e) => setCurrentEdu({ ...currentEdu, school: e.target.value })}
                placeholder=""
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education Type
              </label>
              <select
                value={currentEdu.education_type}
                onChange={(e) => setCurrentEdu({ ...currentEdu, education_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              >
                <option value="fulltime">Full-time</option>
                <option value="parttime">Part-time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Degree
              </label>
              <select
                value={currentEdu.degree}
                onChange={(e) => setCurrentEdu({ ...currentEdu, degree: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              >
                <option value="bachelor">Bachelor</option>
                <option value="master">Master</option>
                <option value="doctor">Doctor</option>
                <option value="associate">Associate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Major
              </label>
              <input
                type="text"
                value={currentEdu.major}
                onChange={(e) => setCurrentEdu({ ...currentEdu, major: e.target.value })}
                placeholder="Computer Science and Technology"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <div className="flex items-center gap-2">
                <DatePicker
                  value={currentEdu.start_date}
                  onChange={(value) => setCurrentEdu({ ...currentEdu, start_date: value })}
                  placeholder="Start Date"
                  showMonthYearPicker
                  className="flex-1"
                />
                <span className="text-gray-500">to</span>
                <DatePicker
                  value={currentEdu.end_date}
                  onChange={(value) => setCurrentEdu({ ...currentEdu, end_date: value })}
                  placeholder="End Date"
                  showMonthYearPicker
                  className="flex-1"
                />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campus Experience (Optional)
              </label>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Resume Highlights Keywords</span>
                <button className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  Not sure how to showcase your education?<br />
                  Try enabling resume highlights keywords
                </button>
              </div>
              <textarea
                value={currentEdu.experience}
                onChange={(e) => setCurrentEdu({ ...currentEdu, experience: e.target.value })}
                placeholder="1. Campus positions held...&#10;2. Honors and awards received...&#10;3. Major courses studied..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {currentEdu.experience.length}/3000
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thesis/Capstone Project (Optional)
              </label>
              <input
                type="text"
                value={currentEdu.thesis}
                onChange={(e) => setCurrentEdu({ ...currentEdu, thesis: e.target.value })}
                placeholder="Please enter"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thesis/Capstone Description (Optional)
              </label>
              <textarea
                value={currentEdu.thesisDescription}
                onChange={(e) => setCurrentEdu({ ...currentEdu, thesisDescription: e.target.value })}
                placeholder="Describe the main content of your thesis/capstone project to showcase your academic abilities&#10;For example:&#10;1. Purpose and significance of the topic...&#10;2. Abstract and keywords...&#10;3. Thesis conclusions or outcomes"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
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

      {formData.education.length === 0 && !isAdding && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-5xl mb-4">🎓</div>
          <p>No education yet, click the "Add" button above to create</p>
        </div>
      )}
    </div>
  );
}
