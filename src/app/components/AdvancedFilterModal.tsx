// src/app/components/AdvancedFilterModal.tsx
'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTimes, faCalendarAlt, faCar, faTag, faRedo } from '@fortawesome/free-solid-svg-icons';

interface AdvancedFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: AdvancedFilters) => void;
  brands: string[];
  vehicleTypes: string[];
  currentFilters: AdvancedFilters;
}

export interface AdvancedFilters {
  dateFrom: string;
  dateTo: string;
  selectedBrands: string[];
  selectedVehicleTypes: string[];
}

export default function AdvancedFilterModal({ 
  isOpen, 
  onClose, 
  onApply, 
  brands, 
  vehicleTypes,
  currentFilters 
}: AdvancedFilterProps) {
  const [dateFrom, setDateFrom] = useState(currentFilters.dateFrom || '');
  const [dateTo, setDateTo] = useState(currentFilters.dateTo || '');
  const [selectedBrands, setSelectedBrands] = useState<string[]>(currentFilters.selectedBrands || []);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>(currentFilters.selectedVehicleTypes || []);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({
      dateFrom,
      dateTo,
      selectedBrands,
      selectedVehicleTypes
    });
    onClose();
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedBrands([]);
    setSelectedVehicleTypes([]);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const toggleVehicleType = (type: string) => {
    setSelectedVehicleTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faFilter} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">ตัวกรองขั้นสูง</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">กรองข้อมูลแบบละเอียด</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-all"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Date Range Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500" />
                ช่วงวันที่ชำระภาษี
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">จากวันที่</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">ถึงวันที่</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Type Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <FontAwesomeIcon icon={faCar} className="text-green-500" />
                ประเภทรถ ({selectedVehicleTypes.length} เลือก)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {vehicleTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleVehicleType(type)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedVehicleTypes.includes(type)
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <FontAwesomeIcon icon={faTag} className="text-purple-500" />
                ยี่ห้อรถ ({selectedBrands.length} เลือก)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                {brands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => toggleBrand(brand)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedBrands.includes(brand)
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {brand || '(ไม่ระบุ)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {(selectedBrands.length + selectedVehicleTypes.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)) > 0 && (
                <span>
                  เลือกตัวกรอง: <span className="font-bold text-blue-600 dark:text-blue-400">
                    {selectedBrands.length + selectedVehicleTypes.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)} รายการ
                  </span>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faRedo} className="text-xs" />
                รีเซ็ต
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleApply}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-md"
              >
                ใช้ตัวกรอง
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

