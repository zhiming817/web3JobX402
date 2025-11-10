#!/bin/bash

# 测试获取简历详情接口
# 需要提供 resume_id 和 owner

BASE_URL="http://127.0.0.1:4021"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 测试获取简历详情接口 ===${NC}\n"

# 1. 先创建一个测试用户和简历
WALLET="test_wallet_$(date +%s)"
echo -e "${BLUE}1. 创建测试用户: $WALLET${NC}"
curl -s -X POST "$BASE_URL/api/users/register" \
  -H "Content-Type: application/json" \
  -d "{\"wallet_address\": \"$WALLET\", \"nickname\": \"测试用户\"}" | jq .

# 2. 创建简历并获取 resume_id
echo -e "\n${BLUE}2. 创建测试简历${NC}"
RESUME_RESPONSE=$(curl -s -X POST "$BASE_URL/api/resumes" \
  -H "Content-Type: application/json" \
  -d "{
    \"owner\": \"$WALLET\",
    \"personal\": {
      \"name\": \"张三\",
      \"gender\": \"男\",
      \"birth_date\": \"1995-01-01\",
      \"work_start_date\": \"2018-07-01\",
      \"job_status\": \"在职-考虑机会\",
      \"phone\": \"13800138000\",
      \"email\": \"zhangsan@example.com\"
    },
    \"skills\": \"熟练掌握 React、Vue、Node.js\",
    \"desired_position\": {
      \"job_type\": \"全职\",
      \"position\": \"前端工程师\",
      \"industry\": \"互联网\",
      \"salary_min\": 15000,
      \"salary_max\": 25000,
      \"city\": \"北京\",
      \"other_cities\": [\"上海\", \"深圳\"]
    },
    \"work_experience\": [
      {
        \"company\": \"某科技公司\",
        \"position\": \"前端开发工程师\",
        \"start_date\": \"2020-07-01\",
        \"end_date\": \"2024-01-01\",
        \"description\": \"负责前端开发\"
      }
    ],
    \"project_experience\": [
      {
        \"name\": \"电商平台\",
        \"role\": \"前端负责人\",
        \"start_date\": \"2021-01-01\",
        \"end_date\": \"2023-12-31\",
        \"description\": \"从0到1搭建电商平台\"
      }
    ],
    \"education\": [
      {
        \"degree\": \"本科\",
        \"school\": \"清华大学\",
        \"major\": \"计算机科学\",
        \"start_date\": \"2014-09-01\",
        \"end_date\": \"2018-06-30\"
      }
    ],
    \"certificates\": [
      {
        \"name\": \"PMP\",
        \"issue_date\": \"2020-06-01\"
      }
    ]
  }")

echo "$RESUME_RESPONSE" | jq .

RESUME_ID=$(echo "$RESUME_RESPONSE" | jq -r '.data')

if [ "$RESUME_ID" == "null" ] || [ -z "$RESUME_ID" ]; then
  echo -e "${RED}创建简历失败!${NC}"
  exit 1
fi

echo -e "\n${GREEN}简历创建成功! ID: $RESUME_ID${NC}"

# 3. 测试获取简历详情 (使用正确的 owner)
echo -e "\n${BLUE}3. 获取简历详情 (正确的 owner)${NC}"
curl -s -X GET "$BASE_URL/api/resumes/detail/$RESUME_ID/$WALLET" | jq .

# 4. 测试使用错误的 owner (应该返回 Unauthorized)
echo -e "\n${BLUE}4. 使用错误的 owner 获取详情 (应该失败)${NC}"
WRONG_WALLET="wrong_wallet_123"
curl -s -X GET "$BASE_URL/api/resumes/detail/$RESUME_ID/$WRONG_WALLET" | jq .

# 5. 测试不存在的简历 ID
echo -e "\n${BLUE}5. 获取不存在的简历 (应该失败)${NC}"
curl -s -X GET "$BASE_URL/api/resumes/detail/non-existent-id/$WALLET" | jq .

echo -e "\n${GREEN}=== 测试完成! ===${NC}"
