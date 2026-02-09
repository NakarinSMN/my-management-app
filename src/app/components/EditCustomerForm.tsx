import { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaCheckCircle, FaExclamationCircle, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { faCar, faMoneyBillWave, faShield, faFileAlt, faTag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FilterDropdown from './FilterDropdown';
import BrandSearchableDropdown from './BrandSearchableDropdown';

interface CustomerData {
  licensePlate: string;
  brand?: string;
  customerName: string;
  phone: string;
  registerDate: string;
  inspectionDate?: string;
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
    inspectionDate: customerData.inspectionDate || '', // วันที่ตรวจ
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
          originalVehicleType: customerData.vehicleType || '', // ประเภทรถเดิม
          licensePlate: formData.licensePlate,
          customerName: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
          registerDate: formData.registerDate,
          inspectionDate: formData.inspectionDate,
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
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-[700px] w-full mx-auto border border-gray-100 dark:border-gray-700 font-sans overflow-hidden">
        
        {/* --- HEADER --- */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              แก้ไขข้อมูลลูกค้า
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ทะเบียนรถ: <span className="font-semibold text-gray-700 dark:text-gray-300">{customerData.licensePlate}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDeleteClick}
            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-all dark:hover:bg-red-900/20"
            title="ลบข้อมูล"
          >
            <FaTrash />
          </button>
        </div>

        {/* --- BODY --- */}
        <div className="p-8 space-y-6 bg-white dark:bg-gray-800">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* ทะเบียน */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 pl-1">
                ทะเบียนรถ <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="licensePlate" 
                value={formData.licensePlate} 
                onChange={handleChange}
                required
                className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400" 
                placeholder="เช่น กก 1234"
              />
            </div>

            {/* ยี่ห้อ */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 pl-1">
                ยี่ห้อ / รุ่น
              </label>
              <div>
                <BrandSearchableDropdown
                  value={formData.brand || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}
                  name="brand"
                  placeholder="เช่น Toyota Camry"
                />
              </div>
            </div>

            {/* ชื่อ */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 pl-1">
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="firstName" 
                value={formData.firstName || ''} 
                onChange={handleChange} 
                required 
                className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400" 
                placeholder="ชื่อจริง"
              />
            </div>

            {/* นามสกุล */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 pl-1">
                นามสกุล <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="lastName" 
                value={formData.lastName || ''} 
                onChange={handleChange} 
                required 
                className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400" 
                placeholder="นามสกุล"
              />
            </div>

            {/* เบอร์ */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 pl-1">
                เบอร์ติดต่อ <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone || ''} 
                onChange={handleChange} 
                required 
                className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400" 
                placeholder="0812345678"
              />
            </div>

            {/* ประเภทรถ */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 pl-1">
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
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 pl-1">
                วันที่ชำระภาษีล่าสุด
              </label>
              <input 
                type="date" 
                name="registerDate" 
                value={formData.registerDate || ''} 
                onChange={handleChange}
                className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-left"
              />
            </div>

            {/* วันที่ตรวจ */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 pl-1">
                วันที่ตรวจ
              </label>
              <input 
                type="date" 
                name="inspectionDate" 
                value={formData.inspectionDate || ''} 
                onChange={handleChange}
                className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-left"
              />
            </div>

            {/* แท็ก */}
            <div className="md:col-span-2 mt-2">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 pl-1">
                ประเภทบริการที่ต้องดูแล
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => handleTagToggle(tag.value)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 border
                      ${formData.tags.includes(tag.value)
                        ? `${tag.color} text-white border-transparent shadow-sm`
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    <FontAwesomeIcon icon={faTag} className={`text-xs ${formData.tags.includes(tag.value) ? 'text-white/80' : 'text-gray-400'}`} />
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* หมายเหตุ */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 pl-1">
                หมายเหตุ
              </label>
              <textarea 
                name="note" 
                value={formData.note || ''} 
                onChange={handleChange}
                rows={3} 
                className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-3xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" 
                placeholder="ข้อมูลเพิ่มเติม..."
              />
            </div>
          </div>

          {/* Message & Error */}
          {(message || error) && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
              message 
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
                : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
            }`}>
              <div className={`p-1 rounded-full ${message ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'}`}>
                {message ? <FaCheckCircle /> : <FaExclamationCircle />}
              </div>
              <p className="text-sm font-medium">{message || error}</p>
            </div>
          )}

        </div>

        {/* --- FOOTER --- */}
        <div className="px-8 py-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex gap-4">
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-full transition-all duration-200 text-sm font-medium dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            ยกเลิก
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <FaSave className="text-sm" />
                <span>บันทึกการแก้ไข</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-fadeInScale border border-red-100 dark:border-red-900/50">
            
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <FaExclamationTriangle className="text-3xl text-red-500 dark:text-red-400" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">ยืนยันการลบข้อมูล?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  คุณกำลังจะลบข้อมูลทะเบียน <span className="font-semibold text-gray-800 dark:text-gray-200">{customerData.licensePlate}</span><br/>
                  การกระทำนี้<span className="text-red-500 font-medium">ไม่สามารถย้อนกลับได้</span>
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 transition-all text-sm font-medium dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all text-sm font-medium shadow-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">กำลังลบ...</span>
                ) : (
                  <>
                    <FaTrash className="text-xs" />
                    <span>ยืนยันลบ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
