# 获取简历详情接口文档

## API 信息

**接口路径:** `GET /api/resumes/detail/{resume_id}/{owner}`

**功能:** 根据简历 ID 和所有者钱包地址获取简历的完整详情

**权限:** 需要验证所有权 (只有简历所有者可以查看)

---

## 请求参数

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `resume_id` | string | 是 | 简历 ID |
| `owner` | string | 是 | 所有者钱包地址 |

---

## 响应格式

### 成功响应 (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "resume-xxx-xxx-xxx",
    "owner": "wallet_address_xxx",
    "personal": {
      "name": "张三",
      "gender": "男",
      "birth_date": "1995-01-01",
      "work_start_date": "2018-07-01",
      "job_status": "在职-考虑机会",
      "phone": "13800138000",
      "wechat": "wechat_id",
      "email": "zhangsan@example.com"
    },
    "skills": "熟练掌握 React、Vue、Node.js",
    "desired_position": {
      "job_type": "全职",
      "position": "前端工程师",
      "industry": "互联网",
      "salary_min": 15000,
      "salary_max": 25000,
      "city": "北京",
      "other_cities": ["上海", "深圳"]
    },
    "work_experience": [...],
    "project_experience": [...],
    "education": [...],
    "certificates": [...],
    "created_at": 1704067200,
    "updated_at": 1704067200
  },
  "message": null
}
```

### 错误响应

#### 1. 未授权 (500 Internal Server Error)

```json
{
  "success": false,
  "data": null,
  "error": "Unauthorized: You don't own this resume"
}
```

**原因:** 提供的 owner 地址与简历所有者不匹配

#### 2. 简历不存在 (500 Internal Server Error)

```json
{
  "success": false,
  "data": null,
  "error": "Resume not found"
}
```

**原因:** 提供的 resume_id 不存在或已被删除

#### 3. 数据解析失败 (500 Internal Server Error)

```json
{
  "success": false,
  "data": null,
  "error": "Failed to parse resume: ..."
}
```

**原因:** 数据库中的简历数据格式异常

---

## 使用示例

### curl 示例

```bash
# 获取简历详情
curl -X GET "http://127.0.0.1:4021/api/resumes/detail/resume-xxx/wallet_address_xxx"
```

### JavaScript 前端示例

```javascript
import { resumeService } from '../services';
import { useWallet } from '@solana/wallet-adapter-react';

const ResumeDetail = ({ resumeId }) => {
  const { publicKey } = useWallet();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDetail = async () => {
      if (!publicKey) return;

      setLoading(true);
      setError(null);

      try {
        const owner = publicKey.toString();
        const data = await resumeService.getResumeDetail(resumeId, owner);
        setResume(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [resumeId, publicKey]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  if (!resume) return <div>简历不存在</div>;

  return (
    <div>
      <h2>{resume.personal.name}</h2>
      <p>{resume.desired_position.position}</p>
      {/* 显示完整简历内容 */}
    </div>
  );
};
```

---

## 安全说明

1. **所有权验证:** 接口会验证请求者是否是简历的所有者
2. **隐私保护:** 只有所有者可以查看完整简历,其他人只能看到摘要
3. **数据完整性:** 返回完整的简历数据,包括所有字段

---

## 与其他接口的区别

| 接口 | 用途 | 数据范围 | 权限要求 |
|------|------|----------|----------|
| `GET /api/resumes/summaries` | 浏览所有简历 | 仅摘要信息 | 无 |
| `GET /api/resumes/my/{owner}` | 查看我的简历列表 | 完整信息列表 | 所有者 |
| `GET /api/resumes/detail/{id}/{owner}` | 查看单个简历详情 | 单个完整信息 | 所有者 |
| `POST /api/resumes/unlock` | 解锁简历 | 完整信息 | x402 支付 |

---

## 测试

运行测试脚本:

```bash
cd backend/rust_backend
./examples/test_get_resume_detail.sh
```

测试脚本会:
1. 创建测试用户
2. 创建测试简历
3. 使用正确的 owner 获取详情 (应成功)
4. 使用错误的 owner 获取详情 (应失败)
5. 获取不存在的简历 (应失败)

---

## 使用场景

1. **编辑简历:** 在更新简历前获取当前数据
2. **查看详情:** 用户查看自己简历的完整信息
3. **数据回显:** 在编辑表单中回显现有数据
4. **审核检查:** 确认简历数据是否正确保存

---

**添加时间:** 2025-01-07  
**版本:** v1.0
