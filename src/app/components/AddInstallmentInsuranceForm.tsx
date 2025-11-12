// src/app/components/AddInstallmentInsuranceForm.tsx
'use client';

import React, { useState } from 'react';
import { MONGODB_INSTALLMENT_INSURANCE_API_URL } from '@/lib/useInstallmentInsuranceData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';

interface AddInstallmentInsuranceFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddInstallmentInsuranceForm({ onSuccess, onCancel }: AddInstallmentInsuranceFormProps) {
  const [formData, setFormData] = useState({
    licensePlate: '',
    brand: '',
    customerName: '',
    phone: '',
    insuranceCompany: '',
    insurancePremium: '',
    installmentCount: '',
    startDate: new Date().toISOString().split('T')[0], // วันที่เริ่มผ่อน = วันนี้
    paymentDay: '1', // วันที่ของเดือนที่ต้องจ่าย
    tags: [] as string[],
    status: 'กำลังผ่อน',
    note: ''
  });

  const [paidInstallments, setPaidInstallments] = useState<Set<number>>(new Set());
  const [installmentAmounts, setInstallmentAmounts] = useState<{ [key: number]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState<Array<{
    sequenceNumber?: number;
    licensePlate: string;
    customerName: string;
    phone: string;
    insuranceCompany?: string;
    insurancePremium?: number;
    installmentCount?: number;
    startDate?: string;
    paymentDay?: number;
    paidDates?: { [key: number]: string };
    installmentAmounts?: { [key: number]: number };
    note?: string;
    tags?: string[];
  }>>([]);
  const [isCheckingPlate, setIsCheckingPlate] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [originalData, setOriginalData] = useState<{
    sequenceNumber?: number;
  } | null>(null);

  const statusOptions = ['กำลังผ่อน', 'ผ่อนครบแล้ว', 'ยกเลิก'];
  const tagOptions = ['ป.1', 'ป.2+', 'ป.3+', 'ป.3'];
  
  // คำนวณงวดละอัตโนมัติเพื่อใช้เป็น placeholder
  const amountPerInstallment = formData.insurancePremium && formData.installmentCount 
    ? parseFloat(formData.insurancePremium) / parseInt(formData.installmentCount)
    : 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const toggleInstallmentPaid = (installmentNum: number) => {
    setPaidInstallments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(installmentNum)) {
        newSet.delete(installmentNum);
      } else {
        newSet.add(installmentNum);
      }
      return newSet;
    });
  };

  // ฟังก์ชันเช็คทะเบียนซ้ำ
  const checkDuplicatePlate = async (licensePlate: string) => {
    if (!licensePlate || licensePlate.length < 3) return;
    
    try {
      setIsCheckingPlate(true);
      const response = await fetch(`${MONGODB_INSTALLMENT_INSURANCE_API_URL}?licensePlate=${encodeURIComponent(licensePlate)}`);
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
  const handleUseExistingData = (existing: typeof duplicateData[0]) => {
    // เติมข้อมูลในฟอร์ม
    setFormData({
      licensePlate: existing.licensePlate || '',
      brand: '',
      customerName: existing.customerName || '',
      phone: existing.phone || '',
      insuranceCompany: existing.insuranceCompany || '',
      insurancePremium: existing.insurancePremium?.toString() || '',
      installmentCount: existing.installmentCount?.toString() || '',
      startDate: existing.startDate || new Date().toISOString().split('T')[0],
      paymentDay: existing.paymentDay?.toString() || '1',
      tags: existing.tags || [],
      status: 'กำลังผ่อน',
      note: existing.note || ''
    });

    // โหลด paidInstallments และ installmentAmounts
    if (existing.paidDates) {
      const paidSet = new Set<number>();
      Object.keys(existing.paidDates).forEach(key => {
        paidSet.add(parseInt(key));
      });
      setPaidInstallments(paidSet);
    }
    
    if (existing.installmentAmounts) {
      setInstallmentAmounts(existing.installmentAmounts);
    }

    // เก็บข้อมูลเดิมเพื่อใช้ในการ Update
    setOriginalData({
      sequenceNumber: existing.sequenceNumber
    });

    // เปลี่ยนเป็นโหมด Update
    setIsUpdateMode(true);
    setShowDuplicateModal(false);
    setMessage(`กำลังอัปเดตข้อมูลเลขลำดับ ${existing.sequenceNumber ? String(existing.sequenceNumber).padStart(6, '0') : ''} - แก้ไขแล้วกดบันทึก`);
  };

  // ฟังก์ชันเลือกไม่ใช้ข้อมูลเก่า (เพิ่มใหม่)
  const handleAddNew = () => {
    setIsUpdateMode(false);
    setOriginalData(null);
    setShowDuplicateModal(false);
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.licensePlate || !formData.customerName || !formData.phone || !formData.insuranceCompany) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    if (!formData.insurancePremium || parseFloat(formData.insurancePremium) <= 0) {
      setError('กรุณากรอกเบี้ยประกันให้ถูกต้อง');
      return;
    }

    if (!formData.installmentCount || parseInt(formData.installmentCount) <= 0) {
      setError('กรุณากรอกจำนวนงวดที่ผ่อนให้ถูกต้อง');
      return;
    }

    setIsSubmitting(true);

    try {
      // สร้าง paidDates จาก installments ที่เลือก
      const paidDates: { [key: number]: string } = {};
      const today = new Date().toISOString().split('T')[0];
      paidInstallments.forEach(num => {
        paidDates[num] = today; // ใช้วันนี้เป็นวันที่จ่าย
      });

      // กำหนด method และ body ตามโหมด
      const method = isUpdateMode ? 'PUT' : 'POST';
      const body: Record<string, unknown> = {
        ...formData,
        paidDates: paidDates,
        installmentAmounts: installmentAmounts
      };

      // ถ้าเป็นโหมด update ให้ส่ง sequenceNumber ไปด้วย
      if (isUpdateMode && originalData?.sequenceNumber) {
        body.sequenceNumber = originalData.sequenceNumber;
      }

      const response = await fetch(MONGODB_INSTALLMENT_INSURANCE_API_URL, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isUpdateMode ? 'update' : 'add'} installment insurance data`);
      }

      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `เกิดข้อผิดพลาดในการ${isUpdateMode ? 'แก้ไข' : 'เพิ่ม'}ข้อมูล`;
      console.error(`Error ${isUpdateMode ? 'updating' : 'adding'} installment insurance:`, error);
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-auto border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          เพิ่มข้อมูลผ่อนประกัน
        </h2>
      </div>

      {/* Form - Scrollable */}
      <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 flex-1">
        <div className="space-y-6">
          {/* ส่วนที่ 1: ข้อมูลรถยนต์ */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
              ข้อมูลรถยนต์
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ทะเบียนรถ <span className="text-red-500">*</span>
                  {isCheckingPlate && <span className="text-blue-500 text-xs ml-2">(กำลังตรวจสอบ...)</span>}
                </label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  onBlur={handleLicensePlateBlur}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                  disabled={isUpdateMode}
                />
              </div>
            </div>
          </div>

          {/* ส่วนที่ 2: ข้อมูลลูกค้าและประกัน (รวมกัน) */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-blue-500 rounded-full"></div>
              ข้อมูลลูกค้าและประกัน
            </h3>
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/10 dark:to-blue-900/10 rounded-xl p-4 space-y-4">
              {/* ข้อมูลลูกค้า */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    เบอร์โทร <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    required
                  />
                </div>
              </div>

              {/* ข้อมูลประกัน */}
              <div className="border-t border-blue-200 dark:border-blue-800 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      บริษัทประกัน <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="insuranceCompany"
                      value={formData.insuranceCompany}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      เบี้ยประกันเต็ม (บาท) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="insurancePremium"
                      value={formData.insurancePremium}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      required
                      placeholder="ใส่ยอดเบี้ยรวม"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      จำนวนงวด <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="installmentCount"
                      value={formData.installmentCount}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      required
                      placeholder="จำนวนงวด"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ส่วนที่ 3: ข้อมูลการผ่อนชำระและรายละเอียด (รวมกัน) */}
          {formData.installmentCount && parseInt(formData.installmentCount) > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
                ข้อมูลการผ่อนชำระและรายละเอียด
              </h3>
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-xl p-4 space-y-4">
                {/* วันที่เริ่มผ่อนและวันที่จ่าย */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      วันที่เริ่มผ่อน <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ผ่อนทุกวันที่ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="paymentDay"
                      value={formData.paymentDay}
                      onChange={handleInputChange}
                      min="1"
                      max="31"
                      placeholder="เช่น 5, 10, 15"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      required
                    />
                  </div>
                </div>

                {/* ตารางรายละเอียดแต่ละงวด */}
                <div className="border-t border-purple-200 dark:border-purple-800 pt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    📋 รายละเอียดแต่ละงวด (ไม่บังคับ)
                  </p>
                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-indigo-100 dark:bg-indigo-900/30">
                        <tr>
                          <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-300">งวดที่</th>
                          <th className="px-3 py-2 text-right font-bold text-gray-700 dark:text-gray-300">จำนวนเงิน (฿)</th>
                          <th className="px-3 py-2 text-center font-bold text-gray-700 dark:text-gray-300">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: parseInt(formData.installmentCount) }, (_, i) => i + 1).map(installmentNum => {
                          const customAmount = installmentAmounts[installmentNum];
                          const isPaid = paidInstallments.has(installmentNum);

                          return (
                            <tr 
                              key={installmentNum}
                              className={`border-t border-gray-200 dark:border-gray-700 ${
                                isPaid ? 'bg-green-50 dark:bg-green-900/10' : ''
                              }`}
                            >
                              <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                                งวดที่ {installmentNum}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={customAmount || ''}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (e.target.value && !isNaN(value)) {
                                      setInstallmentAmounts({ ...installmentAmounts, [installmentNum]: value });
                                    } else {
                                      const newAmounts = { ...installmentAmounts };
                                      delete newAmounts[installmentNum];
                                      setInstallmentAmounts(newAmounts);
                                    }
                                  }}
                                  placeholder={amountPerInstallment > 0 ? amountPerInstallment.toFixed(2) : '0.00'}
                                  step="0.01"
                                  min="0"
                                  className="w-full px-3 py-2 text-right border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleInstallmentPaid(installmentNum)}
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                    isPaid 
                                      ? 'bg-green-500 text-white hover:bg-green-600' 
                                      : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
                                  }`}
                                >
                                  <FontAwesomeIcon icon={isPaid ? faCheckCircle : faClock} className="mr-1" />
                                  {isPaid ? 'จ่ายแล้ว' : 'รอชำระ'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* สรุป */}
                  <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">ยอดรวมทั้งหมด</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {(() => {
                          let total = 0;
                          const count = parseInt(formData.installmentCount);
                          for (let i = 1; i <= count; i++) {
                            const amount = installmentAmounts[i] || amountPerInstallment;
                            total += amount;
                          }
                          return total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()} ฿
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">จ่ายไปแล้ว</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {(() => {
                          let totalPaid = 0;
                          paidInstallments.forEach(num => {
                            const amount = installmentAmounts[num] || amountPerInstallment;
                            totalPaid += amount;
                          });
                          return totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()} ฿
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ({paidInstallments.size}/{formData.installmentCount} งวด)
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">คงเหลือ</p>
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {(() => {
                          let totalPaid = 0;
                          paidInstallments.forEach(num => {
                            const amount = installmentAmounts[num] || amountPerInstallment;
                            totalPaid += amount;
                          });
                          const remaining = parseFloat(formData.insurancePremium || '0') - totalPaid;
                          return remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()} ฿
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ({parseInt(formData.installmentCount || '0') - paidInstallments.size} งวด)
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                    💡 ใส่จำนวนเงินแต่ละงวด (ถ้าไม่ใส่จะใช้ค่า {amountPerInstallment.toFixed(2)} บาท) | คลิกปุ่มสถานะเพื่อบันทึกว่าจ่ายแล้ว
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* แท็กและสถานะ */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
              แท็กและสถานะ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  แท็กบริการ
                </label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        formData.tags.includes(tag)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  สถานะ
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* หมายเหตุ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              หมายเหตุ
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-700 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">{message}</p>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </form>

      {/* Buttons */}
      <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-semibold text-sm disabled:opacity-50"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 text-sm shadow-lg disabled:opacity-50"
        >
          {isSubmitting ? 'กำลังบันทึก...' : isUpdateMode ? 'อัปเดตข้อมูล' : 'บันทึก'}
        </button>
      </div>

      {/* Duplicate Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                พบข้อมูลผ่อนประกันที่มีทะเบียนนี้อยู่แล้ว
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                คุณต้องการใช้ข้อมูลเก่าเพื่ออัปเดต หรือเพิ่มข้อมูลใหม่?
              </p>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {duplicateData.map((existing, index) => (
                <div key={index} className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">เลขลำดับ:</span>
                      <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                        {existing.sequenceNumber ? String(existing.sequenceNumber).padStart(6, '0') : '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">ทะเบียน:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">{existing.licensePlate}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">ชื่อลูกค้า:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">{existing.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">เบอร์โทร:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">{existing.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">บริษัทประกัน:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">{existing.insuranceCompany}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">เบี้ยประกัน:</span>
                      <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                        {existing.insurancePremium?.toLocaleString()} บาท
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUseExistingData(existing)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-sm shadow-md"
                  >
                    ใช้ข้อมูลนี้เพื่ออัปเดต
                  </button>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
              <button
                onClick={handleAddNew}
                className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all text-sm shadow-md"
              >
                ไม่ใช้ เพิ่มข้อมูลใหม่
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
