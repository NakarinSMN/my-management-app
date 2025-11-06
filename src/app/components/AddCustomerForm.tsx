import { useState } from 'react';
import { FaSave, FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

interface AddCustomerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddCustomerForm({ onSuccess, onCancel }: AddCustomerFormProps) {
  const [formData, setFormData] = useState({
    licensePlate: '',
    brand: '',
    firstName: '',
    lastName: '',
    phone: '',
    registerDate: '',
    note: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');
    console.log('DEBUG: formData', formData);
    
    try {
      // ใช้ MongoDB API แทน Google Sheets
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licensePlate: formData.licensePlate,
          brand: formData.brand,
          customerName: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
          registerDate: formData.registerDate,
          status: 'รอดำเนินการ', // ตั้งค่าเริ่มต้น
          note: formData.note,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setMessage('เพิ่มข้อมูลลูกค้าสำเร็จ!');
        setTimeout(() => onSuccess(), 1500);
      } else {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      let msg = '';
      if (err instanceof Error) {
        msg = err.message;
      } else {
        msg = String(err);
      }
      setError(`เกิดข้อผิดพลาด: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-auto border border-gray-200 dark:border-gray-700 p-6 md:p-8">
      {/* Header with gradient */}
      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          เพิ่มข้อมูลลูกค้า
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">กรอกข้อมูลลูกค้าให้ครบถ้วน</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ทะเบียน */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            ทะเบียนรถ <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="licensePlate" 
            value={formData.licensePlate} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all" 
            placeholder="เช่น กก 1234"
          />
        </div>

        {/* ยี่ห้อ */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            ยี่ห้อ / รุ่น <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="brand" 
            value={formData.brand} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all" 
            placeholder="เช่น Toyota Camry"
          />
        </div>

        {/* ชื่อ */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            ชื่อ <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="firstName" 
            value={formData.firstName || ''} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all" 
            placeholder="ชื่อจริง"
          />
        </div>

        {/* นามสกุล */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            นามสกุล <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="lastName" 
            value={formData.lastName || ''} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all" 
            placeholder="นามสกุล"
          />
        </div>

        {/* เบอร์ */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            เบอร์ติดต่อ <span className="text-red-500">*</span>
          </label>
          <input 
            type="tel" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all" 
            placeholder="0812345678"
          />
        </div>

        {/* วันที่ชำระภาษี */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            วันที่ชำระภาษีล่าสุด
          </label>
          <input 
            type="date" 
            name="registerDate" 
            value={formData.registerDate} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
          />
        </div>

        {/* หมายเหตุ */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            หมายเหตุ
          </label>
          <textarea 
            name="note" 
            value={formData.note} 
            onChange={handleChange} 
            rows={3} 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all resize-none" 
            placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
          />
        </div>
      </div>

      {/* Message & Error */}
      {message && (
        <div className="flex items-center gap-2 justify-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <FaCheckCircle className="text-green-500" />
          <p className="text-green-700 dark:text-green-400 font-medium text-sm">{message}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 justify-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <FaExclamationCircle className="text-red-500" />
          <p className="text-red-700 dark:text-red-400 font-medium text-sm">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button 
          type="button" 
          onClick={onCancel} 
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-semibold text-sm"
        >
          <FaTimes /> ยกเลิก
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              กำลังบันทึก...
            </>
          ) : (
            <>
              <FaSave /> บันทึกข้อมูล
            </>
          )}
        </button>
      </div>
    </form>
  );
} 