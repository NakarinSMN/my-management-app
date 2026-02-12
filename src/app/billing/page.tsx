// src/app/billing/page.tsx
'use client';

import Link from 'next/link';
import React, { useState, useMemo, memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { motion } from 'framer-motion';

import {
  faSearch,
  faCheckCircle,
  faExclamationTriangle,
  faClock,
  faChevronLeft,
  faChevronRight,
  faInfoCircle,
  faEye,
  faSync,
  faFileInvoice
} from '@fortawesome/free-solid-svg-icons';

// ⚡ ใช้ Custom Hook
import { useBillingData, BillingData } from '@/lib/useBillingData';

// Interfaces
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

interface BillItem {
  name?: string;
  description?: string;
  quantity?: number;
  price?: number;
  amount?: number;
}

// Maps สำหรับสถานะและสี/ไอคอน
const statusColor: { [key: string]: string } = {
  'ชำระแล้ว': 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-white',
  'รอชำระ': 'bg-yellow-200 dark:bg-yellow-600 text-yellow-800 dark:text-black',
  'ยกเลิก': 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-white',
  'รอดำเนินการ': 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-white',
};

const statusIcon: { [key: string]: IconDefinition } = {
  'ชำระแล้ว': faCheckCircle,
  'รอชำระ': faClock,
  'ยกเลิก': faExclamationTriangle,
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
        className="pl-8 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-neutral-700 text-black dark:text-white focus:outline-none w-full"
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

// ฟังก์ชันแสดงวันที่
function formatDate(dateStr: string) {
  if (!dateStr || typeof dateStr !== 'string') return '';

  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split('-');
      return `${dd}/${mm}/${yyyy}`;
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    } else {
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return dateStr;

      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();

      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error('Error formatting date:', dateStr, error);
    return dateStr;
  }
}

// ฟังก์ชันแปลงราคาเป็นรูปแบบเงิน
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function BillingPage() {
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedBill, setSelectedBill] = useState<BillingData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // ⚡ ใช้ Custom Hook พร้อม Cache
  const { data, error, isLoading, refreshData } = useBillingData();

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterCategory('');
    setCurrentPage(1);
  };

  const startIdx: number = (currentPage - 1) * itemsPerPage;

  const filteredData: BillingData[] = useMemo(() => data
    .filter(item => {
      const matchSearch =
        item.billNumber.toLowerCase().includes(search.toLowerCase()) ||
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.phone.includes(search);

      const matchStatus = !filterStatus || item.status === filterStatus;
      const matchCategory = !filterCategory || item.category === filterCategory;

      return matchSearch && matchStatus && matchCategory;
    }), [data, search, filterStatus, filterCategory]);

  const paginatedData: BillingData[] = useMemo(() =>
    itemsPerPage === filteredData.length
      ? filteredData
      : filteredData.slice(startIdx, startIdx + itemsPerPage),
    [filteredData, itemsPerPage, startIdx]
  );

  const totalPages: number = itemsPerPage === filteredData.length ? 1 : Math.ceil(filteredData.length / itemsPerPage);

  // สร้างตัวเลือกสำหรับ dropdown
  const statusOptions = Array.from(new Set(data.map(item => item.status))).filter(Boolean);
  const categoryOptions = Array.from(new Set(data.map(item => item.category))).filter(Boolean);

  // คำนวณสรุป
  const totalRevenue = filteredData.reduce((sum, item) => sum + (item.totalAmount || item.price), 0);
  const paidCount = filteredData.filter(item => item.status === 'ชำระแล้ว').length;
  const pendingCount = filteredData.filter(item => item.status === 'รอชำระ').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <motion.h1
                className="text-3xl font-bold text-gray-900 dark:text-white"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FontAwesomeIcon icon={faFileInvoice} className="mr-3" />
                รายการบิล
              </motion.h1>
              <motion.p
                className="text-gray-600 dark:text-gray-400 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                จัดการและติดตามบิลทั้งหมด
              </motion.p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshData}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium flex items-center gap-2"
                title="รีเฟรชข้อมูล"
              >
                <FontAwesomeIcon icon={faSync} className={isLoading ? 'animate-spin' : ''} />
                รีเฟรช
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                กลับหน้าหลัก
              </Link>
            </div>
          </div>

          {/* สถิติสรุป */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faFileInvoice} className="text-blue-500 mr-2 text-2xl" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">บิลทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredData.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2 text-2xl" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ชำระแล้ว</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{paidCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faClock} className="text-yellow-500 mr-2 text-2xl" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">รอชำระ</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="text-green-500 mr-2 text-2xl">฿</div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ยอดรวม</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - ไม่มีการกรองวันที่ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาเลขที่บิล, ชื่อลูกค้า, เบอร์โทร"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <SelectFilter
              value={filterStatus}
              onChange={val => { setFilterStatus(val); setCurrentPage(1); }}
              icon={faCheckCircle}
              placeholder="กรองตามสถานะ"
              options={statusOptions}
            />

            <SelectFilter
              value={filterCategory}
              onChange={val => { setFilterCategory(val); setCurrentPage(1); }}
              icon={faInfoCircle}
              placeholder="กรองตามหมวดหมู่"
              options={categoryOptions}
            />

            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors w-full font-semibold text-base"
            >
              รีเซ็ตตัวกรอง
            </button>
          </div>

          <div className="mt-4">
            <select
              className="py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-black dark:text-white focus:outline-none border border-gray-300 dark:border-gray-600"
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
          ) : error ? (
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">เลขที่บิล</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ลูกค้า</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">บริการ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">หมวดหมู่</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ราคา</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">วันที่</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สถานะ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                          ไม่พบข้อมูลที่ตรงกับตัวกรอง
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((item, idx) => (
                        <BillRow
                          key={item.billNumber + idx}
                          item={item}
                          onViewDetail={(bill) => {
                            setSelectedBill(bill);
                            setIsDetailModalOpen(true);
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
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
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

      {/* Modal แสดงรายละเอียดบิล */}
      {isDetailModalOpen && selectedBill && (
        <BillDetailModal
          bill={selectedBill}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedBill(null);
          }}
        />
      )}
    </div>
  );
}

// Table Row Component
const BillRow = memo(function BillRow({
  item,
  onViewDetail
}: {
  item: BillingData;
  onViewDetail: (bill: BillingData) => void;
}) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
        {item.billNumber}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        <div>
          <div className="font-medium">{item.customerName}</div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">{item.phone}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {item.service}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
          {item.category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
        ฿{formatCurrency(item.price)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {formatDate(item.date)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[item.status] || 'bg-gray-200 text-gray-800'}`}>
          <FontAwesomeIcon icon={statusIcon[item.status] || faClock} className="mr-1" />
          {item.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        <button
          onClick={() => onViewDetail(item)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <FontAwesomeIcon icon={faEye} className="mr-1" />
          ดูรายละเอียด
        </button>
      </td>
    </tr>
  );
});

// Modal Component สำหรับแสดงรายละเอียด
function BillDetailModal({ bill, onClose }: { bill: BillingData; onClose: () => void }) {
  let itemsData = { items: [] };

  if (bill?.items) {
    try {
      itemsData = typeof bill.items === 'string' ? JSON.parse(bill.items) : bill.items;
    } catch {
      itemsData = { items: [] };
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              รายละเอียดบิล #{bill.billNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* ข้อมูลลูกค้า */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">ข้อมูลลูกค้า</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ชื่อลูกค้า</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{bill.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">เบอร์ติดต่อ</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{bill.phone}</p>
                </div>
              </div>
            </div>

            {/* ข้อมูลบริการ */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">ข้อมูลบริการ</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">บริการ</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{bill.service}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">หมวดหมู่</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{bill.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">วันที่</p>
                  <p className="text-base font-medium text-gray-900 dark:text-white">{formatDate(bill.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">สถานะ</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[bill.status]}`}>
                    <FontAwesomeIcon icon={statusIcon[bill.status]} className="mr-1" />
                    {bill.status}
                  </span>
                </div>
              </div>
            </div>

            {/* รายการและยอดเงิน */}
            {itemsData && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">รายการและยอดเงิน</h3>
                {itemsData.items && Array.isArray(itemsData.items) && itemsData.items.length > 0 ? (
                  <div className="space-y-2">
                    {itemsData.items.map((item: BillItem, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.name || item.description}</p>
                          {item.quantity && <p className="text-sm text-gray-600 dark:text-gray-400">จำนวน: {item.quantity}</p>}
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ฿{formatCurrency(item.price || item.amount || 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{bill.items}</pre>
                  </div>
                )}
              </div>
            )}

            {/* สรุปยอดเงิน */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">ยอดรวมทั้งหมด</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ฿{formatCurrency(bill.totalAmount || bill.price)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


