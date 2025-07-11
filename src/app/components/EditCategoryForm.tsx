import { useState } from 'react';
import type { ServiceCategory, Service } from '../pricing/page';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3WJmHNJ2h8Yj1rm2tc_mXj6JNCYz8T-yOmg9kC6aKgpAAuXmH5Z3DNZQF8ecGZUGw/exec';

interface ServiceItem {
  serviceName: string;
  serviceDetails: string;
  servicePrice: string | number;
  rowIndex?: number;
}

interface EditCategoryFormProps {
  category: ServiceCategory;
  onSuccess: (updated?: unknown) => void;
  onCancel: () => void;
}

export default function EditCategoryForm({ category, onSuccess, onCancel }: EditCategoryFormProps) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);
  const [services, setServices] = useState<ServiceItem[]>(category.services.map((svc: Service) => ({
    serviceName: svc.serviceName,
    serviceDetails: svc.serviceDetails,
    servicePrice: svc.servicePrice,
    rowIndex: svc.rowIndex,
  })));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleServiceChange = (idx: number, field: keyof ServiceItem, value: string) => {
    setServices(prev => prev.map((svc, i) => i === idx ? { ...svc, [field]: value } : svc));
  };

  const handleRemoveService = async (idx: number) => {
    const svc = services[idx];
    if (svc.rowIndex !== undefined) {
      try {
        setIsSubmitting(true);
        setError('');
        const res = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'deleteService', rowIndex: svc.rowIndex }),
        });
        const result = await res.json();
        if (result.status !== 'success') throw new Error(result.message || 'ลบไม่สำเร็จ');
        setServices(prev => prev.filter((_, i) => i !== idx));
        setMessage('ลบบริการสำเร็จ');
        setTimeout(() => setMessage(''), 1200);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message || 'เกิดข้อผิดพลาดขณะลบ');
        } else {
          setError('เกิดข้อผิดพลาดขณะลบ');
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setServices(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleAddService = () => {
    setServices(prev => ([...prev, { serviceName: '', serviceDetails: '', servicePrice: '', rowIndex: undefined }]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        action: 'editCategory',
        categoryName: name,
        categoryDescription: description,
        services: services.map(svc => ({
          serviceName: svc.serviceName,
          serviceDetails: svc.serviceDetails,
          servicePrice: svc.servicePrice,
          rowIndex: svc.rowIndex,
        })),
      };
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.status === 'success') {
        setMessage('บันทึกสำเร็จ!');
        setTimeout(() => onSuccess(result), 1200);
      } else {
        throw new Error(result.message || 'บันทึกไม่สำเร็จ');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'เกิดข้อผิดพลาดขณะบันทึก');
      } else {
        setError('เกิดข้อผิดพลาดขณะบันทึก');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl min-w-[380px] md:min-w-[600px] max-w-2xl md:max-w-3xl mx-auto border border-gray-100 dark:border-gray-800 min-h-[500px] max-h-[90vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-3xl md:text-4xl font-extrabold text-yellow-700 dark:text-yellow-400 tracking-tight text-center mb-1 md:mb-2">แก้ไขหมวดหมู่</h2>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">ชื่อหมวดหมู่</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none transition text-base"
          />
        </div>
        <div>
          <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">คำอธิบายหมวดหมู่</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none transition text-base"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-800 dark:text-gray-100 font-extrabold text-lg md:text-xl">บริการในหมวดหมู่นี้</label>
            <button type="button" onClick={handleAddService} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow transition-colors text-sm md:text-base">+ เพิ่มบริการใหม่</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="px-4 py-2 text-left text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200">ชื่อบริการ</th>
                  <th className="px-4 py-2 text-left text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200">รายละเอียด</th>
                  <th className="px-4 py-2 text-left text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200">ราคา</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc, idx) => (
                  <tr key={svc.rowIndex || idx} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
                    <td className="px-4 py-2 align-top w-1/3">
                      <input
                        type="text"
                        value={svc.serviceName}
                        onChange={e => handleServiceChange(idx, 'serviceName', e.target.value)}
                        placeholder="ชื่อบริการ"
                        className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm md:text-base"
                      />
                    </td>
                    <td className="px-4 py-2 align-top w-1/3">
                      <input
                        type="text"
                        value={svc.serviceDetails}
                        onChange={e => handleServiceChange(idx, 'serviceDetails', e.target.value)}
                        placeholder="รายละเอียด (ถ้ามี)"
                        className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm md:text-base"
                      />
                    </td>
                    <td className="px-4 py-2 align-top w-1/4">
                      <input
                        type="text"
                        value={svc.servicePrice}
                        onChange={e => handleServiceChange(idx, 'servicePrice', e.target.value)}
                        placeholder="ราคา"
                        className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm md:text-base"
                      />
                    </td>
                    <td className="px-4 py-2 align-top w-12">
                      <button type="button" disabled={isSubmitting} onClick={() => handleRemoveService(idx)} className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded-full transition-colors text-xs font-bold">ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {message && <p className="text-green-600 dark:text-green-400 font-medium text-center">{message}</p>}
        {error && <p className="text-red-500 font-medium text-center">{error}</p>}
      </div>
      {/* Footer */}
      <div className="flex justify-end gap-4 px-8 py-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold text-base">ยกเลิก</button>
        <button type="submit" disabled={isSubmitting} className="px-7 py-2 bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-60 text-base">{isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}</button>
      </div>
    </form>
  );
} 