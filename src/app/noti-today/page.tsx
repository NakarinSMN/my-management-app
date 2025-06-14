// src/app/noti-today/page.tsx
"use client"; // This is a client component

import { motion } from "framer-motion";
import React, { useEffect, useState } from 'react';

// ปรับปรุง Interface ให้ตรงกับข้อมูลที่ส่งมาจาก API Route (หลังจากถูก Normalize)
interface NotificationItem {
  date: string; // ตรงกับ 'วันที่' ใน Sheets
  timestamp: string; // ตรงกับ 'เวลาที่แจ้งเตือน'
  licensenumber: string; // ตรงกับ 'ทะเบียนรถ'
  brand: string; // ตรงกับ 'ยี่ห้อ'
  customername: string; // ตรงกับ 'ชื่อลูกค้า'
  contactnumber: string; // ตรงกับ 'เบอร์ติดต่อ'
  transactiondate: string; // ตรงกับ 'วันที่ชำระ-ค้างชำระ'
  notes: string; // ตรงกับ 'หมายเหตุ'
  userid: string; // ตรงกับ 'userid'
  remainingdays: string; // ตรงกับ 'อายุวัน'
  taxrenewaldate: string; // ตรงกับ 'วันที่ต่อภาษี'
  status: string; // ตรงกับ 'สถานะ'
}

export default function NotiTodayPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        // เรียกใช้ Next.js API Route ที่เป็นตัวกลางไปหา Apps Script
        const response = await fetch('/api/sheet-data'); 
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to fetch notifications');
        }
        // ไม่ต้องระบุ Type เป็น NotificationItem[] ตรงๆ ที่นี่ แต่ให้มันอนุมานจาก useState หรือ map เอา
        const data: NotificationItem[] = await response.json(); // Specify type here

        // Filter data for "กำลังจะครบกำหนด" status
        const filteredData = data.filter(item => item.status === 'กำลังจะครบกำหนด');

        setNotifications(filteredData);
      } catch (err: unknown) { // Use 'unknown' for catch error type
        let errorMessage = 'An unknown error occurred';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        setError(errorMessage);
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[500px]"
    >
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        รายการแจ้งเตือนวันนี้
      </h1>
      <p className="text-gray-700 dark:text-gray-300 mb-6">
        หน้านี้แสดงรายการการแจ้งเตือนสำหรับงานที่กำลังจะครบกำหนด.
      </p>

      {loading && <p className="text-blue-500 dark:text-blue-400">กำลังโหลดรายการแจ้งเตือน...</p>}
      {error && <p className="text-red-500 dark:text-red-400">ข้อผิดพลาด: {error}</p>}

      {!loading && !error && notifications.length === 0 && (
        <p className="text-gray-600 dark:text-gray-400">ไม่มีรายการแจ้งเตือนที่กำลังจะครบกำหนดสำหรับวันนี้.</p>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="space-y-4">
          {notifications.map((noti, index) => (
            <div key={index} className="p-4 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <h2 className="font-semibold text-blue-800 dark:text-blue-200">ทะเบียนรถ: {noti.licensenumber} ({noti.brand})</h2>
              <p className="text-sm text-blue-700 dark:text-blue-300">ชื่อลูกค้า: {noti.customername}</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">เบอร์ติดต่อ: {noti.contactnumber}</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">วันที่ครบกำหนดภาษี: {noti.taxrenewaldate} (เหลือ {noti.remainingdays} วัน)</p>
              {noti.notes && <p className="text-sm text-blue-700 dark:text-blue-300">หมายเหตุ: {noti.notes}</p>}
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">แจ้งเตือนเมื่อ: {noti.timestamp}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}