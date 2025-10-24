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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} className="text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ชื่อหมวดหมู่ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ชื่อหมวดหมู่ *
          </label>
          <input
            type="text"
            value={formData.categoryName}
            onChange={(e) => handleInputChange('categoryName', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.categoryName 
                ? 'border-red-500 dark:border-red-400' 
                : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            placeholder="เช่น ราคาตรวจสภาพ, งานแจ้งเปลี่ยนสี"
          />
          {errors.categoryName && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.categoryName}</p>
          )}
        </div>

        {/* คำอธิบายหมวดหมู่ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            คำอธิบายหมวดหมู่
          </label>
          <textarea
            value={formData.categoryDescription}
            onChange={(e) => handleInputChange('categoryDescription', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="คำอธิบายหมวดหมู่ (ไม่บังคับ)"
          />
        </div>

        {/* ปุ่ม */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={isEdit ? faSave : faPlus} />
            {isLoading ? 'กำลังบันทึก...' : (isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}
