// src/app/customer-info/page.tsx
'use client';

import Link from 'next/link';
import React, { useState, useMemo, memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'; // สำคัญ: ต้อง Import IconDefinition
import { motion } from 'framer-motion';

import AnimatedPage, { itemVariants } from '../components/AnimatedPage';
import Modal from '../components/Modal';
import AddCustomerForm from '../components/AddCustomerForm';
import EditCustomerForm from '../components/EditCustomerForm';
import FilterDropdown from '../components/FilterDropdown';

// ⚡ ใช้ Custom Hook แทน SWR โดยตรง
import { useCustomerData, CustomerData } from '@/lib/useCustomerData';

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
  faEdit,
} from '@fortawesome/free-solid-svg-icons';
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
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);

  // ⚡ ใช้ Custom Hook แทน useSWR โดยตรง
  const { data, error, isLoading, mutate, refreshData } = useCustomerData();

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

  // สร้างตัวเลือกสำหรับ dropdown
  const monthOptions = [
    { value: '', label: 'ทุกเดือน', color: '#6B7280' },
    { value: '01', label: 'มกราคม', color: '#EF4444' },
    { value: '02', label: 'กุมภาพันธ์', color: '#F97316' },
    { value: '03', label: 'มีนาคม', color: '#F59E0B' },
    { value: '04', label: 'เมษายน', color: '#10B981' },
    { value: '05', label: 'พฤษภาคม', color: '#06B6D4' },
    { value: '06', label: 'มิถุนายน', color: '#3B82F6' },
    { value: '07', label: 'กรกฎาคม', color: '#8B5CF6' },
    { value: '08', label: 'สิงหาคม', color: '#EC4899' },
    { value: '09', label: 'กันยายน', color: '#84CC16' },
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
              {/* ใน filter UI ลบ SelectFilter ของวันออก */}
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
