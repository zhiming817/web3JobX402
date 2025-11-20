import React from 'react';
import DatePicker from '../../components/DatePicker';

export default function PersonalInfo({ formData, handleInputChange }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Edit Personal Information</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            value={formData.personal.name}
            onChange={(e) => handleInputChange('personal', 'name', e.target.value)}
            placeholder="John"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Job Status
          </label>
          <select
            value={formData.personal.jobStatus}
            onChange={(e) => handleInputChange('personal', 'jobStatus', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
          >
            <option value="employed">Available - Ready to Start</option>
            <option value="looking">Employed - Open to Opportunities</option>
            <option value="urgent">Actively Looking</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => handleInputChange('personal', 'gender', 'male')}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                formData.personal.gender === 'male'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              Male
            </button>
            <button
              onClick={() => handleInputChange('personal', 'gender', 'female')}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                formData.personal.gender === 'female'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              Female
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Identity
          </label>
          <select
            value={formData.personal.identity}
            onChange={(e) => handleInputChange('personal', 'identity', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
          >
            <option value="professional">Professional</option>
            <option value="student">Student</option>
            <option value="freelancer">Freelancer</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          <DatePicker
            value={formData.personal.birthDate}
            onChange={(value) => handleInputChange('personal', 'birthDate', value)}
            placeholder="Select date of birth"
            showMonthYearPicker
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={formData.personal.phone}
            onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
            placeholder=""
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Work Start Date
          </label>
          <DatePicker
            value={formData.personal.workStartDate}
            onChange={(value) => handleInputChange('personal', 'workStartDate', value)}
            placeholder="Select work start date"
            showMonthYearPicker
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WeChat (Optional)
          </label>
          <input
            type="text"
            value={formData.personal.wechat}
            onChange={(e) => handleInputChange('personal', 'wechat', e.target.value)}
            placeholder=""
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email (Optional)
          </label>
          <input
            type="email"
            value={formData.personal.email}
            onChange={(e) => handleInputChange('personal', 'email', e.target.value)}
            placeholder=""
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
          />
        </div>
      </div>
    </div>
  );
}
