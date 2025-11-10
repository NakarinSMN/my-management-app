'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faChevronRight, 
  faAnglesLeft, 
  faAnglesRight,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import FilterDropdown from './FilterDropdown';

const holidays = [
  '2024-01-01',
  '2024-04-13',
  '2024-04-14',
  '2024-04-15',
  '2024-12-05',
  '2024-12-31',
  '2025-01-01',
  '2025-04-13',
  '2025-04-14',
  '2025-04-15',
  '2025-12-05',
  '2025-12-31',
];

export default function Calendar({
  selectedDate,
  onSelectDate,
  className = "",
}: {
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  className?: string;
}) {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // ตรวจสอบว่า selectedDate มีค่าและไม่ใช่ empty string
    if (selectedDate && selectedDate.trim() !== '') {
      const date = new Date(selectedDate);
      // ตรวจสอบว่าเป็น valid date
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return new Date();
  });
  const [daysInMonth, setDaysInMonth] = useState<Date[]>([]);

  useEffect(() => {
    generateCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const days: Date[] = [];
    for (let i = firstDayOfMonth.getDay(); i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    while (days.length < 42) {
      const last = days[days.length - 1];
      days.push(
        new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)
      );
    }

    setDaysInMonth(days);
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const year = prev.getFullYear();
      const month = prev.getMonth() + offset;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const day = Math.min(prev.getDate(), lastDay);
      return new Date(year, month, day);
    });
  };

  const changeYear = (offset: number) => {
    setCurrentDate(prev => {
      const year = prev.getFullYear() + offset;
      const month = prev.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      const day = Math.min(prev.getDate(), lastDay);
      return new Date(year, month, day);
    });
  };

  const isHoliday = (date: Date) =>
    holidays.includes(date.toISOString().split('T')[0]);

  const handleSelectDate = (date: Date) => {
    if (onSelectDate) {
      onSelectDate(date.toISOString().split('T')[0]);
    }
  };

  const todayString = new Date().toDateString();
  const yearOptions = Array.from({ length: 21 }, (_, i) => 2015 + i);
  const months = Array.from({ length: 12 }).map((_, idx) =>
    new Date(0, idx).toLocaleString('th-TH', { month: 'long' })
  );

  return (
    <div
      className={`w-full h-full flex flex-col p-6 rounded-2xl ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-center mb-4 flex-shrink-0 pb-4 border-b-2 border-emerald-100 dark:border-emerald-900/30 gap-0.5">
        <button 
          onClick={() => changeYear(-1)} 
          className="p-2 rounded-lg transition-all hover:scale-125"
          aria-label="ปีก่อนหน้า"
        >
          <FontAwesomeIcon icon={faAnglesLeft} className="text-emerald-600 dark:text-emerald-400 text-lg" />
        </button>
        <button 
          onClick={() => changeMonth(-1)} 
          className="p-2 rounded-lg transition-all hover:scale-125"
          aria-label="เดือนก่อนหน้า"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-emerald-600 dark:text-emerald-400 text-lg" />
        </button>
        
        <div className="flex items-center gap-1.5 mx-3">
          {/* Month Dropdown */}
          <FilterDropdown
            value={currentDate.getMonth().toString()}
            onChange={(val) => {
              const monthIdx = parseInt(val);
              setCurrentDate(
                new Date(
                  currentDate.getFullYear(),
                  monthIdx,
                  Math.min(
                    currentDate.getDate(),
                    new Date(currentDate.getFullYear(), monthIdx + 1, 0).getDate()
                  )
                )
              );
            }}
            icon={faCalendarAlt}
            placeholder="เดือน"
            options={months.map((m, idx) => ({ 
              value: idx.toString(), 
              label: m,
              color: '#10B981'
            }))}
            className="min-w-[160px]"
            showClearButton={false}
          />

          {/* Year Dropdown */}
          <FilterDropdown
            value={currentDate.getFullYear().toString()}
            onChange={(val) => {
              const year = parseInt(val);
              setCurrentDate(
                new Date(
                  year,
                  currentDate.getMonth(),
                  Math.min(
                    currentDate.getDate(),
                    new Date(year, currentDate.getMonth() + 1, 0).getDate()
                  )
                )
              );
            }}
            icon={faCalendarAlt}
            placeholder="ปี"
            showClearButton={false}
            options={yearOptions.map(y => ({ 
              value: y.toString(), 
              label: y.toString(),
              color: '#10B981'
            }))}
            className="min-w-[120px]"
          />
        </div>

        <button 
          onClick={() => changeMonth(1)} 
          className="p-2 rounded-lg transition-all hover:scale-125"
          aria-label="เดือนถัดไป"
        >
          <FontAwesomeIcon icon={faChevronRight} className="text-emerald-600 dark:text-emerald-400 text-lg" />
        </button>
        <button 
          onClick={() => changeYear(1)} 
          className="p-2 rounded-lg transition-all hover:scale-125"
          aria-label="ปีถัดไป"
        >
          <FontAwesomeIcon icon={faAnglesRight} className="text-emerald-600 dark:text-emerald-400 text-lg" />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 text-center font-semibold pb-3 mb-2 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
          <div key={d} className="text-sm">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr gap-2 flex-1">
        {daysInMonth.map((date, idx) => {
          const iso = date.toISOString().split('T')[0];
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isSelected = selectedDate === iso;
          const isToday = date.toDateString() === todayString;
          const isHol = isHoliday(date);

          const classes = [
            'flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200',
            !isCurrentMonth && 'text-gray-300 dark:text-gray-600 opacity-40',
            isCurrentMonth && 'hover:bg-gradient-to-br hover:from-emerald-100 hover:to-green-100 dark:hover:from-emerald-900/30 dark:hover:to-green-900/30 cursor-pointer hover:scale-105 hover:shadow-md',
            isHol && isCurrentMonth && 'bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-red-600 dark:text-red-400 font-semibold',
            isSelected && isCurrentMonth && !isHol && 'bg-gradient-to-br from-emerald-500 to-green-500 text-white font-bold shadow-lg scale-105 ring-2 ring-emerald-300 dark:ring-emerald-600',
            isToday && !isSelected && isCurrentMonth && !isHol && 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/40 text-emerald-700 dark:text-emerald-300 font-semibold ring-2 ring-emerald-400 dark:ring-emerald-500',
            !isSelected && !isToday && !isHol && isCurrentMonth && 'text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={idx}
              onClick={isCurrentMonth ? () => handleSelectDate(date) : undefined}
              className={classes}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

