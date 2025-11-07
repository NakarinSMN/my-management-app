import { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaCheckCircle, FaExclamationCircle, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { faCar, faMoneyBillWave, faShield, faFileAlt, faTag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FilterDropdown from './FilterDropdown';

interface CustomerData {
  licensePlate: string;
  brand?: string;
  customerName: string;
  phone: string;
  registerDate: string;
  vehicleType?: string;
  status: string;
  note?: string;
  tags?: string[];
}

interface EditCustomerFormProps {
  customerData: CustomerData;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditCustomerForm({ customerData, onSuccess, onCancel }: EditCustomerFormProps) {
  // แยกชื่อและนามสกุลจาก customerName
  const splitName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' ')
      };
    }
    return {
      firstName: fullName,
      lastName: ''
    };
  };

  const { firstName: initialFirstName, lastName: initialLastName } = splitName(customerData.customerName);

  const [formData, setFormData] = useState({
    licensePlate: customerData.licensePlate,
    brand: customerData.brand || '',
    firstName: initialFirstName,
    lastName: initialLastName,
    phone: customerData.phone,
    registerDate: customerData.registerDate,
    vehicleType: customerData.vehicleType || '',
    status: customerData.status,
    note: customerData.note || '',
    tags: customerData.tags || [],
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

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const availableTags = [
    { value: 'ภาษี', label: 'ภาษี', color: 'bg-blue-500', icon: faMoneyBillWave },
    { value: 'ตรอ.', label: 'ตรอ.', color: 'bg-green-500', icon: faFileAlt },
    { value: 'พรบ.', label: 'พรบ.', color: 'bg-orange-500', icon: faShield }
  ];

  const vehicleTypeOptions = [
    { value: 'รย.1', label: 'รย.1 - รถยนต์นั่งส่วนบุคคลไม่เกิน 7 คน' },
    { value: 'รย.2', label: 'รย.2 - รถยนต์นั่งส่วนบุคคลเกิน 7 คน' },
    { value: 'รย.3', label: 'รย.3 - รถยนต์บรรทุกส่วนบุคคล' },
    { value: 'รย.12', label: 'รย.12 - รถจักรยานยนต์' }
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');
    
    try {
      console.log('=== DEBUG EDIT FORM ===');
      console.log('customerData (original):', customerData);
      console.log('formData (current):', formData);
      
      // ใช้ MongoDB API แทน Google Sheets
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalLicensePlate: customerData.licensePlate, // ใช้ทะเบียนเดิมเป็น key
          licensePlate: formData.licensePlate,
          customerName: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
          registerDate: formData.registerDate,
          vehicleType: formData.vehicleType,
          status: formData.status,
          brand: formData.brand,
          note: formData.note,
          tags: formData.tags,
        }),
      });

      const result = await response.json();
      console.log('DEBUG: Response:', result);
      
      if (response.ok && result.success) {
        setMessage('แก้ไขข้อมูลลูกค้าสำเร็จ!');
        setTimeout(() => onSuccess(), 1500);
      } else {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
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
      console.log('=== DEBUG DELETE ===');
      console.log('Deleting customer:', customerData.licensePlate);
      
      // ใช้ MongoDB API แทน Google Sheets
      const response = await fetch('/api/customers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licensePlate: customerData.licensePlate,
        }),
      });

      const result = await response.json();
      console.log('DEBUG: Response:', result);
      
      if (response.ok && result.success) {
        setMessage('ลบข้อมูลลูกค้าสำเร็จ!');
        setTimeout(() => onSuccess(), 1500);
      } else {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการลบข้อมูล');
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
    <>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-auto border border-gray-200 dark:border-gray-700 p-6 md:p-8">
        {/* Header with gradient */}
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            แก้ไขข้อมูลลูกค้า
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ทะเบียนรถ: <span className="font-semibold">{customerData.licensePlate}</span>
          </p>
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
              ยี่ห้อ / รุ่น
            </label>
            <input 
              type="text" 
              name="brand" 
              value={formData.brand || ''} 
              onChange={handleChange}
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
              value={formData.phone || ''} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all" 
              placeholder="0812345678"
            />
          </div>

          {/* ประเภทรถ */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              ประเภทรถ
            </label>
            <FilterDropdown
              value={formData.vehicleType}
              onChange={(value) => setFormData(prev => ({ ...prev, vehicleType: value }))}
              icon={faCar}
              placeholder="เลือกประเภทรถ"
              options={vehicleTypeOptions}
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
              value={formData.registerDate || ''} 
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
            />
          </div>

          {/* แท็ก */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              ประเภทบริการที่ต้องดูแล
            </label>
            <div className="flex flex-wrap gap-3">
              {availableTags.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => handleTagToggle(tag.value)}
                  className={`
                    px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2
                    ${formData.tags.includes(tag.value)
                      ? `${tag.color} text-white shadow-md`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  <FontAwesomeIcon icon={faTag} className="text-xs" />
                  {tag.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              เลือกประเภทบริการที่ต้องดูแล (เลือกได้มากกว่า 1 อัน)
            </p>
          </div>

          {/* หมายเหตุ */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              หมายเหตุ
            </label>
            <textarea 
              name="note" 
              value={formData.note || ''} 
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
        <div className="flex justify-between gap-3 pt-4">
          <button 
            type="button" 
            onClick={handleDeleteClick} 
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-lg"
          >
            <FaTrash /> ลบข้อมูล
          </button>
          
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onCancel} 
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-semibold text-sm"
            >
              <FaTimes /> ยกเลิก
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <FaSave /> บันทึกการแก้ไข
                </>
              )}
            </button>
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
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-1.5"></div>
                      กำลังลบ...
                    </>
                  ) : (
                    <>
                      <FaTrash className="inline mr-1.5 text-sm" /> 
                      ยืนยันการลบ
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
