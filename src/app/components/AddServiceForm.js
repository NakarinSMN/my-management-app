// components/AddServiceForm.js
"use client";

import { useState } from 'react';
// NEW ICON IMPORTS
import { FaSave, FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3WJmHNJ2h8Yj1rm2tc_mXj6JNCYz8T-yOmg9kC6aKgpAAuXmH5Z3DNZQF8ecGZUGw/exec';

export default function AddServiceForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    categoryName: '', categoryDescription: '', serviceName: '',
    servicePrice: '', serviceDetails: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST', body: JSON.stringify(formData), redirect: 'follow',
      });
      const result = await response.json();

      if (result.status === 'success') {
        setMessage('เพิ่มข้อมูลสำเร็จ!');
        setTimeout(() => onSuccess(), 1500);
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">เพิ่มบริการใหม่</h2>
      
      <input type="text" name="categoryName" placeholder="ชื่อหมวดหมู่ (จำเป็น)" value={formData.categoryName} onChange={handleChange} required className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
      <input type="text" name="serviceName" placeholder="ชื่อบริการ (จำเป็น)" value={formData.serviceName} onChange={handleChange} required className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
      <input type="text" name="servicePrice" placeholder="ราคา (จำเป็น)" value={formData.servicePrice} onChange={handleChange} required className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
      <textarea name="serviceDetails" placeholder="รายละเอียดบริการ" value={formData.serviceDetails} onChange={handleChange} rows={2} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
      <textarea name="categoryDescription" placeholder="คำอธิบายหมวดหมู่ (ถ้ามี)" value={formData.categoryDescription} onChange={handleChange} rows={2} className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>

      {/* CHANGED: ADDED ICONS TO STATUS MESSAGES */}
      {message && <p className="text-green-500 font-medium flex items-center gap-2"><FaCheckCircle/> {message}</p>}
      {error && <p className="text-red-500 font-medium flex items-center gap-2"><FaExclamationCircle/> {error}</p>}
      
      <div className="flex justify-end gap-4 mt-4">
        {/* CHANGED: ADDED ICON TO CANCEL BUTTON */}
        <button type="button" onClick={onCancel} className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-400 transition-colors">
          <FaTimes /> ยกเลิก
        </button>
        {/* CHANGED: ADDED ICON TO SAVE BUTTON */}
        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
          <FaSave /> {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </div>
    </form>
  );
}