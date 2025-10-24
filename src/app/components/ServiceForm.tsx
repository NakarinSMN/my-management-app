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
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'แก้ไขรายการบริการ' : 'เพิ่มรายการบริการ'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            หมวดหมู่: {categoryName}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} className="text-xl" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* หมวดหมู่ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            หมวดหมู่ *
          </label>
          <input
            type="text"
            value={formData.categoryName}
            readOnly
            className={`w-full px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white ${
              errors.categoryName 
                ? 'border-red-500 dark:border-red-400' 
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="หมวดหมู่จะถูกตั้งค่าอัตโนมัติ"
          />
          {errors.categoryName && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.categoryName}</p>
          )}
        </div>

        {/* ชื่อบริการ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ชื่อบริการ *
          </label>
          <input
            type="text"
            value={formData.serviceName}
            onChange={(e) => handleInputChange('serviceName', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.serviceName 
                ? 'border-red-500 dark:border-red-400' 
                : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            placeholder="เช่น ตรวจสภาพรถยนต์, เปลี่ยนสีรถ"
          />
          {errors.serviceName && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.serviceName}</p>
          )}
        </div>

        {/* ราคา */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ราคา (บาท) *
          </label>
          <input
            type="number"
            value={formData.servicePrice}
            onChange={(e) => handleInputChange('servicePrice', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.servicePrice 
                ? 'border-red-500 dark:border-red-400' 
                : 'border-gray-300 dark:border-gray-600'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
            placeholder="0"
          />
          {errors.servicePrice && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.servicePrice}</p>
          )}
        </div>

        {/* รายละเอียด */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            รายละเอียดบริการ
          </label>
          <textarea
            value={formData.serviceDetails}
            onChange={(e) => handleInputChange('serviceDetails', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
          />
        </div>

        {/* ปุ่ม */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={isEdit ? faSave : faPlus} />
            {isLoading ? 'กำลังบันทึก...' : (isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ')}
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