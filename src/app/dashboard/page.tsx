"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { itemVariants } from '../components/AnimatedPage';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faCar,
  faCheckCircle,
  faExclamationTriangle,
  faBell,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';

import { useCustomerData } from '@/lib/useCustomerData';
import FilterDropdown from '../components/FilterDropdown';

export default function DashboardPage() {
  const [thisMonthRenewals, setThisMonthRenewals] = useState(0);
  const [upcomingExpiry, setUpcomingExpiry] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [nextYearTax, setNextYearTax] = useState<Record<string, unknown>[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [taxMonthlyData, setTaxMonthlyData] = useState<{month: string, count: number, monthNum: number}[]>([]);
  const [taxDailyData, setTaxDailyData] = useState<{day: number, count: number}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState('');
  
  // States สำหรับกราฟตรวจรถ
  const [inspectionMonthlyData, setInspectionMonthlyData] = useState<{month: string, count: number, monthNum: number, byType: Record<string, number>}[]>([]);
  const [inspectionDailyData, setInspectionDailyData] = useState<{day: number, count: number, byType: Record<string, number>}[]>([]);
  const [selectedInspectionMonth, setSelectedInspectionMonth] = useState<number | null>(null);

  const { rawData: customerData } = useCustomerData();

  // คำนวณสถิติ
  useEffect(() => {
    if (customerData && customerData.data) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      let monthCount = 0;
      let upcomingCount = 0;
      let overdueCountTemp = 0;
      
      customerData.data.forEach((item: Record<string, unknown>) => {
        const lastTaxDate = String(item['registerDate'] || item['วันที่ชำระภาษีล่าสุด'] || '');
        
        if (lastTaxDate) {
          let month = 0;
          let year = 0;
          
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastTaxDate)) {
            const [, mm, yyyy] = lastTaxDate.split('/');
            month = parseInt(mm);
            year = parseInt(yyyy);
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(lastTaxDate)) {
            const [yyyy, mm] = lastTaxDate.split('-');
            month = parseInt(mm);
            year = parseInt(yyyy);
          } else if (lastTaxDate.includes('T')) {
            const dateObj = new Date(lastTaxDate);
            month = dateObj.getMonth() + 1;
            year = dateObj.getFullYear();
          }
          
          if (month === currentMonth && year === currentYear) {
            monthCount++;
          }
        }
        
        const status = String(item['status'] || item['สถานะ'] || '');
        if (status === 'กำลังจะครบกำหนด') {
          upcomingCount++;
        } else if (status === 'เกินกำหนด') {
          overdueCountTemp++;
        }
      });
      
      setThisMonthRenewals(monthCount);
      setUpcomingExpiry(upcomingCount);
      setOverdueCount(overdueCountTemp);
    }
  }, [customerData]);

  // คำนวณภาษีครั้งถัดไป
  useEffect(() => {
    if (customerData && customerData.data) {
      const now = new Date();
      const nextYear = now.getFullYear() + 1;
      const filtered = customerData.data.filter((item: Record<string, unknown>) => {
        const lastTaxDate = String(item['registerDate'] || item['วันที่ชำระภาษีล่าสุด'] || '');
        
        if (lastTaxDate) {
          let year = 0;
          
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastTaxDate)) {
            const [, , yyyy] = lastTaxDate.split('/');
            year = parseInt(yyyy);
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(lastTaxDate)) {
            const [yyyy] = lastTaxDate.split('-');
            year = parseInt(yyyy);
          } else if (lastTaxDate.includes('T')) {
            year = new Date(lastTaxDate).getFullYear();
          }
          
          return year === nextYear;
        }
        return false;
      });
      
      setTotalCustomers(customerData.data.length);
      setNextYearTax(filtered.slice(0, 10));
    }
  }, [customerData]);

  // คำนวณข้อมูลรายเดือน
  useEffect(() => {
    if (customerData && customerData.data) {
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                         'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      
      const monthlyData: {[key: number]: number} = {};
      for (let i = 0; i < 12; i++) {
        monthlyData[i] = 0;
      }
      
      customerData.data.forEach((item: Record<string, unknown>) => {
        const lastTaxDate = String(item['registerDate'] || item['วันที่ชำระภาษีล่าสุด'] || '');
        
        if (lastTaxDate) {
          let month = -1;
          
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastTaxDate)) {
            const [, mm] = lastTaxDate.split('/');
            month = parseInt(mm) - 1;
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(lastTaxDate)) {
            const [, mm] = lastTaxDate.split('-');
            month = parseInt(mm) - 1;
          } else if (lastTaxDate.includes('T')) {
            month = new Date(lastTaxDate).getMonth();
          }
          
          if (month >= 0 && month < 12) {
            monthlyData[month]++;
          }
        }
      });
      
      const array = Object.entries(monthlyData).map(([monthNum, count]) => ({
        month: monthNames[parseInt(monthNum)],
        count: count,
        monthNum: parseInt(monthNum)
      }));
      
      setTaxMonthlyData(array);
    }
  }, [customerData]);

  // คำนวณข้อมูลตรวจรถรายเดือน
  useEffect(() => {
    if (customerData && customerData.data) {
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                         'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      
      const monthlyData: {[key: number]: {total: number, byType: Record<string, number>}} = {};
      for (let i = 0; i < 12; i++) {
        monthlyData[i] = { total: 0, byType: {} };
      }
      
      // กรองเฉพาะที่มีแท็ก "ตรอ."
      customerData.data.forEach((item: Record<string, unknown>) => {
        const tags = item['tags'] as string[] | undefined;
        if (!tags || !tags.includes('ตรอ.')) return;
        
        const lastInspectionDate = String(item['registerDate'] || item['วันที่ชำระภาษีล่าสุด'] || '');
        const vehicleType = String(item['vehicleType'] || '');
        
        if (lastInspectionDate) {
          let month = -1;
          
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastInspectionDate)) {
            const [, mm] = lastInspectionDate.split('/');
            month = parseInt(mm) - 1;
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(lastInspectionDate)) {
            const [, mm] = lastInspectionDate.split('-');
            month = parseInt(mm) - 1;
          } else if (lastInspectionDate.includes('T')) {
            month = new Date(lastInspectionDate).getMonth();
          }
          
          if (month >= 0 && month < 12) {
            monthlyData[month].total++;
            if (vehicleType) {
              monthlyData[month].byType[vehicleType] = (monthlyData[month].byType[vehicleType] || 0) + 1;
            }
          }
        }
      });
      
      const array = Object.entries(monthlyData).map(([monthNum, data]) => ({
        month: monthNames[parseInt(monthNum)],
        count: data.total,
        monthNum: parseInt(monthNum),
        byType: data.byType
      }));
      
      setInspectionMonthlyData(array);
      console.log('📊 Inspection Monthly Data:', array);
    }
  }, [customerData]);

  // คำนวณข้อมูลรายวัน
  useEffect(() => {
    if (customerData && customerData.data && selectedMonth !== null) {
      const currentYear = new Date().getFullYear();
      const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
      
      const dailyData: {[key: number]: number} = {};
      for (let i = 1; i <= daysInMonth; i++) {
        dailyData[i] = 0;
      }
      
      customerData.data.forEach((item: Record<string, unknown>) => {
        const lastTaxDate = String(item['registerDate'] || item['วันที่ชำระภาษีล่าสุด'] || '');
        
        if (lastTaxDate) {
          let day = -1;
          let month = -1;
          
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastTaxDate)) {
            const [dd, mm] = lastTaxDate.split('/');
            day = parseInt(dd);
            month = parseInt(mm) - 1;
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(lastTaxDate)) {
            const [, mm, dd] = lastTaxDate.split('-');
            day = parseInt(dd);
            month = parseInt(mm) - 1;
          } else if (lastTaxDate.includes('T')) {
            const dateObj = new Date(lastTaxDate);
            day = dateObj.getDate();
            month = dateObj.getMonth();
          }
          
          if (month === selectedMonth && day >= 1 && day <= daysInMonth) {
            dailyData[day]++;
          }
        }
      });
      
      const array = Object.entries(dailyData).map(([day, count]) => ({
        day: parseInt(day),
        count: count
      }));
      
      setTaxDailyData(array);
    }
  }, [customerData, selectedMonth]);

  // คำนวณข้อมูลตรวจรถรายวัน
  useEffect(() => {
    if (customerData && customerData.data && selectedInspectionMonth !== null) {
      const currentYear = new Date().getFullYear();
      const daysInMonth = new Date(currentYear, selectedInspectionMonth + 1, 0).getDate();
      
      const dailyData: {[key: number]: {total: number, byType: Record<string, number>}} = {};
      for (let i = 1; i <= daysInMonth; i++) {
        dailyData[i] = { total: 0, byType: {} };
      }
      
      // กรองเฉพาะที่มีแท็ก "ตรอ."
      customerData.data.forEach((item: Record<string, unknown>) => {
        const tags = item['tags'] as string[] | undefined;
        if (!tags || !tags.includes('ตรอ.')) return;
        
        const lastInspectionDate = String(item['registerDate'] || item['วันที่ชำระภาษีล่าสุด'] || '');
        const vehicleType = String(item['vehicleType'] || '');
        
        if (lastInspectionDate) {
          let day = -1;
          let month = -1;
          
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastInspectionDate)) {
            const [dd, mm] = lastInspectionDate.split('/');
            day = parseInt(dd);
            month = parseInt(mm) - 1;
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(lastInspectionDate)) {
            const [, mm, dd] = lastInspectionDate.split('-');
            day = parseInt(dd);
            month = parseInt(mm) - 1;
          } else if (lastInspectionDate.includes('T')) {
            const dateObj = new Date(lastInspectionDate);
            day = dateObj.getDate();
            month = dateObj.getMonth();
          }
          
          if (month === selectedInspectionMonth && day >= 1 && day <= daysInMonth) {
            dailyData[day].total++;
            if (vehicleType) {
              dailyData[day].byType[vehicleType] = (dailyData[day].byType[vehicleType] || 0) + 1;
            }
          }
        }
      });
      
      const array = Object.entries(dailyData).map(([day, data]) => ({
        day: parseInt(day),
        count: data.total,
        byType: data.byType
      }));
      
      setInspectionDailyData(array);
      console.log('📊 Inspection Daily Data for month', selectedInspectionMonth, ':', array);
    }
  }, [customerData, selectedInspectionMonth]);

  // อัปเดตวันที่
  useEffect(() => {
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

  const dashboardStats = [
    { label: "รถทั้งหมด", value: totalCustomers.toString(), icon: faCar, description: "จำนวนรถในระบบ" },
    { label: "ต่อภาษีเดือนนี้", value: thisMonthRenewals.toString(), icon: faCheckCircle, description: "รถที่ต่อภาษีในเดือนนี้" },
    { label: "กำลังจะครบกำหนด", value: upcomingExpiry.toString(), icon: faExclamationTriangle, description: "รถที่ใกล้ครบกำหนดต่อภาษี" },
    { label: "เกินกำหนด", value: overdueCount.toString(), icon: faExclamationCircle, description: "รถที่เกินกำหนดต่อภาษี" },
    { label: "ต้องต่อภาษีปีหน้า", value: nextYearTax.length.toString(), icon: faCalendarAlt, description: "รถที่ต้องต่อภาษีในปีถัดไป" },
    { label: "ต่อภาษีแล้ว", value: (customerData?.data?.filter((item: Record<string, unknown>) => item.status === 'ต่อภาษีแล้ว').length || 0).toString(), icon: faCheckCircle, description: "รถที่ต่อภาษีเรียบร้อยแล้ว" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100/30 to-white dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              แดชบอร์ดภาษีรถยนต์
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              อัปเดต: {lastUpdate} {lastUpdateTime}
            </p>
        </div>
          <div className="flex gap-3">
          <Link
              href="/customer-info"
              className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700"
              title="ข้อมูลรถยนต์"
          >
              <FontAwesomeIcon icon={faCar} className="text-purple-600 dark:text-purple-400 text-xl" />
          </Link>
          <Link
            href="/tax-expiry-next-year"
              className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700"
              title="ภาษีครั้งถัดไป"
          >
              <FontAwesomeIcon icon={faCalendarAlt} className="text-purple-600 dark:text-purple-400 text-xl" />
          </Link>
          </div>
        </div>

        {/* Total Summary */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl shadow-2xl p-8 text-white">
            <div className="text-center">
              <p className="text-sm opacity-90 mb-2">จำนวนรถทั้งหมดในระบบ</p>
              <p className="text-6xl font-bold mb-1">{totalCustomers.toLocaleString()}</p>
              <p className="text-lg opacity-90">คัน</p>
            </div>
          </div>
        </motion.div>

        {/* Tax Chart - Full Width */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">กราฟการต่อภาษี</h2>
              
              {/* Dropdown เลือกเดือน */}
              <div className="w-48">
                <FilterDropdown
                  value={selectedMonth === null ? '' : selectedMonth.toString()}
                  onChange={(value) => setSelectedMonth(value === '' ? null : parseInt(value))}
                  icon={faCalendarAlt}
                  placeholder="เลือกเดือน"
                  options={[
                    { value: '', label: 'ทั้งปี' },
                    ...taxMonthlyData.map(data => ({
                      value: data.monthNum.toString(),
                      label: data.month
                    }))
                  ]}
                />
              </div>
            </div>
            
            {/* Chart */}
            <div className="relative h-96 mb-4 bg-white dark:bg-gray-900/20 rounded-xl p-4 overflow-hidden">
              {/* Grid Lines Background */}
              <div className="absolute inset-4 pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-full border-t border-gray-200 dark:border-gray-700"
                    style={{ bottom: `${(i + 1) * 20}%` }}
                  />
                ))}
      </div>

              {selectedMonth === null ? (
                <div className="absolute inset-4 flex items-end justify-between gap-1">
                  {taxMonthlyData.map((data, index) => {
                    const maxCount = Math.max(...taxMonthlyData.map(d => d.count), 1);
                    const heightPercentage = data.count > 0 ? Math.max((data.count / maxCount) * 100, 20) : 0;
                    const isCurrentMonth = new Date().getMonth() === data.monthNum;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full">
                        <div className="flex-1 w-full flex flex-col justify-end items-center">
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">
                            {data.count}
                          </span>
          <motion.div 
                            className={`w-full rounded-t-xl shadow-lg ${
                              isCurrentMonth 
                                ? 'bg-gradient-to-t from-purple-700 to-purple-500' 
                                : 'bg-gradient-to-t from-purple-500 to-purple-400'
                            }`}
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercentage}%` }}
                            transition={{ duration: 1, delay: index * 0.06, ease: 'easeOut' }}
                            style={{ minHeight: data.count > 0 ? '40px' : '0', maxHeight: '100%' }}
                          />
      </div>
                        <span className={`text-xs font-medium mt-2 ${
                          isCurrentMonth ? 'text-purple-700 dark:text-purple-300 font-bold' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {data.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="absolute inset-4 flex items-end justify-between gap-1">
                  {taxDailyData.map((data, index) => {
                    const maxCount = Math.max(...taxDailyData.map(d => d.count), 1);
                    const heightPercentage = data.count > 0 ? Math.max((data.count / maxCount) * 100, 15) : 0;
                    const isToday = new Date().getDate() === data.day && new Date().getMonth() === selectedMonth;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full">
                          <div className="flex-1 w-full flex flex-col justify-end items-center">
                            {data.count > 0 && (
                              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">
                                {data.count}
                              </span>
                            )}
                            <motion.div 
                              className={`w-full rounded-t-lg shadow-md ${
                                isToday 
                                  ? 'bg-gradient-to-t from-purple-700 to-purple-500' 
                                  : data.count > 0
                                    ? 'bg-gradient-to-t from-purple-500 to-purple-400'
                                    : 'bg-gray-300 dark:bg-gray-700'
                              }`}
                              initial={{ height: 0 }}
                              animate={{ height: `${heightPercentage}%` }}
                              transition={{ duration: 0.8, delay: index * 0.02, ease: 'easeOut' }}
                              style={{ minHeight: data.count > 0 ? '30px' : '8px', maxHeight: '100%' }}
                            />
                    </div>
                          <span className={`text-xs font-medium mt-1 ${
                            isToday ? 'text-purple-700 dark:text-purple-300 font-bold' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {data.day}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {selectedMonth === null ? (
                <>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รวม</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {taxMonthlyData.reduce((sum, d) => sum + d.count, 0)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">เฉลี่ย/เดือน</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(taxMonthlyData.reduce((sum, d) => sum + d.count, 0) / 12)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รวมเดือนนี้</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {taxDailyData.reduce((sum, d) => sum + d.count, 0)} คัน
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">เฉลี่ย/วัน</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                      {taxDailyData.length > 0 ? Math.round(taxDailyData.reduce((sum, d) => sum + d.count, 0) / taxDailyData.length) : 0} คัน
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* กราฟตรวจรถ - Full Width */}
        <motion.div
          variants={itemVariants}
          className="mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  📋 สถิติการตรวจรถ (ตรอ.)
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {selectedInspectionMonth === null 
                    ? 'ภาพรวมการตรวจรถทั้งปี (แยกตามเดือน)' 
                    : `รายละเอียดการตรวจรถในเดือน ${inspectionMonthlyData[selectedInspectionMonth]?.month || ''}`}
                </p>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-t from-blue-600 to-blue-400"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">รย.1</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-t from-yellow-600 to-yellow-400"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">รย.2</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-t from-orange-600 to-orange-400"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">รย.3</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-t from-pink-600 to-pink-400"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">รย.12</span>
                  </div>
                </div>
              </div>
              
              {/* Dropdown เลือกเดือน */}
              <div className="w-48">
                <FilterDropdown
                  value={selectedInspectionMonth === null ? '' : selectedInspectionMonth.toString()}
                  onChange={(value) => setSelectedInspectionMonth(value === '' ? null : parseInt(value))}
                  icon={faCalendarAlt}
                  placeholder="เลือกเดือน"
                  options={[
                    { value: '', label: 'ทั้งปี' },
                    ...inspectionMonthlyData.map(data => ({
                      value: data.monthNum.toString(),
                      label: data.month
                    }))
                  ]}
                />
              </div>
            </div>
            
            {/* Chart */}
            <div className="relative h-96 mb-4 bg-white dark:bg-gray-900/20 rounded-xl p-4 overflow-hidden">
              {/* Grid Lines Background */}
              <div className="absolute inset-4 pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-full border-t border-gray-200 dark:border-gray-700"
                    style={{ bottom: `${(i + 1) * 20}%` }}
                  />
        ))}
      </div>

              {selectedInspectionMonth === null ? (
                <div className="absolute inset-4 flex items-end justify-between gap-2">
                  {inspectionMonthlyData.map((data, index) => {
                    const vehicleTypes = ['รย.1', 'รย.2', 'รย.3', 'รย.12'];
                    const colors = [
                      'bg-gradient-to-t from-blue-600 to-blue-400',
                      'bg-gradient-to-t from-yellow-600 to-yellow-400', 
                      'bg-gradient-to-t from-orange-600 to-orange-400',
                      'bg-gradient-to-t from-pink-600 to-pink-400'
                    ];
                    const maxCount = Math.max(
                      ...inspectionMonthlyData.flatMap(d => 
                        vehicleTypes.map(type => d.byType[type] || 0)
                      ),
                      1
                    );
                    const isCurrentMonth = new Date().getMonth() === data.monthNum;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full">
                        <div className="flex-1 w-full flex items-end justify-center gap-0.5">
                          {vehicleTypes.map((type, typeIndex) => {
                            const count = data.byType[type] || 0;
                            const heightPercentage = count > 0 ? Math.max((count / maxCount) * 100, 15) : 0;
                            
                            return (
                              <div key={typeIndex} className="flex-1 flex flex-col items-center justify-end h-full">
                                {count > 0 && (
                                  <span className="text-[9px] font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                                    {count}
                                  </span>
                                )}
                                <motion.div 
                                  className={`w-full rounded-t-md shadow-md ${colors[typeIndex]}`}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${heightPercentage}%` }}
                                  transition={{ duration: 1, delay: index * 0.06 + typeIndex * 0.02, ease: 'easeOut' }}
                                  style={{ minHeight: count > 0 ? '25px' : '0', maxHeight: '100%' }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <span className={`text-xs font-medium mt-1 ${
                          isCurrentMonth ? 'text-green-700 dark:text-green-300 font-bold' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {data.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="absolute inset-4 flex items-end justify-between gap-1">
                  {inspectionDailyData.map((data, index) => {
                    const vehicleTypes = ['รย.1', 'รย.2', 'รย.3', 'รย.12'];
                    const colors = [
                      'bg-gradient-to-t from-blue-600 to-blue-400',
                      'bg-gradient-to-t from-yellow-600 to-yellow-400', 
                      'bg-gradient-to-t from-orange-600 to-orange-400',
                      'bg-gradient-to-t from-pink-600 to-pink-400'
                    ];
                    const maxCount = Math.max(
                      ...inspectionDailyData.flatMap(d => 
                        vehicleTypes.map(type => d.byType[type] || 0)
                      ),
                      1
                    );
                    const isToday = new Date().getDate() === data.day && new Date().getMonth() === selectedInspectionMonth;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1 h-full">
                        <div className="flex-1 w-full flex items-end justify-center gap-0.5">
                          {vehicleTypes.map((type, typeIndex) => {
                            const count = data.byType[type] || 0;
                            const heightPercentage = count > 0 ? Math.max((count / maxCount) * 100, 12) : 0;
                            
                            return (
                              <div key={typeIndex} className="flex-1 flex flex-col items-center justify-end h-full">
                                {count > 0 && (
                                  <span className="text-[8px] font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                                    {count}
                                  </span>
                                )}
                                <motion.div 
                                  className={`w-full rounded-t-sm shadow-sm ${colors[typeIndex]}`}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${heightPercentage}%` }}
                                  transition={{ duration: 0.8, delay: index * 0.01 + typeIndex * 0.01, ease: 'easeOut' }}
                                  style={{ minHeight: count > 0 ? '20px' : '0', maxHeight: '100%' }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <span className={`text-xs font-medium mt-0.5 ${
                          isToday ? 'text-green-700 dark:text-green-300 font-bold' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {data.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {selectedInspectionMonth === null ? (
                <>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รวมทั้งหมด</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {inspectionMonthlyData.reduce((sum, d) => sum + d.count, 0)} คัน
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.1</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {inspectionMonthlyData.reduce((sum, d) => sum + (d.byType['รย.1'] || 0), 0)} คัน
                    </p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.2</p>
                    <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                      {inspectionMonthlyData.reduce((sum, d) => sum + (d.byType['รย.2'] || 0), 0)} คัน
                    </p>
                    </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.3</p>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {inspectionMonthlyData.reduce((sum, d) => sum + (d.byType['รย.3'] || 0), 0)} คัน
                    </p>
                    </div>
                  <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.12</p>
                    <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                      {inspectionMonthlyData.reduce((sum, d) => sum + (d.byType['รย.12'] || 0), 0)} คัน
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รวมเดือนนี้</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      {inspectionDailyData.reduce((sum, d) => sum + d.count, 0)} คัน
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.1</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {inspectionDailyData.reduce((sum, d) => sum + (d.byType['รย.1'] || 0), 0)} คัน
                    </p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.2</p>
                    <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                      {inspectionDailyData.reduce((sum, d) => sum + (d.byType['รย.2'] || 0), 0)} คัน
                    </p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.3</p>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {inspectionDailyData.reduce((sum, d) => sum + (d.byType['รย.3'] || 0), 0)} คัน
                    </p>
                  </div>
                  <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.12</p>
                    <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                      {inspectionDailyData.reduce((sum, d) => sum + (d.byType['รย.12'] || 0), 0)} คัน
                    </p>
                </div>
                </>
              )}
            </div>
            </div>
        </motion.div>

        {/* KPI Cards - Full Width */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {dashboardStats.map((stat, index) => (
              <motion.div 
                key={stat.label}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all p-5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                      <FontAwesomeIcon 
                        icon={stat.icon} 
                        className="text-lg text-purple-600 dark:text-purple-400"
                      />
                    </div>
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-1">
                      {stat.label}
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Next Year Tax */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" transition={{ delay: 0.5 }} className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">รถที่ต้องต่อภาษีปีหน้า</h2>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full text-sm font-bold text-purple-600 dark:text-purple-400">
                {nextYearTax.length} คัน
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
              {nextYearTax.length > 0 ? (
                nextYearTax.map((customer: Record<string, unknown>, index: number) => (
                  <div 
                    key={index} 
                    className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faCar} className="text-purple-600 dark:text-purple-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {String(customer.licensePlate || 'ไม่มีทะเบียน')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {String(customer.customerName || 'ไม่มีชื่อลูกค้า')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-400">
                  <p>ไม่มีข้อมูล</p>
                </div>
              )}
            </div>
            
            {nextYearTax.length > 9 && (
              <div className="mt-4 text-center">
              <Link 
                href="/tax-expiry-next-year"
                  className="text-purple-600 dark:text-purple-400 hover:underline text-sm font-medium"
              >
                  ดูทั้งหมด
              </Link>
              </div>
            )}
            </div>
        </motion.div>

        {/* Alerts */}
        {(upcomingExpiry > 0 || overdueCount > 0) && (
          <motion.div variants={itemVariants} initial="hidden" animate="show" transition={{ delay: 0.6 }} className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border-l-4 border-purple-500">
                <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faBell} className="text-xl text-purple-600 dark:text-purple-400" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">การแจ้งเตือน</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {upcomingExpiry > 0 && <span>ใกล้ครบ {upcomingExpiry} คัน</span>}
                    {upcomingExpiry > 0 && overdueCount > 0 && <span> • </span>}
                    {overdueCount > 0 && <span>เกินกำหนด {overdueCount} คัน</span>}
                  </div>
                </div>
              </div>
            </div>
        </motion.div>
        )}
      </div>
        </div>
  );
}
