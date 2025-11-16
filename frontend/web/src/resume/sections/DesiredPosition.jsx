import React from 'react';

export default function DesiredPosition({ formData, handleInputChange }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900">编辑求职期望</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            求职类型
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
              全职
            </button>
            <button
              onClick={() => handleInputChange('desiredPosition', 'jobType', 'parttime')}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                formData.desiredPosition.jobType === 'parttime'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              兼职
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            期望职位
          </label>
          <input
            type="text"
            value={formData.desiredPosition.position}
            onChange={(e) => handleInputChange('desiredPosition', 'position', e.target.value)}
            placeholder="Java"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            期望行业
          </label>
          <input
            type="text"
            value={formData.desiredPosition.industry}
            onChange={(e) => handleInputChange('desiredPosition', 'industry', e.target.value)}
            placeholder="企业服务、电子商务、医疗健康"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            薪资要求
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={formData.desiredPosition.salaryMin}
              onChange={(e) => handleInputChange('desiredPosition', 'salaryMin', e.target.value)}
              placeholder="13k"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
            />
            <span className="text-gray-500">至</span>
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
            工作城市
          </label>
          <input
            type="text"
            value={formData.desiredPosition.city}
            onChange={(e) => handleInputChange('desiredPosition', 'city', e.target.value)}
            placeholder="上海"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            其他感兴趣的城市 (选填)
          </label>
          <input
            type="text"
            placeholder="苏州"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
          />
        </div>
      </div>
    </div>
  );
}
