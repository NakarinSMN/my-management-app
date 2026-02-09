// src/app/components/FilterDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons';

interface FilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  icon: IconDefinition;
  placeholder: string;
  options: { value: string; label: string; color?: string }[];
  className?: string;
  showClearButton?: boolean;
}

export default function FilterDropdown({
  value,
  onChange,
  icon,
  placeholder,
  options,
  className = '',
  showClearButton = true
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === value);
  const hasValue = value && value !== '';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-3 py-2
          border border-gray-300 dark:border-gray-600 
          rounded-full bg-white/70 dark:bg-gray-800 
          text-gray-900 dark:text-white text-sm
          hover:border-emerald-500 dark:hover:border-emerald-400
          focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
          transition-all duration-200
          ${isOpen ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <FontAwesomeIcon 
            icon={icon} 
            className="text-emerald-500 dark:text-emerald-400 text-sm" 
          />
          <span className={` ${hasValue ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {showClearButton && hasValue && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setIsOpen(false);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm cursor-pointer"
            >
              <FontAwesomeIcon icon={faTimes} className="text-sm" />
            </div>
          )}
          <FontAwesomeIcon 
            icon={faChevronDown} 
            className={`text-gray-400 transition-transform duration-200 text-sm ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center justify-between px-3 py-2.5 text-left
                hover:bg-gray-100 dark:hover:bg-emerald-900/20
                transition-colors duration-150
                ${option.value === value ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'text-gray-500  dark:text-white'}
                ${index === 0 ? 'rounded-t-lg' : ''}
                ${index === options.length - 1 ? 'rounded-b-lg' : ''}
              `}
            >
              <div className="flex items-center gap-2">
                {option.color && (
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: option.color }}
                  />
                )}
                <span className="font-medium text-sm">{option.label}</span>
              </div>
              {option.value === value && (
                <div className="text-emerald-600 dark:text-emerald-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
