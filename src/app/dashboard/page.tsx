"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedPage, { itemVariants } from '../components/AnimatedPage';
import { Card } from '../components/ui/Card';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { RecentActivities } from '../components/RecentActivities';
import { useMemo, useEffect, useState } from 'react';

// ⚡ ใช้ Custom Hook แทน useSWR
import { useCustomerData } from '@/lib/useCustomerData';

export default function DashboardPage() {
  // State สำหรับข้อมูลจริง
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [thisMonthRenewals, setThisMonthRenewals] = useState(0);
  const [upcomingExpiry, setUpcomingExpiry] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  // ⚡ ใช้ Custom Hook พร้อม Cache
  const { rawData: customerData } = useCustomerData();

  // ชื่อเดือนภาษาไทย
  const [currentMonthName, setCurrentMonthName] = useState('');

  // คำนวณสถิติจากข้อมูลจริง
  useEffect(() => {
    if (customerData && customerData.data) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                          'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
      setCurrentMonthName(monthNames[currentMonth - 1]);
      
      let monthCount = 0;
      let upcomingCount = 0;
      let overdueCount = 0;
      
      customerData.data.forEach((item: Record<string, string | number>) => {
        // นับรถที่ต่อภาษีในเดือนนี้ (จากวันที่ชำระล่าสุด)
        const lastTaxDate = String(item['วันที่ชำระภาษีล่าสุด'] || '');
        if (lastTaxDate) {
          let month = 0;
          let year = 0;
          
          // แปลงวันที่
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastTaxDate)) {
            const [, mm, yyyy] = lastTaxDate.split('/');
            month = parseInt(mm);
            year = parseInt(yyyy);
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(lastTaxDate)) {
            const [yyyy, mm] = lastTaxDate.split('-');
            month = parseInt(mm);
            year = parseInt(yyyy);
          }
          
          if (month === currentMonth && year === currentYear) {
            monthCount++;
          }
        }
        
        // นับสถานะ
        const status = String(item['สถานะ'] || item['สถานะการเตือน'] || '');
        if (status === 'กำลังจะครบกำหนด' || status === 'ใกล้ครบกำหนด') {
          upcomingCount++;
        } else if (status === 'เกินกำหนด') {
          overdueCount++;
        }
      });
      
      setTotalCustomers(customerData.data.length);
      setThisMonthRenewals(monthCount);
      setUpcomingExpiry(upcomingCount);
      setOverdueCount(overdueCount);
    }
  }, [customerData]);

  const dashboardStats = [
    { label: "ลูกค้าทั้งหมด", value: totalCustomers.toString(), icon: "👥", description: "จำนวนลูกค้าทั้งหมดในระบบ" },
    { 
      label: `ต่อภาษี${currentMonthName}`, 
      value: thisMonthRenewals.toString(), 
      icon: "🚗", 
      description: `จำนวนรถที่ต่อภาษีในเดือน${currentMonthName}` 
    },
    { label: "ใกล้ครบกำหนด", value: upcomingExpiry.toString(), icon: "⚠️", description: "รถที่ใกล้ครบกำหนดต่อภาษี" },
    { label: "เกินกำหนด", value: overdueCount.toString(), icon: "🔴", description: "รถที่เกินกำหนดต่อภาษีแล้ว" },
  ];

  const userAccessData = useMemo(() => [
    { date: '2025-05-01', value: 120 }, { date: '2025-05-02', value: 150 },
    { date: '2025-05-03', value: 130 }, { date: '2025-05-04', value: 180 },
    { date: '2025-05-05', value: 160 }, { date: '2025-05-06', value: 190 },
    { date: '2025-05-07', value: 175 }, { date: '2025-05-08', value: 200 },
    { date: '2025-05-09', value: 210 }, { date: '2025-05-10', value: 185 },
    { date: '2025-05-11', value: 220 }, { date: '2025-05-12', value: 205 },
    { date: '2025-05-13', value: 230 }, { date: '2025-05-14', value: 215 },
    { date: '2025-05-15', value: 240 }, { date: '2025-05-16', value: 225 },
    { date: '2025-05-17', value: 250 }, { date: '2025-05-18', value: 235 },
    { date: '2025-05-19', value: 260 }, { date: '2025-05-20', value: 245 },
    { date: '2025-05-21', value: 270 }, { date: '2025-05-22', value: 255 },
    { date: '2025-05-23', value: 280 }, { date: '2025-05-24', value: 265 },
    { date: '2025-05-25', value: 290 }, { date: '2025-05-26', value: 275 },
    { date: '2025-05-27', value: 300 }, { date: '2025-05-28', value: 285 },
    { date: '2025-05-29', value: 310 }, { date: '2025-05-30', value: 295 },
    { date: '2025-05-31', value: 320 },
  ], []);

  const inspectionData = useMemo(() => ({
    'รย.1': [
      { date: '2025-05-01', value: 50 }, { date: '2025-05-05', value: 60 }, { date: '2025-05-10', value: 55 },
      { date: '2025-05-15', value: 65 }, { date: '2025-05-20', value: 70 }, { date: '2025-05-25', value: 68 },
      { date: '2025-05-30', value: 75 },
    ],
    'รย.2': [
      { date: '2025-05-01', value: 30 }, { date: '2025-05-05', value: 35 }, { date: '2025-05-10', value: 32 },
      { date: '2025-05-15', value: 40 }, { date: '2025-05-20', value: 38 }, { date: '2025-05-25', value: 42 },
      { date: '2025-05-30', value: 45 },
    ],
    'รย.3': [
      { date: '2025-05-01', value: 10 }, { date: '2025-05-05', value: 12 }, { date: '2025-05-10', value: 11 },
      { date: '2025-05-15', value: 15 }, { date: '2025-05-20', value: 14 }, { date: '2025-05-25', value: 16 },
      { date: '2025-05-30', value: 18 },
    ],
    'รย.12': [
      { date: '2025-05-01', value: 5 }, { date: '2025-05-05', value: 8 }, { date: '2025-05-10', value: 7 },
      { date: '2025-05-15', value: 10 }, { date: '2025-05-20', value: 9 }, { date: '2025-05-25', value: 11 },
      { date: '2025-05-30', value: 13 },
    ],
  }), []);

  const taxRenewalData = useMemo(() => [
    { date: '2025-05-01', value: 80 }, { date: '2025-05-02', value: 95 },
    { date: '2025-05-03', value: 88 }, { date: '2025-05-04', value: 105 },
    { date: '2025-05-05', value: 92 }, { date: '2025-05-06', value: 110 },
    { date: '2025-05-07', value: 100 }, { date: '2025-05-08', value: 115 },
    { date: '2025-05-09', value: 120 }, { date: '2025-05-10', value: 108 },
    { date: '2025-05-11', value: 125 }, { date: '2025-05-12', value: 112 },
    { date: '2025-05-13', value: 130 }, { date: '2025-05-14', value: 118 },
    { date: '2025-05-15', value: 135 }, { date: '2025-05-16', value: 122 },
    { date: '2025-05-17', value: 140 }, { date: '2025-05-18', value: 128 },
    { date: '2025-05-19', value: 145 }, { date: '2025-05-20', value: 132 },
    { date: '2025-05-21', value: 150 }, { date: '2025-05-22', value: 138 },
    { date: '2025-05-23', value: 155 }, { date: '2025-05-24', value: 142 },
    { date: '2025-05-25', value: 160 }, { date: '2025-05-26', value: 148 },
    { date: '2025-05-27', value: 165 }, { date: '2025-05-28', value: 152 },
    { date: '2025-05-29', value: 170 }, { date: '2025-05-30', value: 158 },
    { date: '2025-05-31', value: 175 },
  ], []);

  // เพิ่ม state สำหรับวันที่อัปเดตล่าสุด (string)
  const [lastUpdate, setLastUpdate] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState('');
  useEffect(() => {
    // แปลงวันที่เป็น string ฝั่ง client เท่านั้น
    setLastUpdate(new Date().toLocaleDateString('th-TH', {
      dateStyle: 'long',
      timeZone: 'Asia/Bangkok',
    }));
    setLastUpdateTime(new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Bangkok',
    }));
  }, []);


  return (
    <AnimatedPage>
      {/* SECTION 1: Page Header and Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <motion.h1
            className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white"
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            แดชบอร์ดภาพรวม
          </motion.h1>
          <motion.p
            className="text-xl text-gray-600 dark:text-gray-400 mt-2"
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            ภาพรวมของระบบ ข้อมูลสำคัญ และกิจกรรมล่าสุด
          </motion.p>
        </div>
        <motion.div variants={itemVariants} className="flex gap-2" transition={{ duration: 0.2 }}>
          <Link
            href="/billing"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            📄 รายการบิล
          </Link>
          <Link
            href="/tax-expiry-next-year"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            ภาษีครั้งถัดไป
          </Link>
        </motion.div>
      </div>

       {/* SECTION 2: Summary and Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Overall Summary Card - spanning 2 columns on large screens */}
        <motion.div variants={itemVariants} className="lg:col-span-2" transition={{ duration: 0.2 }}>
          <Card title="ภาพรวมสรุป (Overall Summary)" className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">ผู้ใช้งานเฉลี่ยต่อวัน (เดือนนี้)</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">185</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">จาก 30 วันที่ผ่านมา</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">รถที่ตรวจสภาพแล้ว (สัปดาห์นี้)</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">320 คัน</p>
                <p className="text-xs text-green-600 dark:text-green-400">+12% จากสัปดาห์ก่อน</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">ยอดต่อภาษี (รายปี)</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">1,560 ราย</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">เป้าหมาย: 2,000 ราย</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              ข้อมูลอัปเดตล่าสุด: {lastUpdate} เวลา {lastUpdateTime}
            </p>
          </Card>
        </motion.div>

        {/* Individual KPI Cards Container - This div wraps the map */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          {dashboardStats.map((stat) => (
            <motion.div key={stat.label} variants={itemVariants} transition={{ duration: 0.2 }}>
              {/* This is the corrected Card call with the required 'title' prop */}
              <Card title={stat.label}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{stat.description}</p>
                  </div>
                  <div className="text-4xl">{stat.icon}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

      </div>

      {/* SECTION 3: Primary Charts */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
        {/* User Access Chart */}
        <motion.div variants={itemVariants} transition={{ duration: 0.2 }}>
          <Card title="ข้อมูลลูกค้าเข้าใช้งาน" className="h-full">
            <TimeSeriesChart
              data={userAccessData}
              dataKey="value"
              name="จำนวนผู้ใช้งาน"
              chartType="line"
              chartColor="rgba(75, 192, 192, 0.6)" // Teal-like color
              borderColor="rgba(75, 192, 192, 1)"
            />
          </Card>
        </motion.div>

        {/* Tax Renewal Statistics Chart */}
        <motion.div variants={itemVariants} transition={{ duration: 0.2 }}>
          <Card title="สถิติต่อภาษี" className="h-full">
            <TimeSeriesChart
              data={taxRenewalData}
              dataKey="value"
              name="จำนวนการต่อภาษี"
              chartType="bar"
              chartColor="rgba(153, 102, 255, 0.6)" // Purple color
              borderColor="rgba(153, 102, 255, 1)"
            />
          </Card>
        </motion.div>
      </div>

      {/* SECTION 4: Detailed Charts & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Vehicle Inspection Data Chart by Type */}
        <motion.div variants={itemVariants} transition={{ duration: 0.2 }}>
          <Card title="ข้อมูลการตรวจสภาพรถ (ตามประเภท)" className="h-full">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">แสดงจำนวนรถที่ได้รับการตรวจสภาพตามประเภท (รย.1, รย.2, รย.3, รย.12)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(inspectionData).map(([type, data]) => (
                <TimeSeriesChart
                  key={type}
                  data={data}
                  dataKey="value"
                  name={`จำนวน ${type}`}
                  chartType="line"
                  chartColor={type === 'รย.1' ? "rgba(255, 99, 132, 0.6)" :
                    type === 'รย.2' ? "rgba(54, 162, 235, 0.6)" :
                      type === 'รย.3' ? "rgba(255, 206, 86, 0.6)" :
                        "rgba(75, 192, 192, 0.6)"}
                  borderColor={type === 'รย.1' ? "rgba(255, 99, 132, 1)" :
                    type === 'รย.2' ? "rgba(54, 162, 235, 1)" :
                      type === 'รย.3' ? "rgba(255, 206, 86, 1)" :
                        "rgba(75, 192, 192, 1)"}
                  className="mb-4"
                />
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Recent Activities */}
        <motion.div variants={itemVariants} transition={{ duration: 0.2 }}>
          <Card title="กิจกรรมล่าสุด (Recent Activities)" className="h-full">
            <RecentActivities />
          </Card>
        </motion.div>
      </div>

      {/* SECTION 5: Back to Home Button (or Footer) */}
      <motion.div variants={itemVariants} className="mt-8 text-center" transition={{ duration: 0.2 }}>
        <Link
          href="/"
          className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          กลับหน้าหลัก
        </Link>
      </motion.div>
    </AnimatedPage>
  );
}