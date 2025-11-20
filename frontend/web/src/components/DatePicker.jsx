import React from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';
import dayjs from 'dayjs';

/**
 * Unified DatePicker Component using MUI
 * Supports Year, Month-Year, and Full Date selection
 */
export default function DatePicker({ 
  value, 
  onChange, 
  placeholder,
  showMonthYearPicker = false,
  showYearPicker = false,
  disabled = false,
  minDate,
  maxDate,
  className = '',
  ...props 
}) {
  // Convert string value to dayjs object
  const dateValue = value ? dayjs(value) : null;

  const handleChange = (newValue) => {
    if (!newValue || !newValue.isValid()) {
      onChange('');
      return;
    }

    // Format based on mode
    let formatString = 'YYYY-MM-DD';
    if (showYearPicker) {
      formatString = 'YYYY';
    } else if (showMonthYearPicker) {
      formatString = 'YYYY-MM';
    }

    onChange(newValue.format(formatString));
  };

  // Determine views and format
  let views = ['year', 'month', 'day'];
  let format = 'YYYY-MM-DD';
  
  if (showYearPicker) {
    views = ['year'];
    format = 'YYYY';
  } else if (showMonthYearPicker) {
    views = ['year', 'month'];
    format = 'YYYY-MM';
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MuiDatePicker
        value={dateValue}
        onChange={handleChange}
        views={views}
        format={format}
        disabled={disabled}
        minDate={minDate ? dayjs(minDate) : undefined}
        maxDate={maxDate ? dayjs(maxDate) : undefined}
        slots={{
          openPickerIcon: CalendarIcon
        }}
        slotProps={{
          textField: {
            fullWidth: true,
            placeholder: placeholder,
            size: 'small',
            className: className,
            sx: {
              backgroundColor: 'white',
              '& .MuiOutlinedInput-root': {
                borderRadius: '0.5rem', // rounded-lg
                transition: 'all 0.2s ease-in-out',
                '& fieldset': {
                  borderColor: '#d1d5db', // gray-300
                },
                '&:hover fieldset': {
                  borderColor: '#9ca3af', // gray-400
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#14b8a6', // teal-500 (matching most forms)
                  borderWidth: '2px',
                },
                '& input': {
                  padding: '8.5px 14px', // Fine-tune padding
                  fontSize: '0.875rem', // text-sm
                  color: '#111827', // gray-900
                }
              },
              '& .MuiInputAdornment-root': {
                color: '#6b7280', // gray-500
                marginRight: '4px',
              },
              '& .MuiSvgIcon-root': {
                fontSize: '1.25rem',
              }
            }
          },
          popper: {
            sx: {
              '& .MuiPaper-root': {
                borderRadius: '1rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // shadow-lg
                border: '1px solid #f3f4f6',
              },
              '& .MuiPickersDay-root.Mui-selected': {
                backgroundColor: '#14b8a6', // teal-500
                '&:hover': {
                  backgroundColor: '#0d9488', // teal-600
                }
              },
              '& .MuiPickersYear-yearButton.Mui-selected': {
                backgroundColor: '#14b8a6',
                '&:hover': {
                  backgroundColor: '#0d9488',
                }
              }
            }
          }
        }}
        {...props}
      />
    </LocalizationProvider>
  );
}
