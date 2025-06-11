// src/app/customer-info/page.tsx
"use client";

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faSearch,
  faCalendarDay,
  faCalendarAlt,
  faCalendar,
  faChevronLeft,
  faChevronRight,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import AnimatedPage, { itemVariants } from '../components/AnimatedPage';

interface CustomerData {
  licensePlate: string;
  customerName: string;
  phone: string;
  registerDate: string;
  status: string;
}

// กำหนด Interface สำหรับข้อมูลดิบที่มาจาก Google Sheet API โดยไม่มี [key: string]: any;
interface RawCustomerDataItem {
  'ทะเบียนรถ'?: string;
  'ชื่อลูกค้า'?: string;
  'เบอร์ติดต่อ'?: string | number;
  'วันที่ชำระภาษีล่าสุด'?: string;
  'สถานะ'?: string;
  'สถานะการเตือน'?: string;
}

interface SelectFilterProps {
  value: string;
  onChange: (value: string) => void;
  icon: IconDefinition;
  placeholder: string;
  options: string[];
}

interface PageButtonProps {
  onClick: () => void;
  disabled: boolean;
  icon: IconDefinition;
}

function SelectFilter({ value, onChange, icon, placeholder, options }: SelectFilterProps) {
  return (
    <div className="relative">
      <FontAwesomeIcon icon={icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300 pointer-events-none" />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-9 pr-4 py-2 rounded-lg appearance-none bg-gray-50 dark:bg-neutral-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">{placeholder}</option>
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function PageButton({ onClick, disabled, icon }: PageButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition hover:bg-gray-300 dark:hover:bg-neutral-600"
    >
      <FontAwesomeIcon icon={icon} />
    </button>
  );
}

export default function CustomerInfoPage() {
  const [search, setSearch] = useState<string>('');
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  
  const [data, setData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const itemsPerPage: number = 10;
  
  const GOOGLE_SHEET_CUSTOMER_API_URL: string = 'https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64svTEX4mYCHoDd6g/exec?getAll=1';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(GOOGLE_SHEET_CUSTOMER_API_URL);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}.`);
      }

      const json: { data?: RawCustomerDataItem[] } = await res.json();

      const formatted: CustomerData[] = (json.data || []).map((item: RawCustomerDataItem) => {
        const dtField: string = item['วันที่ชำระภาษีล่าสุด'] || '';
        const registerDate: string = dtField.includes('T') ? dtField.split('T')[0] : dtField;
        
        const rawPhone: string = (item['เบอร์ติดต่อ'] || '').toString();
        const phone: string = rawPhone.startsWith('0') || rawPhone.length === 0 ? rawPhone : `0${rawPhone}`;
        
        return {
          licensePlate: item['ทะเบียนรถ'] || '',
          customerName: item['ชื่อลูกค้า'] || '',
          phone,
          registerDate,
          status: item['สถานะ'] || item['สถานะการเตือน'] || 'รอดำเนินการ',
        };
      });
      setData(formatted);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('❌ ดึงข้อมูลลูกค้าไม่สำเร็จ:', err.message);
      } else {
        console.error('❌ ดึงข้อมูลลูกค้าไม่สำเร็จ:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [GOOGLE_SHEET_CUSTOMER_API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetFilters = () => {
    setSearch('');
    setFilterDay('');
    setFilterMonth('');
    setFilterYear('');
    setCurrentPage(1);
  };

  const filteredData: CustomerData[] = data
    .filter(item => !!item.registerDate)
    .filter(item => {
      const [year, monthRaw, dayRaw] = item.registerDate.split('-');
      if (!year || !monthRaw || !dayRaw) return false; 

      const day: string = String(Number(dayRaw));
      const monthIndex: number = Number(monthRaw) - 1;
      const monthMap: string[] = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const month: string = monthMap[monthIndex] || '';
      
      const matchSearch: boolean = item.licensePlate.toLowerCase().includes(search.toLowerCase()) || 
                                   item.customerName.toLowerCase().includes(search.toLowerCase());
      const matchDay: boolean = !filterDay || day === filterDay;
      const matchMonth: boolean = !filterMonth || month === filterMonth;
      const matchYear: boolean = !filterYear || year === filterYear;

      return matchSearch && matchDay && matchMonth && matchYear;
    });
  
  const startIdx: number = (currentPage - 1) * itemsPerPage;
  const paginatedData: CustomerData[] = filteredData.slice(startIdx, startIdx + itemsPerPage);
  const totalPages: number = Math.ceil(filteredData.length / itemsPerPage);

  const days: string[] = Array.from({ length: 31 }, (_, i) => `${i + 1}`);
  const months: string[] = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const currentYear: number = new Date().getFullYear();
  const years: string[] = Array.from({ length: 5 }, (_, i) => `${currentYear + i - 2}`);

  return (
    <AnimatedPage>
      <motion.div variants={itemVariants} className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">ข้อมูลลูกค้าต่อภาษี</h1>
      </motion.div>
      
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-neutral-800 rounded-lg p-4 sm:p-6 shadow-lg w-full max-w-6xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6 items-center">
          <div className="relative lg:col-span-2">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              placeholder="ค้นหาทะเบียนรถ / ชื่อลูกค้า"
              className="w-full pl-10 py-2 rounded-lg bg-gray-50 dark:bg-neutral-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <SelectFilter value={filterDay} onChange={setFilterDay} icon={faCalendarDay} placeholder="ทุกวัน" options={days} />
          <SelectFilter value={filterMonth} onChange={setFilterMonth} icon={faCalendarAlt} placeholder="ทุกเดือน" options={months} />
          <SelectFilter value={filterYear} onChange={setFilterYear} icon={faCalendar} placeholder="ทุกปี" options={years} />
          <button onClick={resetFilters} className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition w-full">ล้าง</button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-700 dark:text-gray-200">
            <FontAwesomeIcon icon={faSpinner} spin className="text-4xl mb-4 text-blue-500 dark:text-blue-400" />
            <p className="text-lg">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <>
            <div className="overflow-auto h-[55vh] border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-left text-sm text-gray-700 dark:text-gray-200">
                <thead className="bg-gray-100 dark:bg-neutral-700 sticky top-0 z-10">
                  <tr className="border-b border-gray-300 dark:border-gray-600">
                    {['ทะเบียนรถ', 'วันที่ชำระภาษี', 'ลูกค้า', 'เบอร์โทร', 'สถานะ'].map((label: string) => (
                      <th key={label} className="p-3 font-semibold whitespace-nowrap">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedData.map((item: CustomerData) => (
                    <tr key={item.licensePlate} className="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                      <td className="p-3 font-medium whitespace-nowrap">{item.licensePlate}</td>
                      <td className="p-3 whitespace-nowrap">{item.registerDate}</td>
                      <td className="p-3 whitespace-nowrap">{item.customerName}</td>
                      <td className="p-3 whitespace-nowrap">{item.phone}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                          ${item.status === 'ต่อภาษีแล้ว' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                            item.status === 'เกินกำหนด' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                            'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {paginatedData.length === 0 && (
                  <div className="flex items-center justify-center h-full text-center py-10 text-gray-500">
                      ไม่พบข้อมูลที่ตรงกับตัวกรอง
                  </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-6 flex-wrap gap-4">
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                    แสดง {paginatedData.length === 0 ? 0 : startIdx + 1} - {startIdx + paginatedData.length} จาก {filteredData.length} รายการ
                </span>
                <div className="flex items-center gap-2">
                    <PageButton onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} icon={faChevronLeft} />
                    <span className="text-gray-700 dark:text-gray-200 font-medium">{currentPage} / {totalPages || 1}</span>
                    <PageButton onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} icon={faChevronRight} />
                </div>
            </div>
          </>
        )}
      </motion.div>
      <motion.div variants={itemVariants} className="text-center mt-8">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
          <FontAwesomeIcon icon={faChevronLeft} /> กลับหน้าหลัก
        </Link>
      </motion.div>
    </AnimatedPage>
  );
}