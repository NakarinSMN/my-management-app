// src/utils/customerHelpers.ts
import { 
  faCheckCircle, 
  faExclamationTriangle, 
  faTimesCircle, 
  faClock,
  faWarning // ✅ เพิ่ม icon นี้สำหรับ 'ครบกำหนดวันนี้'
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// --- Constants ---

export const STATUS_COLOR: { [key: string]: string } = {
  'ต่อภาษีแล้ว': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'กำลังจะครบกำหนด': 'bg-amber-50 text-amber-700 border-amber-100',
  'ครบกำหนดวันนี้': 'bg-orange-50 text-orange-700 border-orange-100',
  'เกินกำหนด': 'bg-rose-50 text-rose-700 border-rose-100',
  'รอดำเนินการ': 'bg-gray-50 text-gray-700 border-gray-200',
};

export const STATUS_ICON: { [key: string]: IconDefinition } = {
  'ต่อภาษีแล้ว': faCheckCircle,
  'กำลังจะครบกำหนด': faExclamationTriangle,
  'ครบกำหนดวันนี้': faWarning,
  'เกินกำหนด': faTimesCircle,
  'รอดำเนินการ': faClock,
};

export const MONTH_OPTIONS = [
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

export const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'ทุกสถานะ', color: '#6B7280' },
  { value: 'ต่อภาษีแล้ว', label: 'ต่อภาษีแล้ว', color: '#10B981' },
  { value: 'กำลังจะครบกำหนด', label: 'กำลังจะครบกำหนด', color: '#F59E0B' },
  { value: 'ครบกำหนดวันนี้', label: 'ครบกำหนดวันนี้', color: '#EF4444' },
  { value: 'เกินกำหนด', label: 'เกินกำหนด', color: '#DC2626' },
  { value: 'รอดำเนินการ', label: 'รอดำเนินการ', color: '#6B7280' },
];

// --- Helper Functions ---

// ฟังก์ชันคำนวณเลขหน้า Pagination
export function getPageNumbers(currentPage: number, totalPages: number, maxPages = 5) {
  const pages: (number | string)[] = [];
  if (totalPages <= maxPages + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  pages.push(1);
  if (currentPage > 3) pages.push('...');
  
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  if (currentPage < totalPages - 2) pages.push('...');
  if (totalPages > 1) pages.push(totalPages);
  
  return pages;
}

// ฟังก์ชันจัดรูปแบบวันที่ (รองรับทั้ง YYYY-MM-DD และ DD/MM/YYYY)
export function formatDateFlexible(dateStr: string, useBuddhistYear: boolean = true) {
  if (!dateStr || typeof dateStr !== 'string') return '-';
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split('-');
      const year = useBuddhistYear ? parseInt(yyyy) + 543 : parseInt(yyyy);
      return `${dd}/${mm}/${year}`;
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    } else {
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return dateStr;
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = useBuddhistYear ? dateObj.getFullYear() + 543 : dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    return dateStr;
  }
}

// ✅ เพิ่มฟังก์ชันคำนวณวันหมดอายุ
export function calculateDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const timeDiff = expiry.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// ✅ เพิ่มฟังก์ชันคำนวณสถานะ
export function calculateStatus(registerDate: string): string {
  if (!registerDate) return 'รอดำเนินการ';
  try {
    let date: Date;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(registerDate)) {
      const [day, month, year] = registerDate.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(registerDate)) {
      date = new Date(registerDate);
    } else if (registerDate.includes('T')) {
      date = new Date(registerDate);
    } else {
      return 'รอดำเนินการ';
    }

    const expiryDate = new Date(date);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const today = new Date();
    const gap = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (gap < 0) return 'เกินกำหนด';
    else if (gap === 0) return 'ครบกำหนดวันนี้';
    else if (gap <= 90) return 'กำลังจะครบกำหนด';
    else return 'ต่อภาษีแล้ว';
  } catch (error) {
    return 'รอดำเนินการ';
  }
}

// ✅ เพิ่มฟังก์ชันตรวจสอบเบอร์โทร
export function isValidPhone(phone: string | undefined): boolean {
  if (!phone) return false;
  const trimmed = phone.trim();
  if (trimmed.length === 0 || /^0+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/[\s\-\(\)]/g, '');
  return /^\d+$/.test(digits) && digits.length >= 6 && digits.length <= 15;
}