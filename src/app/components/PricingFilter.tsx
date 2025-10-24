'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';

interface PricingFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  priceRange: { min: number; max: number };
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  categories: string[];
  onReset: () => void;
}

export default function PricingFilter({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  categories,
  onReset
}: PricingFilterProps) {
  const handleMinPriceChange = (value: string) => {
    const min = parseFloat(value) || 0;
    onPriceRangeChange({ ...priceRange, min });
  };

  const handleMaxPriceChange = (value: string) => {
    const max = parseFloat(value) || 0;
    onPriceRangeChange({ ...priceRange, max });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FontAwesomeIcon icon={faFilter} className="text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ตัวกรองข้อมูล</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ช่องค้นหา */}
        <div className="relative">
          <FontAwesomeIcon 
            icon={faSearch} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
          />
          <input
            type="text"
            placeholder="ค้นหาบริการ..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* กรองตามหมวดหมู่ */}
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* กรองตามราคาต่ำสุด */}
        <div>
          <input
            type="number"
            placeholder="ราคาต่ำสุด"
            value={priceRange.min || ''}
            onChange={(e) => handleMinPriceChange(e.target.value)}
            min="0"
            step="0.01"
            className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* กรองตามราคาสูงสุด */}
        <div>
          <input
            type="number"
            placeholder="ราคาสูงสุด"
            value={priceRange.max || ''}
            onChange={(e) => handleMaxPriceChange(e.target.value)}
            min="0"
            step="0.01"
            className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* ปุ่มรีเซ็ต */}
      <div className="flex justify-end mt-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} />
          รีเซ็ตตัวกรอง
        </button>
      </div>
    </div>
  );
}
