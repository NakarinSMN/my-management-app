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
    <form onSubmit={handleSubmit} className="bg-green-100/50 dark:bg-gray-800 rounded-2xl shadow-2xl max-w-[700px] w-full mx-auto border border-gray-100 dark:border-gray-700 p-6 md:p-8 backdrop-blur-4xl">
      {/* Header with gradient */}
      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-950 to-teal-600 bg-clip-text text-transparent">
          {isUpdateMode ? 'อัปเดตข้อมูลลูกค้า' : 'เพิ่มข้อมูลลูกค้า'}
        </h2>
        <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">
          {isUpdateMode 
            ? `กำลังอัปเดตเลขลำดับ ${originalData?.sequenceNumber ? String(originalData.sequenceNumber).padStart(6, '0') : ''}`
            : 'กรอกข้อมูลลูกค้าให้ครบถ้วน'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 rounded-2xl mb-4 shadow-xl border border-white backdrop-blur-4xl bg-green-100/50">
        {/* ทะเบียน */}
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white/70 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all" 
              placeholder="เช่น กก 1234"
            />
            {isCheckingPlate && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        {/* ยี่ห้อ */}
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
            ยี่ห้อ / รุ่น <span className="text-red-500">*</span>
          </label>
          <BrandSearchableDropdown
            value={formData.brand}
            onChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}
            name="brand"
            required
            placeholder="เช่น Toyota Camry"
          />
        </div>

        {/* ชื่อ */}
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
            ชื่อ <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="firstName" 
            value={formData.firstName || ''} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white/70 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all" 
            placeholder="ชื่อจริง"
          />
        </div>

        {/* นามสกุล */}
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
            นามสกุล <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="lastName" 
            value={formData.lastName || ''} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white/70 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all" 
            placeholder="นามสกุล"
          />
        </div>

        {/* เบอร์ */}
        <div>
          <label className="block text-sm  text-gray-700 dark:text-gray-300 mb-2">
            เบอร์ติดต่อ <span className="text-red-500">*</span>
          </label>
          <input 
            type="tel" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            required 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white/70 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all" 
            placeholder="0812345678"
          />
        </div>

        {/* ประเภทรถ */}
        <div>
          <label className="block text-sm  text-gray-700 dark:text-gray-300 mb-2">
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
          <label className="block text-sm  text-gray-700 dark:text-gray-300 mb-2">
            วันที่ชำระภาษีล่าสุด
          </label>
          <input 
            type="date" 
            name="registerDate" 
            value={formData.registerDate} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white/70 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
          />
        </div>

        {/* วันที่ตรวจ */}
        <div>
          <label className="block text-sm  text-gray-700 dark:text-gray-300 mb-2">
            วันที่ตรวจ
          </label>
          <input 
            type="date" 
            name="inspectionDate" 
            value={formData.inspectionDate} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white/70 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
          />
        </div>

        {/* แท็ก */}
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
            ประเภทบริการที่ต้องดูแล
          </label>
          <div className="flex bg-white/70 rounded-full p-2 border border-gray-300  gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag.value}
                type="button"
                onClick={() => handleTagToggle(tag.value)}
                className={`
                  px-3 py-2  rounded-full text-sm transition-all duration-200 flex items-center gap-2
                  ${formData.tags.includes(tag.value)
                    ? `${tag.color} text-white shadow-md`
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <FontAwesomeIcon icon={faTag} className="text-xs" />
                {tag.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            เลือกได้มากกว่า 1 อัน
          </p>
        </div>

        {/* หมายเหตุ */}
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
            หมายเหตุ
          </label>
          <textarea 
            name="note" 
            value={formData.note} 
            onChange={handleChange} 
            rows={3} 
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all resize-none" 
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
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-sm"
        >
          <FaTimes /> ยกเลิก
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-white rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg ${
            isUpdateMode 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {isUpdateMode ? 'กำลังอัปเดต...' : 'กำลังบันทึก...'}
            </>
          ) : (
            <>
              <FaSave /> {isUpdateMode ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}
            </>
          )}
        </button>
      </div>

      {/* Modal แสดงข้อมูลทะเบียนซ้ำ */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12rounded-full flex items-center justify-center">
                  <FaExclamationCircle className="text-orange-600 text-4xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                    พบข้อมูลทะเบียนนี้อยู่แล้ว
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    ระบบพบทะเบียน <span className="font-semibold px-3 bg-orange-200 rounded-full text-orange-700">{formData.licensePlate}</span> มี {duplicateData.length} รายการ
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                {duplicateData.map((item, idx) => (
                  <div key={idx} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-2">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold ">
                            ลำดับ: {item.sequenceNumber ? String(item.sequenceNumber).padStart(6, '0') : '-'}
                          </span>
                          {item.vehicleType && (
                            <span className="px-3 py-1 bg-emerald-100 font-semibold dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-xs ">
                              {item.vehicleType}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-900 dark:text-white">
                            <span className="font-semibold text-gray-600 dark:text-gray-400">ทะเบียน:</span> 
                            <span className="ml-2 font-bold">{item.licensePlate}</span>
                          </p>
                          <p className="text-gray-900 dark:text-white">
                            <span className="font-semibold text-gray-600 dark:text-gray-400">ชื่อ:</span> 
                            <span className="ml-2">{item.customerName}</span>
                          </p>
                          <p className="text-gray-900 dark:text-white">
                            <span className="font-semibold text-gray-600 dark:text-gray-400">เบอร์:</span> 
                            <span className="ml-2">{item.phone}</span>
                          </p>
                          {item.brand && (
                            <p className="text-gray-900 dark:text-white">
                              <span className="font-semibold text-gray-600 dark:text-gray-400">ยี่ห้อ:</span> 
                              <span className="ml-2">{item.brand}</span>
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUseExistingData(item)}
                          className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full hover:from-emerald-600 hover:to-teal-600 transition-all text-sm shadow-md"
                        >
                          ✓ ใช้ข้อมูลนี้ (อัปเดต)
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ปุ่มด้านล่าง */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  💡 <strong>คำแนะนำ:</strong> หากต้องการเพิ่มข้อมูลใหม่ (ต่างประเภทรถ) กรุณาระบุประเภทรถให้ต่างจากข้อมูลเดิม
                </p> */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white text-sm rounded-full hover:bg-gray-700 transition-all"
                  >
                    เพิ่มข้อมูลใหม่ (ต่างประเภท)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDuplicateModal(false);
                      setFormData(prev => ({ ...prev, licensePlate: '' }));
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-full hover:bg-red-700 transition-all"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
} 