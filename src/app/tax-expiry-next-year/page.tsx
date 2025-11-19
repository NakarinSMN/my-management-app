// src/app/tax-expiry-next-year/page.tsx
'use client';

import Link from 'next/link';
import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
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
  faInfoCircle,
  faBell,
  faCopy,
  faCheck,
  faTrash,
  faSync,
  faSpinner,
  faFilter,
  faStar,
  faTag,
  faSquareCheck,
  faSquare
} from '@fortawesome/free-solid-svg-icons';

// ⚡ ใช้ Custom Hook แทน useSWR
import { useCustomerData } from '@/lib/useCustomerData';
import { useDebounce } from '@/lib/useDebounce';
import FilterDropdown from '../components/FilterDropdown';
import { useDialog } from '../contexts/DialogContext';
import AdvancedFilterModal, { AdvancedFilters } from '../components/AdvancedFilterModal';
import TaxExpiryCard from '../components/TaxExpiryCard';

// กำหนด Interface สำหรับข้อมูลลูกค้าที่มีวันสิ้นอายุภาษีปีถัดไป
interface TaxExpiryData {
  sequenceNumber?: number;
  licensePlate: string;
  customerName: string;
  phone: string;
  lastTaxDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: string;
  brand?: string;
  vehicleType?: string;
  tags?: string[];
}

// Interface สำหรับสถานะการส่งข้อความ
interface NotificationStatus {
  [licensePlate: string]: {
    sent: boolean;
    sentAt: string;
  };
}


// Maps สำหรับสถานะและสี/ไอคอน
const statusColor: { [key: string]: string } = {
  'ต่อภาษีแล้ว': 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-white',
  'กำลังจะครบกำหนด': 'bg-yellow-200 dark:bg-yellow-600 text-yellow-800 dark:text-white',
  'ครบกำหนดวันนี้': 'bg-orange-200 dark:bg-orange-700 text-orange-800 dark:text-white',
  'เกินกำหนด': 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-white',
  'รอดำเนินการ': 'bg-emerald-200 dark:bg-emerald-700 text-emerald-800 dark:text-white',
};

const statusIcon: { [key: string]: IconDefinition } = {
  'ต่อภาษีแล้ว': faCheckCircle,
  'กำลังจะครบกำหนด': faExclamationTriangle,
  'ครบกำหนดวันนี้': faWarning,
  'เกินกำหนด': faTimesCircle,
  'รอดำเนินการ': faClock,
};

// ฟังก์ชันแปลงวันที่เป็นรูปแบบ DD/MM/YYYY (พ.ศ.)
function formatDate(dateStr: string, useBuddhistYear: boolean = true): string {
  if (!dateStr) return '-';
  
  try {
    // ถ้าเป็น YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split('-');
      const year = useBuddhistYear ? parseInt(yyyy) + 543 : parseInt(yyyy);
      return `${dd}/${mm}/${year}`;
    }
    // ถ้าเป็น DD/MM/YYYY อยู่แล้ว
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      if (useBuddhistYear) {
        const [dd, mm, yyyy] = dateStr.split('/');
        // ตรวจสอบว่าเป็น ค.ศ. หรือ พ.ศ. อยู่แล้ว
        const year = parseInt(yyyy);
        if (year < 2500) {
          // ถ้าเป็น ค.ศ. ให้บวก 543
          return `${dd}/${mm}/${year + 543}`;
        }
      }
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
      const year = useBuddhistYear ? dateObj.getFullYear() + 543 : dateObj.getFullYear();
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

// ฟังก์ชันตรวจสอบเบอร์โทรศัพท์ที่ถูกต้อง
function isValidPhone(phone: string | undefined): boolean {
  if (!phone) return false;
  
  const trimmedPhone = phone.trim();
  
  // ตรวจสอบว่าไม่ใช่ string ว่าง
  if (trimmedPhone.length === 0) return false;
  
  // ตรวจสอบว่าไม่ใช่ "0" หรือชุดเลข 0 เท่านั้น (เช่น "00", "000", "0000")
  if (/^0+$/.test(trimmedPhone)) return false;
  
  // ตรวจสอบว่าเป็นตัวเลขเท่านั้น (อนุญาตให้มี -, (), หรือช่องว่าง)
  const digitsOnly = trimmedPhone.replace(/[\s\-\(\)]/g, '');
  if (!/^\d+$/.test(digitsOnly)) return false;
  
  // ตรวจสอบความยาวของตัวเลข (เบอร์โทรควรมีอย่างน้อย 6 หลัก และไม่เกิน 15 หลัก)
  // กรองเบอร์ที่สั้นเกินไปหรือยาวเกินไป
  if (digitsOnly.length < 6 || digitsOnly.length > 15) return false;
  
  return true;
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

// Component สำหรับแสดงรายการแจ้งเตือนใน modal
const NotificationItemCard = memo(function NotificationItemCard({
  item,
  idx,
  isSelectionMode,
  isSelected,
  isCopied,
  hasCopied,
  isSending,
  copiedPhoneIds,
  onToggleSelection,
  onCopyPhone,
  onCopyMessage,
  onMarkAsSent,
  onDelete,
  formatDate
}: {
  item: TaxExpiryData;
  idx: number;
  isSelectionMode: boolean;
  isSelected: boolean;
  isCopied: boolean;
  hasCopied: boolean;
  isSending: boolean;
  copiedPhoneIds: Set<string>;
  onToggleSelection: (licensePlate: string) => void;
  onCopyPhone: (phone: string, licensePlate: string) => void;
  onCopyMessage: (item: TaxExpiryData) => void;
  onMarkAsSent: (licensePlate: string) => void;
  onDelete: (licensePlate: string) => void;
  formatDate: (dateStr: string, useBuddhistYear?: boolean) => string;
}) {
  const isPhoneCopied = copiedPhoneIds.has(item.licensePlate);
  
  const checkboxStyle = useMemo(() => ({
    backgroundColor: isSelected ? '#10b981' : 'transparent',
    borderColor: isSelected ? '#10b981' : '#9ca3af'
  }), [isSelected]);

  return (
    <div
      key={item.licensePlate + idx}
      className="border-2 rounded-xl p-5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="flex items-start gap-4">
        {/* Checkbox (แสดงเฉพาะเมื่ออยู่ในโหมดเลือก) และเลขลำดับ */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          {isSelectionMode && (
            <button
              onClick={() => onToggleSelection(item.licensePlate)}
              className="w-6 h-6 flex items-center justify-center rounded border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              style={checkboxStyle}
              title={isSelected ? 'ยกเลิกเลือก' : 'เลือก'}
            >
              {isSelected && (
                <FontAwesomeIcon icon={faCheck} className="text-white text-xs" />
              )}
            </button>
          )}
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 text-white flex items-center justify-center font-bold text-sm shadow-lg ${isSelectionMode ? 'mt-0' : ''}`}>
            {item.sequenceNumber ? String(item.sequenceNumber).padStart(6, '0') : String(idx + 1).padStart(6, '0')}
          </div>
        </div>
        
        {/* ข้อมูล */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
              item.daysUntilExpiry < 0
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                : item.daysUntilExpiry === 0
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white animate-pulse'
                : item.daysUntilExpiry <= 30
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900'
                : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
            }`}>
              {item.daysUntilExpiry < 0
                ? `⚠️ เกินกำหนด ${Math.abs(item.daysUntilExpiry)} วัน`
                : item.daysUntilExpiry === 0
                ? '🔥 ครบกำหนดวันนี้'
                : item.daysUntilExpiry <= 30
                ? `⏰ เหลือ ${item.daysUntilExpiry} วัน`
                : `📅 เหลือ ${item.daysUntilExpiry} วัน`
              }
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <p className="text-gray-900 dark:text-white">
                <span className="font-semibold text-gray-600 dark:text-gray-400">ทะเบียน:</span> 
                <span className="ml-2 font-bold">{item.licensePlate}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <p className="text-gray-900 dark:text-white">
                <span className="font-semibold text-gray-600 dark:text-gray-400">ชื่อ:</span> 
                <span className="ml-2">{item.customerName}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <p className="text-gray-900 dark:text-white">
                <span className="font-semibold text-gray-600 dark:text-gray-400">เบอร์:</span> 
                <span className="ml-2">{item.phone}</span>
              </p>
              <button
                onClick={() => onCopyPhone(item.phone, item.licensePlate)}
                className="ml-1 px-2 py-1 rounded-md text-xs font-medium transition-all hover:scale-105 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                title="คัดลอกเบอร์โทร"
              >
                <FontAwesomeIcon 
                  icon={isPhoneCopied ? faCheck : faCopy} 
                  className="text-xs" 
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <p className="text-gray-900 dark:text-white">
                <span className="font-semibold text-gray-600 dark:text-gray-400">ครบกำหนด:</span> 
                <span className="ml-2 font-bold text-orange-600 dark:text-orange-400">{formatDate(item.expiryDate)}</span>
              </p>
            </div>
            {item.tags && item.tags.length > 0 && (
              <div className="flex items-start gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5"></div>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex}
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
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* ปุ่มต่างๆ */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          {/* ปุ่มคัดลอก */}
          <button
            onClick={() => onCopyMessage(item)}
            className={`px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-semibold min-w-[140px] transform hover:scale-105 ${
              isCopied
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50 animate-pulse'
                : hasCopied
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-md hover:shadow-lg'
            }`}
          >
            <FontAwesomeIcon icon={isCopied || hasCopied ? faCheck : faCopy} className="text-lg" />
            {isCopied ? 'คัดลอกแล้ว!' : hasCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}
          </button>
          
          {/* ปุ่มส่งแล้ว */}
          <button
            onClick={() => onMarkAsSent(item.licensePlate)}
            disabled={!hasCopied || isSending}
            className={`px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-semibold min-w-[140px] transform ${
              isSending
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white cursor-wait'
                : hasCopied
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg hover:scale-105'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-60'
            }`}
            title={
              isSending 
                ? 'กำลังบันทึก...' 
                : !hasCopied 
                ? 'กรุณาคัดลอกข้อความก่อน' 
                : 'ทำเครื่องหมายว่าส่งแล้ว'
            }
          >
            <FontAwesomeIcon 
              icon={isSending ? faSpinner : faCheck} 
              className={`text-lg ${isSending ? 'animate-spin' : ''}`} 
            />
            {isSending ? 'กำลังส่ง...' : 'ส่งแล้ว'}
          </button>

          {/* ปุ่มลบ */}
          <button
            onClick={() => onDelete(item.licensePlate)}
            disabled={isSending}
            className="px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-semibold min-w-[140px] transform hover:scale-105 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title="ลบรายการนี้ออกจากรายการแจ้งเตือน"
          >
            <FontAwesomeIcon icon={faTrash} className="text-lg" />
            ลบ
          </button>
        </div>
      </div>
    </div>
  );
});

const TaxExpiryRow = memo(function TaxExpiryRow({ 
  item,
  rowNumber,
  notificationStatus,
  isFavorite,
  onToggleFavorite
}: { 
  item: TaxExpiryData;
  rowNumber: number;
  notificationStatus: NotificationStatus;
  isFavorite: boolean;
  onToggleFavorite: (licensePlate: string) => void;
}) {
  const isSent = notificationStatus[item.licensePlate]?.sent || false;
  const sentAt = notificationStatus[item.licensePlate]?.sentAt;
  
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
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(item.lastTaxDate)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(item.expiryDate)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
      <td className="px-6 py-4 whitespace-nowrap">
        {isSent ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
            <FontAwesomeIcon icon={faCheck} className="mr-1" />
            ส่งแล้ว
            {sentAt && (
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                ({new Date(sentAt).toLocaleDateString('th-TH', { 
                  day: '2-digit', 
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })})
              </span>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            <FontAwesomeIcon icon={faClock} className="mr-1" />
            ยังไม่ส่ง
          </span>
        )}
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
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>({});
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string>('');
  const [copiedPhoneIds, setCopiedPhoneIds] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [dailySnapshotList, setDailySnapshotList] = useState<string[]>([]);
  const [isLoadingDaily, setIsLoadingDaily] = useState<boolean>(false);
  const [sendingLicensePlates, setSendingLicensePlates] = useState<Set<string>>(new Set());
  const [showSentHistoryModal, setShowSentHistoryModal] = useState<boolean>(false);
  const [isClearingBoard, setIsClearingBoard] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [jumpToPage, setJumpToPage] = useState<string>('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    dateFrom: '',
    dateTo: '',
    selectedBrands: [],
    selectedVehicleTypes: []
  });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // ⚡ ใช้ Custom Hook พร้อม Cache
  const { data: customerData, error: swrError, isLoading, refreshData } = useCustomerData();

  // ⚡ ใช้ Dialog Hook
  const { showSuccess, showError, showConfirm } = useDialog();
  
  // ⚡ Debounce search เพื่อลด re-render
  const debouncedSearch = useDebounce(search, 300);

  // โหลด favorites จาก localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('tax-expiry-favorites');
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
      localStorage.setItem('tax-expiry-favorites', JSON.stringify(Array.from(newFavorites)));
      return newFavorites;
    });
  };

  // โหลดสถานะการส่งข้อความจาก MongoDB
  const loadNotificationStatus = async () => {
    try {
      const response = await fetch('/api/notification-status');
      const result = await response.json();
      
      if (result.success && result.data) {
        setNotificationStatus(result.data);
        console.log('✅ Loaded notification status from MongoDB');
      }
    } catch (error) {
      console.error('❌ Error loading notification status:', error);
    }
  };

  useEffect(() => {
    loadNotificationStatus();
  }, []);

  // ฟังก์ชันล้างกระดานแจ้งเตือนวันนี้
  const clearDailyBoard = () => {
    showConfirm(
      'ล้างกระดานแจ้งเตือน',
      'ต้องการล้างกระดานแจ้งเตือนวันนี้ใช่หรือไม่?\n\nรายการทั้งหมดจะถูกลบออก (ไม่สร้างรายการใหม่)',
      async () => {
        try {
          setIsClearingBoard(true);

          // ลบรายการของวันนี้
          const deleteResponse = await fetch('/api/daily-notifications/delete-all', {
            method: 'DELETE'
          });

          const deleteResult = await deleteResponse.json();

          if (deleteResult.success) {
            // ล้าง dailySnapshotList
            setDailySnapshotList([]);
            
            // ล้าง copiedIds
            setCopiedIds(new Set());

            showSuccess(
              'ล้างกระดานสำเร็จ!',
              `ลบรายการทั้งหมดแล้ว (${deleteResult.deletedCount || 0} รายการ)\n\nกระดานว่างเปล่าแล้ว รายการใหม่จะถูกสร้างในวันถัดไป`,
              () => setShowNotificationModal(false)
            );
          } else {
            showError(
              'เกิดข้อผิดพลาด',
              `ไม่สามารถล้างกระดานได้\n\n${deleteResult.error || 'Unknown error'}`
            );
          }
      } catch (error) {
          console.error('Error clearing daily board:', error);
          showError(
            'เกิดข้อผิดพลาด',
            'เกิดข้อผิดพลาดในการล้างกระดาน กรุณาลองใหม่อีกครั้ง'
          );
        } finally {
          setIsClearingBoard(false);
        }
      }
    );
  };

  // โหลดรายการแจ้งเตือนของวันนี้จาก MongoDB
  const loadDailyNotifications = async () => {
    try {
      setIsLoadingDaily(true);
      const response = await fetch('/api/daily-notifications');
      const result = await response.json();
      
      if (result.success && result.data) {
        // ใช้รายการที่มีอยู่แล้วในวันนี้
        setDailySnapshotList(result.data.licensePlates || []);
        console.log('Loaded daily notifications:', result.data.licensePlates?.length);
      } else {
        // ถ้าไม่มีรายการของวันนี้ ให้เซ็ตเป็น array ว่าง (ไม่สร้างใหม่อัตโนมัติ)
        setDailySnapshotList([]);
        console.log('No daily notifications found for today');
      }
    } catch (error) {
      console.error('Error loading daily notifications:', error);
    } finally {
      setIsLoadingDaily(false);
    }
  };

  // สร้างรายการแจ้งเตือนใหม่สำหรับวันนี้ (Manual)
  const createNewDailyNotifications = () => {
    showConfirm(
      'สร้างรายการใหม่',
      'ต้องการสร้างรายการแจ้งเตือนใหม่ 50 คันใช่หรือไม่?\n\n(รายการเก่าจะถูกแทนที่)',
      async () => {
        try {
          setIsCreatingNew(true);
          
          // ลบรายการเก่าก่อน (ถ้ามี)
    if (dailySnapshotList.length > 0) {
            await fetch('/api/daily-notifications/delete-all', {
              method: 'DELETE'
            });
          }

          // สร้างรายการใหม่ (force = true เพื่อบังคับสร้างแม้จะมีรายการอยู่)
          await createDailyNotifications(true);
          
          // โหลดรายการใหม่
          await loadDailyNotifications();
          
          showSuccess(
            'สร้างรายการสำเร็จ!',
            'สร้างรายการแจ้งเตือนใหม่ 50 คันสำเร็จ'
          );
        } catch (error) {
          console.error('Error creating new notifications:', error);
          showError(
            'เกิดข้อผิดพลาด',
            'เกิดข้อผิดพลาดในการสร้างรายการใหม่'
          );
        } finally {
          setIsCreatingNew(false);
        }
      }
    );
  };

  // สร้างรายการแจ้งเตือนใหม่สำหรับวันนี้
  const createDailyNotifications = async (force = false) => {
    // ป้องกันการสร้างซ้ำ - ถ้ามีรายการอยู่แล้วไม่ต้องสร้างใหม่ (ยกเว้น force = true)
    if (!force && dailySnapshotList.length > 0) {
      console.log('Daily notifications already exist:', dailySnapshotList.length);
      return;
    }

    try {
      // เงื่อนไข: เอารถที่เหลือ <= 90 วัน มาทั้งหมด (รวมทั้งรถที่เกินกำหนดแล้วด้วย) และต้องมีเบอร์โทรศัพท์ที่ถูกต้อง
      const urgentItems = data
        .filter(item => {
          // ตรวจสอบว่าเบอร์โทรศัพท์ถูกต้อง (ไม่ใช่ "0" หรือรูปแบบไม่ถูกต้อง)
          if (!isValidPhone(item.phone)) return false;
          
          return item.daysUntilExpiry <= 90 && !notificationStatus[item.licensePlate]?.sent;
        })
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry) // เรียงจากน้อยไปมาก (รถเกินกำหนดมาก่อน เช่น -120, -90, -30, 0, 30, 60, 90)
        .slice(0, 50); // จำกัดแค่ 50 คัน
      
      const licensePlates = urgentItems.map(item => item.licensePlate);
      
      // ป้องกันการสร้างรายการว่าง
      if (licensePlates.length === 0) {
        console.log('No urgent items to create notifications');
        setDailySnapshotList([]);
        return;
      }

      const overdueCount = urgentItems.filter(item => item.daysUntilExpiry < 0).length;
      const upcomingCount = urgentItems.filter(item => item.daysUntilExpiry >= 0).length;
      console.log(`📋 Creating notifications: ${overdueCount} overdue + ${upcomingCount} upcoming = ${licensePlates.length} total`);

      const response = await fetch('/api/daily-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licensePlates })
      });
      
      const result = await response.json();
      if (result.success) {
        setDailySnapshotList(licensePlates);
        console.log('✅ Created daily notifications:', licensePlates.length);
      }
    } catch (error) {
      console.error('❌ Error creating daily notifications:', error);
    }
  };

  // โหลดรายการแจ้งเตือนเมื่อเปิดหน้าครั้งแรก
  useEffect(() => {
    if (data.length > 0 && dailySnapshotList.length === 0) {
      loadDailyNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  // ฟังก์ชันบันทึกสถานะการส่งข้อความลง MongoDB
  const saveNotificationStatus = useCallback(async (licensePlate: string, sent: boolean, sentAt: string) => {
    try {
      const response = await fetch('/api/notification-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licensePlate, sent, sentAt })
      });
      
      const result = await response.json();
      if (result.success) {
        // อัปเดต local state
        setNotificationStatus(prev => ({
          ...prev,
          [licensePlate]: { sent, sentAt }
        }));
        console.log('✅ Notification status saved to MongoDB');
      }
    } catch (error) {
      console.error('❌ Error saving notification status:', error);
      throw error;
    }
  }, []);

  // ฟังก์ชันสร้างข้อความแจ้งเตือน
  const generateNotificationMessage = useCallback((item: TaxExpiryData): string => {
    const messageType = item.daysUntilExpiry < 0 
      ? '🚨 เกินกำหนด! ภาษีรถหมดอายุแล้ว'
      : item.daysUntilExpiry === 0
      ? '🔔 ด่วน! ภาษีรถจะหมดอายุวันนี้'
      : `🔔 แจ้งเตือน! ภาษีรถจะหมดอายุในอีก ${item.daysUntilExpiry} วัน`;

    return `${messageType}

ทะเบียน: ${item.licensePlate}
ชื่อเจ้าของ: ${item.customerName}

ครบกำหนดชำระ: ${formatDate(item.expiryDate)}
กรุณารีบต่อภาษี เพื่อเลี่ยงค่าปรับ

ติดต่อสอบถามโทร 095-841-0423 หรือแอดไลน์ด้วยเบอร์โทรนี้
ตรอ.บังรีท่าอิฐ`;
  }, []);

  // ฟังก์ชันคัดลอกเบอร์โทร
  const copyPhoneToClipboard = useCallback(async (phone: string, licensePlate: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhoneIds(prev => new Set([...prev, licensePlate]));
      setTimeout(() => {
        setCopiedPhoneIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(licensePlate);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy phone:', error);
      showError(
        'คัดลอกไม่สำเร็จ',
        'ไม่สามารถคัดลอกเบอร์โทรได้ กรุณาลองใหม่อีกครั้ง'
      );
    }
  }, [showError]);

  // ฟังก์ชันคัดลอกข้อความ
  const copyToClipboard = useCallback(async (item: TaxExpiryData) => {
    const message = generateNotificationMessage(item);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(item.licensePlate);
      // เพิ่มเข้าใน Set ของคันที่คัดลอกแล้ว
      setCopiedIds(prev => new Set([...prev, item.licensePlate]));
      setTimeout(() => setCopiedId(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      showError(
        'คัดลอกไม่สำเร็จ',
        'ไม่สามารถคัดลอกข้อความได้ กรุณาลองใหม่อีกครั้ง'
      );
    }
  }, [showError, generateNotificationMessage]);

  // ฟังก์ชันเลือก/ยกเลิกเลือกรายการ
  const toggleSelection = useCallback((licensePlate: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(licensePlate)) {
        newSet.delete(licensePlate);
      } else {
        newSet.add(licensePlate);
      }
      return newSet;
    });
  }, []);

  // ฟังก์ชันเริ่มโหมดเลือก
  const startSelectionMode = () => {
    setIsSelectionMode(true);
    setSelectedItems(new Set());
  };

  // ฟังก์ชันยืนยันการเลือก
  const confirmSelection = () => {
    if (selectedItems.size === 0) {
      showError(
        'ไม่มีรายการที่เลือก',
        'กรุณาเลือกรายการที่ต้องการลบก่อน'
      );
      return;
    }
    setIsSelectionMode(false);
  };

  // ฟังก์ชันยกเลิกการเลือก
  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedItems(new Set());
  };

  // ฟังก์ชันเลือกทั้งหมด/ยกเลิกทั้งหมด
  const toggleSelectAll = () => {
    if (selectedItems.size === notificationList.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(notificationList.map(item => item.licensePlate)));
    }
  };

  // ฟังก์ชันลบหลายรายการพร้อมกัน
  const deleteMultipleNotifications = async () => {
    if (selectedItems.size === 0) {
      showError(
        'ไม่มีรายการที่เลือก',
        'กรุณาเลือกรายการที่ต้องการลบก่อน'
      );
      return;
    }

    const selectedArray = Array.from(selectedItems);
    showConfirm(
      'ลบหลายรายการ',
      `ต้องการลบ ${selectedItems.size} รายการออกจากรายการแจ้งเตือนใช่หรือไม่?\n\n${selectedArray.slice(0, 5).join(', ')}${selectedArray.length > 5 ? ` และอีก ${selectedArray.length - 5} รายการ` : ''}`,
      async () => {
        try {
          // ลบแต่ละรายการจาก MongoDB
          const deletePromises = selectedArray.map(async (licensePlate) => {
            const response = await fetch('/api/daily-notifications', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ licensePlate })
            });
            if (!response.ok) {
              throw new Error(`Failed to delete ${licensePlate}`);
            }
          });

          await Promise.all(deletePromises);
          
          // ลบออกจาก dailySnapshotList
          setDailySnapshotList(prev => prev.filter(plate => !selectedItems.has(plate)));
          
          // ลบออกจาก copiedIds และ copiedPhoneIds
          selectedArray.forEach(licensePlate => {
            setCopiedIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(licensePlate);
              return newSet;
            });
            setCopiedPhoneIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(licensePlate);
              return newSet;
            });
          });
          
          // ล้าง selectedItems และออกจากโหมดเลือก
          setSelectedItems(new Set());
          setIsSelectionMode(false);
          
          showSuccess(
            'ลบสำเร็จ',
            `ลบ ${selectedArray.length} รายการเรียบร้อยแล้ว`
          );
        } catch (error) {
          console.error('Error deleting multiple notifications:', error);
          showError(
            'เกิดข้อผิดพลาด',
            'เกิดข้อผิดพลาดในการลบ กรุณาลองใหม่อีกครั้ง'
          );
        }
      }
    );
  };

  // ฟังก์ชันลบรายการออกจากรายการแจ้งเตือน (ไม่บันทึกว่าส่งแล้ว)
  const deleteNotification = useCallback((licensePlate: string) => {
    // ป้องกันการลบซ้ำ
    if (sendingLicensePlates.has(licensePlate)) {
      return;
    }

    showConfirm(
      'ลบรายการแจ้งเตือน',
      `ต้องการลบ ${licensePlate} ออกจากรายการแจ้งเตือนใช่หรือไม่?`,
      async () => {
        try {
          setSendingLicensePlates(prev => new Set([...prev, licensePlate]));

          // ลบออกจาก MongoDB
          const response = await fetch('/api/daily-notifications', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licensePlate })
          });

          if (!response.ok) {
            throw new Error('Failed to delete from MongoDB');
          }
          
          // ลบออกจาก dailySnapshotList
          setDailySnapshotList(prev => prev.filter(plate => plate !== licensePlate));
          
          // ลบออกจาก copiedIds
          setCopiedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(licensePlate);
            return newSet;
          });
          
          // ลบออกจาก copiedPhoneIds
          setCopiedPhoneIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(licensePlate);
            return newSet;
          });
          
          // ลบออกจาก selectedItems ถ้ามี
          setSelectedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(licensePlate);
            return newSet;
          });
        } catch (error) {
          console.error('Error deleting notification:', error);
          showError(
            'เกิดข้อผิดพลาด',
            'เกิดข้อผิดพลาดในการลบ กรุณาลองใหม่อีกครั้ง'
          );
        } finally {
          setSendingLicensePlates(prev => {
            const newSet = new Set(prev);
            newSet.delete(licensePlate);
            return newSet;
          });
        }
      }
    );
  }, [showError, sendingLicensePlates, showConfirm]);

  // ฟังก์ชันรีเซ็ตสถานะการส่ง (เพื่อให้กลับมาแจ้งเตือนได้อีก)
  const resetNotificationStatus = (licensePlate: string) => {
    showConfirm(
      'รีเซ็ตสถานะการส่ง',
      `ต้องการรีเซ็ตสถานะการส่งของ ${licensePlate} ใช่หรือไม่?\n\nรถคันนี้จะกลับมาแสดงในรายการแจ้งเตือนอีกครั้ง`,
      async () => {
        try {
          // ลบสถานะการส่งออกจาก MongoDB
          const response = await fetch('/api/notification-status', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licensePlate })
          });

          if (!response.ok) {
            throw new Error('Failed to reset notification status');
          }

          // อัปเดต local state
          setNotificationStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[licensePlate];
            return newStatus;
          });

          showSuccess(
            'รีเซ็ตสำเร็จ!',
            `รีเซ็ตสถานะของ ${licensePlate} เรียบร้อยแล้ว\n\nรถคันนี้จะกลับมาแสดงในรายการแจ้งเตือนอีกครั้ง`,
            async () => {
              // โหลดข้อมูลใหม่
              await loadNotificationStatus();
            }
          );
        } catch (error) {
          console.error('Error resetting notification status:', error);
          showError(
            'เกิดข้อผิดพลาด',
            'เกิดข้อผิดพลาดในการรีเซ็ตสถานะ กรุณาลองใหม่อีกครั้ง'
          );
        }
      }
    );
  };

  // ฟังก์ชันทำเครื่องหมายว่าส่งแล้ว (จะลบออกจากรายการ)
  const markAsSent = useCallback(async (licensePlate: string) => {
    // ป้องกันการส่งซ้ำ - ถ้ากำลังส่งอยู่ให้ return
    if (sendingLicensePlates.has(licensePlate)) {
      console.log('Already sending:', licensePlate);
      return;
    }

    // ป้องกันการส่งซ้ำ - ตรวจสอบว่าส่งไปแล้วหรือยัง
    if (notificationStatus[licensePlate]?.sent) {
      console.log('Already sent:', licensePlate);
      return;
    }

    try {
      // เพิ่มเข้า Set ของรายการที่กำลังส่ง
      setSendingLicensePlates(prev => new Set([...prev, licensePlate]));

      const sentAt = new Date().toISOString();

      // บันทึกสถานะการส่งลง MongoDB
      await saveNotificationStatus(licensePlate, true, sentAt);
      
      // ลบออกจาก daily notifications
      const response = await fetch('/api/daily-notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licensePlate })
      });

      if (!response.ok) {
        throw new Error('Failed to delete from MongoDB');
      }
      
      // ลบออกจาก dailySnapshotList
      setDailySnapshotList(prev => prev.filter(plate => plate !== licensePlate));
      
      // ลบออกจาก copiedIds
      setCopiedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(licensePlate);
        return newSet;
      });
      
      // ลบออกจาก copiedPhoneIds
      setCopiedPhoneIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(licensePlate);
        return newSet;
      });
    } catch (error) {
      console.error('Error marking as sent:', error);
      showError(
        'เกิดข้อผิดพลาด',
        'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง'
      );
      
      // ถ้าเกิดข้อผิดพลาด ให้ลบสถานะการส่งออกจาก local state
      setNotificationStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[licensePlate];
        return newStatus;
      });

      // ลบออกจาก MongoDB ด้วย
      try {
        await fetch('/api/notification-status', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ licensePlate })
        });
      } catch (deleteError) {
        console.error('Error deleting notification status:', deleteError);
      }
    } finally {
      // ลบออกจาก Set ของรายการที่กำลังส่ง
      setSendingLicensePlates(prev => {
        const newSet = new Set(prev);
        newSet.delete(licensePlate);
        return newSet;
      });
    }
  }, [showError, saveNotificationStatus, notificationStatus, sendingLicensePlates]);

  // รายการแจ้งเตือนที่แสดง - ใช้จาก dailySnapshotList (รายการของวันนี้)
  const notificationList = useMemo(() => {
    if (dailySnapshotList.length === 0) {
      return [];
    }
    // แสดงเฉพาะรายการที่อยู่ใน dailySnapshotList และมีเบอร์โทรศัพท์ที่ถูกต้อง
    return data.filter(item => {
      // ตรวจสอบว่าเบอร์โทรศัพท์ถูกต้อง (ไม่ใช่ "0" หรือรูปแบบไม่ถูกต้อง)
      if (!isValidPhone(item.phone)) return false;
      
      return dailySnapshotList.includes(item.licensePlate);
    });
  }, [data, dailySnapshotList]);

  // นับจำนวนรายการที่ส่งแล้วในเดือนนี้
  const sentThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return Object.values(notificationStatus).filter(status => {
      if (!status.sent || !status.sentAt) return false;
      const sentDate = new Date(status.sentAt);
      return sentDate.getMonth() === currentMonth && sentDate.getFullYear() === currentYear;
    }).length;
  }, [notificationStatus]);

  useEffect(() => {
    if (customerData && customerData.length > 0) {
      console.log('=== DEBUG TAX EXPIRY DATA ===');
      console.log('Customer data length:', customerData.length);
      console.log('First item:', customerData[0]);
      
      const formatted = customerData
        .map((item): TaxExpiryData | null => {
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
            sequenceNumber: item.sequenceNumber || 0,
            licensePlate: item.licensePlate || '',
            customerName: item.customerName || '',
            phone,
            lastTaxDate: item.lastTaxDate || item.registerDate || '',
            expiryDate,
            daysUntilExpiry,
            status,
            brand: item.brand,
            vehicleType: item.vehicleType,
            tags: item.tags || []
          };
        })
        .filter((item): item is TaxExpiryData => item !== null);
      
      // เรียงข้อมูลตาม sequenceNumber จากมากไปน้อย (ข้อมูลใหม่อยู่บนสุด)
      const sortedData: TaxExpiryData[] = formatted.sort((a, b) => {
        const seqA = a.sequenceNumber || 0;
        const seqB = b.sequenceNumber || 0;
        return seqB - seqA; // เรียงจากมากไปน้อย
      });
      setData(sortedData);
      
      console.log('Formatted data length:', formatted.length);
    }
  }, [customerData, swrError]);

  const resetAllFilters = () => {
    setSearch('');
    setFilterMonth('');
    setFilterStatus('');
    setAdvancedFilters({
      dateFrom: '',
      dateTo: '',
      selectedBrands: [],
      selectedVehicleTypes: []
    });
    setCurrentPage(1);
  };

  // สร้างรายการ brands และ vehicle types ที่ unique
  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>();
    customerData?.forEach(customer => {
      if (customer.brand) brands.add(customer.brand);
    });
    return Array.from(brands).sort();
  }, [customerData]);

  const uniqueVehicleTypes = useMemo(() => {
    const types = new Set<string>();
    customerData?.forEach(customer => {
      if (customer.vehicleType) types.add(customer.vehicleType);
    });
    return Array.from(types).sort();
  }, [customerData]);

  const filteredData: TaxExpiryData[] = useMemo(() => data
    .filter(item => {
      // กรองตามการค้นหา (ใช้ debouncedSearch แทน search)
      const searchLower = debouncedSearch.toLowerCase();
      const sequenceStr = item.sequenceNumber ? String(item.sequenceNumber).padStart(6, '0') : '';
      const matchesSearch = !debouncedSearch || 
        item.licensePlate.toLowerCase().includes(searchLower) ||
        item.customerName.toLowerCase().includes(searchLower) ||
        item.phone.includes(debouncedSearch) ||
        sequenceStr.includes(debouncedSearch);

      // กรองตามเดือน
      const expiryMonth = new Date(item.expiryDate).getMonth() + 1;
      const matchesMonth = !filterMonth || String(expiryMonth) === filterMonth;

      // กรองตามสถานะ
      const matchesStatus = !filterStatus || item.status === filterStatus;

      // กรองตาม Advanced Filters - ช่วงวันที่
      let matchesDateRange = true;
      if (advancedFilters.dateFrom || advancedFilters.dateTo) {
        const lastTaxDate = new Date(item.lastTaxDate);
        if (advancedFilters.dateFrom) {
          const fromDate = new Date(advancedFilters.dateFrom);
          matchesDateRange = matchesDateRange && lastTaxDate >= fromDate;
        }
        if (advancedFilters.dateTo) {
          const toDate = new Date(advancedFilters.dateTo);
          matchesDateRange = matchesDateRange && lastTaxDate <= toDate;
        }
      }

      // กรองตาม brands
      const matchesBrand = advancedFilters.selectedBrands.length === 0 || 
        (item.brand && advancedFilters.selectedBrands.includes(item.brand));

      // กรองตาม vehicle types
      const matchesVehicleType = advancedFilters.selectedVehicleTypes.length === 0 || 
        (item.vehicleType && advancedFilters.selectedVehicleTypes.includes(item.vehicleType));

      return matchesSearch && matchesMonth && matchesStatus && matchesDateRange && matchesBrand && matchesVehicleType;
    }), [data, debouncedSearch, filterMonth, filterStatus, advancedFilters]);

  // นับจำนวน active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.dateFrom || advancedFilters.dateTo) count++;
    if (advancedFilters.selectedBrands.length > 0) count += advancedFilters.selectedBrands.length;
    if (advancedFilters.selectedVehicleTypes.length > 0) count += advancedFilters.selectedVehicleTypes.length;
    return count;
  }, [advancedFilters]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  // ใน pagination และการ slice ข้อมูล ให้รองรับ itemsPerPage = filteredData.length (all)
  const currentData = useMemo(() => itemsPerPage === filteredData.length ? filteredData : filteredData.slice(startIndex, endIndex), [filteredData, itemsPerPage, startIndex, endIndex]);

  // Handler สำหรับกระโดดไปหน้าที่ต้องการ
  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setJumpToPage('');
    }
  };

  // Keyboard shortcuts สำหรับเปลี่ยนหน้า
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // ป้องกันไม่ให้ทำงานถ้ากำลังพิมพ์ใน input/textarea หรือเปิด modal
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        showNotificationModal ||
        showSentHistoryModal
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
  }, [currentPage, totalPages, showNotificationModal, showSentHistoryModal]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full h-full">
        {/* Header */}
        <div className="mb-6 px-3 pt-3">
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
              <button
                onClick={() => setShowNotificationModal(true)}
                disabled={isLoadingDaily}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faBell} className={isLoadingDaily ? 'animate-pulse' : ''} />
                รายการแจ้งเตือนวันนี้
                <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold min-w-[24px] text-center">
                  {isLoadingDaily ? '...' : dailySnapshotList.length}
                </span>
              </button>
              <button
                onClick={() => setShowSentHistoryModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faCheck} />
                ดูรายการที่ส่งแล้ว
                <span className="bg-white text-green-600 px-2 py-0.5 rounded-full text-xs font-bold min-w-[24px] text-center">
                  {Object.keys(notificationStatus).length}
                </span>
              </button>
              <Link
                href="/customer-info"
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg"
              >
                กลับไปหน้าข้อมูลต่อภาษี
              </Link>
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
                <FontAwesomeIcon icon={faWarning} className="text-yellow-500 mr-2" />
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="ค้นหาเลขลำดับ, ทะเบียนรถ, ชื่อลูกค้า, เบอร์โทร"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-7 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
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
            
            {/* Advanced Filter Button */}
            <button
              onClick={() => setShowAdvancedFilter(true)}
              className="relative px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <FontAwesomeIcon icon={faFilter} />
              ตัวกรองขั้นสูง
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            
            <button
              onClick={resetAllFilters}
              className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors w-full font-medium text-xs"
            >
              รีเซ็ตทั้งหมด
            </button>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">ตัวกรองที่เปิดใช้งาน:</p>
                <button
                  onClick={resetAllFilters}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 underline"
                >
                  ล้างทั้งหมด
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(advancedFilters.dateFrom || advancedFilters.dateTo) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md text-[10px] font-medium">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    {advancedFilters.dateFrom && `จาก ${advancedFilters.dateFrom}`}
                    {advancedFilters.dateTo && ` ถึง ${advancedFilters.dateTo}`}
                  </span>
                )}
                {advancedFilters.selectedBrands.map(brand => (
                  <span key={brand} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-[10px] font-medium">
                    {brand}
                  </span>
                ))}
                {advancedFilters.selectedVehicleTypes.map(type => (
                  <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md text-[10px] font-medium">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}
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
            {/* Mobile Card View */}
            <div className="md:hidden px-3 space-y-3 mb-4">
              {currentData.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  ไม่พบข้อมูลที่ตรงกับตัวกรอง
                </div>
              ) : (
                currentData.map((item, idx) => (
                  <TaxExpiryCard
                    key={item.licensePlate + item.customerName + idx}
                    item={item}
                    rowNumber={startIndex + idx + 1}
                    notificationStatus={notificationStatus}
                    isFavorite={favorites.has(item.licensePlate)}
                    onToggleFavorite={toggleFavorite}
                    statusColor={statusColor}
                    statusIcon={statusIcon}
                    formatDate={formatDate}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        ลำดับ
                      </th>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        แจ้งเตือน
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentData.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                          ไม่พบข้อมูลที่ตรงกับตัวกรอง
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item, idx) => (
                        <TaxExpiryRow 
                          key={item.licensePlate + item.customerName + idx} 
                          item={item}
                          rowNumber={startIndex + idx + 1}
                          notificationStatus={notificationStatus}
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
                        className="w-14 px-2 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={handleJumpToPage}
                        className="px-2.5 py-0.5 text-xs font-medium rounded bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 transition-all"
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
                        แสดง <span className="font-medium">{startIndex + 1}</span> ถึง{' '}
                        <span className="font-medium">{Math.min(endIndex, filteredData.length)}</span> จาก{' '}
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
                    <div className="flex justify-center">
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        {/* First Page Button */}
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="หน้าแรก"
                        >
                          <span className="sr-only">หน้าแรก</span>
                          «
                        </button>
                        
                        {/* Previous Page Button */}
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="หน้าก่อนหน้า"
                        >
                          <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        
                        {/* Page Numbers */}
                        {getPageNumbers(currentPage, totalPages).map((page, idx) => (
                          typeof page === 'number' ? (
                          <button
                              key={`page-${page}`}
                            onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium transition-colors ${
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
                              className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300"
                            >
                              {page}
                            </span>
                          )
                        ))}
                        
                        {/* Next Page Button */}
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="หน้าถัดไป"
                        >
                          <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                        
                        {/* Last Page Button */}
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="หน้าสุดท้าย"
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

        {/* Modal รายการแจ้งเตือน */}
        {showNotificationModal && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
            onClick={() => {
              setShowNotificationModal(false);
              setSelectedItems(new Set()); // ล้างการเลือกเมื่อปิด modal
              setIsSelectionMode(false); // ออกจากโหมดเลือก
            }}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all"
              onClick={(e) => e.stopPropagation()}
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <FontAwesomeIcon icon={faBell} className="text-white text-xl animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        รายการแจ้งเตือนวันนี้
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        รายการที่เกินกำหนดและกำลังจะครบกำหนดภายใน 90 วัน (สูงสุด 50 คัน)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* ปุ่มสร้างรายการใหม่ */}
                    <button
                      onClick={createNewDailyNotifications}
                      disabled={isCreatingNew || isLoadingDaily || isClearingBoard}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-all disabled:opacity-50"
                      title="สร้างรายการใหม่ 50 คัน"
                    >
                      <FontAwesomeIcon icon={faBell} className={isCreatingNew ? 'animate-pulse' : ''} />
                    </button>
                    {/* ปุ่มล้างกระดาน */}
                    <button
                      onClick={clearDailyBoard}
                      disabled={isClearingBoard || isLoadingDaily || isCreatingNew}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all disabled:opacity-50"
                      title="ล้างกระดานแจ้งเตือนวันนี้"
                    >
                      <FontAwesomeIcon icon={faTrash} className={isClearingBoard ? 'animate-pulse' : ''} />
                    </button>
                    {/* ปุ่มรีเฟรช */}
                    <button
                      onClick={loadDailyNotifications}
                      disabled={isLoadingDaily || isClearingBoard || isCreatingNew}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all disabled:opacity-50"
                      title="รีเฟรชข้อมูล"
                    >
                      <FontAwesomeIcon icon={faSync} className={isLoadingDaily ? 'animate-spin' : ''} />
                    </button>
                    {/* ปุ่มปิด */}
                    <button
                      onClick={() => {
                        setShowNotificationModal(false);
                        setSelectedItems(new Set()); // ล้างการเลือกเมื่อปิด modal
                        setIsSelectionMode(false); // ออกจากโหมดเลือก
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl transition-all hover:rotate-90"
                      title="ปิด"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
                {notificationList.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 dark:text-green-400 text-5xl" />
                    </div>
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">ไม่มีรายการแจ้งเตือน</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      รายการที่ส่งแล้วจะถูกลบออกจากรายการนี้
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Toolbar สำหรับเลือกและลบหลายรายการ */}
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                      {!isSelectionMode ? (
                        <>
                          {selectedItems.size === 0 ? (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={startSelectionMode}
                                className="px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg"
                                title="เลือกรายการเพื่อลบ"
                              >
                                <FontAwesomeIcon icon={faCheck} />
                                เลือก
                              </button>
                              </div>
                          ) : (
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                เลือกแล้ว {selectedItems.size} รายการ
                                </span>
                              <button
                                onClick={startSelectionMode}
                                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                title="เปลี่ยนรายการที่เลือก"
                              >
                                <FontAwesomeIcon icon={faFilter} />
                                เปลี่ยน
                              </button>
                              </div>
                          )}
                          {selectedItems.size > 0 && (
                              <button
                              onClick={deleteMultipleNotifications}
                              className="px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg"
                              title={`ลบ ${selectedItems.size} รายการ`}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              ลบที่เลือก ({selectedItems.size})
                              </button>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex items-center gap-3">
                              <button
                              onClick={toggleSelectAll}
                              className="px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                              title={selectedItems.size === notificationList.length ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                              >
                                <FontAwesomeIcon 
                                icon={selectedItems.size === notificationList.length ? faSquareCheck : faSquare} 
                                className="text-sm"
                                />
                              {selectedItems.size === notificationList.length ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                              </button>
                            {selectedItems.size > 0 && (
                              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                เลือกแล้ว {selectedItems.size} รายการ
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                              <button
                              onClick={cancelSelection}
                              className="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              ยกเลิก
                            </button>
                            <button
                              onClick={confirmSelection}
                              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 shadow-md hover:shadow-lg ${
                                selectedItems.size === 0
                                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60'
                                  : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600'
                              }`}
                              disabled={selectedItems.size === 0}
                            >
                              <FontAwesomeIcon icon={faCheck} />
                              ยืนยัน ({selectedItems.size})
                              </button>
                            </div>
                          </div>
                      )}
                        </div>
                    {notificationList.map((item, idx) => (
                      <NotificationItemCard
                        key={item.licensePlate + idx}
                        item={item}
                        idx={idx}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedItems.has(item.licensePlate)}
                        isCopied={copiedId === item.licensePlate}
                        hasCopied={copiedIds.has(item.licensePlate)}
                        isSending={sendingLicensePlates.has(item.licensePlate)}
                        copiedPhoneIds={copiedPhoneIds}
                        onToggleSelection={toggleSelection}
                        onCopyPhone={copyPhoneToClipboard}
                        onCopyMessage={copyToClipboard}
                        onMarkAsSent={markAsSent}
                        onDelete={deleteNotification}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* รายการคงเหลือ */}
                    <div className="bg-white dark:bg-gray-700 px-4 py-3 rounded-xl shadow-md border-2 border-orange-200 dark:border-orange-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">รายการคงเหลือ</p>
                      <p className="text-2xl font-bold">
                        <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                          {dailySnapshotList.length}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">คัน</span>
                      </p>
                    </div>
                    
                    {/* ส่งไปแล้วเดือนนี้ */}
                    <div className="bg-white dark:bg-gray-700 px-4 py-3 rounded-xl shadow-md border-2 border-green-200 dark:border-green-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ส่งไปแล้วเดือนนี้</p>
                      <p className="text-2xl font-bold">
                        <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                          {sentThisMonth}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">คัน</span>
                      </p>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="flex items-center gap-2">
                        <span className="text-xl">💡</span>
                        <span>คัดลอกข้อความก่อน แล้วกดปุ่ม <span className="font-semibold text-green-600 dark:text-green-400">&quot;ส่งแล้ว&quot;</span></span>
                      </p>
                      <p className="text-xs mt-1 ml-7 text-gray-500 dark:text-gray-500">
                        รายการจะถูกลบออกทันทีหลังกดปุ่มส่งแล้ว
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowNotificationModal(false);
                      setSelectedItems(new Set()); // ล้างการเลือกเมื่อปิด modal
                      setIsSelectionMode(false); // ออกจากโหมดเลือก
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal รายการที่ส่งแล้ว */}
        {showSentHistoryModal && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
            onClick={() => setShowSentHistoryModal(false)}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all"
              onClick={(e) => e.stopPropagation()}
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <FontAwesomeIcon icon={faCheck} className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        รายการที่ส่งแล้ว
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        รายการที่ส่งข้อความแจ้งเตือนไปแล้ว (สามารถรีเซ็ตเพื่อแจ้งเตือนใหม่ได้)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* ปุ่มปิด */}
                    <button
                      onClick={() => setShowSentHistoryModal(false)}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl transition-all hover:rotate-90"
                      title="ปิด"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
                {Object.keys(notificationStatus).length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faInfoCircle} className="text-gray-400 dark:text-gray-600 text-5xl" />
                    </div>
                    <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">ยังไม่มีรายการที่ส่งแล้ว</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      เมื่อคุณส่งข้อความแจ้งเตือนไปแล้ว รายการจะปรากฏที่นี่
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(notificationStatus)
                      .sort((a, b) => new Date(b[1].sentAt).getTime() - new Date(a[1].sentAt).getTime())
                      .map(([licensePlate, status], idx) => {
                        // หาข้อมูลรถจาก data
                        const carData = data.find(item => item.licensePlate === licensePlate);
                        
                        return (
                          <div
                            key={licensePlate + idx}
                            className="border-2 rounded-xl p-5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-green-400 dark:hover:border-green-500 transition-all duration-300"
                          >
                            <div className="flex items-start gap-4">
                              {/* เลขลำดับ */}
                              <div className="flex-shrink-0">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center font-bold text-sm shadow-lg">
                                  {carData?.sequenceNumber ? String(carData.sequenceNumber).padStart(6, '0') : String(idx + 1).padStart(6, '0')}
                                </div>
                              </div>
                              
                              {/* ข้อมูล */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm bg-gradient-to-r from-green-500 to-green-600 text-white">
                                    ✅ ส่งแล้ว
                                  </span>
                                </div>
                                
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <p className="text-gray-900 dark:text-white">
                                      <span className="font-semibold text-gray-600 dark:text-gray-400">ทะเบียน:</span> 
                                      <span className="ml-2 font-bold">{licensePlate}</span>
                                    </p>
                                  </div>
                                  {carData && (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <p className="text-gray-900 dark:text-white">
                                          <span className="font-semibold text-gray-600 dark:text-gray-400">ชื่อ:</span> 
                                          <span className="ml-2">{carData.customerName}</span>
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <p className="text-gray-900 dark:text-white">
                                          <span className="font-semibold text-gray-600 dark:text-gray-400">เบอร์:</span> 
                                          <span className="ml-2">{carData.phone}</span>
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                        <p className="text-gray-900 dark:text-white">
                                          <span className="font-semibold text-gray-600 dark:text-gray-400">ครบกำหนด:</span> 
                                          <span className="ml-2 font-bold text-orange-600 dark:text-orange-400">{formatDate(carData.expiryDate)}</span>
                                        </p>
                                      </div>
                                    </>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                    <p className="text-gray-900 dark:text-white">
                                      <span className="font-semibold text-gray-600 dark:text-gray-400">ส่งเมื่อ:</span> 
                                      <span className="ml-2">{new Date(status.sentAt).toLocaleString('th-TH', { 
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* ปุ่มรีเซ็ต */}
                              <div className="flex flex-col gap-3 flex-shrink-0">
                                <button
                                  onClick={() => resetNotificationStatus(licensePlate)}
                                  className="px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-semibold min-w-[140px] transform hover:scale-105 bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-md hover:shadow-lg"
                                  title="รีเซ็ตเพื่อแจ้งเตือนใหม่"
                                >
                                  <FontAwesomeIcon icon={faSync} className="text-lg" />
                                  รีเซ็ต
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* จำนวนรายการที่ส่งแล้ว */}
                    <div className="bg-white dark:bg-gray-700 px-4 py-3 rounded-xl shadow-md border-2 border-green-200 dark:border-green-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">รายการทั้งหมด</p>
                      <p className="text-2xl font-bold">
                        <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                          {Object.keys(notificationStatus).length}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">คัน</span>
                      </p>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p className="flex items-center gap-2">
                        <span className="text-xl">💡</span>
                        <span>กดปุ่ม <span className="font-semibold text-emerald-600 dark:text-emerald-400">&quot;รีเซ็ต&quot;</span> เพื่อให้รถคันนั้นกลับมาแจ้งเตือนได้อีกครั้ง</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSentHistoryModal(false)}
                    className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Filter Modal */}
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
    </div>
  );
}