// src/app/installment-insurance/page.tsx
'use client';

import React, { useState, useMemo, memo, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { motion } from 'framer-motion';

import AnimatedPage, { itemVariants } from '../components/AnimatedPage';
import Modal from '../components/Modal';
import AddInstallmentInsuranceForm from '../components/AddInstallmentInsuranceForm';
import EditInstallmentInsuranceForm from '../components/EditInstallmentInsuranceForm';
import FilterDropdown from '../components/FilterDropdown';
import LoadingSkeleton from '../components/LoadingSkeleton';
import RippleButton from '../components/RippleButton';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import Tooltip from '../components/Tooltip';

// ⚡ ใช้ Custom Hook
import { useInstallmentInsuranceData, InstallmentInsuranceData } from '@/lib/useInstallmentInsuranceData';
import { useDebounce } from '@/lib/useDebounce';

import {
  faSearch,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faChevronLeft,
  faChevronRight,
  faInfoCircle,
  faEdit,
  faTag,
  faStar,
  faMoneyBill,
  faBell,
  faChevronRight as faChevronRightIcon,
} from '@fortawesome/free-solid-svg-icons';

// Maps สำหรับสถานะและสี/ไอคอน
const statusColor: { [key: string]: string } = {
  'กำลังผ่อน': 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-white',
  'ผ่อนครบแล้ว': 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-white',
  'ยกเลิก': 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-white',
};

const statusIcon: { [key: string]: IconDefinition } = {
  'กำลังผ่อน': faClock,
  'ผ่อนครบแล้ว': faCheckCircle,
  'ยกเลิก': faTimesCircle,
};

function getPageNumbers(currentPage: number, totalPages: number, maxPages = 5) {
  const pages: (number | string)[] = [];
  
  if (totalPages <= maxPages + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  pages.push(1);
  
  if (currentPage > 3) {
    pages.push('...');
  }
  
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  if (currentPage < totalPages - 2) {
    pages.push('...');
  }
  
  if (totalPages > 1) {
    pages.push(totalPages);
  }
  
  return pages;
}

// ฟังก์ชันคำนวณวันที่หมดอายุของกรมธรรม์
function calculateExpiryDate(startDate: string, installmentCount: number): string | null {
  if (!startDate || !installmentCount) return null;
  
  try {
    const start = new Date(startDate);
    // เพิ่มจำนวนเดือนตาม installmentCount
    const expiryDate = new Date(start);
    expiryDate.setMonth(expiryDate.getMonth() + installmentCount);
    
    // แปลงเป็นรูปแบบ DD/MM/YYYY
    const dd = String(expiryDate.getDate()).padStart(2, '0');
    const mm = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const yyyy = expiryDate.getFullYear();
    
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return null;
  }
}

// ฟังก์ชันคำนวณวันเหลือจนถึงวันหมดอายุ
function calculateDaysUntilExpiry(expiryDateStr: string): number | null {
  if (!expiryDateStr) return null;
  
  try {
    // แปลงจาก DD/MM/YYYY เป็น Date
    const [dd, mm, yyyy] = expiryDateStr.split('/');
    const expiry = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    const timeDiff = expiry.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  } catch {
    return null;
  }
}

// Interface สำหรับข้อมูลแจ้งเตือน
interface RenewalNotification {
  licensePlate: string;
  customerName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  insuranceCompany: string;
  type: 'renewal' | 'payment'; // ประเภทแจ้งเตือน
  paymentDay?: number; // วันที่ต้องผ่อน (สำหรับ payment)
  installmentNumber?: number; // งวดที่ต้องผ่อน
  amount?: number; // จำนวนเงินที่ต้องผ่อน
}

// Type สำหรับ paidDates ที่รองรับทั้ง number และ string key
type PaidDates = { [key: number]: string } | { [key: string]: string } | Record<string | number, string>;

// ฟังก์ชันช่วยในการเข้าถึง paidDates
function getPaidDate(paidDates: PaidDates | undefined, key: number | string): string | undefined {
  if (!paidDates) return undefined;
  return (paidDates as Record<string | number, string>)[key] || (paidDates as Record<string | number, string>)[String(key)];
}

// ฟังก์ชันตรวจสอบว่าผ่อนครบแล้วหรือไม่
function isFullyPaid(paidDates?: PaidDates, installmentCount?: number): boolean {
  if (!installmentCount || installmentCount <= 0 || !paidDates) {
    return false;
  }
  
  // ตรวจสอบว่ามี paidDates ครบทุกงวดหรือไม่
  // รองรับทั้ง key เป็น number และ string
  for (let i = 1; i <= installmentCount; i++) {
    const paidDate = getPaidDate(paidDates, i);
    if (!paidDate || paidDate.trim() === '') {
      return false; // ยังมีงวดที่ยังไม่จ่าย
    }
  }
  
  return true; // จ่ายครบทุกงวดแล้ว
}

// ฟังก์ชันตรวจสอบว่าวันนี้เป็นวันที่ต้องผ่อนหรือไม่
function isPaymentDayToday(paymentDay: number, startDate: string, paidDates?: PaidDates, installmentCount?: number): { isToday: boolean; installmentNumber?: number; amount?: number; insurancePremium: number; installmentCount: number } {
  if (!paymentDay || !startDate) {
    return { isToday: false, insurancePremium: 0, installmentCount: 0 };
  }

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // ตรวจสอบว่าวันนี้ตรงกับ paymentDay หรือไม่
  // รองรับกรณีที่ paymentDay > วันที่ในเดือนนี้ (เช่น paymentDay = 31 แต่เดือนนี้มี 30 วัน)
  const isPaymentDay = currentDay === paymentDay || (currentDay === daysInCurrentMonth && paymentDay > daysInCurrentMonth);
  
  if (!isPaymentDay) {
    return { isToday: false, insurancePremium: 0, installmentCount: 0 };
  }

  // คำนวณงวดที่ควรจะผ่อนในเดือนนี้
  try {
    const start = new Date(startDate);
    const startDay = start.getDate();
    const startMonth = start.getMonth();
    const startYear = start.getFullYear();
    
    // คำนวณจำนวนเดือนที่ผ่านมา
    let monthsDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth);
    
    // ถ้าวันที่ปัจจุบันยังไม่ถึงวันที่เริ่มผ่อนในเดือนนี้ ให้ลดเดือนลง 1
    if (currentDay < startDay) {
      monthsDiff -= 1;
    }
    
    // งวดที่ควรจะผ่อน = monthsDiff + 1 (เริ่มจากงวดที่ 1)
    const expectedInstallment = monthsDiff + 1;
    
    // ตรวจสอบว่าผ่อนครบแล้วหรือยัง (ถ้า expectedInstallment > installmentCount แสดงว่าผ่อนครบแล้ว)
    if (installmentCount && expectedInstallment > installmentCount) {
      return { isToday: false, insurancePremium: 0, installmentCount: 0 };
    }
    
    // ตรวจสอบว่าผ่อนครบทุกงวดแล้วหรือไม่
    if (installmentCount && isFullyPaid(paidDates, installmentCount)) {
      return { isToday: false, insurancePremium: 0, installmentCount: 0 };
    }
    
    // ตรวจสอบว่าจ่ายงวดนี้ไปแล้วหรือยัง (รองรับทั้ง key เป็น number และ string)
    const isPaid = paidDates && getPaidDate(paidDates, expectedInstallment);
    
    if (!isPaid && expectedInstallment > 0) {
      return {
        isToday: true,
        installmentNumber: expectedInstallment,
        insurancePremium: 0, // จะคำนวณภายหลัง
        installmentCount: 0
      };
    }
  } catch {
    return { isToday: false, insurancePremium: 0, installmentCount: 0 };
  }

  return { isToday: false, insurancePremium: 0, installmentCount: 0 };
}

export default function InstallmentInsurancePage() {
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<InstallmentInsuranceData | null>(null);
  const [jumpToPage, setJumpToPage] = useState<string>('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isNotificationTooltipOpen, setIsNotificationTooltipOpen] = useState<boolean>(false);
  const notificationTooltipRef = React.useRef<HTMLDivElement>(null);

  // ⚡ ใช้ Custom Hook
  const { data, error, isLoading, refreshData } = useInstallmentInsuranceData();
  const toast = useToast();
  
  // ⚡ Debounce search
  const debouncedSearch = useDebounce(search, 300);

  // โหลด favorites จาก localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('installment-insurance-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // คำนวณรายการแจ้งเตือนกรมธรรม์ต่ออายุ และวันที่ต้องผ่อน
  const renewalNotifications = useMemo<RenewalNotification[]>(() => {
    const notifications: RenewalNotification[] = [];
    
    data.forEach(item => {
      // ข้ามรายการที่ผ่อนครบแล้ว (status = 'ผ่อนครบแล้ว' หรือจ่ายครบทุกงวดแล้ว)
      // ไม่แจ้งเตือนเลยถ้าผ่อนครบแล้ว
      const fullyPaid = isFullyPaid(item.paidDates, item.installmentCount);
      if (item.status === 'ผ่อนครบแล้ว' || fullyPaid) {
        return; // ข้ามรายการนี้ ไม่ต้องแจ้งเตือนเลย
      }
      
      // ตรวจสอบเฉพาะรายการที่ status เป็น 'กำลังผ่อน' และยังไม่ผ่อนครบ
      if (item.status === 'กำลังผ่อน') {
        // 1. ตรวจสอบว่าวันนี้เป็นวันที่ต้องผ่อนหรือไม่
        if (item.paymentDay && item.startDate) {
          const paymentCheck = isPaymentDayToday(
            item.paymentDay,
            item.startDate,
            item.paidDates,
            item.installmentCount
          );
          
          // ตรวจสอบอีกครั้งว่ายังไม่ผ่อนครบ (expectedInstallment <= installmentCount)
          // และตรวจสอบอีกครั้งว่ายังไม่ผ่อนครบทุกงวด
          if (paymentCheck.isToday && paymentCheck.installmentNumber && item.installmentCount) {
            if (paymentCheck.installmentNumber <= item.installmentCount) {
              // ตรวจสอบอีกครั้งว่ายังไม่ผ่อนครบทุกงวด
              const isFullyPaidCheck = isFullyPaid(item.paidDates, item.installmentCount);
              if (!isFullyPaidCheck) {
                // คำนวณจำนวนเงินที่ต้องผ่อน
                const defaultAmount = item.insurancePremium / item.installmentCount;
                const amount = item.installmentAmounts?.[paymentCheck.installmentNumber] || defaultAmount;
                
                notifications.push({
                  licensePlate: item.licensePlate,
                  customerName: item.customerName,
                  expiryDate: '',
                  daysUntilExpiry: 0,
                  insuranceCompany: item.insuranceCompany || '',
                  type: 'payment',
                  paymentDay: item.paymentDay,
                  installmentNumber: paymentCheck.installmentNumber,
                  amount: amount,
                });
              }
            }
          }
        }
        
        // 2. ตรวจสอบกรมธรรม์ใกล้หมดอายุ (สำหรับรายการที่ผ่อนครบแล้วด้วย)
        if (item.startDate && item.installmentCount) {
          const expiryDate = calculateExpiryDate(item.startDate, item.installmentCount);
          if (expiryDate) {
            const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);
            if (daysUntilExpiry !== null && daysUntilExpiry <= 5) {
              notifications.push({
                licensePlate: item.licensePlate,
                customerName: item.customerName,
                expiryDate: expiryDate,
                daysUntilExpiry: daysUntilExpiry,
                insuranceCompany: item.insuranceCompany || '',
                type: 'renewal',
              });
            }
          }
        }
      }
    });
    
    // เรียงลำดับ: payment มาก่อน, renewal ตามหลัง
    // และเรียงตามวันเหลือ (น้อยที่สุดก่อน)
    return notifications.sort((a, b) => {
      // payment มาก่อน renewal
      if (a.type === 'payment' && b.type === 'renewal') return -1;
      if (a.type === 'renewal' && b.type === 'payment') return 1;
      
      // ถ้าเป็นประเภทเดียวกัน เรียงตามวันเหลือ
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });
  }, [data]);

  // ปิด notification tooltip เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationTooltipRef.current && !notificationTooltipRef.current.contains(event.target as Node)) {
        setIsNotificationTooltipOpen(false);
      }
    }

    if (isNotificationTooltipOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationTooltipOpen]);

  // บันทึก favorites ลง localStorage
  const toggleFavorite = (licensePlate: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(licensePlate)) {
        newFavorites.delete(licensePlate);
      } else {
        newFavorites.add(licensePlate);
      }
      localStorage.setItem('installment-insurance-favorites', JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  };

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setJumpToPage('');
    }
  };

  const startIdx: number = (currentPage - 1) * itemsPerPage;

  const filteredData: InstallmentInsuranceData[] = useMemo(() => data
    .filter(item => {
      // กรองตามการค้นหา
      const searchLower = debouncedSearch.toLowerCase();
      const sequenceStr = item.sequenceNumber ? String(item.sequenceNumber).padStart(6, '0') : '';
      const matchSearch = !debouncedSearch || 
        item.licensePlate.toLowerCase().includes(searchLower) ||
        item.customerName.toLowerCase().includes(searchLower) ||
        item.phone.includes(debouncedSearch) ||
        sequenceStr.includes(debouncedSearch) ||
        item.insuranceCompany?.toLowerCase().includes(searchLower);
      
      // กรองตามสถานะ
      const matchStatus = !filterStatus || item.status === filterStatus;
      
      return matchSearch && matchStatus;
    }), [data, debouncedSearch, filterStatus]);

  const paginatedData: InstallmentInsuranceData[] = useMemo(() => 
    itemsPerPage === filteredData.length ? filteredData : filteredData.slice(startIdx, startIdx + itemsPerPage), 
    [filteredData, itemsPerPage, startIdx]
  );
  
  const totalPages: number = itemsPerPage === filteredData.length ? 1 : Math.ceil(filteredData.length / itemsPerPage);

  // Keyboard shortcuts สำหรับเปลี่ยนหน้า
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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

  const statusOptions = [
    { value: '', label: 'ทุกสถานะ', color: '#6B7280' },
    { value: 'กำลังผ่อน', label: 'กำลังผ่อน', color: '#3B82F6' },
    { value: 'ผ่อนครบแล้ว', label: 'ผ่อนครบแล้ว', color: '#10B981' },
    { value: 'ยกเลิก', label: 'ยกเลิก', color: '#EF4444' },
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
                  ข้อมูลผ่อนประกัน
                </motion.h1>
                <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-gray-600 dark:text-gray-400 mt-2">
                  รายการข้อมูลผ่อนประกันทั้งหมด
                </motion.p>
              </div>
              <div className="flex gap-2 items-center">
                {/* ไอคอนกระดิ่งพร้อม badge และวงกลมสีแดง + Tooltip */}
                {renewalNotifications.length > 0 && (
                  <div className="relative" ref={notificationTooltipRef}>
                    <button
                      onClick={() => setIsNotificationTooltipOpen(!isNotificationTooltipOpen)}
                      className="relative"
                    >
                      {/* วงกลมสีแดงรอบไอคอน */}
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-600 rounded-full"></div>
                      
                      <FontAwesomeIcon 
                        icon={faBell} 
                        className="text-2xl text-gray-700 dark:text-gray-300 relative z-10 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                      />
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-6 flex items-center justify-center px-1.5 shadow-lg border-2 border-white dark:border-gray-800">
                        {renewalNotifications.length > 99 ? '99+' : renewalNotifications.length}
                      </span>
                    </button>

                    {/* Notification Tooltip */}
                    {isNotificationTooltipOpen && (
                      <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden flex flex-col">
                        {/* Header - แถบส้ม */}
                        <div className="bg-orange-500 text-white px-4 py-3 rounded-t-lg flex-shrink-0">
                          <h2 className="text-base font-semibold">
                            การแจ้งเตือน - รายการที่ต้องติดตาม
                          </h2>
                        </div>
                        
                        {/* รายการแจ้งเตือน - Scrollable */}
                        <div className="overflow-y-auto flex-1">
                          <div className="p-3 space-y-2">
                            {renewalNotifications.slice(0, 10).map((notification, index) => (
                              <div 
                                key={`${notification.licensePlate}-${index}`}
                                className="flex items-center text-sm text-gray-800 dark:text-gray-200 py-2 px-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                                onClick={() => {
                                  setIsNotificationTooltipOpen(false);
                                  // ค้นหาและแสดงข้อมูลที่เกี่ยวข้อง
                                  const relatedItem = data.find(item => item.licensePlate === notification.licensePlate);
                                  if (relatedItem) {
                                    setSelectedData(relatedItem);
                                    setIsViewModalOpen(true);
                                  }
                                }}
                              >
                                <FontAwesomeIcon 
                                  icon={faChevronRightIcon} 
                                  className="text-gray-400 mr-2 text-xs flex-shrink-0"
                                />
                                <span className="flex-1">
                                  {notification.type === 'payment' ? (
                                    <>
                                      <span className="font-semibold text-red-600 dark:text-red-400">⚠️ ต้องผ่อนวันนี้:</span>{' '}
                                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                                        {notification.customerName}
                                      </span>
                                      {' '}งวดที่ {notification.installmentNumber}
                                      {notification.amount && (
                                        <span className="text-orange-600 dark:text-orange-400 font-semibold ml-2">
                                          ({notification.amount.toLocaleString()} บาท)
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-semibold">กรมธรรม์ต่ออายุ:</span>{' '}
                                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                                        {notification.customerName}
                                      </span>
                                      , หมดอายุวันที่{' '}
                                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                                        {notification.expiryDate}
                                      </span>
                                    </>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Footer - ลิงก์รายการอื่นๆ */}
                        {renewalNotifications.length > 10 && (
                          <div className="border-t border-gray-200 dark:border-gray-700 flex-shrink-0 p-3">
                            <button
                              onClick={() => {
                                setIsNotificationTooltipOpen(false);
                                setFilterStatus('');
                                setSearch('');
                                setCurrentPage(1);
                                window.scrollTo({ top: 600, behavior: 'smooth' });
                              }}
                              className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline w-full text-left py-1"
                            >
                              รายการอื่นๆ ({renewalNotifications.length - 10} รายการ)
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <RippleButton
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg"
                >
                  + เพิ่มข้อมูลผ่อนประกัน
                </RippleButton>
              </div>
            </div>

            {/* สถิติสรุป */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-emerald-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">รายการทั้งหมด</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredData.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faClock} className="text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">กำลังผ่อน</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredData.filter(item => item.status === 'กำลังผ่อน').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ผ่อนครบแล้ว</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredData.filter(item => item.status === 'ผ่อนครบแล้ว').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faMoneyBill} className="text-yellow-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ยอดเบี้ยรวม</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {filteredData.reduce((sum, item) => sum + (item.insurancePremium || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 mb-3 mx-3">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              <div className="relative md:col-span-3">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="ค้นหาเลขลำดับ, ทะเบียนรถ, ชื่อลูกค้า, เบอร์โทร, บริษัทประกัน"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
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
                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors w-full font-medium text-sm border border-emerald-100 dark:border-emerald-800"
              >
                รีเซ็ตฟิลเตอร์
              </button>
            </div>
          </div>

          {/* Data Display - Table for Desktop */}
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton variant="list" count={8} />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-500 mb-4">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
              <RippleButton
                onClick={refreshData}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg"
              >
                ลองใหม่
              </RippleButton>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mx-3 mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ลำดับ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ทะเบียนรถ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ชื่อลูกค้า</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">เบอร์โทร</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ประกัน</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">เบี้ยประกัน</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">วันที่เริ่มผ่อน</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">จำนวนที่ผ่อน</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">แท็ก</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สถานะ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                            ไม่พบข้อมูลที่ตรงกับตัวกรอง
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map((item, idx) => (
                          <InstallmentRow 
                            key={item.licensePlate + item.customerName + idx} 
                            item={item}
                            rowNumber={startIdx + idx + 1}
                            onView={(data) => {
                              setSelectedData(data);
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-4 mx-3 mt-3">
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
                        className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={handleJumpToPage}
                        className="px-3 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 transition-all"
                      >
                        ไป
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center mt-2">
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        «
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                      </button>
                      {getPageNumbers(currentPage, totalPages).map((page, idx) => (
                        typeof page === 'number' ? (
                          <button
                            key={`page-${page}`}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'z-10 bg-emerald-50 dark:bg-emerald-900 border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-300'
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
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        »
                      </button>
                    </nav>
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      💡 ใช้ ← → สำหรับเปลี่ยนหน้า | Home/End สำหรับหน้าแรก/สุดท้าย
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Modal สำหรับเพิ่มข้อมูล */}
      <Modal isOpen={isAddModalOpen}>
        <AddInstallmentInsuranceForm
          onSuccess={async () => { 
            setIsAddModalOpen(false);
            setCurrentPage(1);
            setSearch('');
            await refreshData(); // รอให้ refresh เสร็จ
            toast.success('✅ เพิ่มข้อมูลผ่อนประกันสำเร็จ!');
          }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Modal สำหรับแก้ไขข้อมูล */}
      <Modal isOpen={isEditModalOpen}>
        {selectedData && (
          <EditInstallmentInsuranceForm
            data={selectedData}
            onSuccess={async () => { 
              setIsEditModalOpen(false); 
              setSelectedData(null);
              setCurrentPage(1);
              await refreshData(); // รอให้ refresh เสร็จ
              toast.success('✅ แก้ไขข้อมูลผ่อนประกันสำเร็จ!');
            }}
            onCancel={() => { setIsEditModalOpen(false); setSelectedData(null); }}
          />
        )}
      </Modal>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

      {/* Modal สำหรับดูข้อมูลเต็ม */}
      <Modal isOpen={isViewModalOpen}>
        {selectedData && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full mx-auto border border-gray-200 dark:border-gray-700 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-6 md:p-8 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                ข้อมูลผ่อนประกัน
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
                  <div className="grid grid-cols-1 gap-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">ทะเบียนรถ</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{selectedData.licensePlate}</p>
                    </div>
                  </div>
                </div>

                {/* ส่วนข้อมูลลูกค้าและประกัน - รวมกัน */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-blue-500 rounded-full"></div>
                    ข้อมูลลูกค้าและประกัน
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/10 dark:to-blue-900/10 rounded-xl p-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">ชื่อ-นามสกุล</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{selectedData.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">เบอร์ติดต่อ</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedData.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">บริษัทประกัน</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedData.insuranceCompany}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">เบี้ยประกัน</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {selectedData.insurancePremium.toLocaleString()} บาท
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">วันที่เริ่มผ่อน</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {selectedData.startDate ? (() => {
                          try {
                            const date = new Date(selectedData.startDate);
                            const dd = String(date.getDate()).padStart(2, '0');
                            const mm = String(date.getMonth() + 1).padStart(2, '0');
                            const yyyy = date.getFullYear();
                            return `${dd}/${mm}/${yyyy}`;
                          } catch {
                            return selectedData.startDate;
                          }
                        })() : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">ผ่อนไปแล้ว</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {selectedData.paidDates ? Object.keys(selectedData.paidDates).length : 0} / {selectedData.installmentCount} งวด
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">ผ่อนทุกวันที่</p>
                      <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {selectedData.paymentDay || '-'} ของเดือน
                      </p>
                    </div>
                  </div>
                </div>

                {/* ตารางรายละเอียดการผ่อนชำระ */}
                {selectedData.startDate && selectedData.paymentDay && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></div>
                      รายละเอียดทุกงวด
                    </h3>
                    <div className="bg-pink-50 dark:bg-pink-900/10 rounded-xl p-4">
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-pink-100 dark:bg-pink-900/30">
                            <tr>
                              <th className="px-3 py-2 text-left font-bold text-gray-700 dark:text-gray-300">งวดที่</th>
                              <th className="px-3 py-2 text-right font-bold text-gray-700 dark:text-gray-300">จำนวนเงิน</th>
                              <th className="px-3 py-2 text-center font-bold text-gray-700 dark:text-gray-300">สถานะ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: selectedData.installmentCount }, (_, i) => i + 1).map(installmentNum => {
                              const isPaid = selectedData.paidDates && selectedData.paidDates[installmentNum];
                              const defaultAmount = selectedData.insurancePremium / selectedData.installmentCount;
                              const amount = selectedData.installmentAmounts?.[installmentNum] || defaultAmount;

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
                                  <td className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                                    {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {isPaid ? (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                                        <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                                        จ่ายแล้ว
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-400 text-white">
                                        <FontAwesomeIcon icon={faClock} className="mr-1" />
                                        รอชำระ
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ส่วนแท็กและสถานะ */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                    แท็กและสถานะ
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">แท็กบริการ</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedData.tags && selectedData.tags.length > 0 ? (
                          selectedData.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${
                                tag === 'ป.1' ? 'bg-emerald-500 text-white' :
                                tag === 'ป.2+' ? 'bg-green-500 text-white' :
                                tag === 'ป.3+' ? 'bg-orange-500 text-white' :
                                tag === 'ป.3' ? 'bg-blue-500 text-white' :
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
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[selectedData.status]}`}>
                        <FontAwesomeIcon icon={statusIcon[selectedData.status]} className="mr-1" />
                        {selectedData.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* หมายเหตุ */}
                {selectedData.note && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gradient-to-b from-gray-500 to-gray-600 rounded-full"></div>
                      หมายเหตุ
                    </h3>
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-lg p-4">
                      <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                        {selectedData.note}
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
                  setSelectedData(null);
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
const InstallmentRow = memo(function InstallmentRow({ 
  item,
  rowNumber,
  onView,
  isFavorite,
  onToggleFavorite
}: { 
  item: InstallmentInsuranceData;
  rowNumber: number;
  onView: (data: InstallmentInsuranceData) => void;
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
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {item.sequenceNumber ? String(item.sequenceNumber).padStart(6, '0') : String(rowNumber).padStart(6, '0')}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.licensePlate}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.customerName}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.phone}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.insuranceCompany}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
        {item.insurancePremium.toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {item.startDate ? (() => {
          try {
            const date = new Date(item.startDate);
            const dd = String(date.getDate()).padStart(2, '0');
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const yyyy = date.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
          } catch {
            return item.startDate;
          }
        })() : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
        <Tooltip 
          content={
            item.paymentDay 
              ? `ผ่อนทุกวันที่ ${item.paymentDay} ของเดือน | จ่ายไป ${(() => {
                  // คำนวณยอดที่จ่ายไปแล้วจริงๆ
                  let totalPaid = 0;
                  const defaultAmount = item.insurancePremium / item.installmentCount;
                  
                  if (item.paidDates) {
                    Object.keys(item.paidDates).forEach(key => {
                      const num = parseInt(key);
                      const amount = item.installmentAmounts?.[num] || defaultAmount;
                      totalPaid += amount;
                    });
                  }
                  
                  return totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                })()} บาท`
              : 'ไม่ได้ระบุวันที่ชำระ'
          }
          position="top"
        >
          <div className="inline-flex items-center gap-1 cursor-help">
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {item.paidDates ? Object.keys(item.paidDates).length : 0}
            </span>
            <span className="text-gray-500 dark:text-gray-500">/</span>
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              {item.installmentCount}
            </span>
            {item.paymentDay && (
              <span className="ml-1 text-emerald-500 dark:text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
            )}
          </div>
        </Tooltip>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-row flex-wrap gap-1">
          {item.tags && item.tags.length > 0 ? (
            item.tags.map((tag, index) => (
              <span 
                key={index}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                  tag === 'ป.1' ? 'bg-blue-500 text-white' :
                  tag === 'ป.2+' ? 'bg-green-500 text-white' :
                  tag === 'ป.3+' ? 'bg-orange-500 text-white' :
                  tag === 'ป.3' ? 'bg-indigo-500 text-white' :
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

