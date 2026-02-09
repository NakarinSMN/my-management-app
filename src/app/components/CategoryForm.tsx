'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';

interface CategoryData {
  _id?: string;
  categoryName: string;
  categoryDescription: string;
}

interface CategoryFormProps {
  data?: CategoryData | null;
  onSuccess: (data: CategoryData) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

export default function CategoryForm({ data, onSuccess, onCancel, isEdit = false }: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryData>({
    categoryName: '',
    categoryDescription: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.categoryName.trim()) {
      newErrors.categoryName = 'กรุณากรอกชื่อหมวดหมู่';
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

  const handleInputChange = (field: keyof CategoryData, value: string) => {
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
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg max-w-md mx-auto overflow-hidden border border-gray-100 dark:border-gray-700 font-sans">
      
      {/* --- HEADER --- */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          {isEdit ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
        </h2>
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
          {/* ชื่อหมวดหมู่ */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
              ชื่อหมวดหมู่ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.categoryName}
              onChange={(e) => handleInputChange('categoryName', e.target.value)}
              className={`w-full text-sm px-4 py-2.5 border rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                errors.categoryName 
                  ? 'border-red-500 focus:ring-red-100 dark:border-red-400' 
                  : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-emerald-900'
              } bg-gray-50/50 dark:bg-gray-700 text-gray-900`}
              placeholder="เช่น ราคาตรวจสภาพ, งานแจ้งเปลี่ยนสี"
            />
            {errors.categoryName && (
              <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                 {errors.categoryName}
              </p>
            )}
          </div>

          {/* คำอธิบายหมวดหมู่ */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
              คำอธิบาย <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
            </label>
            <textarea
              value={formData.categoryDescription}
              onChange={(e) => handleInputChange('categoryDescription', e.target.value)}
              rows={3}
              className="w-full text-sm px-4 py-2.5 border border-gray-200 rounded-3xl transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-emerald-900 bg-gray-50/50 resize-none"
              placeholder="รายละเอียดเพิ่มเติม..."
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
            className="flex-1 px-4 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
               <span className="animate-pulse">กำลังบันทึก...</span>
            ) : (
              <>
                <FontAwesomeIcon icon={isEdit ? faSave : faPlus} className="text-xs" />
                {isEdit ? 'บันทึก' : 'สร้างหมวดหมู่'}
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
