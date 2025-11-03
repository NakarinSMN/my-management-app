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
  faInfoCircle,
  faBell,
  faCopy,
  faCheck,
  faTrash,
  faSync,
  faSpinner
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

// Interface สำหรับสถานะการส่งข้อความ
interface NotificationStatus {
  [licensePlate: string]: {
    sent: boolean;
    sentAt: string;
  };
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

function getPageNumbers(currentPage: number, totalPages: number, maxPages = 5) {
  let start = Math.max(1, currentPage - Math.floor(maxPages / 2));
  let end = start + maxPages - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxPages + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

const TaxExpiryRow = memo(function TaxExpiryRow({ 
  item, 
  notificationStatus 
}: { 
  item: TaxExpiryData;
  notificationStatus: NotificationStatus;
}) {
  const isSent = notificationStatus[item.licensePlate]?.sent || false;
  const sentAt = notificationStatus[item.licensePlate]?.sentAt;
  
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-5 align-middle text-sm font-medium text-gray-900 dark:text-white">{item.licensePlate}</td>
      <td className="px-6 py-5 align-middle text-sm text-gray-900 dark:text-white">{item.customerName}</td>
      <td className="px-6 py-5 align-middle text-sm text-gray-900 dark:text-white">{item.phone}</td>
      <td className="px-6 py-5 align-middle text-sm text-gray-900 dark:text-white">{formatDate(item.lastTaxDate)}</td>
      <td className="px-6 py-5 align-middle text-sm text-gray-900 dark:text-white">{formatDate(item.expiryDate)}</td>
      <td className="px-6 py-5 align-middle font-medium">
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
      <td className="px-6 py-5 align-middle">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[item.status]}`}>
          <FontAwesomeIcon icon={statusIcon[item.status]} className="mr-1" />
          {item.status}
        </span>
      </td>
      <td className="px-6 py-5 align-middle">
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
  const [dailySnapshotList, setDailySnapshotList] = useState<string[]>([]);
  const [isLoadingDaily, setIsLoadingDaily] = useState<boolean>(false);
  const [sendingLicensePlates, setSendingLicensePlates] = useState<Set<string>>(new Set());

  // ⚡ ใช้ Custom Hook พร้อม Cache
  const { data: customerData, error: swrError, isLoading, refreshData } = useCustomerData();

  // โหลดสถานะการส่งข้อความจาก localStorage
  useEffect(() => {
    const savedStatus = localStorage.getItem('notificationStatus');
    if (savedStatus) {
      try {
        setNotificationStatus(JSON.parse(savedStatus));
      } catch (error) {
        console.error('Error loading notification status:', error);
      }
    }
  }, []);

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
        // ถ้าไม่มีรายการของวันนี้ ให้สร้างใหม่
        await createDailyNotifications();
      }
    } catch (error) {
      console.error('Error loading daily notifications:', error);
    } finally {
      setIsLoadingDaily(false);
    }
  };

  // สร้างรายการแจ้งเตือนใหม่สำหรับวันนี้
  const createDailyNotifications = async () => {
    // ป้องกันการสร้างซ้ำ - ถ้ามีรายการอยู่แล้วไม่ต้องสร้างใหม่
    if (dailySnapshotList.length > 0) {
      console.log('Daily notifications already exist:', dailySnapshotList.length);
      return;
    }

    try {
      const urgentItems = data
        .filter(item => item.daysUntilExpiry <= 90 && !notificationStatus[item.licensePlate]?.sent)
        .slice(0, 50);
      
      const licensePlates = urgentItems.map(item => item.licensePlate);
      
      // ป้องกันการสร้างรายการว่าง
      if (licensePlates.length === 0) {
        console.log('No urgent items to create notifications');
        setDailySnapshotList([]);
        return;
      }

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

  // ฟังก์ชันบันทึกสถานะการส่งข้อความ
  const saveNotificationStatus = (status: NotificationStatus) => {
    setNotificationStatus(status);
    localStorage.setItem('notificationStatus', JSON.stringify(status));
  };

  // ฟังก์ชันสร้างข้อความแจ้งเตือน
  const generateNotificationMessage = (item: TaxExpiryData): string => {
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
  };

  // ฟังก์ชันคัดลอกข้อความ
  const copyToClipboard = async (item: TaxExpiryData) => {
    const message = generateNotificationMessage(item);
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(item.licensePlate);
      // เพิ่มเข้าใน Set ของคันที่คัดลอกแล้ว
      setCopiedIds(prev => new Set([...prev, item.licensePlate]));
      setTimeout(() => setCopiedId(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('ไม่สามารถคัดลอกข้อความได้');
    }
  };

  // ฟังก์ชันลบรายการออกจากรายการแจ้งเตือน (ไม่บันทึกว่าส่งแล้ว)
  const deleteNotification = async (licensePlate: string) => {
    if (!confirm(`ต้องการลบ ${licensePlate} ออกจากรายการแจ้งเตือนใช่หรือไม่?`)) {
      return;
    }

    // ป้องกันการลบซ้ำ
    if (sendingLicensePlates.has(licensePlate)) {
      return;
    }

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
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('เกิดข้อผิดพลาดในการลบ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSendingLicensePlates(prev => {
        const newSet = new Set(prev);
        newSet.delete(licensePlate);
        return newSet;
      });
    }
  };

  // ฟังก์ชันทำเครื่องหมายว่าส่งแล้ว (จะลบออกจากรายการ)
  const markAsSent = async (licensePlate: string) => {
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

      // บันทึกสถานะการส่ง
      const newStatus = {
        ...notificationStatus,
        [licensePlate]: {
          sent: true,
          sentAt: new Date().toISOString(),
        },
      };
      saveNotificationStatus(newStatus);
      
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
    } catch (error) {
      console.error('Error marking as sent:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง');
      
      // ถ้าเกิดข้อผิดพลาด ให้ลบสถานะการส่งออก
      const newStatus = { ...notificationStatus };
      delete newStatus[licensePlate];
      saveNotificationStatus(newStatus);
    } finally {
      // ลบออกจาก Set ของรายการที่กำลังส่ง
      setSendingLicensePlates(prev => {
        const newSet = new Set(prev);
        newSet.delete(licensePlate);
        return newSet;
      });
    }
  };

  // รายการแจ้งเตือนที่แสดง - ใช้จาก dailySnapshotList (รายการของวันนี้)
  const notificationList = useMemo(() => {
    if (dailySnapshotList.length === 0) {
      return [];
    }
    // แสดงเฉพาะรายการที่อยู่ใน dailySnapshotList
    return data.filter(item => dailySnapshotList.includes(item.licensePlate));
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        แจ้งเตือน
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {currentData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                          ไม่พบข้อมูลภาษีครั้งถัดไป
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item, idx) => (
                        <TaxExpiryRow 
                          key={item.licensePlate + item.customerName + idx} 
                          item={item}
                          notificationStatus={notificationStatus}
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

        {/* Modal รายการแจ้งเตือน */}
        {showNotificationModal && (
          <div 
            className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fadeIn"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
            onClick={() => setShowNotificationModal(false)}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all"
              onClick={(e) => e.stopPropagation()}
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
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
                    {/* ปุ่มรีเฟรช */}
                    <button
                      onClick={loadDailyNotifications}
                      disabled={isLoadingDaily}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all disabled:opacity-50"
                      title="รีเฟรชข้อมูล"
                    >
                      <FontAwesomeIcon icon={faSync} className={isLoadingDaily ? 'animate-spin' : ''} />
                    </button>
                    {/* ปุ่มปิด */}
                    <button
                      onClick={() => setShowNotificationModal(false)}
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
                    {notificationList.map((item, idx) => {
                      const isCopied = copiedId === item.licensePlate;
                      const hasCopied = copiedIds.has(item.licensePlate);
                      const isSending = sendingLicensePlates.has(item.licensePlate);
                      
                      return (
                        <div
                          key={item.licensePlate + idx}
                          className="border-2 rounded-xl p-5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <div className="flex items-start gap-4">
                            {/* เลขลำดับ */}
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
                                {idx + 1}
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
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
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
                                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
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
                                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                  <p className="text-gray-900 dark:text-white">
                                    <span className="font-semibold text-gray-600 dark:text-gray-400">เบอร์:</span> 
                                    <span className="ml-2">{item.phone}</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                  <p className="text-gray-900 dark:text-white">
                                    <span className="font-semibold text-gray-600 dark:text-gray-400">ครบกำหนด:</span> 
                                    <span className="ml-2 font-bold text-orange-600 dark:text-orange-400">{formatDate(item.expiryDate)}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* ปุ่มต่างๆ */}
                            <div className="flex flex-col gap-3 flex-shrink-0">
                              {/* ปุ่มคัดลอก */}
                              <button
                                onClick={() => copyToClipboard(item)}
                                className={`px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-semibold min-w-[140px] transform hover:scale-105 ${
                                  isCopied
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50 animate-pulse'
                                    : hasCopied
                                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg'
                                }`}
                              >
                                <FontAwesomeIcon icon={isCopied || hasCopied ? faCheck : faCopy} className="text-lg" />
                                {isCopied ? 'คัดลอกแล้ว!' : hasCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                              </button>
                              
                              {/* ปุ่มส่งแล้ว */}
                              <button
                                onClick={() => markAsSent(item.licensePlate)}
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
                                onClick={() => deleteNotification(item.licensePlate)}
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
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
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
                    onClick={() => setShowNotificationModal(false)}
                    className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 