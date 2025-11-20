import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ResumePreview({ formData, onClose, onExportPDF }) {
  const resumeRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!resumeRef.current) return;
    
    setIsExporting(true);
    try {
      // 获取简历内容的DOM元素
      const element = resumeRef.current;
      
      // 使用 html2canvas 将 HTML 转换为 canvas
      const canvas = await html2canvas(element, {
        scale: 2, // 提高清晰度
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // 获取 canvas 的尺寸
      const imgWidth = 210; // A4 宽度 (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // 创建 PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // 将 canvas 转换为图片并添加到 PDF
      const imgData = canvas.toDataURL('image/png');
      
      // 如果内容高度超过一页,需要分页
      const pageHeight = 297; // A4 高度 (mm)
      let heightLeft = imgHeight;
      let position = 0;

      // 添加第一页
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 如果还有剩余内容,添加新页
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 保存 PDF
      const fileName = `${formData.personal.name || 'Resume'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      alert('PDF exported successfully!');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF, please try again');
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-pink-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* 头部操作栏 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
          <h3 className="text-xl font-bold text-gray-900">Resume Preview</h3>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 ${
                isExporting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* 简历内容 */}
        <div className="p-8 bg-gray-50">
          <div ref={resumeRef} className="bg-white shadow-lg rounded-lg p-8 max-w-3xl mx-auto">
            {/* 个人信息 */}
            <div className="text-center mb-8 pb-6 border-b-2 border-orange-500">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {formData.personal.name || 'Name Not Filled'}
              </h1>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                {formData.personal.gender && (
                  <span>{formData.personal.gender === 'male' ? 'Male' : 'Female'}</span>
                )}
                {formData.personal.birthDate && (
                  <span>{formData.personal.birthDate}</span>
                )}
                {formData.personal.phone && (
                  <span>📱 {formData.personal.phone}</span>
                )}
                {formData.personal.email && (
                  <span>📧 {formData.personal.email}</span>
                )}
                {formData.personal.wechat && (
                  <span>💬 {formData.personal.wechat}</span>
                )}
              </div>
            </div>

            {/* 期望职位 */}
            {(formData.desiredPosition.position || formData.desiredPosition.industry) && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-orange-500 pl-3">
                  💼 Desired Position
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {formData.desiredPosition.position && (
                    <div>
                      <span className="text-gray-500">Position:</span>
                      <span className="text-gray-900 font-medium ml-2">
                        {formData.desiredPosition.position}
                      </span>
                    </div>
                  )}
                  {formData.desiredPosition.industry && (
                    <div>
                      <span className="text-gray-500">Industry:</span>
                      <span className="text-gray-900 font-medium ml-2">
                        {formData.desiredPosition.industry}
                      </span>
                    </div>
                  )}
                  {formData.desiredPosition.jobType && (
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="text-gray-900 font-medium ml-2">
                        {formData.desiredPosition.jobType === 'fulltime' ? 'Full-time' : 'Part-time'}
                      </span>
                    </div>
                  )}
                  {(formData.desiredPosition.salaryMin || formData.desiredPosition.salaryMax) && (
                    <div>
                      <span className="text-gray-500">Salary:</span>
                      <span className="text-gray-900 font-medium ml-2">
                        {formData.desiredPosition.salaryMin || '0'}k - {formData.desiredPosition.salaryMax || 'Unlimited'}k
                      </span>
                    </div>
                  )}
                  {formData.desiredPosition.city && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Preferred City:</span>
                      <span className="text-gray-900 font-medium ml-2">
                        {formData.desiredPosition.city}
                        {formData.desiredPosition.otherCities?.length > 0 && 
                          ` / ${formData.desiredPosition.otherCities.join(' / ')}`
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 个人优势 */}
            {formData.skills && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-orange-500 pl-3">
                  ⭐ Personal Summary
                </h2>
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {formData.skills}
                </div>
              </div>
            )}

            {/* 工作经历 */}
            {formData.workExperience?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-orange-500 pl-3">
                  💻 Work Experience
                </h2>
                <div className="space-y-6">
                  {formData.workExperience.map((work, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {work.company}
                          </h3>
                          <p className="text-orange-600 font-medium">{work.position}</p>
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                          {work.startDate} - {work.endDate || 'Present'}
                        </span>
                      </div>
                      {work.description && (
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                          {work.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 项目经历 */}
            {formData.projectExperience?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-orange-500 pl-3">
                  📁 Project Experience
                </h2>
                <div className="space-y-6">
                  {formData.projectExperience.map((project, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {project.name}
                          </h3>
                          <p className="text-orange-600 font-medium">{project.role}</p>
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                          {project.startDate} - {project.endDate || 'Present'}
                        </span>
                      </div>
                      {project.link && (
                        <p className="text-sm text-blue-600 mb-2">
                          🔗 {project.link}
                        </p>
                      )}
                      {project.description && (
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                          {project.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 教育经历 */}
            {formData.education?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-orange-500 pl-3">
                  🎓 Education
                </h2>
                <div className="space-y-4">
                  {formData.education.map((edu, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {edu.school}
                          </h3>
                          <p className="text-gray-700">
                            {edu.major} · {edu.degree}
                            {edu.educationType && (
                              <span className="text-sm text-gray-500 ml-2">
                                ({edu.educationType === 'fulltime' ? 'Full-time' : 'Part-time'})
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                          {edu.startDate} - {edu.endDate || 'Present'}
                        </span>
                      </div>
                      {edu.thesis && (
                        <p className="text-sm text-gray-600 mt-1">
                          Thesis: {edu.thesis}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 资格证书 */}
            {formData.certificates?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-orange-500 pl-3">
                  📜 Certificates
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.certificates.map((cert, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-2">{cert.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        Issuer: {cert.issuer}
                      </p>
                      {cert.number && (
                        <p className="text-sm text-gray-600 mb-1">
                          Certificate No: {cert.number}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        {cert.issueDate}
                        {cert.noExpiry ? ' - No Expiration' : cert.expiryDate ? ` - ${cert.expiryDate}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 页脚 */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
              <p>Generated by ResumeVault · Encrypted Resume Platform Based on Sui Blockchain</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
