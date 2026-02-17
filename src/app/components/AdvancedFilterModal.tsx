// src/app/components/AdvancedFilterModal.tsx
'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilter, 
  faTimes, 
  faCalendarAlt, 
  faCar, 
  faTag, 
  faRedo,
  faCalendarCheck // ✅ เพิ่มไอคอนสำหรับวันที่ตรวจ
} from '@fortawesome/free-solid-svg-icons';

interface AdvancedFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: AdvancedFilters) => void;
  brands: string[];
  vehicleTypes: string[];
  currentFilters: AdvancedFilters;
}

// ✅ อัปเดต Interface
export interface AdvancedFilters {
  dateFrom: string;
  dateTo: string;
  inspectionDateFrom: string; // ✅ เพิ่ม
  inspectionDateTo: string;   // ✅ เพิ่ม
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
  // State เดิม
  const [dateFrom, setDateFrom] = useState(currentFilters.dateFrom || '');
  const [dateTo, setDateTo] = useState(currentFilters.dateTo || '');
  const [selectedBrands, setSelectedBrands] = useState<string[]>(currentFilters.selectedBrands || []);
  const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<string[]>(currentFilters.selectedVehicleTypes || []);

  // ✅ State ใหม่สำหรับวันที่ตรวจ
  const [inspectionDateFrom, setInspectionDateFrom] = useState(currentFilters.inspectionDateFrom || '');
  const [inspectionDateTo, setInspectionDateTo] = useState(currentFilters.inspectionDateTo || '');

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({
      dateFrom,
      dateTo,
      inspectionDateFrom, // ✅ ส่งค่ากลับ
      inspectionDateTo,   // ✅ ส่งค่ากลับ
      selectedBrands,
      selectedVehicleTypes
    });
    onClose();
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setInspectionDateFrom(''); // ✅ รีเซ็ต
    setInspectionDateTo('');   // ✅ รีเซ็ต
    setSelectedBrands([]);
    setSelectedVehicleTypes([]);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleVehicleType = (type: string) => {
    setSelectedVehicleTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // คำนวณจำนวนตัวกรองที่เลือก (รวมวันที่ตรวจด้วย)
  const activeFilterCount = 
    selectedBrands.length + 
    selectedVehicleTypes.length + 
    (dateFrom ? 1 : 0) + 
    (dateTo ? 1 : 0) +
    (inspectionDateFrom ? 1 : 0) + 
    (inspectionDateTo ? 1 : 0);

  return (
    <div 
      className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-fadeInScale border border-gray-100 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- HEADER --- */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xl shadow-sm">
                <FontAwesomeIcon icon={faFilter} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">ตัวกรองขั้นสูง</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">กำหนดเงื่อนไขการค้นหาข้อมูล</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 dark:bg-gray-700/50 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
        </div>

        {/* --- BODY (CONTENT) --- */}
        <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-gray-800 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-600">
          <div className="space-y-8">
            
            {/* 1. Date Range Filter (Tax) */}
            <div className="bg-gray-50/50 dark:bg-gray-700/20 rounded-3xl p-6 border border-gray-100 dark:border-gray-700/50">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">
                <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 flex items-center justify-center text-xs">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                </span>
                ช่วงวันที่ชำระภาษี
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">จากวันที่</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">ถึงวันที่</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* ✅ 2. Inspection Date Filter (เพิ่มใหม่) */}
            <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl p-6 border border-blue-100 dark:border-blue-800/30">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
                  <FontAwesomeIcon icon={faCalendarCheck} />
                </span>
                ช่วงวันที่ตรวจสภาพ
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">จากวันที่</label>
                  <input
                    type="date"
                    value={inspectionDateFrom}
                    onChange={(e) => setInspectionDateFrom(e.target.value)}
                    className="w-full px-4 py-2.5 border border-blue-200 dark:border-blue-700/50 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 ml-1">ถึงวันที่</label>
                  <input
                    type="date"
                    value={inspectionDateTo}
                    onChange={(e) => setInspectionDateTo(e.target.value)}
                    className="w-full px-4 py-2.5 border border-blue-200 dark:border-blue-700/50 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 3. Vehicle Type Filter */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
                    <FontAwesomeIcon icon={faCar} />
                  </span>
                  ประเภทรถ 
                  {selectedVehicleTypes.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">
                      {selectedVehicleTypes.length}
                    </span>
                  )}
                </label>
                {selectedVehicleTypes.length > 0 && (
                    <button onClick={() => setSelectedVehicleTypes([])} className="text-xs text-gray-400 hover:text-red-500 transition-colors">ล้างค่า</button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {vehicleTypes.map((type) => {
                  const isSelected = selectedVehicleTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleVehicleType(type)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md hover:bg-emerald-600'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Brand Filter */}
            <div>
               <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
                    <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs">
                      <FontAwesomeIcon icon={faTag} />
                    </span>
                    ยี่ห้อรถ
                    {selectedBrands.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full font-medium">
                        {selectedBrands.length}
                      </span>
                    )}
                  </label>
                   {selectedBrands.length > 0 && (
                      <button onClick={() => setSelectedBrands([])} className="text-xs text-gray-400 hover:text-red-500 transition-colors">ล้างค่า</button>
                  )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-3xl p-4 border border-gray-100 dark:border-gray-700 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {brands.map((brand) => {
                     const isSelected = selectedBrands.includes(brand);
                     return (
                      <button
                        key={brand}
                        onClick={() => toggleBrand(brand)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all text-left truncate ${
                          isSelected
                            ? 'bg-purple-500 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-600'
                        }`}
                        title={brand}
                      >
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'bg-gray-300 dark:bg-gray-500'}`}></div>
                            <span className="truncate">{brand || '(ไม่ระบุ)'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Status Text */}
          <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
            {activeFilterCount > 0 ? (
               <span className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                 เลือกแล้ว <span className="font-bold text-gray-800 dark:text-white">{activeFilterCount}</span> รายการ
               </span>
            ) : (
                <span>ยังไม่ได้เลือกตัวกรอง</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex w-full sm:w-auto gap-3">
             <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all text-sm font-medium flex items-center justify-center gap-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <FontAwesomeIcon icon={faRedo} className="text-xs" />
              <span className="hidden sm:inline">รีเซ็ต</span>
            </button>
            
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm font-medium"
            >
              ยกเลิก
            </button>
            
            <button
              onClick={handleApply}
              className="flex-1 sm:flex-none px-8 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none transition-all transform active:scale-95 text-sm font-bold"
            >
              ค้นหา
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}