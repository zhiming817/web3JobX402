# API 服务使用说明

## 目录结构

```
src/services/
├── index.js                 # 统一导出
├── api.config.js           # API 配置
├── http.client.js          # HTTP 请求客户端
├── resume.service.js       # 简历服务
├── user.service.js         # 用户服务
└── resume.transform.js     # 数据转换工具
```

## 使用示例

### 1. 创建简历

```javascript
import { resumeService, userService } from '../services';
import { transformResumeData, validateResumeData } from '../services/resume.transform';

// 在组件中
const handleCreateResume = async () => {
  const walletAddress = publicKey.toString();
  
  // 1. 验证数据
  const validation = validateResumeData(formData);
  if (!validation.valid) {
    alert(validation.errors.join('\n'));
    return;
  }
  
  // 2. 确保用户已注册
  await userService.registerOrGetUser(walletAddress);
  
  // 3. 转换数据
  const apiData = transformResumeData(formData, walletAddress);
  
  // 4. 创建简历
  const result = await resumeService.createResume(apiData);
  console.log('简历 ID:', result.resumeId);
};
```

### 2. 浏览简历列表

```javascript
import { resumeService } from '../services';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';

const ResumeBrowse = () => {
  const { connected, publicKey } = useWallet();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 加载简历列表
  useEffect(() => {
    loadResumeSummaries();
  }, []);

  const loadResumeSummaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await resumeService.getResumeSummaries();
      
      // 转换后端数据为前端显示格式
      const formattedResumes = data.map(resume => {
        const { summary } = resume;
        const { personal, desired_position, education, work_experience } = summary;
        
        return {
          resumeId: resume.resume_id,
          name: personal?.name || '未知',
          title: desired_position?.position || '未填写职位',
          experience: calculateExperience(personal?.work_start_date),
          education: getEducationLevel(education),
          location: desired_position?.city || '未知',
          salary: formatSalary(desired_position?.salary_min, desired_position?.salary_max),
          avatar: getAvatar(personal?.gender),
          price: `${(resume.price / 1_000_000_000).toFixed(4)} SOL`,
          isLocked: true
        };
      });
      
      setResumes(formattedResumes);
    } catch (err) {
      console.error('加载简历列表失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 辅助函数
  const calculateExperience = (workStartDate) => {
    if (!workStartDate) return '应届毕业生';
    const years = new Date().getFullYear() - new Date(workStartDate).getFullYear();
    if (years < 1) return '应届毕业生';
    if (years <= 3) return '1-3年';
    if (years <= 5) return '3-5年';
    if (years <= 10) return '5-10年';
    return '10年以上';
  };

  const getEducationLevel = (educationArray) => {
    if (!educationArray || educationArray.length === 0) return '未填写';
    const degrees = educationArray.map(edu => edu.degree).filter(Boolean);
    if (degrees.length === 0) return '未填写';
    const highest = degrees.includes('博士') ? '博士' : 
                   degrees.includes('硕士') ? '硕士' : 
                   degrees.includes('本科') ? '本科' : 
                   degrees.includes('专科') ? '专科' : '其他';
    return highest;
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return '面议';
    if (min === max) return `${min / 1000}K`;
    return `${min / 1000}-${max / 1000}K`;
  };

  const getAvatar = (gender) => {
    return gender === '女' ? '👩‍💻' : '👨‍💻';
  };

  // 解锁简历
  const handleUnlock = async (resumeId) => {
    if (!connected || !publicKey) {
      alert('请先连接钱包!');
      return;
    }

    try {
      const buyerWallet = publicKey.toString();
      await resumeService.unlockResume(resumeId, buyerWallet);
      
      // 更新本地状态
      setResumes(resumes.map(r => 
        r.resumeId === resumeId ? { ...r, isLocked: false } : r
      ));
      
      alert('简历解锁成功!');
    } catch (err) {
      alert(`解锁失败: ${err.message}`);
    }
  };

  // 加载状态
  if (loading) {
    return <div>加载中...</div>;
  }

  // 错误状态
  if (error) {
    return (
      <div>
        <p>加载失败: {error}</p>
        <button onClick={loadResumeSummaries}>重试</button>
      </div>
    );
  }

  return (
    <div>
      {resumes.map(resume => (
        <div key={resume.resumeId}>
          <h3>{resume.name}</h3>
          <p>{resume.title}</p>
          <button onClick={() => handleUnlock(resume.resumeId)}>
            解锁 ({resume.price})
          </button>
        </div>
      ))}
    </div>
  );
};
```

### 3. 获取我的简历列表

```javascript
import { resumeService } from '../services';

// 获取我的简历
const myResumes = await resumeService.getMyResumes(walletAddress);
```

### 4. 获取简历详情

```javascript
import { resumeService } from '../services';

// 获取指定简历的完整详情 (需要验证所有权)
const handleViewDetail = async (resumeId, owner) => {
  try {
    const detail = await resumeService.getResumeDetail(resumeId, owner);
    console.log('简历详情:', detail);
  } catch (err) {
    if (err.message.includes('Unauthorized')) {
      alert('无权查看此简历');
    } else {
      alert(`获取失败: ${err.message}`);
    }
  }
};
```

### 5. 更新简历

```javascript
import { resumeService } from '../services';
import { transformResumeData } from '../services/resume.transform';

const handleUpdateResume = async (resumeId) => {
  const apiData = transformResumeData(formData, walletAddress);
  await resumeService.updateResume(resumeId, apiData);
};
```

### 5. 解锁简历

```javascript
import { resumeService } from '../services';

const handleUnlockResume = async (resumeId) => {
  const result = await resumeService.unlockResume(
    resumeId,
    buyerWallet
  );
  console.log('解锁的简历:', result.resume);
};
```

### 6. 用户操作

```javascript
import { userService } from '../services';

// 注册/获取用户
const user = await userService.registerOrGetUser(walletAddress);

// 更新昵称
const updatedUser = await userService.updateNickname(walletAddress, '新昵称');

// 获取用户信息
const user = await userService.getUserByWallet(walletAddress);
```

## 错误处理

所有服务方法都会抛出错误，建议使用 try-catch 处理：

```javascript
try {
  const result = await resumeService.createResume(apiData);
  // 成功处理
} catch (error) {
  console.error('创建失败:', error.message);
  // 错误处理
}
```

## 配置

在 `.env.development` 中配置 API 地址：

```
VITE_API_BASE_URL=http://127.0.0.1:4021
```

## 数据格式

### 简历数据格式

```javascript
{
  owner: "钱包地址",
  personal: {
    name: "姓名",
    gender: "男/女",
    birth_date: "1990-01-01",
    work_start_date: "2015-07-01",
    job_status: "在职-考虑机会",
    phone: "13800138000",
    wechat: "微信号",
    email: "email@example.com"
  },
  skills: "技能描述",
  desired_position: {
    job_type: "全职",
    position: "职位名称",
    industry: "行业",
    salary_min: 10000,
    salary_max: 20000,
    city: "城市",
    other_cities: ["其他城市"]
  },
  work_experience: [...],
  project_experience: [...],
  education: [...],
  certificates: [...]
}
```

## API 响应格式

成功响应：
```javascript
{
  success: true,
  data: { ... },
  message: "操作成功"
}
```

失败响应：
```javascript
{
  success: false,
  error: "错误信息"
}
```
