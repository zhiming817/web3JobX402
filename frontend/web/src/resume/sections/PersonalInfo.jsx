import React from 'react';

export default function PersonalInfo({ formData, handleInputChange }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-900">编辑个人信息</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            姓名
          </label>
          <input
            type="text"
            value={formData.personal.name}
            onChange={(e) => handleInputChange('personal', 'name', e.target.value)}
            placeholder="小明"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            当前求职状态
          </label>
          <select
            value={formData.personal.jobStatus}
            onChange={(e) => handleInputChange('personal', 'jobStatus', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="employed">离职-随时到岗</option>
            <option value="looking">在职-看看机会</option>
            <option value="urgent">急寻机会</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            性别
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
              男
            </button>
            <button
              onClick={() => handleInputChange('personal', 'gender', 'female')}
              className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                formData.personal.gender === 'female'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              女
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            我的牛人身份
          </label>
          <select
            value={formData.personal.identity}
            onChange={(e) => handleInputChange('personal', 'identity', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="professional">职场人</option>
            <option value="student">学生</option>
            <option value="freelancer">自由职业</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            出生年月
          </label>
          <input
            type="month"
            value={formData.personal.birthDate}
            onChange={(e) => handleInputChange('personal', 'birthDate', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            电话
          </label>
          <input
            type="tel"
            value={formData.personal.phone}
            onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
            placeholder=""
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            参加工作时间
          </label>
          <input
            type="month"
            value={formData.personal.workStartDate}
            onChange={(e) => handleInputChange('personal', 'workStartDate', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            微信号 (选填)
          </label>
          <input
            type="text"
            value={formData.personal.wechat}
            onChange={(e) => handleInputChange('personal', 'wechat', e.target.value)}
            placeholder=""
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            邮箱 (选填)
          </label>
          <input
            type="email"
            value={formData.personal.email}
            onChange={(e) => handleInputChange('personal', 'email', e.target.value)}
            placeholder=""
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>
    </div>
  );
}
