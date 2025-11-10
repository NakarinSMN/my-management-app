// src/app/customer-info/page.tsx
'use client';

import Link from 'next/link';
import React, { useState, useMemo, memo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'; // สำคัญ: ต้อง Import IconDefinition
import { motion } from 'framer-motion';

import AnimatedPage, { itemVariants } from '../components/AnimatedPage';
import Modal from '../components/Modal';
import AddCustomerForm from '../components/AddCustomerForm';
import EditCustomerForm from '../components/EditCustomerForm';
import FilterDropdown from '../components/FilterDropdown';
import AdvancedFilterModal, { AdvancedFilters } from '../components/AdvancedFilterModal';
import CustomerCard from '../components/CustomerCard';

// ⚡ ใช้ Custom Hook แทน SWR โดยตรง
import { useCustomerData, CustomerData } from '@/lib/useCustomerData';
import { useDebounce } from '@/lib/useDebounce';

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
  faTag,
  faFilter,
  faStar,
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
  'กำลังจะครบกำหนด': 'bg-yellow-200 dark:bg-yellow-600 text-yellow-800 dark:text-white',
  'ครบกำหนดวันนี้': 'bg-orange-200 dark:bg-orange-700 text-orange-800 dark:text-white',
  'เกินกำหนด': 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-white',
  'รอดำเนินการ': 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-white',
};

const statusIcon: { [key: string]: IconDefinition } = {
  'ต่อภาษีแล้ว': faCheckCircle,
  'กำลังจะครบกำหนด': faExclamationTriangle,
  'ครบกำหนดวันนี้': faExclamationTriangle,
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
  const pages: (number | string)[] = [];
  
  if (totalPages <= maxPages + 2) {
    // แสดงทุกหน้าถ้าไม่เยอะมาก
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  // เสมอแสดงหน้าแรก
  pages.push(1);
  
  if (currentPage > 3) {
    pages.push('...');
  }
  
  // แสดงหน้าปัจจุบันและข้างเคียง
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  if (currentPage < totalPages - 2) {
    pages.push('...');
  }
  
  // เสมอแสดงหน้าสุดท้าย
  if (totalPages > 1) {
    pages.push(totalPages);
  }
  
  return pages;
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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [jumpToPage, setJumpToPage] = useState<string>('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    dateFrom: '',
    dateTo: '',
    selectedBrands: [],
    selectedVehicleTypes: []
  });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // ⚡ ใช้ Custom Hook แทน useSWR โดยตรง
  const { data, error, isLoading, refreshData } = useCustomerData();
  
  // ⚡ Debounce search เพื่อลด re-render
  const debouncedSearch = useDebounce(search, 300);

  // โหลด favorites จาก localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('customer-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // บันทึก favorites ลง localStorage
  const toggleFavorite = (licensePlate: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(licensePlate)) {
        newFavorites.delete(licensePlate);
      } else {
        newFavorites.add(licensePlate);
      }
      localStorage.setItem('customer-favorites', JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  };

  const resetFilters = () => {
    setSearch('');
    setFilterMonth('');
    setFilterStatus('');
    setCurrentPage(1); // เมื่อรีเซ็ตตัวกรอง ให้กลับไปหน้าแรก
  };
  
  const resetAllFilters = () => {
    resetFilters();
    setAdvancedFilters({
      dateFrom: '',
      dateTo: '',
      selectedBrands: [],
      selectedVehicleTypes: []
    });
  };

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setJumpToPage('');
    }
  };

  const startIdx: number = (currentPage - 1) * itemsPerPage;

  // ดึงรายการยี่ห้อและประเภทรถที่ไม่ซ้ำกัน
  const uniqueBrands = useMemo(() => {
    const brands = Array.from(new Set(data.map(item => item.brand || '').filter(Boolean)));
    return brands.sort();
  }, [data]);

  const uniqueVehicleTypes = useMemo(() => {
    const types = Array.from(new Set(data.map(item => item.vehicleType || '').filter(Boolean)));
    return types.sort();
  }, [data]);

  const filteredData: CustomerData[] = useMemo(() => data
    .filter(item => {
      const dateStr = formatDateFlexible(item.registerDate);
      const [dd, mm, yyyy] = dateStr.split('/');
      if (!dd || !mm || !yyyy) return false;
      
      // กรองตามการค้นหา (ใช้ debouncedSearch แทน search)
      const searchLower = debouncedSearch.toLowerCase();
      const sequenceStr = item.sequenceNumber ? String(item.sequenceNumber).padStart(6, '0') : '';
      const matchSearch = !debouncedSearch || 
        item.licensePlate.toLowerCase().includes(searchLower) ||
        item.customerName.toLowerCase().includes(searchLower) ||
        item.phone.includes(debouncedSearch) ||
        sequenceStr.includes(debouncedSearch);
      
      // กรองตามเดือน
      const matchMonth = !filterMonth || mm === filterMonth.padStart(2, '0');
      
      // กรองตามสถานะ
      const matchStatus = !filterStatus || item.status === filterStatus;
      
      // Advanced Filters
      // กรองตามช่วงวันที่
      let matchDateRange = true;
      if (advancedFilters.dateFrom || advancedFilters.dateTo) {
        const itemDate = new Date(yyyy + '-' + mm + '-' + dd);
        if (advancedFilters.dateFrom) {
          const fromDate = new Date(advancedFilters.dateFrom);
          matchDateRange = matchDateRange && itemDate >= fromDate;
        }
        if (advancedFilters.dateTo) {
          const toDate = new Date(advancedFilters.dateTo);
          matchDateRange = matchDateRange && itemDate <= toDate;
        }
      }
      
      // กรองตามยี่ห้อ
      const matchBrand = advancedFilters.selectedBrands.length === 0 || 
        advancedFilters.selectedBrands.includes(item.brand || '');
      
      // กรองตามประเภทรถ
      const matchVehicleType = advancedFilters.selectedVehicleTypes.length === 0 || 
        advancedFilters.selectedVehicleTypes.includes(item.vehicleType || '');
      
      return matchSearch && matchMonth && matchStatus && matchDateRange && matchBrand && matchVehicleType;
    }), [data, debouncedSearch, filterMonth, filterStatus, advancedFilters]);

  const paginatedData: CustomerData[] = useMemo(() => itemsPerPage === filteredData.length ? filteredData : filteredData.slice(startIdx, startIdx + itemsPerPage), [filteredData, itemsPerPage, startIdx]);
  const totalPages: number = itemsPerPage === filteredData.length ? 1 : Math.ceil(filteredData.length / itemsPerPage);

  // นับจำนวน active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.dateFrom) count++;
    if (advancedFilters.dateTo) count++;
    count += advancedFilters.selectedBrands.length;
    count += advancedFilters.selectedVehicleTypes.length;
    return count;
  }, [advancedFilters]);

  // Keyboard shortcuts สำหรับเปลี่ยนหน้า
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // ป้องกันไม่ให้ทำงานถ้ากำลังพิมพ์ใน input/textarea หรือเปิด modal
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        isAddModalOpen ||
        isEditModalOpen ||
        isViewModalOpen
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' && currentPage > 1) {
        e.preventDefault();
        setCurrentPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        e.preventDefault();
        setCurrentPage(currentPage + 1);
      } else if (e.key === 'Home' && currentPage !== 1) {
        e.preventDefault();
        setCurrentPage(1);
      } else if (e.key === 'End' && currentPage !== totalPages) {
        e.preventDefault();
        setCurrentPage(totalPages);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages, isAddModalOpen, isEditModalOpen, isViewModalOpen]);

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
      <motion.div variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full h-full">
          {/* Header */}
          <div className="mb-6 px-3 pt-3">
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + เพิ่มข้อมูลลูกค้า
                </button>
                <Link
                  href="/tax-expiry-next-year"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  ภาษีครั้งถัดไป
                </Link>
              </div>
            </div>

            {/* สถิติสรุป */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2 mb-3 mx-3">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              <div className="relative md:col-span-2">
                <FontAwesomeIcon icon={faSearch} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="ค้นหาเลขลำดับ, ทะเบียนรถ, ชื่อลูกค้า, เบอร์โทร"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-7 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
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
                onClick={resetAllFilters}
                className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors w-full font-medium text-xs"
              >
                รีเซ็ต
              </button>
            </div>
            
            {/* Advanced Filter Button & Active Filters */}
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={() => setShowAdvancedFilter(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium relative"
              >
                <FontAwesomeIcon icon={faFilter} />
                ตัวกรองขั้นสูง
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              
              {/* แสดง Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {advancedFilters.dateFrom && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs">
                      จาก: {advancedFilters.dateFrom}
                    </span>
                  )}
                  {advancedFilters.dateTo && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs">
                      ถึง: {advancedFilters.dateTo}
                    </span>
                  )}
                  {advancedFilters.selectedBrands.slice(0, 3).map(brand => (
                    <span key={brand} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md text-xs">
                      {brand}
                    </span>
                  ))}
                  {advancedFilters.selectedBrands.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md text-xs">
                      +{advancedFilters.selectedBrands.length - 3}
                    </span>
                  )}
                  {advancedFilters.selectedVehicleTypes.map(type => (
                    <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-xs">
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Data Display - Table for Desktop, Cards for Mobile */}
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
              {/* Mobile Card View */}
              <div className="md:hidden px-3 space-y-3 mb-4">
                {paginatedData.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    ไม่พบข้อมูลที่ตรงกับตัวกรอง
                  </div>
                ) : (
                  paginatedData.map((item, idx) => (
                    <CustomerCard
                      key={item.licensePlate + item.customerName + idx}
                      item={item}
                      rowNumber={startIdx + idx + 1}
                      onView={(customer) => {
                        setSelectedCustomer(customer);
                        setIsViewModalOpen(true);
                      }}
                      isFavorite={favorites.has(item.licensePlate)}
                      onToggleFavorite={toggleFavorite}
                      statusColor={statusColor}
                      statusIcon={statusIcon}
                      formatDate={formatDateFlexible}
                    />
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mx-3 mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ลำดับ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ทะเบียนรถ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ประเภท</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ยี่ห้อ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ชื่อลูกค้า</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">เบอร์โทร</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">วันที่ชำระล่าสุด</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">แท็ก</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สถานะ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                            ไม่พบข้อมูลที่ตรงกับตัวกรอง
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map((item, idx) => (
                          <CustomerRow 
                            key={item.licensePlate + item.customerName + idx} 
                            item={item}
                            rowNumber={startIdx + idx + 1}
                            onView={(customer) => {
                              setSelectedCustomer(customer);
                              setIsViewModalOpen(true);
                            }}
                            isFavorite={favorites.has(item.licensePlate)}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination - แสดงทั้ง Mobile และ Desktop */}
              {totalPages > 1 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-4 mx-3 mt-3">
                    {/* Mobile Pagination */}
                    <div className="flex flex-col gap-2 sm:hidden">
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                          ก่อนหน้า
                        </button>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          หน้า {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                        >
                          ถัดไป
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">ไปหน้า:</span>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={jumpToPage}
                          onChange={(e) => setJumpToPage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleJumpToPage()}
                          placeholder={currentPage.toString()}
                          className="w-14 px-2 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleJumpToPage}
                          className="px-2.5 py-0.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          ไป
                        </button>
                      </div>
                    </div>

                    {/* Desktop Pagination */}
                    <div className="hidden sm:flex sm:flex-col sm:gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-700 dark:text-gray-300">
                            แสดง <span className="font-medium">{startIdx + 1}</span> ถึง{' '}
                            <span className="font-medium">{Math.min(startIdx + itemsPerPage, filteredData.length)}</span> จาก{' '}
                            <span className="font-medium">{filteredData.length.toLocaleString()}</span> รายการ
                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                              (หน้า {currentPage} / {totalPages})
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400">ไปหน้า:</span>
                          <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={jumpToPage}
                            onChange={(e) => setJumpToPage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleJumpToPage()}
                            placeholder={currentPage.toString()}
                            className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleJumpToPage}
                            className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            ไป
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          {/* First Page Button */}
                          <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="หน้าแรก (Home)"
                          >
                            <span className="sr-only">หน้าแรก</span>
                            «
                          </button>
                          
                          {/* Previous Page Button */}
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="หน้าก่อนหน้า (←)"
                          >
                            <FontAwesomeIcon icon={faChevronLeft} />
                          </button>
                          
                          {/* Page Numbers */}
                          {getPageNumbers(currentPage, totalPages).map((page, idx) => (
                            typeof page === 'number' ? (
                              <button
                                key={`page-${page}`}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                }`}
                              >
                                {page}
                              </button>
                            ) : (
                              <span
                                key={`ellipsis-${idx}`}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                              >
                                {page}
                              </span>
                            )
                          ))}
                          
                          {/* Next Page Button */}
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="หน้าถัดไป (→)"
                          >
                            <FontAwesomeIcon icon={faChevronRight} />
                          </button>
                          
                          {/* Last Page Button */}
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="หน้าสุดท้าย (End)"
                          >
                            <span className="sr-only">หน้าสุดท้าย</span>
                            »
                          </button>
                        </nav>
                      </div>
                      {/* Keyboard Shortcuts Hint */}
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          💡 ใช้ ← → สำหรับเปลี่ยนหน้า | Home/End สำหรับหน้าแรก/สุดท้าย
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
      </motion.div>
      {/* Modal สำหรับเพิ่มข้อมูลลูกค้า */}
      <Modal isOpen={isAddModalOpen}>
        <AddCustomerForm
          onSuccess={() => { 
            setIsAddModalOpen(false);
            setCurrentPage(1); // กลับไปหน้าแรก
            setSearch(''); // เคลียร์การค้นหา
            refreshData(); // บังคับ refresh ข้อมูล
          }}
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
          onSuccess={() => { 
            setIsEditModalOpen(false); 
            setSelectedCustomer(null);
            setCurrentPage(1); // กลับไปหน้าแรก
            refreshData(); // บังคับ refresh ข้อมูล
          }}
          onCancel={() => { setIsEditModalOpen(false); setSelectedCustomer(null); }}
        />
      </Modal>

      {/* Modal สำหรับ Advanced Filter */}
      <AdvancedFilterModal
        isOpen={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        onApply={(filters) => {
          setAdvancedFilters(filters);
          setCurrentPage(1);
        }}
        brands={uniqueBrands}
        vehicleTypes={uniqueVehicleTypes}
        currentFilters={advancedFilters}
      />

      {/* Modal สำหรับดูข้อมูลเต็ม */}
      <Modal isOpen={isViewModalOpen}>
        {selectedCustomer && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-auto border border-gray-200 dark:border-gray-700 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-6 md:p-8 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                ข้อมูลลูกค้า
              </h2>
            </div>

            {/* ข้อมูลทั้งหมด - Scrollable */}
            <div className="overflow-y-auto px-6 md:px-8 py-4 flex-1">
              <div className="space-y-6">
              {/* ส่วนข้อมูลรถ */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                  ข้อมูลรถยนต์
                </h3>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">ทะเบียนรถ</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{selectedCustomer.licensePlate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">ยี่ห้อ / รุ่น</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedCustomer.brand || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">ประเภทรถ</p>
                    {selectedCustomer.vehicleType ? (
                      <span className="inline-flex px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-bold">
                        {selectedCustomer.vehicleType}
                      </span>
                    ) : (
                      <p className="text-sm text-gray-400">-</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ส่วนข้อมูลลูกค้า */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                  ข้อมูลลูกค้า
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">ชื่อ-นามสกุล</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{selectedCustomer.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">เบอร์ติดต่อ</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedCustomer.phone}</p>
                  </div>
                </div>
              </div>

              {/* ส่วนข้อมูลการบริการ */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
                  ข้อมูลการบริการ
                </h3>
                <div className="grid grid-cols-4 gap-4 bg-green-50 dark:bg-green-900/10 rounded-xl p-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">วันที่ชำระภาษีล่าสุด</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatDateFlexible(selectedCustomer.registerDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">วันที่ตรวจ</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {selectedCustomer.inspectionDate ? formatDateFlexible(selectedCustomer.inspectionDate) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">แท็กบริการ</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCustomer.tags && selectedCustomer.tags.length > 0 ? (
                        selectedCustomer.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${
                              tag === 'ภาษี' ? 'bg-blue-500 text-white' :
                              tag === 'ตรอ.' ? 'bg-green-500 text-white' :
                              tag === 'พรบ.' ? 'bg-orange-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}
                          >
                            <FontAwesomeIcon icon={faTag} className="text-[8px]" />
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">ไม่มีแท็ก</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">สถานะ</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[selectedCustomer.status]}`}>
                      <FontAwesomeIcon icon={statusIcon[selectedCustomer.status]} className="mr-1" />
                      {selectedCustomer.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* ส่วนข้อมูลระบบ */}
              {(selectedCustomer.createdAt || selectedCustomer.updatedAt) && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                    ข้อมูลการบันทึก
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4">
                    {selectedCustomer.createdAt && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">วันที่บันทึก</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          {new Date(selectedCustomer.createdAt).toLocaleString('th-TH')}
                        </p>
                      </div>
                    )}
                    {selectedCustomer.updatedAt && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">อัปเดตล่าสุด</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                          {new Date(selectedCustomer.updatedAt).toLocaleString('th-TH')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* หมายเหตุ */}
              {selectedCustomer.note && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full"></div>
                    หมายเหตุ
                  </h3>
                  <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-lg p-4">
                    <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                      {selectedCustomer.note}
                    </p>
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* ปุ่มจัดการ */}
            <div className="flex justify-between gap-3 p-6 md:px-8 md:py-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedCustomer(null);
                }}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-semibold text-sm"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 text-sm shadow-lg"
              >
                <FontAwesomeIcon icon={faEdit} />
                แก้ไขข้อมูล
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AnimatedPage>
  );
}

// Table Row Memoized
const CustomerRow = memo(function CustomerRow({ 
  item,
  rowNumber,
  onView,
  isFavorite,
  onToggleFavorite
}: { 
  item: CustomerData;
  rowNumber: number;
  onView: (customer: CustomerData) => void;
  isFavorite: boolean;
  onToggleFavorite: (licensePlate: string) => void;
}) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite(item.licensePlate)}
            className="text-yellow-500 hover:text-yellow-600 transition-colors"
            title={isFavorite ? "ลบออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
          >
            <FontAwesomeIcon icon={faStar} className={isFavorite ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'} />
          </button>
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {item.sequenceNumber ? String(item.sequenceNumber).padStart(6, '0') : String(rowNumber).padStart(6, '0')}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.licensePlate}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {item.vehicleType ? (
          <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md text-xs font-medium">
            {item.vehicleType}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.brand || '-'}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.customerName}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.phone}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDateFlexible(item.registerDate)}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-row flex-wrap gap-1">
          {item.tags && item.tags.length > 0 ? (
            item.tags.map((tag, index) => (
              <span 
                key={index}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                  tag === 'ภาษี' ? 'bg-blue-500 text-white' :
                  tag === 'ตรอ.' ? 'bg-green-500 text-white' :
                  tag === 'พรบ.' ? 'bg-orange-500 text-white' :
                  'bg-gray-500 text-white'
                }`}
              >
                <FontAwesomeIcon icon={faTag} className="text-[9px]" />
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[item.status]}`}>
          <FontAwesomeIcon icon={statusIcon[item.status]} className="mr-1" />
          {item.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <button
          onClick={() => onView(item)}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
        >
          <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
          ดูข้อมูล
        </button>
      </td>
    </tr>
  );
});
