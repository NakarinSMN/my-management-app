'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';

interface ServiceData {
  _id?: string;
  categoryName: string;
  serviceName: string;
  servicePrice: number;
  serviceDetails: string;
}

interface ServiceFormProps {
  data?: ServiceData | null;
  categoryName: string;
  onSuccess: (data: ServiceData) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function ServiceForm({ data, categoryName, onSuccess, onCancel, isEdit = false }: ServiceFormProps) {
  const [formData, setFormData] = useState<ServiceData>({
    categoryName: categoryName,
    serviceName: '',
    servicePrice: 0,
    serviceDetails: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      setFormData(data);
    } else {
      setFormData(prev => ({
        ...prev,
        categoryName: categoryName
      }));
    }
  }, [data, categoryName]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.categoryName.trim()) {
      newErrors.categoryName = 'กรุณาเลือกหมวดหมู่';
    }

    if (!formData.serviceName.trim()) {
      newErrors.serviceName = 'กรุณากรอกชื่อบริการ';
    }

    if (formData.servicePrice <= 0) {
      newErrors.servicePrice = 'กรุณากรอกราคาที่มากกว่า 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      onSuccess(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ServiceData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg max-w-xl mx-auto overflow-hidden border border-gray-100 dark:border-gray-700 font-sans">
      
      {/* --- HEADER --- */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {isEdit ? 'แก้ไขรายการบริการ' : 'เพิ่มรายการบริการ'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            ในหมวดหมู่: <span className="font-medium text-green-600 dark:text-green-400">{categoryName}</span>
          </p>
        </div>
        <button
          onClick={onCancel}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-all duration-200"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* --- BODY (FORM CONTENT) --- */}
        <div className="p-6 space-y-5">
          
          {/* หมวดหมู่ (Read Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
              หมวดหมู่ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.categoryName}
              readOnly
              className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-full bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400"
              placeholder="หมวดหมู่จะถูกตั้งค่าอัตโนมัติ"
            />
            {errors.categoryName && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.categoryName}</p>
            )}
          </div>

          {/* ชื่อบริการ */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
              ชื่อบริการ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.serviceName}
              onChange={(e) => handleInputChange('serviceName', e.target.value)}
              className={`w-full text-sm px-4 py-2.5 border rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                errors.serviceName
                  ? 'border-red-500 focus:ring-red-100 dark:border-red-400'
                  : 'border-gray-200 focus:border-green-500 focus:ring-green-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-green-900'
              } bg-white dark:bg-gray-700 text-gray-900`}
              placeholder="เช่น ตรวจสภาพรถยนต์, เปลี่ยนสีรถ"
            />
            {errors.serviceName && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.serviceName}</p>
            )}
          </div>

          {/* ราคา */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
              ราคา (บาท) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.servicePrice}
              onChange={(e) => handleInputChange('servicePrice', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className={`w-full text-sm px-4 py-2.5 border rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                errors.servicePrice
                  ? 'border-red-500 focus:ring-red-100 dark:border-red-400'
                  : 'border-gray-200 focus:border-green-500 focus:ring-green-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-green-900'
              } bg-white dark:bg-gray-700 text-gray-900`}
              placeholder="0.00"
            />
            {errors.servicePrice && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{errors.servicePrice}</p>
            )}
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
              รายละเอียดบริการ <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
            </label>
            <textarea
              value={formData.serviceDetails}
              onChange={(e) => handleInputChange('serviceDetails', e.target.value)}
              rows={3}
              className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-3xl transition-all duration-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-green-900 bg-white resize-none"
              placeholder="ระบุรายละเอียดเพิ่มเติม..."
            />
          </div>
        </div>

        {/* --- FOOTER (ACTIONS) --- */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
             {isLoading ? (
               <span className="animate-pulse">กำลังบันทึก...</span>
            ) : (
              <>
                <FontAwesomeIcon icon={isEdit ? faSave : faPlus} className="text-xs" />
                {isEdit ? 'บันทึก' : 'เพิ่มรายการ'}
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}