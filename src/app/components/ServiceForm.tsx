"use client";

import { useState } from 'react';
import { FaSave, FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3WJmHNJ2h8Yj1rm2tc_mXj6JNCYz8T-yOmg9kC6aKgpAAuXmH5Z3DNZQF8ecGZUGw/exec';

interface FormData {
  categoryName: string;
  categoryDescription: string;
}

interface ServiceFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  categoryOptions?: { name: string; description: string }[];
}

export default function ServiceForm({ onSuccess, onCancel, categoryOptions = [] }: ServiceFormProps) {
  const [formData, setFormData] = useState<FormData>({
    categoryName: '',
    categoryDescription: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        action: 'addCategory',
        categoryName: formData.categoryName,
        categoryDescription: formData.categoryDescription,
      };
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.status === 'success') {
        setMessage('เพิ่มหมวดหมู่สำเร็จ!');
        setTimeout(() => onSuccess(), 1200);
      } else {
        throw new Error(result.message || 'เพิ่มหมวดหมู่ไม่สำเร็จ');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'เกิดข้อผิดพลาดขณะบันทึก');
      } else {
        setError('เกิดข้อผิดพลาดขณะบันทึก');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl min-w-[340px] max-w-lg mx-auto border border-gray-100 dark:border-gray-800 min-h-[380px] max-h-[85vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-2xl md:text-3xl font-extrabold text-blue-700 dark:text-blue-400 tracking-tight text-center mb-1">เพิ่มหมวดหมู่ใหม่</h2>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">ชื่อหมวดหมู่ <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="categoryName"
            placeholder="เช่น งานทะเบียน, งานประกัน"
            value={formData.categoryName}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition text-base"
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">คำอธิบายหมวดหมู่</label>
          <textarea
            name="categoryDescription"
            placeholder="รายละเอียดหมวดหมู่ (ถ้ามี)"
            value={formData.categoryDescription}
            onChange={handleChange}
            rows={2}
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition text-base"
          />
        </div>
        {message && (
          <p className="text-green-500 font-medium flex items-center gap-2 justify-center">
            <FaCheckCircle /> {message}
          </p>
        )}
        {error && (
          <p className="text-red-500 font-medium flex items-center gap-2 justify-center">
            <FaExclamationCircle /> {error}
          </p>
        )}
        <div className="mt-4">
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3">หมวดหมู่ที่มีอยู่แล้ว</h3>
          {categoryOptions.length === 0 ? (
            <div className="text-gray-400 dark:text-gray-500 text-center py-4">ยังไม่มีหมวดหมู่</div>
          ) : (
            <ul className="space-y-3">
              {categoryOptions.map((cat, idx) => (
                <li key={cat.name + idx} className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                  <div className="font-semibold text-gray-800 dark:text-white text-base">{cat.name}</div>
                  {cat.description && <div className="text-xs text-gray-500 dark:text-gray-300 mt-1">{cat.description}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Footer */}
      <div className="flex justify-end gap-4 px-8 py-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold text-base flex items-center gap-2"
        >
          <FaTimes /> ยกเลิก
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-7 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 text-base flex items-center gap-2"
        >
          <FaSave /> {isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มหมวดหมู่'}
        </button>
      </div>
    </form>
  );
}
