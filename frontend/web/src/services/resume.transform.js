/**
 * 表单数据转换工具
 * 将前端表单数据转换为后端 API 所需格式
 */

/**
 * 转换表单数据为 API 请求格式
 * @param {object} formData - 前端表单数据
 * @param {string} walletAddress - 钱包地址
 * @returns {object} API 请求数据
 */
export function transformResumeData(formData, walletAddress) {
  return {
    owner: walletAddress,
    
    // 个人信息
    personal: {
      name: formData.personal.name,
      gender: formData.personal.gender === 'male' ? '男' : '女',
      birth_date: formData.personal.birthDate,
      work_start_date: formData.personal.workStartDate,
      job_status: transformJobStatus(formData.personal.jobStatus),
      phone: formData.personal.phone,
      wechat: formData.personal.wechat,
      email: formData.personal.email,
    },
    
    // 个人优势
    skills: formData.skills,
    
    // 期望职位
    desired_position: {
      job_type: transformJobType(formData.desiredPosition.jobType),
      position: formData.desiredPosition.position,
      industry: formData.desiredPosition.industry,
      salary_min: parseInt(formData.desiredPosition.salaryMin) || 0,
      salary_max: parseInt(formData.desiredPosition.salaryMax) || 0,
      city: formData.desiredPosition.city,
      other_cities: formData.desiredPosition.otherCities || [],
    },
    
    // 工作经历
    work_experience: formData.workExperience.map(exp => ({
      company: exp.company || '',
      position: exp.position || '',
      start_date: exp.startDate || exp.start_date || '',
      end_date: exp.endDate || exp.end_date || null,
      description: exp.description || '',
    })),
    
    // 项目经历
    project_experience: formData.projectExperience.map(project => ({
      name: project.name || '',
      role: project.role || '',
      start_date: project.startDate || project.start_date || '',
      end_date: project.endDate || project.end_date || null,
      link: project.link || null,
      description: project.description || '',
    })),
    
    // 教育经历
    education: formData.education.map(edu => ({
      school: edu.school || '',
      major: edu.major || '',
      degree: edu.degree || 'bachelor',
      education_type: edu.education_type || 'fulltime',
      start_date: edu.start_date || '',
      end_date: edu.end_date || null,
      thesis: edu.thesis || null,
    })),
    
    // 资格证书
    certificates: formData.certificates.map(cert => ({
      name: cert.name || '',
      issuer: cert.issuer || '',
      number: cert.number || null,
      issue_date: cert.issueDate || cert.issue_date || '',
      expiry_date: cert.expiryDate || cert.expiry_date || null,
      no_expiry: cert.noExpiry || cert.no_expiry || false,
    })),
  };
}

/**
 * 转换在职状态
 */
function transformJobStatus(status) {
  const statusMap = {
    employed: '在职-考虑机会',
    离职: '离职-随时到岗',
    考虑: '在职-暂不考虑',
    求职: '在职-急找工作',
  };
  return statusMap[status] || status;
}

/**
 * 转换工作类型
 */
function transformJobType(type) {
  const typeMap = {
    fulltime: '全职',
    parttime: '兼职',
    intern: '实习',
  };
  return typeMap[type] || type;
}

/**
 * 验证表单数据
 * @param {object} formData - 表单数据
 * @returns {object} { valid: boolean, errors: array }
 */
export function validateResumeData(formData) {
  const errors = [];
  
  // 验证个人信息
  if (!formData.personal.name) {
    errors.push('请填写姓名');
  }
  if (!formData.personal.phone) {
    errors.push('请填写手机号');
  }
  if (!formData.personal.email) {
    errors.push('请填写邮箱');
  }
  
  // 验证期望职位
  if (!formData.desiredPosition.position) {
    errors.push('请填写期望职位');
  }
  if (!formData.desiredPosition.industry) {
    errors.push('请填写期望行业');
  }
  if (!formData.desiredPosition.city) {
    errors.push('请填写期望城市');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
