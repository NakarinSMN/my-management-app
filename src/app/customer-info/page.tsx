// src/app/customer-info/page.tsx
'use client';

import Link from 'next/link';
import React, { useState, useEffect, useMemo, memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'; // สำคัญ: ต้อง Import IconDefinition
import useSWR from 'swr';
import { motion } from 'framer-motion';

import AnimatedPage, { itemVariants } from '../components/AnimatedPage';
import Modal from '../components/Modal';
import AddCustomerForm from '../components/AddCustomerForm';
import EditCustomerForm from '../components/EditCustomerForm';
import TestAPI from '../components/TestAPI';

import {
  faSearch,
  faCalendarAlt,
  faClock,
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle,
  faChevronLeft,
  faChevronRight,
  faInfoCircle,
  faEdit
} from '@fortawesome/free-solid-svg-icons';

// กำหนด Interface สำหรับข้อมูลลูกค้าที่ถูกจัดรูปแบบแล้ว
interface CustomerData {
  licensePlate: string;
  brand?: string;
  customerName: string;
  phone: string;
  registerDate: string;
  status: string;
  note?: string;
  userId?: string;
  day?: number;
}

// กำหนด Interface สำหรับข้อมูลดิบที่มาจาก Google Sheet API
// คีย์ต้องตรงกับชื่อคอลัมน์ใน Google Sheet และสิ่งที่ doGet ส่งมา
interface RawCustomerDataItem {
  'ทะเบียนรถ'?: string;
  'ยี่ห้อ / รุ่น'?: string;
  'ชื่อลูกค้า'?: string;
  'เบอร์ติดต่อ'?: string | number;
  'วันที่ชำระภาษีล่าสุด'?: string;
  'สถานะ'?: string;
  'สถานะการเตือน'?: string;
  'หมายเหตุ'?: string;
  // rowIndex?: number; // หาก Google Apps Script ส่ง rowIndex มาด้วย ให้เพิ่มบรรทัดนี้
}


// Interfaces สำหรับ Component ลูก
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


// Maps สำหรับสถานะและสี/ไอคอน
const statusColor: { [key: string]: string } = {
  'ต่อภาษีแล้ว': 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-white',
  'กำลังจะครบกำหนด': 'bg-yellow-200 dark:bg-yellow-600 text-yellow-800 dark:text-black',
  'ใกล้ครบกำหนด': 'bg-yellow-200 dark:bg-yellow-600 text-yellow-800 dark:text-black',
  'เกินกำหนด': 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-white',
  'รอดำเนินการ': 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-white',
};

const statusIcon: { [key: string]: IconDefinition } = {
  'ต่อภาษีแล้ว': faCheckCircle,
  'กำลังจะครบกำหนด': faExclamationTriangle,
  'ใกล้ครบกำหนด': faExclamationTriangle,
  'เกินกำหนด': faTimesCircle,
  'รอดำเนินการ': faClock,
};


// Component ลูก: SelectFilter
function SelectFilter({ value, onChange, icon, placeholder, options }: SelectFilterProps) {
  return (
    <div className="relative">
      <FontAwesomeIcon icon={icon} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-8 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-neutral-700 text-black dark:text-white focus:outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

// Component ลูก: PageButton
function PageButton({ onClick, disabled, icon }: PageButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 transition"
    >
      <FontAwesomeIcon icon={icon} />
    </button>
  );
}

function getPageNumbers(currentPage: number, totalPages: number, maxPages = 5) {
  let start = Math.max(1, currentPage - Math.floor(maxPages / 2));
  let end = start + maxPages - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxPages + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// ฟังก์ชันแสดงวันที่ตรงกับชีต รองรับทั้ง YYYY-MM-DD และ DD/MM/YYYY
function formatDateFlexible(dateStr: string) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  
  try {
    // ถ้าเป็น YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split('-');
      return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
    }
    // ถ้าเป็น DD/MM/YYYY อยู่แล้ว
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    }
    // ถ้าเป็น format อื่น ลองแปลง
    else {
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) {
        return dateStr; // คืนค่าต้นฉบับถ้าไม่สามารถแปลงได้
      }
      
      // แสดงผลในรูปแบบ DD/MM/YYYY โดยใช้ค่าจาก Date object
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error('Error formatting date:', dateStr, error);
    return dateStr; // คืนค่าต้นฉบับถ้าเกิดข้อผิดพลาด
  }
}


export default function CustomerInfoPage() {
  const [search, setSearch] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [data, setData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // เพิ่ม state สำหรับ error message
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // **** เปลี่ยน URL นี้เป็น URL ของ Web App ของคุณจริงๆ ที่ได้จาก Google Apps Script ****
  const GOOGLE_SHEET_CUSTOMER_API_URL: string = 'https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64svMYUFCSALwTEX4mYCHoDd6g/exec?getAll=1';

  const fetcher = (url: string) => fetch(url).then(res => res.json());

  const { data: swrData, error: swrError, mutate } = useSWR(GOOGLE_SHEET_CUSTOMER_API_URL, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useEffect(() => {
    if (swrData && swrData.data) {
      console.log('=== DEBUG API DATA ===');
      console.log('First item keys:', swrData.data[0] ? Object.keys(swrData.data[0]) : 'No data');
      console.log('First item:', swrData.data[0]);
      
      const formatted: CustomerData[] = (swrData.data || []).map((item: RawCustomerDataItem) => {
        const dtField: string = item['วันที่ชำระภาษีล่าสุด'] || '';
        
        // จัดการวันที่ให้ถูกต้อง
        let registerDate = '';
        if (dtField) {
          // ถ้าเป็น ISO format (YYYY-MM-DDTHH:mm:ss)
          if (dtField.includes('T')) {
            registerDate = dtField.split('T')[0];
          }
          // ถ้าเป็น DD/MM/YYYY อยู่แล้ว
          else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dtField)) {
            registerDate = dtField;
          }
          // ถ้าเป็น YYYY-MM-DD
          else if (/^\d{4}-\d{2}-\d{2}$/.test(dtField)) {
            registerDate = dtField;
          }
          // อื่นๆ ใช้ค่าเดิม
          else {
            registerDate = dtField;
          }
        }
        
        const rawPhone: string = (item['เบอร์ติดต่อ'] || '').toString();
        const phone: string = rawPhone.startsWith('0') || rawPhone.length === 0 ? rawPhone : `0${rawPhone}`;
        
        return {
          licensePlate: item['ทะเบียนรถ'] || '',
          brand: item['ยี่ห้อ / รุ่น'] || '',
          customerName: item['ชื่อลูกค้า'] || '',
          phone,
          registerDate,
          status: item['สถานะ'] || item['สถานะการเตือน'] || 'รอดำเนินการ',
          note: item['หมายเหตุ'] || '',
        };
      });
      
      console.log('Formatted data first item:', formatted[0]);
      
      // เรียงข้อมูลให้แถวล่าสุดอยู่บนสุด (reverse order)
      const reversedData = formatted.reverse();
      setData(reversedData);
      setError(null);
    } else if (swrError) {
      setError('ไม่สามารถโหลดข้อมูลลูกค้าได้: ' + swrError.message);
    }
    setLoading(false);
  }, [swrData, swrError]);

  const resetFilters = () => {
    setSearch('');
    setFilterMonth('');
    setFilterStatus('');
    setCurrentPage(1); // เมื่อรีเซ็ตตัวกรอง ให้กลับไปหน้าแรก
  };

  const startIdx: number = (currentPage - 1) * itemsPerPage;

  const filteredData: CustomerData[] = useMemo(() => data
    .filter(item => {
      const dateStr = formatDateFlexible(item.registerDate);
      const [dd, mm, yyyy] = dateStr.split('/');
      if (!dd || !mm || !yyyy) return false;
      const matchSearch = item.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
                         item.customerName.toLowerCase().includes(search.toLowerCase());
      // ลบ matchDay ออก
      const matchMonth = !filterMonth || mm === filterMonth.padStart(2, '0');
      const matchStatus = !filterStatus || item.status === filterStatus;
      return matchSearch && matchMonth && matchStatus;
    }), [data, search, filterMonth, filterStatus]);

  const paginatedData: CustomerData[] = useMemo(() => itemsPerPage === filteredData.length ? filteredData : filteredData.slice(startIdx, startIdx + itemsPerPage), [filteredData, itemsPerPage, startIdx]);
  const totalPages: number = itemsPerPage === filteredData.length ? 1 : Math.ceil(filteredData.length / itemsPerPage);

  // สร้างตัวเลือกสำหรับ dropdown (ปี ค.ศ. จริง)
  const months: string[] = Array.from({ length: 12 }, (_, i) => `${(i + 1).toString().padStart(2, '0')}`); // 01-12
  // ดึงปีจากข้อมูลจริง (ปี ค.ศ.)
  // ลบ const years ที่ไม่ได้ใช้

  const statusOptions = [
    '',
    'ต่อภาษีแล้ว',
    'กำลังจะครบกำหนด',
    'ใกล้ครบกำหนด',
    'เกินกำหนด',
    'รอดำเนินการ',
  ];


  return (
    <AnimatedPage>
      <motion.div variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <motion.h1 variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-3xl font-bold text-gray-900 dark:text-white">
                  ข้อมูลต่อภาษี
                </motion.h1>
                <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-gray-600 dark:text-gray-400 mt-2">
                  รายการลูกค้าทั้งหมดและข้อมูลการต่อภาษี
                </motion.p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  + เพิ่มข้อมูลลูกค้า
                </button>
                <button
                  onClick={() => setIsTestModalOpen(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  🔧 ทดสอบ API
                </button>
                <Link
                  href="/tax-expiry-next-year"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  ภาษีครั้งถัดไป
                </Link>
              </div>
            </div>

            {/* สถิติสรุป */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">รายการทั้งหมด</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredData.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ต่อภาษีแล้ว</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredData.filter(item => item.status === 'ต่อภาษีแล้ว').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-orange-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ใกล้ครบกำหนด</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredData.filter(item => item.status === 'ใกล้ครบกำหนด').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faTimesCircle} className="text-red-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">เกินกำหนด</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredData.filter(item => item.status === 'เกินกำหนด').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหาทะเบียนรถ, ชื่อลูกค้า, เบอร์โทร"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* ใน filter UI ลบ SelectFilter ของวันออก */}
              <SelectFilter
                value={filterMonth}
                onChange={val => { setFilterMonth(val); setCurrentPage(1); }}
                icon={faCalendarAlt}
                placeholder="กรองตามเดือน"
                options={months}
              />
              <SelectFilter
                value={filterStatus}
                onChange={val => { setFilterStatus(val); setCurrentPage(1); }}
                icon={faCheckCircle}
                placeholder="กรองตามสถานะ"
                options={statusOptions}
              />
              <select
                className="w-full py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-black dark:text-white focus:outline-none border border-gray-300 dark:border-gray-600"
                value={itemsPerPage}
                onChange={e => {
                  const val = e.target.value;
                  setItemsPerPage(val === 'all' ? filteredData.length : Number(val));
                  setCurrentPage(1);
                }}
              >
                {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n} รายการ</option>)}
                <option value="all">ทั้งหมด</option>
              </select>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors w-full font-semibold text-base"
              >
                รีเซ็ตตัวกรอง
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center p-8 w-full">
                <div className="w-full">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4 mb-4">
                      <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/6"></div>
                      <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/4"></div>
                      <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/5"></div>
                      <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/5"></div>
                      <div className="rounded bg-gray-200 dark:bg-gray-700 h-6 w-1/6"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={mutate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ลองใหม่
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ทะเบียนรถ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ชื่อลูกค้า</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">เบอร์โทร</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">วันที่ชำระล่าสุด</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สถานะ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                            ไม่พบข้อมูลที่ตรงกับตัวกรอง
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map((item, idx) => (
                          <CustomerRow 
                            key={item.licensePlate + item.customerName + idx} 
                            item={item} 
                            onEdit={(customer) => {
                              setSelectedCustomer(customer);
                              setIsEditModalOpen(true);
                            }}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        ก่อนหน้า
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        ถัดไป
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          แสดง <span className="font-medium">{startIdx + 1}</span> ถึง{' '}
                          <span className="font-medium">{Math.min(startIdx + itemsPerPage, filteredData.length)}</span> จาก{' '}
                          <span className="font-medium">{filteredData.length}</span> รายการ
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <PageButton
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            icon={faChevronLeft}
                          />
                          {getPageNumbers(currentPage, totalPages).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                          <PageButton
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            icon={faChevronRight}
                          />
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
      {/* Modal สำหรับเพิ่มข้อมูลลูกค้า */}
      <Modal isOpen={isAddModalOpen}>
        <AddCustomerForm
          onSuccess={() => { setIsAddModalOpen(false); mutate(); }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Modal สำหรับแก้ไขข้อมูลลูกค้า */}
      <Modal isOpen={isEditModalOpen}>
        <EditCustomerForm
          customerData={selectedCustomer || { 
            licensePlate: '', 
            brand: '',
            customerName: '', 
            phone: '', 
            registerDate: '', 
            status: '',
            note: '' 
          }}
          onSuccess={() => { setIsEditModalOpen(false); setSelectedCustomer(null); mutate(); }}
          onCancel={() => { setIsEditModalOpen(false); setSelectedCustomer(null); }}
        />
      </Modal>

      {/* Modal สำหรับทดสอบ API */}
      <Modal isOpen={isTestModalOpen}>
        <TestAPI />
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setIsTestModalOpen(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            ปิด
          </button>
        </div>
      </Modal>
    </AnimatedPage>
  );
}

// Table Row Memoized
const CustomerRow = memo(function CustomerRow({ item, onEdit }: { item: CustomerData; onEdit: (customer: CustomerData) => void }) {
  return (
    <tr key={item.licensePlate + item.customerName} className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.licensePlate}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.customerName}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.phone}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDateFlexible(item.registerDate)}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[item.status]}`}>
          <FontAwesomeIcon icon={statusIcon[item.status]} className="mr-1" />
          {item.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        <button
          onClick={() => onEdit(item)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
        >
          <FontAwesomeIcon icon={faEdit} className="mr-1" />
          แก้ไข
        </button>
      </td>
    </tr>
  );
});
