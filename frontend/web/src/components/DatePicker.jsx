import React, { forwardRef } from 'react';
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { zhCN } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePicker.css';

// 注册中文本地化
registerLocale('zh-CN', zhCN);

/**
 * 统一的日期选择器组件
 * 支持年月日选择，带中文本地化
 */
const DatePicker = forwardRef(({ 
  value, 
  onChange, 
  placeholder = '选择日期',
  showMonthYearPicker = false,
  showYearPicker = false,
  dateFormat = showMonthYearPicker ? 'yyyy-MM' : showYearPicker ? 'yyyy' : 'yyyy-MM-dd',
  className = '',
  disabled = false,
  minDate = null,
  maxDate = null,
  ...props 
}, ref) => {
  // 将字符串值转换为 Date 对象
  const dateValue = value ? new Date(value + (showMonthYearPicker ? '-01' : '')) : null;

  const handleChange = (date) => {
    if (!date) {
      onChange('');
      return;
    }

    // 根据格式转换回字符串
    if (showYearPicker) {
      onChange(date.getFullYear().toString());
    } else if (showMonthYearPicker) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      onChange(`${year}-${month}`);
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
  };

  // 自定义输入框
  const CustomInput = forwardRef(({ value, onClick, placeholder }, ref) => (
    <div 
      className={`custom-date-input ${disabled ? 'disabled' : ''} ${className}`}
      onClick={onClick}
      ref={ref}
    >
      <span className={value ? 'has-value' : 'placeholder'}>
        {value || placeholder}
      </span>
      <svg 
        className="calendar-icon" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
        />
      </svg>
    </div>
  ));

  CustomInput.displayName = 'CustomInput';

  // 配置年份范围（最近100年）
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 99;
  const maxYear = currentYear;

  // 自定义头部（用于年月选择器）
  const renderCustomHeader = ({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }) => {
    const years = [];
    for (let i = minYear; i <= maxYear; i++) {
      years.push(i);
    }

    const months = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];

    return (
      <div className="custom-datepicker-header">
        <button
          type="button"
          onClick={decreaseMonth}
          disabled={prevMonthButtonDisabled}
          className="custom-datepicker-nav-button"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="custom-datepicker-selects">
          <select
            value={date.getFullYear()}
            onChange={({ target: { value } }) => changeYear(Number(value))}
            className="custom-datepicker-select"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}年
              </option>
            ))}
          </select>

          {showMonthYearPicker && (
            <select
              value={date.getMonth()}
              onChange={({ target: { value } }) => changeMonth(Number(value))}
              className="custom-datepicker-select"
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          onClick={increaseMonth}
          disabled={nextMonthButtonDisabled}
          className="custom-datepicker-nav-button"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <ReactDatePicker
      ref={ref}
      selected={dateValue}
      onChange={handleChange}
      dateFormat={dateFormat}
      showMonthYearPicker={showMonthYearPicker}
      showYearPicker={showYearPicker}
      placeholderText={placeholder}
      customInput={<CustomInput placeholder={placeholder} />}
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      locale="zh-CN"
      renderCustomHeader={showMonthYearPicker ? renderCustomHeader : undefined}
      {...props}
    />
  );
});

DatePicker.displayName = 'DatePicker';

export default DatePicker;
