# 后端 Seal 集成改动清单

## 📋 概述

后端需要进行以下改动以完整支持 Seal 加密功能：

## ✅ 已完成的工作

### 1. 数据库层
- ✅ 迁移脚本已准备：`migrations/002_add_seal_fields.sql`
- ✅ 实体已更新：`src/entities/resume.rs`
  - 新增字段：`blob_id`, `encryption_id`, `policy_object_id`, `encryption_type`
  - 字段已正确定义，支持 NULL 值

### 2. 实体定义
```rust
// src/entities/resume.rs - 已完成 ✅
pub struct Model {
    // ... 现有字段
    
    /// Walrus Blob ID 或 IPFS CID (加密简历数据)
    #[sea_orm(column_type = "String(StringLen::N(150))")]
    pub blob_id: String,
    
    /// 加密密钥（简单加密模式使用，Seal 模式为 NULL）
    #[sea_orm(column_type = "Text", nullable)]
    pub encryption_key: Option<String>,
    
    /// Seal 加密 ID（Seal 模式使用）
    #[sea_orm(column_type = "String(StringLen::N(150))", nullable)]
    pub encryption_id: Option<String>,
    
    /// Allowlist 对象 ID（访问控制策略，Seal 模式使用）
    #[sea_orm(column_type = "String(StringLen::N(100))", nullable)]
    pub policy_object_id: Option<String>,
    
    /// 加密类型: simple(简单加密) 或 seal(Seal 加密)
    #[sea_orm(column_type = "String(StringLen::N(20))")]
    pub encryption_type: String,
}
```

## 🔧 需要改动的部分

### 1. 模型层 (models/resume.rs)

#### 当前问题
- `CreateResumeRequest` 只有 `ipfs_cid` 字段
- 缺少 Seal 相关字段

#### 需要的改动

```rust
// src/models/resume.rs

/// 简历创建请求
#[derive(Debug, Clone, Deserialize)]
pub struct CreateResumeRequest {
    pub owner: String,
    
    // 现有字段
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ipfs_cid: Option<String>,  // 兼容旧版本
    
    // 新增 Seal 字段 ⭐
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blob_id: Option<String>,  // Walrus blob ID
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub encryption_id: Option<String>,  // Seal 加密 ID
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub policy_object_id: Option<String>,  // Allowlist 策略 ID
    
    #[serde(default = "default_encryption_type")]
    pub encryption_type: String,  // "simple" 或 "seal"
    
    // 原有字段
    pub personal: PersonalInfo,
    pub skills: String,
    pub desired_position: DesiredPosition,
    pub work_experience: Vec<WorkExperience>,
    pub project_experience: Vec<ProjectExperience>,
    pub education: Vec<Education>,
    pub certificates: Vec<Certificate>,
}

fn default_encryption_type() -> String {
    "simple".to_string()
}

/// Resume 模型也需要返回新字段
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Resume {
    pub id: String,
    pub owner: String,
    
    // ... 现有字段 ...
    
    // 加密相关字段 ⭐
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ipfs_cid: Option<String>,  // 兼容旧版本
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blob_id: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub encryption_id: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub policy_object_id: Option<String>,
    
    pub encryption_type: String,  // "simple" 或 "seal"
    
    pub created_at: i64,
    pub updated_at: i64,
}

/// MyResumeSummary 也需要返回新字段
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MyResumeSummary {
    pub id: String,
    pub owner: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub price: i64,
    pub view_count: i32,
    pub unlock_count: i32,
    pub status: String,
    
    // 加密字段 ⭐
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ipfs_cid: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blob_id: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub encryption_id: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub policy_object_id: Option<String>,
    
    pub encryption_type: String,
}
```

### 2. DAO 层 (dao/resume_dao.rs)

#### 需要的改动

```rust
// src/dao/resume_dao.rs

impl ResumeDao {
    /// 创建简历 - 支持 Seal 和简单加密
    pub async fn create(
        db: &DatabaseConnection,
        user_id: i64,
        resume_data: ResumeModel,
        blob_id: String,  // ⭐ 改名从 ipfs_cid
        encryption_key: Option<String>,  // ⭐ 改为 Option
        encryption_id: Option<String>,  // ⭐ 新增
        policy_object_id: Option<String>,  // ⭐ 新增
        encryption_type: String,  // ⭐ 新增
    ) -> Result<i64> {
        let owner = resume_data.owner.clone();
        let summary = serde_json::to_value(&resume_data).unwrap_or_default();
        
        let resume = resume::ActiveModel {
            resume_id: Set(resume_data.id),
            owner_id: Set(user_id),
            owner_wallet: Set(owner),
            blob_id: Set(blob_id),  // ⭐ 使用新字段
            encryption_key: Set(encryption_key),  // ⭐ Option
            encryption_id: Set(encryption_id),  // ⭐ 新增
            policy_object_id: Set(policy_object_id),  // ⭐ 新增
            encryption_type: Set(encryption_type),  // ⭐ 新增
            summary: Set(summary),
            price: Set(5_000_000),
            view_count: Set(0),
            unlock_count: Set(0),
            status: Set("active".to_string()),
            created_at: Set(chrono::Utc::now().naive_utc()),
            updated_at: Set(chrono::Utc::now().naive_utc()),
            ..Default::default()
        };
        
        let result = resume.insert(db).await?;
        Ok(result.id)
    }
    
    /// 更新简历 - 支持 Seal 字段
    pub async fn update(
        db: &DatabaseConnection,
        resume_id: &str,
        blob_id: String,  // ⭐ 改名
        encryption_key: Option<String>,  // ⭐ Option
        encryption_id: Option<String>,  // ⭐ 新增
        policy_object_id: Option<String>,  // ⭐ 新增
        encryption_type: String,  // ⭐ 新增
        summary: serde_json::Value,
        price: i64,
    ) -> Result<()> {
        Resume::update_many()
            .filter(resume::Column::ResumeId.eq(resume_id))
            .col_expr(resume::Column::BlobId, Expr::value(blob_id))  // ⭐ 改名
            .col_expr(resume::Column::EncryptionKey, Expr::value(encryption_key))
            .col_expr(resume::Column::EncryptionId, Expr::value(encryption_id))  // ⭐ 新增
            .col_expr(resume::Column::PolicyObjectId, Expr::value(policy_object_id))  // ⭐ 新增
            .col_expr(resume::Column::EncryptionType, Expr::value(encryption_type))  // ⭐ 新增
            .col_expr(resume::Column::Summary, Expr::value(summary))
            .col_expr(resume::Column::Price, Expr::value(price))
            .col_expr(resume::Column::UpdatedAt, Expr::value(chrono::Utc::now().naive_utc()))
            .exec(db)
            .await?;
        Ok(())
    }
}
```

### 3. Service 层 (services/resume_service.rs)

#### 需要的改动

```rust
// src/services/resume_service.rs

impl ResumeService {
    /// 创建简历 - 支持 Seal 和简单加密
    pub async fn create_resume(
        db: &DatabaseConnection,
        request: CreateResumeRequest,
    ) -> Result<String, String> {
        // 1. 确保用户存在
        let user_id = UserService::create_or_get_user(db, request.owner.clone())
            .await
            .map_err(|e| format!("Failed to create/get user: {}", e))?;

        // 2. 生成简历 ID
        let resume_id = format!("resume-{}", uuid::Uuid::new_v4());
        let now = chrono::Utc::now().timestamp();

        // 3. 确定存储 ID（blob_id 优先，兼容旧的 ipfs_cid）⭐
        let storage_id = request.blob_id
            .or(request.ipfs_cid.clone())
            .ok_or_else(|| "Missing blob_id or ipfs_cid".to_string())?;

        // 4. 确定加密类型 ⭐
        let encryption_type = request.encryption_type.clone();
        
        // 5. 根据加密类型处理密钥 ⭐
        let encryption_key = if encryption_type == "simple" {
            Some(String::new()) // 简单加密，前端管理密钥
        } else {
            None // Seal 加密，不需要本地密钥
        };

        let resume = Resume {
            id: resume_id.clone(),
            owner: request.owner.clone(),
            personal: request.personal,
            skills: request.skills,
            desired_position: request.desired_position,
            work_experience: request.work_experience,
            project_experience: request.project_experience,
            education: request.education,
            certificates: request.certificates,
            created_at: now,
            updated_at: now,
            
            // 加密字段 ⭐
            ipfs_cid: request.ipfs_cid.clone(),  // 兼容旧版本
            blob_id: Some(storage_id.clone()),
            encryption_id: request.encryption_id.clone(),
            policy_object_id: request.policy_object_id.clone(),
            encryption_type: encryption_type.clone(),
        };

        log::info!("Creating resume with encryption type: {}", encryption_type);

        // 6. 创建简历记录 ⭐
        ResumeDao::create(
            db,
            user_id,
            resume,
            storage_id,
            encryption_key,
            request.encryption_id,
            request.policy_object_id,
            encryption_type,
        )
        .await
        .map_err(|e| format!("Failed to create resume: {}", e))?;
        
        Ok(resume_id)
    }

    /// 获取简历详情 - 返回 Seal 字段 ⭐
    pub async fn get_resume_detail(
        db: &DatabaseConnection,
        resume_id: &str,
        owner: &str
    ) -> Result<Resume, String> {
        let resume = ResumeDao::find_by_resume_id(db, resume_id)
            .await
            .map_err(|e| format!("Failed to fetch resume: {}", e))?
            .ok_or_else(|| "Resume not found".to_string())?;

        // 验证所有权
        if resume.owner_wallet != owner {
            return Err("Unauthorized: You don't own this resume".to_string());
        }

        // 解析简历数据
        let mut resume_data: Resume = serde_json::from_value(resume.summary.clone())
            .map_err(|e| format!("Failed to parse resume: {}", e))?;

        // 添加加密字段 ⭐
        resume_data.ipfs_cid = Some(resume.blob_id.clone());  // 兼容
        resume_data.blob_id = Some(resume.blob_id.clone());
        resume_data.encryption_id = resume.encryption_id.clone();
        resume_data.policy_object_id = resume.policy_object_id.clone();
        resume_data.encryption_type = resume.encryption_type.clone();

        Ok(resume_data)
    }

    /// 获取我的简历 - 返回 Seal 字段 ⭐
    pub async fn get_my_resumes(
        db: &DatabaseConnection,
        owner: &str
    ) -> Result<Vec<MyResumeSummary>, String> {
        let resumes = ResumeDao::find_by_owner(db, owner)
            .await
            .map_err(|e| format!("Failed to fetch resumes: {}", e))?;
        
        let summaries: Vec<MyResumeSummary> = resumes.iter()
            .filter_map(|r| {
                let resume: Resume = serde_json::from_value(r.summary.clone()).ok()?;
                Some(MyResumeSummary {
                    id: resume.id,
                    owner: resume.owner,
                    created_at: resume.created_at,
                    updated_at: resume.updated_at,
                    price: r.price,
                    view_count: r.view_count,
                    unlock_count: r.unlock_count,
                    status: r.status.clone(),
                    
                    // 加密字段 ⭐
                    ipfs_cid: Some(r.blob_id.clone()),  // 兼容
                    blob_id: Some(r.blob_id.clone()),
                    encryption_id: r.encryption_id.clone(),
                    policy_object_id: r.policy_object_id.clone(),
                    encryption_type: r.encryption_type.clone(),
                })
            })
            .collect();
        
        Ok(summaries)
    }

    /// 更新简历 - 支持 Seal 字段 ⭐
    pub async fn update_resume(
        db: &DatabaseConnection,
        resume_id: &str,
        request: CreateResumeRequest
    ) -> Result<(), String> {
        let existing = ResumeDao::find_by_resume_id(db, resume_id)
            .await
            .map_err(|e| format!("Failed to fetch resume: {}", e))?
            .ok_or_else(|| "Resume not found".to_string())?;

        // 使用新的存储 ID，否则保留旧的
        let storage_id = request.blob_id
            .or(request.ipfs_cid.clone())
            .unwrap_or(existing.blob_id.clone());

        // 确定加密类型
        let encryption_type = request.encryption_type.clone();
        
        // 根据加密类型处理密钥
        let encryption_key = if encryption_type == "simple" {
            Some(existing.encryption_key.clone().unwrap_or_default())
        } else {
            None
        };

        let updated = Resume {
            id: resume_id.to_string(),
            owner: existing.owner_wallet.clone(),
            personal: request.personal,
            skills: request.skills,
            desired_position: request.desired_position,
            work_experience: request.work_experience,
            project_experience: request.project_experience,
            education: request.education,
            certificates: request.certificates,
            created_at: existing.created_at.and_utc().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
            
            // 加密字段
            ipfs_cid: request.ipfs_cid.clone(),
            blob_id: Some(storage_id.clone()),
            encryption_id: request.encryption_id.clone(),
            policy_object_id: request.policy_object_id.clone(),
            encryption_type: encryption_type.clone(),
        };

        let summary = serde_json::to_value(&updated)
            .map_err(|e| format!("Failed to serialize resume: {}", e))?;

        ResumeDao::update(
            db,
            resume_id,
            storage_id,
            encryption_key,
            request.encryption_id,
            request.policy_object_id,
            encryption_type,
            summary,
            existing.price
        )
        .await
        .map_err(|e| format!("Failed to update resume: {}", e))?;

        Ok(())
    }
}
```

### 4. Controller 层 (controllers/resume_controller.rs)

#### 需要的改动

```rust
// src/controllers/resume_controller.rs

impl ResumeController {
    /// 创建简历 - 简化验证逻辑 ⭐
    pub async fn create(
        req: web::Json<CreateResumeRequest>,
        db: web::Data<DatabaseConnection>,
    ) -> impl Responder {
        println!("=== Create resume endpoint ===");

        let request = req.into_inner();
        
        // 检查是否提供了存储 ID（blob_id 或 ipfs_cid）⭐
        if request.blob_id.is_none() && request.ipfs_cid.is_none() {
            let response = ApiResponse::<()>::error(
                "Missing blob_id or ipfs_cid. Please encrypt and upload the resume first.".to_string()
            );
            return HttpResponse::BadRequest().json(response);
        }

        // 验证 Seal 模式的必需字段 ⭐
        if request.encryption_type == "seal" {
            if request.encryption_id.is_none() || request.policy_object_id.is_none() {
                let response = ApiResponse::<()>::error(
                    "Seal encryption requires encryption_id and policy_object_id".to_string()
                );
                return HttpResponse::BadRequest().json(response);
            }
        }

        match ResumeService::create_resume(&db, request).await {
            Ok(resume_id) => {
                let response = ApiResponse::success_with_message(
                    resume_id,
                    "Resume created successfully".to_string(),
                );
                HttpResponse::Ok().json(response)
            }
            Err(e) => {
                let response = ApiResponse::<()>::error(e);
                HttpResponse::BadRequest().json(response)
            }
        }
    }
    
    // 其他方法保持不变，但返回数据会自动包含新字段
}
```

## 📋 改动检查清单

### 必须改动 (P0)
- [ ] **数据库迁移**：执行 `002_add_seal_fields.sql`
- [ ] **models/resume.rs**：
  - [ ] 更新 `CreateResumeRequest` 添加 Seal 字段
  - [ ] 更新 `Resume` 添加返回字段
  - [ ] 更新 `MyResumeSummary` 添加返回字段
- [ ] **dao/resume_dao.rs**：
  - [ ] 更新 `create()` 方法签名和实现
  - [ ] 更新 `update()` 方法签名和实现
- [ ] **services/resume_service.rs**：
  - [ ] 更新 `create_resume()` 处理 Seal 字段
  - [ ] 更新 `get_resume_detail()` 返回 Seal 字段
  - [ ] 更新 `get_my_resumes()` 返回 Seal 字段
  - [ ] 更新 `update_resume()` 处理 Seal 字段
- [ ] **controllers/resume_controller.rs**：
  - [ ] 更新 `create()` 验证逻辑

### 建议改动 (P1)
- [ ] 添加日志记录 Seal 相关操作
- [ ] 添加 Seal 字段验证
- [ ] 添加错误处理优化

### 测试清单
- [ ] 创建简单加密简历
- [ ] 创建 Seal 加密简历
- [ ] 获取简历详情（简单加密）
- [ ] 获取简历详情（Seal 加密）
- [ ] 更新简单加密简历
- [ ] 更新 Seal 加密简历
- [ ] 我的简历列表正确返回加密字段

## 🚀 执行步骤

### Step 1: 数据库迁移
```bash
cd backend/rust_backend
./scripts/migrate_seal_fields.sh
```

### Step 2: 更新代码
按照上述清单依次更新各个文件。

### Step 3: 编译测试
```bash
cargo build
cargo test
```

### Step 4: 启动服务
```bash
cargo run
```

### Step 5: 前端联调
测试完整的创建、编辑、浏览流程。

## 📊 兼容性说明

### 向后兼容
- ✅ 保留 `ipfs_cid` 字段兼容旧版本
- ✅ `encryption_type` 默认为 "simple"
- ✅ 所有 Seal 字段都是 Optional

### 字段映射
| 旧字段 | 新字段 | 说明 |
|--------|--------|------|
| `ipfs_cid` | `blob_id` | 统一为 blob_id，但仍支持 ipfs_cid |
| N/A | `encryption_id` | Seal 加密 ID |
| N/A | `policy_object_id` | Allowlist 策略 ID |
| N/A | `encryption_type` | "simple" 或 "seal" |

## 🎯 预期结果

### 创建简历（Seal 模式）
**请求**：
```json
{
  "owner": "0x123...",
  "blob_id": "walrus://abc123...",
  "encryption_id": "enc_xyz...",
  "policy_object_id": "0x456...",
  "encryption_type": "seal",
  "personal": { ... },
  ...
}
```

**响应**：
```json
{
  "success": true,
  "data": "resume-uuid-...",
  "message": "Resume created successfully"
}
```

### 获取简历详情
**响应**：
```json
{
  "success": true,
  "data": {
    "id": "resume-uuid-...",
    "owner": "0x123...",
    "blob_id": "walrus://abc123...",
    "encryption_id": "enc_xyz...",
    "policy_object_id": "0x456...",
    "encryption_type": "seal",
    "personal": { ... },
    ...
  }
}
```

### 我的简历列表
**响应**：
```json
{
  "success": true,
  "data": [
    {
      "id": "resume-uuid-...",
      "owner": "0x123...",
      "blob_id": "walrus://abc123...",
      "encryption_id": "enc_xyz...",
      "policy_object_id": "0x456...",
      "encryption_type": "seal",
      "price": 5000000,
      "view_count": 10,
      "unlock_count": 2,
      "status": "active",
      ...
    }
  ]
}
```

## 📝 总结

**需要改动的文件**：
1. ✅ `src/entities/resume.rs` - 已完成
2. ⚠️ `src/models/resume.rs` - 需要更新
3. ⚠️ `src/dao/resume_dao.rs` - 需要更新
4. ⚠️ `src/services/resume_service.rs` - 需要更新
5. ⚠️ `src/controllers/resume_controller.rs` - 需要更新

**工作量估计**：
- 数据库迁移：5 分钟
- 代码改动：1-2 小时
- 测试验证：30 分钟
- **总计**：约 2-3 小时

**风险评估**：
- 🟢 低风险：向后兼容，不影响现有功能
- 🟢 低难度：主要是字段添加，逻辑简单
- 🟢 可回滚：数据库迁移可回滚
