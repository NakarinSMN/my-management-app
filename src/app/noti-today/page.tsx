// src/app/noti-today/page.tsx
"use client"; // This is a client component

import { motion } from "framer-motion";
import React, { useMemo, memo, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag } from '@fortawesome/free-solid-svg-icons';
import AnimatedPage, { itemVariants } from '../components/AnimatedPage';
import { useCustomerData, CustomerData } from '@/lib/useCustomerData';

// Interface สำหรับสถานะการแจ้งเตือน
interface NotificationStatus {
  [licensePlate: string]: {
    sent: boolean;
    sentAt: string;
  };
}

// Interface สำหรับแสดงผลแจ้งเตือน
interface NotificationItem {
  sequenceNumber?: number;
  licensePlate: string;
  brand: string;
  customerName: string;
  phone: string;
  registerDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: string;
  note?: string;
  tags?: string[];
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

// ฟังก์ชันคำนวณจำนวนวันที่เหลือ
function calculateDaysUntilExpiry(registerDate: string): number {
  if (!registerDate) return 999;
  
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
      return 999;
    }
    
    const expiryDate = new Date(date);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    const today = new Date();
    const gap = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return gap;
  } catch {
    return 999;
  }
}

export default function NotiTodayPage() {
  // ใช้ข้อมูลจาก MongoDB แทน Google Sheets
  const { data: customerData, error, isLoading } = useCustomerData();
  
  // สถานะการแจ้งเตือน (ส่งแล้วหรือยัง)
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>({});

  // โหลดสถานะการแจ้งเตือน
  useEffect(() => {
    const loadNotificationStatus = async () => {
      try {
        const response = await fetch('/api/notification-status');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setNotificationStatus(result.data);
          }
        }
      } catch (error) {
        console.error('Error loading notification status:', error);
      }
    };
    
    loadNotificationStatus();
  }, []);

  // กรองเฉพาะรายการที่กำลังจะครบกำหนด (0-90 วัน) และมีเบอร์โทรศัพท์ และยังไม่ส่ง
  const filteredNotifications = useMemo(() => {
    if (!customerData || customerData.length === 0) return [];
    
    const notifications: NotificationItem[] = [];
    
    for (const item of customerData) {
      // 1. ตรวจสอบว่ามีทะเบียนรถหรือไม่ - ถ้าไม่มีให้ข้าม
      if (!item.licensePlate || item.licensePlate.trim() === '') {
        continue;
      }
      
      // 2. ตรวจสอบว่ามีเบอร์โทรศัพท์และรูปแบบถูกต้อง - ถ้าไม่มีหรือไม่ถูกต้องให้ข้าม
      if (!isValidPhone(item.phone)) {
        continue;
      }
      
      // 3. ตรวจสอบว่ามีวันที่ชำระภาษีหรือไม่ - ถ้าไม่มีให้ข้าม
      if (!item.registerDate || item.registerDate.trim() === '') {
        continue;
      }
      
      // 4. ตรวจสอบว่ารายการนี้ส่งแล้วหรือยัง - ถ้าส่งแล้วให้ข้าม
      if (notificationStatus[item.licensePlate]?.sent) {
        continue;
      }
      
      // 5. คำนวณจำนวนวันที่เหลือ (ถ้า return 999 แสดงว่าไม่สามารถคำนวณได้)
      const daysLeft = calculateDaysUntilExpiry(item.registerDate);
      
      // 6. กรองเฉพาะรายการที่ 0-90 วันเท่านั้น (นอกเหนือจากนี้ไม่เอา)
      // - daysLeft < 0 = เกินกำหนดแล้ว
      // - daysLeft > 90 = ยังอีกนานเกิน 90 วัน
      // - daysLeft === 999 = ไม่สามารถคำนวณได้
      if (daysLeft < 0 || daysLeft > 90 || daysLeft === 999) {
        continue;
      }
      
      // คำนวณวันที่หมดอายุ
      let expiryDate = '';
      try {
        let date: Date;
        const registerDate = item.registerDate;
        
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(registerDate)) {
          const [day, month, year] = registerDate.split('/');
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(registerDate)) {
          date = new Date(registerDate);
        } else {
          date = new Date(registerDate);
        }
        
        const expiry = new Date(date);
        expiry.setFullYear(expiry.getFullYear() + 1);
        
        const dd = String(expiry.getDate()).padStart(2, '0');
        const mm = String(expiry.getMonth() + 1).padStart(2, '0');
        const yyyy = expiry.getFullYear();
        expiryDate = `${dd}/${mm}/${yyyy}`;
      } catch {
        expiryDate = '-';
      }
      
      notifications.push({
        sequenceNumber: item.sequenceNumber,
        licensePlate: item.licensePlate,
        brand: item.brand || '',
        customerName: item.customerName,
        phone: item.phone,
        registerDate: item.registerDate,
        expiryDate: expiryDate,
        daysUntilExpiry: daysLeft,
        status: item.status,
        note: item.note,
        tags: item.tags || []
      } as NotificationItem);
    }
    
    // เรียงตาม daysUntilExpiry จากน้อยไปมาก
    return notifications.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [customerData, notificationStatus]);

  return (
    <AnimatedPage>
      <motion.div variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[500px]">
        <motion.h1 variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          รายการแจ้งเตือนวันนี้
        </motion.h1>
        <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-gray-700 dark:text-gray-300 mb-6">
          หน้านี้แสดงรายการการแจ้งเตือนสำหรับงานที่กำลังจะครบกำหนด.
        </motion.p>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse p-4 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <div className="h-4 w-1/3 bg-blue-200 dark:bg-blue-700 rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-blue-100 dark:bg-blue-800 rounded mb-1"></div>
                <div className="h-3 w-1/4 bg-blue-100 dark:bg-blue-800 rounded mb-1"></div>
                <div className="h-3 w-1/3 bg-blue-100 dark:bg-blue-800 rounded mb-1"></div>
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-red-500 dark:text-red-400">ข้อผิดพลาด: เกิดข้อผิดพลาดในการโหลดข้อมูล</p>}
        {!isLoading && !error && filteredNotifications.length === 0 && (
          <p className="text-gray-600 dark:text-gray-400">ไม่มีรายการแจ้งเตือนที่กำลังจะครบกำหนดสำหรับวันนี้.</p>
        )}
        {!isLoading && !error && filteredNotifications.length > 0 && (
          <div className="space-y-4">
            {filteredNotifications.map((noti, index) => (
              <NotificationCard key={index} noti={noti} rowNumber={index + 1} />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatedPage>
  );
}

const NotificationCard = memo(function NotificationCard({ noti, rowNumber }: { noti: NotificationItem; rowNumber: number }) {
  return (
    <motion.div variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="p-4 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg">
            {noti.sequenceNumber ? String(noti.sequenceNumber).padStart(6, '0') : String(rowNumber).padStart(6, '0')}
          </div>
        </div>
        <div className="flex-1">
          <motion.h2 variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="font-semibold text-blue-800 dark:text-blue-200">ทะเบียนรถ: {noti.licensePlate} ({noti.brand})</motion.h2>
          <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-sm text-blue-700 dark:text-blue-300">ชื่อลูกค้า: {noti.customerName}</motion.p>
          <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-sm text-blue-700 dark:text-blue-300">เบอร์ติดต่อ: {noti.phone}</motion.p>
          <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-sm text-blue-700 dark:text-blue-300">วันที่ครบกำหนดภาษี: {noti.expiryDate} (เหลือ {noti.daysUntilExpiry} วัน)</motion.p>
          {noti.tags && noti.tags.length > 0 && (
            <motion.div variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="flex flex-wrap gap-1 my-2">
              {noti.tags.map((tag, index) => (
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
              ))}
            </motion.div>
          )}
          {noti.note && <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-sm text-blue-700 dark:text-blue-300">หมายเหตุ: {noti.note}</motion.p>}
          <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-xs text-blue-600 dark:text-blue-400 mt-1">สถานะ: {noti.status}</motion.p>
        </div>
      </div>
    </motion.div>
  );
});