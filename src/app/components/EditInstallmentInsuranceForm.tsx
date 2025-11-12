// src/app/components/EditInstallmentInsuranceForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { MONGODB_INSTALLMENT_INSURANCE_API_URL } from '@/lib/useInstallmentInsuranceData';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';
import { FaSave, FaTimes, FaTrash, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';

interface InstallmentInsuranceData {
  _id?: string;
  sequenceNumber?: number;
  licensePlate: string;
  vehicleType?: string;
  brand?: string;
  customerName: string;
  phone: string;
  insuranceCompany: string;
  insurancePremium: number;
  installmentCount: number;
  currentInstallment?: number;
  startDate?: string;
  paymentDay?: number;
  paidDates?: { [key: number]: string };
  installmentAmounts?: { [key: number]: number };
  tags?: string[];
  status: string;
  note?: string;
}

interface EditInstallmentInsuranceFormProps {
  data: InstallmentInsuranceData;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditInstallmentInsuranceForm({ data, onSuccess, onCancel }: EditInstallmentInsuranceFormProps) {
  const [formData, setFormData] = useState({
    sequenceNumber: data.sequenceNumber || 0,
    licensePlate: data.licensePlate || '',
    brand: data.brand || '',
    customerName: data.customerName || '',
    phone: data.phone || '',
    insuranceCompany: data.insuranceCompany || '',
    insurancePremium: String(data.insurancePremium || ''),
    installmentCount: String(data.installmentCount || ''),
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    paymentDay: String(data.paymentDay || '1'),
    tags: data.tags || [],
    status: data.status || 'กำลังผ่อน',
    note: data.note || ''
  });

  const [paidInstallments, setPaidInstallments] = useState<Set<number>>(new Set());
  const [installmentAmounts, setInstallmentAmounts] = useState<{ [key: number]: number }>(data.installmentAmounts || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const statusOptions = ['กำลังผ่อน', 'ผ่อนครบแล้ว', 'ยกเลิก'];
  const tagOptions = ['ป.1', 'ป.2+', 'ป.3+', 'ป.3'];
  
  // คำนวณงวดละอัตโนมัติเพื่อใช้เป็น placeholder
  const amountPerInstallment = formData.insurancePremium && formData.installmentCount 
    ? parseFloat(formData.insurancePremium) / parseInt(formData.installmentCount)
    : 0;

  // โหลด paidInstallments จาก paidDates ที่มีอยู่
  useEffect(() => {
    if (data.paidDates) {
      const paidSet = new Set<number>();
      Object.keys(data.paidDates).forEach(key => {
        paidSet.add(parseInt(key));
      });
      setPaidInstallments(paidSet);
    }
  }, [data]);

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
        paidDates[num] = data.paidDates?.[num] || today;
      });

      const response = await fetch(MONGODB_INSTALLMENT_INSURANCE_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          paidDates: paidDates,
          installmentAmounts: installmentAmounts // ส่งจำนวนเงินที่กรอกไป
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update installment insurance data');
      }

      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล';
      console.error('Error updating installment insurance:', error);
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    setMessage('');
    setError('');
    
    try {
      console.log('=== DEBUG DELETE ===');
      console.log('Deleting installment insurance:', data.sequenceNumber);
      
      const response = await fetch(MONGODB_INSTALLMENT_INSURANCE_API_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sequenceNumber: data.sequenceNumber,
        }),
      });

      const result = await response.json();
      console.log('DEBUG: Response:', result);
      
      if (response.ok && result.success) {
        setMessage('ลบข้อมูลผ่อนประกันสำเร็จ!');
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-auto border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          แก้ไขข้อมูลผ่อนประกัน
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          เลขลำดับ: {String(formData.sequenceNumber).padStart(6, '0')}
        </p>
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
                </label>
                <input
                  type="text"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
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
                    📋 รายละเอียดแต่ละงวด
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
          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded-lg flex items-center gap-2">
            <FaExclamationCircle className="text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">{message}</p>
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg flex items-center gap-2">
            <FaExclamationCircle className="text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}
      </form>

      {/* Action Buttons */}
      <div className="flex justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
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
            onClick={handleSubmit}
            disabled={isSubmitting} 
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg"
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
    </div>

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
                    <span className="text-gray-900 dark:text-white font-bold text-lg">{data.licensePlate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">ชื่อลูกค้า:</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{data.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">เบอร์ติดต่อ:</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{data.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">บริษัทประกัน:</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{data.insuranceCompany}</span>
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
