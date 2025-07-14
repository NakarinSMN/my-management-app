// src/app/noti-today/page.tsx
"use client"; // This is a client component

import { motion } from "framer-motion";
import React, { useEffect, useState, useMemo, memo } from 'react';
import useSWR from 'swr';
import AnimatedPage, { itemVariants } from '../components/AnimatedPage';

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

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NotiTodayPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: swrData, error: swrError } = useSWR('/api/sheet-data', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  useEffect(() => {
    if (swrData) {
      // Filter data for "กำลังจะครบกำหนด" status
      const filteredData = swrData.filter((item: NotificationItem) => item.status === 'กำลังจะครบกำหนด');
      setNotifications(filteredData);
      setError(null);
    } else if (swrError) {
      setError('An error occurred: ' + swrError.message);
    }
    setLoading(false);
  }, [swrData, swrError]);

  const filteredNotifications = useMemo(() => notifications, [notifications]);

  return (
    <AnimatedPage>
      <motion.div variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[500px]">
        <motion.h1 variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          รายการแจ้งเตือนวันนี้
        </motion.h1>
        <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-gray-700 dark:text-gray-300 mb-6">
          หน้านี้แสดงรายการการแจ้งเตือนสำหรับงานที่กำลังจะครบกำหนด.
        </motion.p>

        {loading && (
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
        {error && <p className="text-red-500 dark:text-red-400">ข้อผิดพลาด: {error}</p>}
        {!loading && !error && filteredNotifications.length === 0 && (
          <p className="text-gray-600 dark:text-gray-400">ไม่มีรายการแจ้งเตือนที่กำลังจะครบกำหนดสำหรับวันนี้.</p>
        )}
        {!loading && !error && filteredNotifications.length > 0 && (
          <div className="space-y-4">
            {filteredNotifications.map((noti, index) => (
              <NotificationCard key={index} noti={noti} />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatedPage>
  );
}

const NotificationCard = memo(function NotificationCard({ noti }: { noti: NotificationItem }) {
  return (
    <motion.div variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="p-4 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900 rounded-lg">
      <motion.h2 variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="font-semibold text-blue-800 dark:text-blue-200">ทะเบียนรถ: {noti.licensenumber} ({noti.brand})</motion.h2>
      <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-sm text-blue-700 dark:text-blue-300">ชื่อลูกค้า: {noti.customername}</motion.p>
      <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-sm text-blue-700 dark:text-blue-300">เบอร์ติดต่อ: {noti.contactnumber}</motion.p>
      <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-sm text-blue-700 dark:text-blue-300">วันที่ครบกำหนดภาษี: {noti.taxrenewaldate} (เหลือ {noti.remainingdays} วัน)</motion.p>
      {noti.notes && <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-sm text-blue-700 dark:text-blue-300">หมายเหตุ: {noti.notes}</motion.p>}
      <motion.p variants={itemVariants} initial="hidden" animate="show" exit="exit" transition={{ duration: 0.5, ease: 'easeInOut' }} className="text-xs text-blue-600 dark:text-blue-400 mt-1">แจ้งเตือนเมื่อ: {noti.timestamp}</motion.p>
    </motion.div>
  );
});