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

import useSWR from 'swr';

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

// กำหนด Interface สำหรับข้อมูลดิบที่มาจาก Google Sheet API
interface RawTaxExpiryDataItem {
  'ทะเบียนรถ'?: string;
  'ชื่อลูกค้า'?: string;
  'เบอร์ติดต่อ'?: string | number;
  'วันที่ชำระภาษีล่าสุด'?: string;
  'ภาษีครั้งถัดไป'?: string; // คอลัมน์ J
  'สถานะ'?: string;
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

// ฟังก์ชันคำนวณจำนวนวันที่เหลือจากวันสิ้นอายุ
function calculateDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const timeDiff = expiry.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
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
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.lastTaxDate ? new Date(item.lastTaxDate).toLocaleDateString('th-TH') : '-'}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('th-TH') : '-'}</td>
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // URL ของ Google Apps Script API
  const GOOGLE_SHEET_CUSTOMER_API_URL: string = 'https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64svMYUFCSALwTEX4mYCHoDd6g/exec?getAll=1';

  const fetcher = (url: string) => fetch(url).then(res => res.json());

  const { data: swrData, error: swrError, mutate } = useSWR(GOOGLE_SHEET_CUSTOMER_API_URL, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useEffect(() => {
    if (swrData && swrData.data) {
      const formatted: TaxExpiryData[] = (swrData.data || [])
        .map((item: RawTaxExpiryDataItem) => {
          const expiryDate = item['ภาษีครั้งถัดไป'] || '';
          if (!expiryDate || expiryDate.split('-').length !== 3) {
            return null;
          }
          const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);
          const rawPhone: string = (item['เบอร์ติดต่อ'] || '').toString();
          const phone: string = rawPhone.startsWith('0') || rawPhone.length === 0 ? rawPhone : `0${rawPhone}`;
          let status = 'รอดำเนินการ';
          if (daysUntilExpiry < 0) {
            status = 'เกินกำหนด';
          } else if (daysUntilExpiry <= 30) {
            status = 'ใกล้ครบกำหนด';
          } else if (daysUntilExpiry <= 90) {
            status = 'กำลังจะครบกำหนด';
          }
          return {
            licensePlate: item['ทะเบียนรถ'] || '',
            customerName: item['ชื่อลูกค้า'] || '',
            phone,
            lastTaxDate: item['วันที่ชำระภาษีล่าสุด'] || '',
            expiryDate,
            daysUntilExpiry,
            status
          };
        })
        .filter((item: TaxExpiryData | null): item is TaxExpiryData => item !== null);
      setData(formatted);
      setError(null);
    } else if (swrError) {
      setError('ไม่สามารถโหลดข้อมูลได้: ' + swrError.message);
    }
    setLoading(false);
  }, [swrData, swrError]);

  useEffect(() => {
    if (swrData && swrData.data) {
      const formatted: TaxExpiryData[] = (swrData.data || [])
        .map((item: RawTaxExpiryDataItem) => {
          const expiryDate = item['ภาษีครั้งถัดไป'] || '';
          if (!expiryDate || expiryDate.split('-').length !== 3) {
            return null;
          }
          const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);
          const rawPhone: string = (item['เบอร์ติดต่อ'] || '').toString();
          const phone: string = rawPhone.startsWith('0') || rawPhone.length === 0 ? rawPhone : `0${rawPhone}`;
          let status = 'รอดำเนินการ';
          if (daysUntilExpiry < 0) {
            status = 'เกินกำหนด';
          } else if (daysUntilExpiry <= 30) {
            status = 'ใกล้ครบกำหนด';
          } else if (daysUntilExpiry <= 90) {
            status = 'กำลังจะครบกำหนด';
          }
          return {
            licensePlate: item['ทะเบียนรถ'] || '',
            customerName: item['ชื่อลูกค้า'] || '',
            phone,
            lastTaxDate: item['วันที่ชำระภาษีล่าสุด'] || '',
            expiryDate,
            daysUntilExpiry,
            status
          };
        })
        .filter((item: TaxExpiryData | null): item is TaxExpiryData => item !== null);
      setData(formatted);
      setError(null);
    } else if (swrError) {
      setError('ไม่สามารถโหลดข้อมูลได้: ' + swrError.message);
    }
    setLoading(false);
  }, [swrData, swrError]);

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

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][i]
  }));

  const statusOptions = ['รอดำเนินการ', 'กำลังจะครบกำหนด', 'ใกล้ครบกำหนด', 'เกินกำหนด', 'ต่อภาษีแล้ว'];

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
            <Link
              href="/customer-info"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              กลับไปหน้าข้อมูลต่อภาษี
            </Link>
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
            
            <SelectFilter
              value={filterMonth}
              onChange={setFilterMonth}
              icon={faCalendarAlt}
              placeholder="กรองตามเดือน"
              options={monthOptions.map(opt => opt.value)}
            />
            
            <SelectFilter
              value={filterStatus}
              onChange={setFilterStatus}
              icon={faClock}
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
                    {currentData.map((item, idx) => (
                      <TaxExpiryRow key={item.licensePlate + item.customerName + idx} item={item} />
                    ))}
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