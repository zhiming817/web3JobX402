import React, { useState } from 'react';
import DatePicker from '../../components/DatePicker';

export default function Certificates({ formData, setFormData }) {
  const [isAdding, setIsAdding] = useState(false);
  const [currentCert, setCurrentCert] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    noExpiry: false,
    certificateNo: '',
    description: '',
  });

  const handleAdd = () => {
    setFormData(prev => ({
      ...prev,
      certificates: [...prev.certificates, currentCert]
    }));
    setCurrentCert({
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      noExpiry: false,
      certificateNo: '',
      description: '',
    });
    setIsAdding(false);
  };

  const handleDelete = (index) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index)
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Certificates</h2>
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

      {/* Certificates List */}
      {formData.certificates.map((cert, index) => (
        <div key={index} className="mb-4 p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-start gap-3">
              <div className="text-3xl">📜</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{cert.name}</h3>
                <p className="text-sm text-gray-600">
                  {cert.issuer} | Issue Date: {cert.issueDate}
                </p>
                {cert.certificateNo && (
                  <p className="text-sm text-gray-500">Certificate No.: {cert.certificateNo}</p>
                )}
                {!cert.noExpiry && cert.expiryDate && (
                  <p className="text-sm text-gray-500">Valid Until: {cert.expiryDate}</p>
                )}
              </div>
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
          {cert.description && (
            <div className="text-sm text-gray-700 ml-12 whitespace-pre-line">
              {cert.description}
            </div>
          )}
        </div>
      ))}

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="border-2 border-teal-300 rounded-lg p-6 bg-teal-50">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Certificate</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Name
              </label>
              <input
                type="text"
                value={currentCert.name}
                onChange={(e) => setCurrentCert({ ...currentCert, name: e.target.value })}
                placeholder="Software Designer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issuing Organization
              </label>
              <input
                type="text"
                value={currentCert.issuer}
                onChange={(e) => setCurrentCert({ ...currentCert, issuer: e.target.value })}
                placeholder="China Computer Technology Qualification Network"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Date
              </label>
              <DatePicker
                value={currentCert.issueDate}
                onChange={(value) => setCurrentCert({ ...currentCert, issueDate: value })}
                placeholder="Select issue date"
                showMonthYearPicker
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valid Until
              </label>
              <DatePicker
                value={currentCert.expiryDate}
                onChange={(value) => setCurrentCert({ ...currentCert, expiryDate: value })}
                disabled={currentCert.noExpiry}
                placeholder="Valid Permanently"
                showMonthYearPicker
              />
              <div className="mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentCert.noExpiry}
                    onChange={(e) => setCurrentCert({ ...currentCert, noExpiry: e.target.checked, expiryDate: '' })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 text-black"
                  />
                  <span className="text-sm text-gray-700">Valid Permanently</span>
                </label>
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Number (Optional)
              </label>
              <input
                type="text"
                value={currentCert.certificateNo}
                onChange={(e) => setCurrentCert({ ...currentCert, certificateNo: e.target.value })}
                placeholder="123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Description (Optional)
              </label>
              <textarea
                value={currentCert.description}
                onChange={(e) => setCurrentCert({ ...currentCert, description: e.target.value })}
                placeholder="Briefly describe the value and difficulty of the certificate"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-black"
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {currentCert.description.length}/500
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

      {formData.certificates.length === 0 && !isAdding && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-5xl mb-4">📜</div>
          <p>No certificates yet, click the "Add" button above to create</p>
        </div>
      )}
    </div>
  );
}
