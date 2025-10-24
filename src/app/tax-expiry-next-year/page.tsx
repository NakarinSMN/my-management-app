// src/app/tax-expiry-next-year/page.tsx
'use client';

import Link from 'next/link';
import React, { useState, useEffect, useMemo, memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import {
  faSearch,
  faCalendarAlt,
  faClock,
  faCheckCircle,
  faExclamationTriangle,
  faTimesCircle,
  faChevronLeft,
  faChevronRight,
  faWarning,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

// ⚡ ใช้ Custom Hook แทน useSWR
import { useCustomerData } from '@/lib/useCustomerData';
import FilterDropdown from '../components/FilterDropdown';

// กำหนด Interface สำหรับข้อมูลลูกค้าที่มีวันสิ้นอายุภาษีปีถัดไป
interface TaxExpiryData {
  licensePlate: string;
  customerName: string;
  phone: string;
  lastTaxDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: string;
}


// Interfaces สำหรับ Component ลูก

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

// ฟังก์ชันแปลงวันที่เป็นรูปแบบ DD/MM/YYYY
function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  
  try {
    // ถ้าเป็น YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split('-');
      return `${dd}/${mm}/${yyyy}`;
    }
    // ถ้าเป็น DD/MM/YYYY อยู่แล้ว
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    }
    // ถ้าเป็น format อื่น
    else {
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) {
        return dateStr; // คืนค่าเดิมถ้าไม่สามารถแปลงได้
      }
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch {
    return dateStr;
  }
}

// ฟังก์ชันคำนวณจำนวนวันที่เหลือจากวันสิ้นอายุ
function calculateDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const timeDiff = expiry.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// ฟังก์ชันคำนวณสถานะตามวันที่ชำระภาษี (ใช้สูตรเดียวกับ useCustomerData)
function calculateStatus(registerDate: string): string {
  if (!registerDate) return 'รอดำเนินการ';
  
  try {
    // แปลงวันที่เป็น Date object
    let date: Date;
    
    // ถ้าเป็น DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(registerDate)) {
      const [day, month, year] = registerDate.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // ถ้าเป็น YYYY-MM-DD
    else if (/^\d{4}-\d{2}-\d{2}$/.test(registerDate)) {
      date = new Date(registerDate);
    }
    // ถ้าเป็น ISO format
    else if (registerDate.includes('T')) {
      date = new Date(registerDate);
    }
    else {
      return 'รอดำเนินการ';
    }
    
    // คำนวณวันที่ครบกำหนด (1 ปีหลังจากวันที่ชำระ)
    const expiryDate = new Date(date);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    // คำนวณ gap (วันที่ครบกำหนด - วันนี้)
    const today = new Date();
    const gap = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // คำนวณสถานะตามสูตร
    if (gap < 0) {
      return 'เกินกำหนด';
    } else if (gap === 0) {
      return 'ครบกำหนดวันนี้';
    } else if (gap <= 90) {
      return 'กำลังจะครบกำหนด';
    } else {
      return 'ต่อภาษีแล้ว';
    }
  } catch (error) {
    console.error('Error calculating status:', error);
    return 'รอดำเนินการ';
  }
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

const TaxExpiryRow = memo(function TaxExpiryRow({ item }: { item: TaxExpiryData }) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.licensePlate}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.customerName}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.phone}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(item.lastTaxDate)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(item.expiryDate)}</td>
      <td className="px-6 py-4 whitespace-nowrap font-medium">
        <span className={
          item.daysUntilExpiry < 0 ? 'text-red-600 dark:text-red-400' :
          item.daysUntilExpiry <= 30 ? 'text-orange-600 dark:text-orange-400' :
          item.daysUntilExpiry <= 90 ? 'text-yellow-600 dark:text-yellow-400' :
          'text-green-600 dark:text-green-400'
        }>
          {item.daysUntilExpiry < 0 ? `${Math.abs(item.daysUntilExpiry)} วัน (เกินกำหนด)` :
            item.daysUntilExpiry === 0 ? 'วันนี้' :
            `${item.daysUntilExpiry} วัน`}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[item.status]}`}>
          <FontAwesomeIcon icon={statusIcon[item.status]} className="mr-1" />
          {item.status}
        </span>
      </td>
    </tr>
  );
});

export default function TaxExpiryNextYearPage() {
  const [search, setSearch] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [data, setData] = useState<TaxExpiryData[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ⚡ ใช้ Custom Hook พร้อม Cache
  const { data: customerData, error: swrError, isLoading, refreshData } = useCustomerData();

  useEffect(() => {
    if (customerData && customerData.length > 0) {
      console.log('=== DEBUG TAX EXPIRY DATA ===');
      console.log('Customer data length:', customerData.length);
      console.log('First item:', customerData[0]);
      
      const formatted: TaxExpiryData[] = customerData
        .map((item) => {
          // ดึงวันครบกำหนดจากข้อมูล MongoDB
          let expiryDate = item.expiryDate || item.nextTaxDate || '';
          
          // ถ้าไม่มีข้อมูลวันครบกำหนด ให้คำนวณจากวันที่ชำระล่าสุด + 365 วัน
          if (!expiryDate) {
            const lastTaxDate = item.lastTaxDate || item.registerDate || '';
            if (lastTaxDate) {
              // แปลงวันที่เป็น Date object
              let dateObj: Date | null = null;
              if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastTaxDate)) {
                const [dd, mm, yyyy] = lastTaxDate.split('/');
                dateObj = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
              } else if (/^\d{4}-\d{2}-\d{2}$/.test(lastTaxDate)) {
                dateObj = new Date(lastTaxDate);
              }
              
              if (dateObj && !isNaN(dateObj.getTime())) {
                // เพิ่ม 365 วัน
                dateObj.setDate(dateObj.getDate() + 365);
                // แปลงกลับเป็น YYYY-MM-DD
                const yyyy = dateObj.getFullYear();
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                expiryDate = `${yyyy}-${mm}-${dd}`;
              }
            }
          }
          
          // ถ้ายังไม่มีข้อมูลวันครบกำหนด ให้ข้ามรายการนี้
          if (!expiryDate) {
            return null;
          }
          
          // แปลง DD/MM/YYYY เป็น YYYY-MM-DD ถ้าจำเป็น
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(expiryDate)) {
            const [dd, mm, yyyy] = expiryDate.split('/');
            expiryDate = `${yyyy}-${mm}-${dd}`;
          }
          
          const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);
          const rawPhone: string = (item.phone || '').toString();
          const phone: string = rawPhone.startsWith('0') || rawPhone.length === 0 ? rawPhone : `0${rawPhone}`;
          
          // ใช้ฟังก์ชันคำนวณสถานะเดียวกันกับ useCustomerData
          const lastTaxDate = item.lastTaxDate || item.registerDate || '';
          const status = calculateStatus(lastTaxDate);
          return {
            licensePlate: item.licensePlate || '',
            customerName: item.customerName || '',
            phone,
            lastTaxDate: item.lastTaxDate || item.registerDate || '',
            expiryDate,
            daysUntilExpiry,
            status
          };
        })
        .filter((item: TaxExpiryData | null): item is TaxExpiryData => item !== null);
      
      // เรียงข้อมูลให้แถวล่าสุดอยู่บนสุด (reverse order)
      const reversedData = formatted.reverse();
      setData(reversedData);
      
      console.log('Formatted data length:', formatted.length);
    }
  }, [customerData, swrError]);

  const resetFilters = () => {
    setSearch('');
    setFilterMonth('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  const filteredData: TaxExpiryData[] = useMemo(() => data
    .filter(item => {
      // กรองตามการค้นหา
      const searchLower = search.toLowerCase();
      const matchesSearch = !search || 
        item.licensePlate.toLowerCase().includes(searchLower) ||
        item.customerName.toLowerCase().includes(searchLower) ||
        item.phone.includes(search);

      // กรองตามเดือน
      const expiryMonth = new Date(item.expiryDate).getMonth() + 1;
      const matchesMonth = !filterMonth || String(expiryMonth) === filterMonth;

      // กรองตามสถานะ
      const matchesStatus = !filterStatus || item.status === filterStatus;

      return matchesSearch && matchesMonth && matchesStatus;
    }), [data, search, filterMonth, filterStatus]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  // ใน pagination และการ slice ข้อมูล ให้รองรับ itemsPerPage = filteredData.length (all)
  const currentData = useMemo(() => itemsPerPage === filteredData.length ? filteredData : filteredData.slice(startIndex, endIndex), [filteredData, itemsPerPage, startIndex, endIndex]);

  const monthOptions = [
    { value: '', label: 'ทุกเดือน', color: '#6B7280' },
    { value: '1', label: 'มกราคม', color: '#EF4444' },
    { value: '2', label: 'กุมภาพันธ์', color: '#F97316' },
    { value: '3', label: 'มีนาคม', color: '#F59E0B' },
    { value: '4', label: 'เมษายน', color: '#10B981' },
    { value: '5', label: 'พฤษภาคม', color: '#06B6D4' },
    { value: '6', label: 'มิถุนายน', color: '#3B82F6' },
    { value: '7', label: 'กรกฎาคม', color: '#8B5CF6' },
    { value: '8', label: 'สิงหาคม', color: '#EC4899' },
    { value: '9', label: 'กันยายน', color: '#84CC16' },
    { value: '10', label: 'ตุลาคม', color: '#F59E0B' },
    { value: '11', label: 'พฤศจิกายน', color: '#EF4444' },
    { value: '12', label: 'ธันวาคม', color: '#6B7280' },
  ];

  const statusOptions = [
    { value: '', label: 'ทุกสถานะ', color: '#6B7280' },
    { value: 'ต่อภาษีแล้ว', label: 'ต่อภาษีแล้ว', color: '#10B981' },
    { value: 'กำลังจะครบกำหนด', label: 'กำลังจะครบกำหนด', color: '#F59E0B' },
    { value: 'ครบกำหนดวันนี้', label: 'ครบกำหนดวันนี้', color: '#EF4444' },
    { value: 'เกินกำหนด', label: 'เกินกำหนด', color: '#DC2626' },
    { value: 'รอดำเนินการ', label: 'รอดำเนินการ', color: '#6B7280' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                ภาษีครั้งถัดไป
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                รายการลูกค้าที่มีวันสิ้นอายุภาษีครั้งถัดไป
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/customer-info"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                กลับไปหน้าข้อมูลต่อภาษี
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
                <FontAwesomeIcon icon={faWarning} className="text-yellow-500 mr-2" />
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
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-orange-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">กำลังจะครบกำหนด</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {filteredData.filter(item => item.status === 'กำลังจะครบกำหนด').length}
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาทะเบียนรถ, ชื่อลูกค้า, เบอร์โทร"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            
            <FilterDropdown
              value={filterMonth}
              onChange={val => { setFilterMonth(val); setCurrentPage(1); }}
              icon={faCalendarAlt}
              placeholder="กรองตามเดือน"
              options={monthOptions}
            />
            
            <FilterDropdown
              value={filterStatus}
              onChange={val => { setFilterStatus(val); setCurrentPage(1); }}
              icon={faClock}
              placeholder="กรองตามสถานะ"
              options={statusOptions}
            />
            
            <FilterDropdown
              value={itemsPerPage === filteredData.length ? 'all' : itemsPerPage.toString()}
              onChange={val => {
                setItemsPerPage(val === 'all' ? filteredData.length : Number(val));
                setCurrentPage(1);
              }}
              icon={faInfoCircle}
              placeholder="จำนวนรายการ"
              options={[
                { value: '10', label: '10', color: '#6B7280' },
                { value: '20', label: '20', color: '#3B82F6' },
                { value: '30', label: '30', color: '#10B981' },
                { value: '40', label: '40', color: '#F59E0B' },
                { value: '50', label: '50', color: '#EF4444' },
                { value: 'all', label: 'ทั้งหมด', color: '#8B5CF6' },
              ]}
            />
            
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors w-full font-medium text-sm"
            >
              รีเซ็ต
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {isLoading ? (
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
          ) : swrError ? (
            <div className="p-8 text-center">
              <p className="text-red-500 mb-4">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
              <button
                onClick={refreshData}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ทะเบียนรถ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ชื่อลูกค้า
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        เบอร์โทร
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        วันที่ชำระล่าสุด
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ภาษีครั้งถัดไป
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        วันที่เหลือ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        สถานะ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                          ไม่พบข้อมูลภาษีครั้งถัดไป
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item, idx) => (
                        <TaxExpiryRow key={item.licensePlate + item.customerName + idx} item={item} />
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
                        แสดง <span className="font-medium">{startIndex + 1}</span> ถึง{' '}
                        <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span> จาก{' '}
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
    </div>
  );
} 