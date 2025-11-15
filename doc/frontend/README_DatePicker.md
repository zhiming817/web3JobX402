# DatePicker 日期选择器组件

## 概述

统一的日期选择器组件，用于替换所有原生的 `<input type="month">` 和 `<input type="date">` 输入框。

## 特性

- ✅ 支持年份选择
- ✅ 支持年月选择
- ✅ 支持完整日期（年月日）选择
- ✅ 中文本地化（使用 date-fns/locale/zhCN）
- ✅ 统一的样式设计（橙色主题）
- ✅ 日历图标
- ✅ 禁用状态支持
- ✅ 最小/最大日期限制

## 安装依赖

```bash
pnpm install react-datepicker date-fns
```

## 使用方法

### 基本用法（年月选择）

```jsx
import DatePicker from '../components/DatePicker';

function MyComponent() {
  const [birthDate, setBirthDate] = useState('');
  
  return (
    <DatePicker
      value={birthDate}
      onChange={setBirthDate}
      placeholder="选择出生年月"
      showMonthYearPicker
    />
  );
}
```

### 完整日期选择

```jsx
<DatePicker
  value={date}
  onChange={setDate}
  placeholder="选择日期"
  // 不需要 showMonthYearPicker 或 showYearPicker
/>
```

### 年份选择

```jsx
<DatePicker
  value={year}
  onChange={setYear}
  placeholder="选择年份"
  showYearPicker
/>
```

### 禁用状态

```jsx
<DatePicker
  value={date}
  onChange={setDate}
  disabled={true}
  placeholder="禁用状态"
  showMonthYearPicker
/>
```

### 日期范围限制

```jsx
<DatePicker
  value={date}
  onChange={setDate}
  minDate={new Date('2020-01-01')}
  maxDate={new Date()}
  showMonthYearPicker
/>
```

## Props 说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| value | string | - | 日期值（格式：'YYYY-MM' 或 'YYYY-MM-DD'） |
| onChange | function | - | 值变化回调函数 |
| placeholder | string | '选择日期' | 占位符文本 |
| showMonthYearPicker | boolean | false | 是否显示年月选择器 |
| showYearPicker | boolean | false | 是否显示年份选择器 |
| dateFormat | string | auto | 日期格式（自动根据选择器类型设置） |
| className | string | '' | 自定义样式类名 |
| disabled | boolean | false | 是否禁用 |
| minDate | Date | null | 最小可选日期 |
| maxDate | Date | null | 最大可选日期 |

## 数据格式

### 输入/输出格式

- **年月选择**：`'YYYY-MM'`（如：`'2024-11'`）
- **完整日期**：`'YYYY-MM-DD'`（如：`'2024-11-15'`）
- **年份选择**：`'YYYY'`（如：`'2024'`）

### 示例

```jsx
// 年月选择
<DatePicker 
  value="2024-11" 
  onChange={(value) => console.log(value)} // "2024-12"
  showMonthYearPicker 
/>

// 完整日期
<DatePicker 
  value="2024-11-15" 
  onChange={(value) => console.log(value)} // "2024-11-16"
/>
```

## 样式定制

组件使用了自定义 CSS 文件 `DatePicker.css`，主要特点：

- 🎨 橙色主题（`#f97316`）
- 📅 日历图标
- 🎯 聚焦状态带阴影
- 🔒 禁用状态灰色背景
- 🌐 中文本地化

## 已应用的文件

- ✅ `resume/sections/PersonalInfo.jsx` - 出生年月、参加工作时间
- ✅ `resume/sections/WorkExperience.jsx` - 工作开始/结束时间
- ✅ `resume/sections/ProjectExperience.jsx` - 项目开始/结束时间
- ✅ `resume/sections/Education.jsx` - 教育开始/结束时间
- ✅ `resume/sections/Certificates.jsx` - 证书颁发时间、有效期

## 截图对比

### 之前（原生 input）
- 浏览器默认样式
- 不统一的外观
- 中文支持差

### 之后（DatePicker 组件）
- 统一的橙色主题
- 美观的日历选择界面
- 完整的中文支持
- 图标增强的用户体验

## 技术细节

### 依赖库

- **react-datepicker**: 主要的日期选择器库
- **date-fns**: 日期处理和本地化

### 本地化设置

```jsx
import { registerLocale } from 'react-datepicker';
import { zhCN } from 'date-fns/locale';

registerLocale('zh-CN', zhCN);
```

### 自定义输入框

使用 `customInput` 创建自定义的输入框样式，包含：
- 左侧文本显示
- 右侧日历图标
- 点击打开日期选择器

## 注意事项

⚠️ **重要**：
1. 组件接收和返回的都是字符串格式
2. 内部会自动转换 Date 对象
3. `showMonthYearPicker` 模式下，值格式必须是 `'YYYY-MM'`
4. 如果传入空字符串，会清除选择

## 未来扩展

可能的增强功能：
- 📅 日期范围选择（开始-结束）
- 🕐 时间选择支持
- 🌍 更多语言本地化
- 🎨 主题配置选项
- ⌨️ 键盘快捷键
