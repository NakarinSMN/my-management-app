import { useState } from 'react';
import { FaSave, FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { faCar, faMoneyBillWave, faShield, faFileAlt, faTag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FilterDropdown from './FilterDropdown';
import BrandSearchableDropdown from './BrandSearchableDropdown';

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
    inspectionDate: '', // วันที่ตรวจ
    vehicleType: '', // ประเภทรถ: รย.1, รย.2, รย.3, รย.12
    note: '',
    tags: [] as string[], // แท็ก: ภาษี, ตรอ., พรบ.
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState<Array<{
    sequenceNumber?: number;
    licensePlate: string;
    customerName: string;
    phone: string;
    brand?: string;
    vehicleType?: string;
    registerDate?: string;
    inspectionDate?: string;
    note?: string;
    tags?: string[];
  }>>([]);
  const [isCheckingPlate, setIsCheckingPlate] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [originalData, setOriginalData] = useState<{
    licensePlate: string;
    vehicleType: string;
    sequenceNumber?: number;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ฟังก์ชันเช็คทะเบียนซ้ำ
  const checkDuplicatePlate = async (licensePlate: string) => {
    if (!licensePlate || licensePlate.length < 3) return;
    
    try {
      setIsCheckingPlate(true);
      const response = await fetch(`/api/customers?licensePlate=${encodeURIComponent(licensePlate)}`);
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        // พบทะเบียนซ้ำ
        setDuplicateData(result.data);
        setShowDuplicateModal(true);
      }
    } catch (err) {
      console.error('Error checking duplicate plate:', err);
    } finally {
      setIsCheckingPlate(false);
    }
  };

  // ฟังก์ชันเมื่อ blur ออกจากช่องทะเบียน
  const handleLicensePlateBlur = () => {
    if (formData.licensePlate) {
      checkDuplicatePlate(formData.licensePlate);
    }
  };

  // ฟังก์ชันเลือกใช้ข้อมูลเก่า
  const handleUseExistingData = (existingCustomer: typeof duplicateData[0]) => {
    // แยกชื่อและนามสกุล
    const nameParts = existingCustomer.customerName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // แปลงวันที่เป็น YYYY-MM-DD
    let registerDate = existingCustomer.registerDate || '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(registerDate)) {
      const [dd, mm, yyyy] = registerDate.split('/');
      registerDate = `${yyyy}-${mm}-${dd}`;
    }

    let inspectionDate = existingCustomer.inspectionDate || '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(inspectionDate)) {
      const [dd, mm, yyyy] = inspectionDate.split('/');
      inspectionDate = `${yyyy}-${mm}-${dd}`;
    }

    // เติมข้อมูลในฟอร์ม
    setFormData({
      licensePlate: existingCustomer.licensePlate || '',
      brand: existingCustomer.brand || '',
      firstName: firstName,
      lastName: lastName,
      phone: existingCustomer.phone || '',
      registerDate: registerDate,
      inspectionDate: inspectionDate,
      vehicleType: existingCustomer.vehicleType || '',
      note: existingCustomer.note || '',
      tags: existingCustomer.tags || [],
    });

    // เก็บข้อมูลเดิมเพื่อใช้ในการ Update
    setOriginalData({
      licensePlate: existingCustomer.licensePlate,
      vehicleType: existingCustomer.vehicleType || '',
      sequenceNumber: existingCustomer.sequenceNumber
    });

    // เปลี่ยนเป็นโหมด Update
    setIsUpdateMode(true);
    setShowDuplicateModal(false);
    setMessage(`กำลังอัปเดตข้อมูลเลขลำดับ ${existingCustomer.sequenceNumber ? String(existingCustomer.sequenceNumber).padStart(6, '0') : ''} - แก้ไขแล้วกดบันทึก`);
  };

  // ฟังก์ชันเลือกไม่ใช้ข้อมูลเก่า (เพิ่มใหม่)
  const handleAddNew = () => {
    setIsUpdateMode(false);
    setOriginalData(null);
    setShowDuplicateModal(false);
    setMessage('เพิ่มข้อมูลใหม่ - กรุณาระบุประเภทรถให้ต่างจากข้อมูลเดิม');
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
    // console.log('DEBUG: formData', formData);
    // console.log('DEBUG: isUpdateMode', isUpdateMode);
    // console.log('DEBUG: originalData', originalData);
    
    try {
      // เลือกใช้ PUT (อัปเดต) หรือ POST (เพิ่มใหม่)
      const method = isUpdateMode ? 'PUT' : 'POST';
      const bodyData = isUpdateMode && originalData ? {
        // โหมดอัปเดต - ส่ง originalData ไปด้วย
        originalLicensePlate: originalData.licensePlate,
        originalVehicleType: originalData.vehicleType,
        licensePlate: formData.licensePlate,
        brand: formData.brand,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        registerDate: formData.registerDate,
        inspectionDate: formData.inspectionDate,
        vehicleType: formData.vehicleType,
        status: 'รอดำเนินการ',
        note: formData.note,
        tags: formData.tags,
      } : {
        // โหมดเพิ่มใหม่
        licensePlate: formData.licensePlate,
        brand: formData.brand,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        registerDate: formData.registerDate,
        inspectionDate: formData.inspectionDate,
        vehicleType: formData.vehicleType,
        status: 'รอดำเนินการ',
        note: formData.note,
        tags: formData.tags,
      };

      const response = await fetch('/api/customers', {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setMessage(isUpdateMode ? 'อัปเดตข้อมูลสำเร็จ!' : 'เพิ่มข้อมูลลูกค้าสำเร็จ!');
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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-[700px] w-full mx-auto border border-gray-100 dark:border-gray-700 font-sans overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {isUpdateMode ? 'อัปเดตข้อมูลลูกค้า' : 'เพิ่มข้อมูลลูกค้า'}
        </h2>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`w-2 h-2 rounded-full ${isUpdateMode ? 'bg-blue-500' : 'bg-green-500'}`}></span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isUpdateMode 
              ? `แก้ไขรายการลำดับที่ ${originalData?.sequenceNumber ? String(originalData.sequenceNumber).padStart(6, '0') : ''}`
              : 'กรอกรายละเอียดเพื่อสร้างข้อมูลใหม่'
            }
          </p>
        </div>
      </div>

      {/* --- BODY --- */}
      <div className="p-8 space-y-6 bg-white dark:bg-gray-800">
        
        {/* Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          
          {/* ทะเบียน */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 pl-1">
              ทะเบียนรถ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input 
                type="text" 
                name="licensePlate" 
                value={formData.licensePlate} 
                onChange={handleChange}
                onBlur={handleLicensePlateBlur}
                required 
                className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400" 
                placeholder="เช่น กก 1234"
              />
              {isCheckingPlate && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>

          {/* ยี่ห้อ */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 pl-1">
              ยี่ห้อ / รุ่น <span className="text-red-500">*</span>
            </label>
            <div>
                <BrandSearchableDropdown
                value={formData.brand}
                onChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}
                name="brand"
                required
                placeholder="เช่น Toyota Camry"
                // หมายเหตุ: ถ้า Component นี้มี style ในตัว อาจต้องแก้ที่ตัว Component หรือ wrap ด้วย div ที่ style input ได้
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
              className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400" 
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
              className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400" 
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
              value={formData.phone} 
              onChange={handleChange} 
              required 
              className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-gray-400" 
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
              value={formData.registerDate} 
              onChange={handleChange} 
              className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-left"
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
              value={formData.inspectionDate} 
              onChange={handleChange} 
              className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-left"
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
              value={formData.note} 
              onChange={handleChange} 
              rows={3} 
              className="w-full px-5 py-2 border border-gray-200 dark:border-gray-600 rounded-3xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none" 
              placeholder="ข้อมูลเพิ่มเติม..."
            />
          </div>
        </div>

        {/* Message & Error (Alerts) */}
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
          className="flex-1 px-6 py-3 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-full transition-all duration-200 text-sm font-medium dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          ยกเลิก
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-full transition-all duration-200 text-sm font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed ${
            isUpdateMode 
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              <span>กำลังบันทึก...</span>
            </>
          ) : (
            <>
              <FaSave className="text-sm" />
              <span>{isUpdateMode ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}</span>
            </>
          )}
        </button>
      </div>

      {/* --- MODAL (Duplicate Check) --- */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col animate-fadeInScale">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-orange-50/50 dark:bg-gray-800 flex items-start gap-4">
              <div className="p-3 bg-orange-100 text-orange-600 rounded-full shrink-0">
                <FaExclamationCircle className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  ข้อมูลซ้ำ
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  พบทะเบียน <span className="font-semibold text-gray-800 dark:text-gray-200">"{formData.licensePlate}"</span> ในระบบ {duplicateData.length} รายการ
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto">
              <div className="space-y-3">
                {duplicateData.map((item, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-3xl p-5 bg-white hover:border-emerald-300 transition-colors dark:bg-gray-700/50">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2">
                             <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full text-xs font-semibold">
                                #{item.sequenceNumber || '-'}
                             </span>
                             {item.vehicleType && (
                                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-semibold">
                                    {item.vehicleType}
                                </span>
                             )}
                        </div>
                    </div>
                    
                    <div className="space-y-1.5 text-sm ml-1">
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="text-gray-400 dark:text-gray-500 w-12 inline-block">ชื่อ:</span> 
                        {item.customerName}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="text-gray-400 dark:text-gray-500 w-12 inline-block">เบอร์:</span> 
                        {item.phone}
                      </p>
                      {item.brand && (
                        <p className="text-gray-700 dark:text-gray-300">
                            <span className="text-gray-400 dark:text-gray-500 w-12 inline-block">รุ่น:</span> 
                            {item.brand}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUseExistingData(item)}
                      className="mt-4 w-full py-2.5 border border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-full transition-all text-sm font-medium flex justify-center items-center gap-2 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                    >
                      <span>ใช้ข้อมูลนี้เพื่ออัปเดต</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex flex-col gap-3">
                <button
                    type="button"
                    onClick={handleAddNew}
                    className="w-full py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all text-sm font-medium shadow-sm"
                  >
                    ยืนยันเพิ่มข้อมูลใหม่ (รถคนละคัน)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setFormData(prev => ({ ...prev, licensePlate: '' }));
                  }}
                  className="w-full py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all text-sm font-medium"
                >
                  ยกเลิกและแก้ไขทะเบียน
                </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
} 