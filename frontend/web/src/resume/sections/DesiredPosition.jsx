import React from 'react';

export default function DesiredPosition({ formData, handleInputChange }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Edit Job Expectations</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Type
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => handleInputChange('desiredPosition', 'jobType', 'fulltime')}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                formData.desiredPosition.jobType === 'fulltime'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              Full-time
            </button>
            <button
              onClick={() => handleInputChange('desiredPosition', 'jobType', 'parttime')}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                formData.desiredPosition.jobType === 'parttime'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              Part-time
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desired Position
          </label>
          <input
            type="text"
            value={formData.desiredPosition.position}
            onChange={(e) => handleInputChange('desiredPosition', 'position', e.target.value)}
            placeholder="Java Developer"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Desired Industry
          </label>
          <input
            type="text"
            value={formData.desiredPosition.industry}
            onChange={(e) => handleInputChange('desiredPosition', 'industry', e.target.value)}
            placeholder="Enterprise Services, E-commerce, Healthcare"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Salary Expectations
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={formData.desiredPosition.salaryMin}
              onChange={(e) => handleInputChange('desiredPosition', 'salaryMin', e.target.value)}
              placeholder="13k"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              value={formData.desiredPosition.salaryMax}
              onChange={(e) => handleInputChange('desiredPosition', 'salaryMax', e.target.value)}
              placeholder="17k"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Work City
          </label>
          <input
            type="text"
            value={formData.desiredPosition.city}
            onChange={(e) => handleInputChange('desiredPosition', 'city', e.target.value)}
            placeholder="Shanghai"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Other Cities of Interest (Optional)
          </label>
          <input
            type="text"
            placeholder="Suzhou"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
          />
        </div>
      </div>
    </div>
  );
}
