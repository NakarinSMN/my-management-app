import { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaCheckCircle, FaExclamationCircle, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64svMYUFCSALwTEX4mYCHoDd6g/exec';

interface CustomerData {
  licensePlate: string;
  brand?: string;
  customerName: string;
  phone: string;
  registerDate: string;
  status: string;
  note?: string;
}

interface EditCustomerFormProps {
  customerData: CustomerData;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditCustomerForm({ customerData, onSuccess, onCancel }: EditCustomerFormProps) {
  const [formData, setFormData] = useState({
    licensePlate: customerData.licensePlate,
    brand: customerData.brand || '',
    customerName: customerData.customerName,
    phone: customerData.phone,
    registerDate: customerData.registerDate,
    status: customerData.status,
    note: customerData.note || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // แปลงวันที่จาก DD/MM/YYYY เป็น YYYY-MM-DD สำหรับ input type="date"
  useEffect(() => {
    if (customerData.registerDate) {
      const dateStr = customerData.registerDate;
      // ถ้าเป็น DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [dd, mm, yyyy] = dateStr.split('/');
        setFormData(prev => ({ 
          ...prev, 
          registerDate: `${yyyy}-${mm}-${dd}`
        }));
      }
      // ถ้าเป็น YYYY-MM-DD อยู่แล้ว
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        setFormData(prev => ({ 
          ...prev, 
          registerDate: dateStr
        }));
      }
    }
  }, [customerData.registerDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');
    
    try {
      // แปลงวันที่กลับเป็น DD/MM/YYYY สำหรับ Google Sheet
      let formattedDate = '';
      if (formData.registerDate) {
        const [year, month, day] = formData.registerDate.split('-');
        // แปลงเป็น DD/MM/YYYY โดยไม่ปรับวันที่
        formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
      
      const updateData = {
        action: 'updateCustomer',
        originalLicensePlate: customerData.licensePlate, // ใช้ทะเบียนเดิมเป็น key
        licensePlate: formData.licensePlate,
        customerName: formData.customerName,
        phone: formData.phone,
        registerDate: formattedDate,
        status: formData.status,
        brand: formData.brand,
        note: formData.note,
      };
      
      console.log('=== DEBUG EDIT FORM ===');
      console.log('customerData (original):', customerData);
      console.log('formData (current):', formData);
      console.log('Original date:', formData.registerDate);
      console.log('Formatted date:', formattedDate);
      console.log('Sending update data:', updateData);
      console.log('originalLicensePlate:', customerData.licensePlate);
      
      // ใช้ FormData แทน JSON เพื่อหลีกเลี่ยง CORS preflight
      const formDataToSend = new FormData();
      Object.keys(updateData).forEach(key => {
        formDataToSend.append(key, updateData[key as keyof typeof updateData]);
      });

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formDataToSend,
      });
      
      const text = await response.text();
      console.log('DEBUG: Response text:', text);
      
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('Response is not valid JSON: ' + text);
      }
      
      if (result.result === 'success') {
        setMessage('แก้ไขข้อมูลลูกค้าสำเร็จ!');
        setTimeout(() => onSuccess(), 1500);
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
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

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    
    setIsSubmitting(true);
    setMessage('');
    setError('');
    
    try {
      const deleteData = {
        action: 'deleteCustomer',
        licensePlate: customerData.licensePlate,
      };
      
      console.log('=== DEBUG DELETE ===');
      console.log('Deleting customer:', deleteData);
      
      const formDataToSend = new FormData();
      Object.keys(deleteData).forEach(key => {
        formDataToSend.append(key, deleteData[key as keyof typeof deleteData]);
      });

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formDataToSend,
      });
      
      const text = await response.text();
      console.log('DEBUG: Response text:', text);
      
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error('Response is not valid JSON: ' + text);
      }
      
      if (result.result === 'success') {
        setMessage('ลบข้อมูลลูกค้าสำเร็จ!');
        setTimeout(() => onSuccess(), 1500);
      } else {
        throw new Error(result.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
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

  const statusOptions = [
    'ต่อภาษีแล้ว',
    'กำลังจะครบกำหนด',
    'ใกล้ครบกำหนด',
    'เกินกำหนด',
    'รอดำเนินการ',
  ];

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white text-center flex items-center justify-center gap-3">
            <FaSave className="text-3xl" />
            แก้ไขข้อมูลลูกค้า
          </h2>
          <p className="text-blue-100 text-center text-sm mt-2">
            ทะเบียนรถ: <span className="font-semibold">{customerData.licensePlate}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">ทะเบียนรถ</label>
          <input 
            type="text" 
            name="licensePlate" 
            value={formData.licensePlate} 
            disabled
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
            placeholder="ทะเบียนรถ" 
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ไม่สามารถแก้ไขได้</p>
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">ยี่ห้อ / รุ่น</label>
          <input 
            type="text" 
            name="brand" 
            placeholder="ยี่ห้อ / รุ่น" 
            value={formData.brand} 
            onChange={handleChange}
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition" 
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">ชื่อลูกค้า <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name="customerName" 
            value={formData.customerName} 
            onChange={handleChange} 
            required 
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition" 
            placeholder="ชื่อลูกค้า" 
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">เบอร์ติดต่อ <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            required 
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition" 
            placeholder="เบอร์ติดต่อ" 
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">วันที่ชำระภาษีล่าสุด</label>
          <input 
            type="date" 
            name="registerDate" 
            value={formData.registerDate} 
            onChange={handleChange}
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition" 
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">สถานะ</label>
          <select 
            name="status" 
            value={formData.status} 
            disabled
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">อัปเดตอัตโนมัติจากระบบ</p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">หมายเหตุ</label>
          <textarea 
            name="note" 
            value={formData.note} 
            onChange={handleChange}
            rows={3} 
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-400 focus:outline-none transition" 
            placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
          />
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                <FaCheckCircle className="text-xl" /> {message}
              </p>
            </div>
          )}
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
                <FaExclamationCircle className="text-xl" /> {error}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-between items-center gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              onClick={handleDeleteClick} 
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-sm shadow-sm hover:shadow-md"
            >
              <FaTrash className="text-sm" /> ลบข้อมูล
            </button>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={onCancel} 
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-sm hover:shadow-md"
              >
                <FaTimes className="text-sm" /> ยกเลิก
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 active:from-yellow-700 active:to-yellow-800 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm hover:shadow-md"
              >
                <FaSave className="text-sm" /> 
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border-2 border-red-500 dark:border-red-600 transform animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 p-6 rounded-t-2xl">
              <div className="flex items-center justify-center gap-3 text-white">
                <FaExclamationTriangle className="text-4xl animate-pulse" />
                <h3 className="text-2xl font-bold">ยืนยันการลบข้อมูล</h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300 text-center text-lg">
                  คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">ทะเบียนรถ:</span>
                      <span className="text-gray-900 dark:text-white font-bold text-lg">{customerData.licensePlate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">ชื่อลูกค้า:</span>
                      <span className="text-gray-900 dark:text-white font-semibold">{customerData.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">เบอร์ติดต่อ:</span>
                      <span className="text-gray-900 dark:text-white font-semibold">{customerData.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-xl mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-800 dark:text-red-300 font-semibold">
                        คำเตือน!
                      </p>
                      <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                        การลบข้อมูลนี้ไม่สามารถย้อนกลับได้ ข้อมูลจะถูกลบออกจากระบบถาวร
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-sm hover:shadow-md"
                >
                  <FaTimes className="inline mr-1.5 text-sm" /> ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm shadow-sm hover:shadow-md"
                >
                  <FaTrash className="inline mr-1.5 text-sm" /> 
                  {isSubmitting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
