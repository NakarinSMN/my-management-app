// src/utils/customerHelpers.ts
import { 
  faCheckCircle, 
  faExclamationTriangle, 
  faTimesCircle, 
  faClock 
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// --- Constants ---

export const STATUS_COLOR: { [key: string]: string } = {
  'ต่อภาษีแล้ว': 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-white',
  'กำลังจะครบกำหนด': 'bg-yellow-200 dark:bg-yellow-600 text-yellow-800 dark:text-white',
  'ครบกำหนดวันนี้': 'bg-orange-200 dark:bg-orange-700 text-orange-800 dark:text-white',
  'เกินกำหนด': 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-white',
  'รอดำเนินการ': 'bg-emerald-200 dark:bg-emerald-700 text-emerald-800 dark:text-white',
};

export const STATUS_ICON: { [key: string]: IconDefinition } = {
  'ต่อภาษีแล้ว': faCheckCircle,
  'กำลังจะครบกำหนด': faExclamationTriangle,
  'ครบกำหนดวันนี้': faExclamationTriangle,
  'เกินกำหนด': faTimesCircle,
  'รอดำเนินการ': faClock,
};

export const MONTH_OPTIONS = [
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

export const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'ทุกสถานะ', color: '#6B7280' },
  { value: 'ต่อภาษีแล้ว', label: 'ต่อภาษีแล้ว', color: '#10B981' },
  { value: 'กำลังจะครบกำหนด', label: 'กำลังจะครบกำหนด', color: '#F59E0B' },
  { value: 'ครบกำหนดวันนี้', label: 'ครบกำหนดวันนี้', color: '#EF4444' },
  { value: 'เกินกำหนด', label: 'เกินกำหนด', color: '#DC2626' },
  { value: 'รอดำเนินการ', label: 'รอดำเนินการ', color: '#6B7280' },
];

// --- Helper Functions ---

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

export function formatDateFlexible(dateStr: string) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split('-');
      return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}`;
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