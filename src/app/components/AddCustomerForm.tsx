import { useState } from 'react';
import { FaSave, FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64svMYUFCSALwTEX4mYCHoDd6g/exec?api=customerweb';

interface AddCustomerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddCustomerForm({ onSuccess, onCancel }: AddCustomerFormProps) {
  const [formData, setFormData] = useState({
    licensePlate: '',
    brand: '', // เปลี่ยนจาก brandModel เป็น brand
    customerName: '',
    phone: '',
    registerDate: '', // เปลี่ยนจาก lastTaxDate เป็น registerDate
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
    console.log('DEBUG: formData', formData); // เพิ่ม debug log
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'addCustomer',
          ...formData,
        }),
        redirect: 'follow',
      });
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('Response is not valid JSON: ' + text);
      }
      if (result.result === 'success') {
        setMessage('เพิ่มข้อมูลลูกค้าสำเร็จ!');
        setTimeout(() => onSuccess(), 1500);
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full mx-auto border border-gray-100 dark:border-gray-800 p-6 md:p-8 flex flex-col gap-6">
      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white text-center">เพิ่มข้อมูลลูกค้า</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">ทะเบียนรถ <span className="text-red-500">*</span></label>
          <input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} required className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition" placeholder="ทะเบียนรถ" />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">ยี่ห้อ / รุ่น <span className="text-red-500">*</span></label>
          <input type="text" name="brand" placeholder="ยี่ห้อ / รุ่น (จำเป็น)" value={formData.brand} onChange={handleChange} required className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition" />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">ชื่อลูกค้า <span className="text-red-500">*</span></label>
          <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition" placeholder="ชื่อลูกค้า" />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">เบอร์ติดต่อ <span className="text-red-500">*</span></label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition" placeholder="เบอร์ติดต่อ" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">วันที่ชำระภาษีล่าสุด</label>
          <input type="date" name="registerDate" placeholder="วันที่ชำระภาษีล่าสุด" value={formData.registerDate} onChange={handleChange} className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">หมายเหตุ</label>
          <textarea name="note" value={formData.note} onChange={handleChange} rows={2} className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition" placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"></textarea>
        </div>
      </div>
      {message && <p className="text-green-500 font-medium flex items-center gap-2 justify-center"><FaCheckCircle /> {message}</p>}
      {error && <p className="text-red-500 font-medium flex items-center gap-2 justify-center"><FaExclamationCircle /> {error}</p>}
      <div className="flex justify-end gap-4 mt-2">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 px-5 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold text-base">
          <FaTimes /> ยกเลิก
        </button>
        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-7 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 text-base">
          <FaSave /> {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </div>
    </form>
  );
} 