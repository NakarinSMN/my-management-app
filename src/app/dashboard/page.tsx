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
import { useDashboardSummary } from '@/lib/useDashboardSummary';
import FilterDropdown from '../components/FilterDropdown';

export default function DashboardPage() {
  const [thisMonthRenewals, setThisMonthRenewals] = useState(0);
  const [upcomingExpiry, setUpcomingExpiry] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [nextYearTax, setNextYearTax] = useState<Record<string, unknown>[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [taxMonthlyData, setTaxMonthlyData] = useState<{month: string, count: number, monthNum: number, byType: Record<string, number>}[]>([]);
  const [taxDailyData, setTaxDailyData] = useState<{day: number, count: number, byType: Record<string, number>}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState('');
  
  // States สำหรับกราฟตรวจรถ
  const [inspectionMonthlyData, setInspectionMonthlyData] = useState<{month: string, count: number, monthNum: number, byType: Record<string, number>}[]>([]);
  const [inspectionDailyData, setInspectionDailyData] = useState<{day: number, count: number, byType: Record<string, number>}[]>([]);
  const [selectedInspectionMonth, setSelectedInspectionMonth] = useState<number | null>(null);
  const [selectedInspectionYear, setSelectedInspectionYear] = useState<number>(new Date().getFullYear());
  const [inspection7DaysData, setInspection7DaysData] = useState<{date: string, count: number, byType: Record<string, number>}[]>([]);
  const [hoveredBar, setHoveredBar] = useState<{x: number, y: number, data: {label: string, count: number, details: Record<string, number>}} | null>(null);

  const { rawData: customerData } = useCustomerData();
  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary();

  // ดึงค่าสรุปจาก API dashboard-summary (เร็วกว่าและ payload เล็กกว่า)
  useEffect(() => {
    if (summary) {
      setTotalCustomers(summary.totalCustomers);
      setThisMonthRenewals(summary.thisMonthRenewals);
      setUpcomingExpiry(summary.upcomingExpiry);
      setOverdueCount(summary.overdueCount);
      setNextYearTax(summary.nextYearTax as unknown as Record<string, unknown>[]);
    }
  }, [summary]);

  // คำนวณข้อมูลรายเดือน (กรองเฉพาะที่มีแท็ก "ภาษี")
  useEffect(() => {
    if (customerData && customerData.data) {
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
                         'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      
      const monthlyData: {[key: number]: {total: number, byType: Record<string, number>}} = {};
      for (let i = 0; i < 12; i++) {
        monthlyData[i] = { total: 0, byType: {} };
      }
      
      customerData.data.forEach((item: Record<string, unknown>) => {
        // กรองเฉพาะที่มีแท็ก "ภาษี"
        const tags = item['tags'] as string[] | undefined;
        if (!tags || !tags.includes('ภาษี')) return;
        
        const lastTaxDate = String(item['registerDate'] || item['วันที่ชำระภาษีล่าสุด'] || '');
        const vehicleType = String(item['vehicleType'] || '');
        
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
      
      // กรองเฉพาะที่มีแท็ก "ตรอ." และปีที่เลือก
      customerData.data.forEach((item: Record<string, unknown>) => {
        const tags = item['tags'] as string[] | undefined;
        if (!tags || !tags.includes('ตรอ.')) return;
        
        const lastInspectionDate = String(item['inspectionDate'] || '');
        const vehicleType = String(item['vehicleType'] || '');
        
        if (lastInspectionDate) {
          let month = -1;
          let year = -1;
          
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastInspectionDate)) {
            const [, mm, yyyy] = lastInspectionDate.split('/');
            month = parseInt(mm) - 1;
            year = parseInt(yyyy);
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(lastInspectionDate)) {
            const [yyyy, mm] = lastInspectionDate.split('-');
            month = parseInt(mm) - 1;
            year = parseInt(yyyy);
          } else if (lastInspectionDate.includes('T')) {
            const dateObj = new Date(lastInspectionDate);
            month = dateObj.getMonth();
            year = dateObj.getFullYear();
          }
          
          if (month >= 0 && month < 12 && year === selectedInspectionYear) {
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
      console.log('📊 Inspection Monthly Data (Year:', selectedInspectionYear, '):', array);
    }
  }, [customerData, selectedInspectionYear]);

  // คำนวณข้อมูลรายวัน (กรองเฉพาะที่มีแท็ก "ภาษี")
  useEffect(() => {
    if (customerData && customerData.data && selectedMonth !== null) {
      const currentYear = new Date().getFullYear();
      const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
      
      const dailyData: {[key: number]: {total: number, byType: Record<string, number>}} = {};
      for (let i = 1; i <= daysInMonth; i++) {
        dailyData[i] = { total: 0, byType: {} };
      }
      
      customerData.data.forEach((item: Record<string, unknown>) => {
        // กรองเฉพาะที่มีแท็ก "ภาษี"
        const tags = item['tags'] as string[] | undefined;
        if (!tags || !tags.includes('ภาษี')) return;
        
        const lastTaxDate = String(item['registerDate'] || item['วันที่ชำระภาษีล่าสุด'] || '');
        const vehicleType = String(item['vehicleType'] || '');
        
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
      
      setTaxDailyData(array);
    }
  }, [customerData, selectedMonth]);

  // คำนวณข้อมูลตรวจรถรายวัน
  useEffect(() => {
    if (customerData && customerData.data && selectedInspectionMonth !== null) {
      const daysInMonth = new Date(selectedInspectionYear, selectedInspectionMonth + 1, 0).getDate();
      
      const dailyData: {[key: number]: {total: number, byType: Record<string, number>}} = {};
      for (let i = 1; i <= daysInMonth; i++) {
        dailyData[i] = { total: 0, byType: {} };
      }
      
      // กรองเฉพาะที่มีแท็ก "ตรอ." และปีที่เลือก
      customerData.data.forEach((item: Record<string, unknown>) => {
        const tags = item['tags'] as string[] | undefined;
        if (!tags || !tags.includes('ตรอ.')) return;
        
        const lastInspectionDate = String(item['inspectionDate'] || '');
        const vehicleType = String(item['vehicleType'] || '');
        
        if (lastInspectionDate) {
          let day = -1;
          let month = -1;
          let year = -1;
          
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastInspectionDate)) {
            const [dd, mm, yyyy] = lastInspectionDate.split('/');
            day = parseInt(dd);
            month = parseInt(mm) - 1;
            year = parseInt(yyyy);
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(lastInspectionDate)) {
            const [yyyy, mm, dd] = lastInspectionDate.split('-');
            day = parseInt(dd);
            month = parseInt(mm) - 1;
            year = parseInt(yyyy);
          } else if (lastInspectionDate.includes('T')) {
            const dateObj = new Date(lastInspectionDate);
            day = dateObj.getDate();
            month = dateObj.getMonth();
            year = dateObj.getFullYear();
          }
          
          if (month === selectedInspectionMonth && year === selectedInspectionYear && day >= 1 && day <= daysInMonth) {
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
      console.log('📊 Inspection Daily Data for month', selectedInspectionMonth, 'year', selectedInspectionYear, ':', array);
    }
  }, [customerData, selectedInspectionMonth, selectedInspectionYear]);

  // คำนวณข้อมูลตรวจรถ 7 วันล่าสุด
  useEffect(() => {
    if (customerData && customerData.data) {
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return date;
      });
      
      const data7Days: {[key: string]: {total: number, byType: Record<string, number>}} = {};
      last7Days.forEach(date => {
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
        data7Days[dateStr] = { total: 0, byType: {} };
      });
      
      // กรองเฉพาะที่มีแท็ก "ตรอ."
      customerData.data.forEach((item: Record<string, unknown>) => {
        const tags = item['tags'] as string[] | undefined;
        if (!tags || !tags.includes('ตรอ.')) return;
        
        const inspectionDate = String(item['inspectionDate'] || '');
        const vehicleType = String(item['vehicleType'] || '');
        
        if (inspectionDate) {
          let itemDate: Date | null = null;
          
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(inspectionDate)) {
            const [dd, mm, yyyy] = inspectionDate.split('/');
            itemDate = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(inspectionDate)) {
            itemDate = new Date(inspectionDate);
          } else if (inspectionDate.includes('T')) {
            itemDate = new Date(inspectionDate);
          }
          
          if (itemDate) {
            const dateStr = `${itemDate.getDate()}/${itemDate.getMonth() + 1}`;
            if (data7Days[dateStr]) {
              data7Days[dateStr].total++;
              if (vehicleType) {
                data7Days[dateStr].byType[vehicleType] = (data7Days[dateStr].byType[vehicleType] || 0) + 1;
              }
            }
          }
        }
      });
      
      const array = last7Days.map(date => {
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
        return {
          date: dateStr,
          count: data7Days[dateStr].total,
          byType: data7Days[dateStr].byType
        };
      });
      
      setInspection7DaysData(array);
      console.log('📊 Inspection 7 Days Data:', array);
    }
  }, [customerData]);

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
    { label: "ต่อภาษีแล้ว", value: (summary?.alreadyTaxed ?? 0).toString(), icon: faCheckCircle, description: "รถที่ต่อภาษีเรียบร้อยแล้ว" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-100/30 to-white dark:from-gray-900 dark:via-emerald-900/10 dark:to-gray-800 p-8">
      {/* Tooltip */}
      {hoveredBar && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${hoveredBar.x}px`,
            top: `${hoveredBar.y - 10}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="bg-white rounded-lg shadow-xl overflow-hidden min-w-[140px]">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1.5">
              <div className="text-xs font-bold text-blue-600">
                {hoveredBar.data.label}
              </div>
            </div>
            
            {/* Content */}
            <div className="px-3 py-2">
              <div className="text-lg font-bold text-gray-900 mb-2">
                {hoveredBar.data.count} <span className="text-xs font-normal text-gray-500">คัน</span>
              </div>
              
              {Object.keys(hoveredBar.data.details).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(hoveredBar.data.details).map(([type, count]) => (
                    <div 
                      key={type} 
                      className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded text-[10px]"
                    >
                      <span className="font-medium text-gray-600">{type}</span>
                      <span className="font-bold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
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
              <FontAwesomeIcon icon={faCar} className="text-emerald-600 dark:text-emerald-400 text-xl" />
          </Link>
          <Link
            href="/tax-expiry-next-year"
              className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700"
              title="ภาษีครั้งถัดไป"
          >
              <FontAwesomeIcon icon={faCalendarAlt} className="text-emerald-600 dark:text-emerald-400 text-xl" />
          </Link>
          </div>
        </div>

        {/* Total Summary */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="mb-8">
          <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl shadow-2xl p-8 text-white">
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
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">กราฟการต่อภาษี</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  📌 แสดงเฉพาะรายการที่มีแท็ก &quot;ภาษี&quot;
                </p>
              </div>
              
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
            <div className="relative h-96 mb-4 bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-cyan-50/30 dark:from-gray-900/20 dark:via-green-900/10 dark:to-gray-900/20 rounded-xl p-4 overflow-hidden">
              {(() => {
                const maxCount = selectedMonth === null 
                  ? Math.max(...taxMonthlyData.map(d => d.count), 1)
                  : Math.max(...taxDailyData.map(d => d.count), 1);
                const maxScale = Math.ceil(maxCount / 10) * 10 + 10; // ปัดขึ้นเป็น 10
                const steps = 6;
                const stepValue = maxScale / steps;
                const yAxisLabels = Array.from({ length: steps + 1 }, (_, i) => Math.round(i * stepValue));
                
                return (
                  <>
                    {/* Y-axis Labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col-reverse justify-between py-4 pr-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {yAxisLabels.map((label, i) => (
                        <span key={i}>{label}</span>
                      ))}
                    </div>
                    
                    {/* Grid Lines Background */}
                    <div className="absolute inset-4 left-12 pointer-events-none">
                      {/* Y-axis Line */}
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"></div>
                      {/* X-axis Line */}
                      <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-300 dark:bg-gray-600"></div>
                      {/* Grid Lines */}
                      {[...Array(steps)].map((_, i) => (
                        <div 
                          key={i} 
                          className="absolute w-full border-t border-gray-200 dark:border-gray-700"
                          style={{ bottom: `${((i + 1) / steps) * 100}%` }}
                        />
                      ))}
                    </div>
                  </>
                );
              })()}

              {selectedMonth === null ? (
                <>
                  {/* Vertical Grid Lines for Monthly */}
                  <div className="absolute inset-4 left-12 pointer-events-none">
                    {taxMonthlyData.map((_, i) => (
                      <div 
                        key={`v-${i}`}
                        className="absolute h-full border-l border-gray-100 dark:border-gray-800"
                        style={{ left: `${(i / taxMonthlyData.length) * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-4 left-12 flex items-end justify-between gap-1">
                    {taxMonthlyData.map((data, index) => {
                    const maxCount = Math.max(...taxMonthlyData.map(d => d.count), 1);
                    const heightPercentage = data.count > 0 ? Math.max((data.count / maxCount) * 100, 20) : 0;
                    const isCurrentMonth = new Date().getMonth() === data.monthNum;
                    
                    return (
                      <div 
                        key={index} 
                        className="flex-1 flex flex-col items-center h-full cursor-crosshair"
                        onMouseMove={(e) => {
                          setHoveredBar({
                            x: e.clientX,
                            y: e.clientY,
                            data: {
                              label: data.month,
                              count: data.count,
                              details: data.byType
                            }
                          });
                        }}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
                        <div className="flex-1 w-full flex flex-col justify-end items-center">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                            {data.count}
                          </span>
          <motion.div 
                            className={`w-full rounded-t-xl shadow-lg transition-all ${
                              isCurrentMonth 
                                ? 'bg-gradient-to-t from-emerald-400 to-emerald-300' 
                                : 'bg-gradient-to-t from-emerald-300 to-emerald-200'
                            } hover:brightness-110`}
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercentage}%` }}
                            transition={{ duration: 1, delay: index * 0.06, ease: 'easeOut' }}
                            style={{ minHeight: data.count > 0 ? '40px' : '0', maxHeight: '100%' }}
                          />
      </div>
                        <div 
                          className={`px-2 py-1 rounded-md text-xs font-bold text-white mt-2 ${isCurrentMonth ? 'ring-2 ring-emerald-500' : ''}`}
                          style={{ 
                            backgroundColor: ['#3B82F6', '#EC4899', '#10B981', '#F97316', '#22C55E', '#0EA5E9',
                                   '#8B5CF6', '#DB2777', '#84CC16', '#EA580C', '#059669', '#2563EB'][data.monthNum]
                          }}
                        >
                          {data.month}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </>
              ) : (
                <div className="overflow-x-auto -mx-4 px-4 pb-4">
                  <div className="relative flex items-end gap-2 h-80 pl-12" style={{ minWidth: `${taxDailyData.length * 50}px` }}>
                    {taxDailyData.map((data, index) => {
                        const maxCount = Math.max(...taxDailyData.map(d => d.count), 1);
                        const heightPercentage = data.count > 0 ? Math.max((data.count / maxCount) * 100, 15) : 0;
                        const isToday = new Date().getDate() === data.day && new Date().getMonth() === selectedMonth;
                        
                        return (
                          <div 
                            key={index} 
                            className="flex flex-col items-center gap-2 h-full cursor-crosshair" 
                            style={{ width: '40px' }}
                            onMouseMove={(e) => {
                              setHoveredBar({
                                x: e.clientX,
                                y: e.clientY,
                                data: {
                                  label: `วันที่ ${data.day}`,
                                  count: data.count,
                                  details: data.byType
                                }
                              });
                            }}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            <div className="flex-1 w-full flex flex-col justify-end items-center">
                              {data.count > 0 && (
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                                  {data.count}
                                </span>
                              )}
                              <motion.div 
                                className={`w-full rounded-t-lg shadow-md transition-all ${
                                  isToday 
                                    ? 'bg-gradient-to-t from-emerald-400 to-emerald-300' 
                                    : data.count > 0
                                      ? 'bg-gradient-to-t from-emerald-300 to-emerald-200'
                                      : 'bg-gray-200/50 dark:bg-gray-700'
                                } hover:brightness-110`}
                                initial={{ height: 0 }}
                                animate={{ height: `${heightPercentage}%` }}
                                transition={{ duration: 0.8, delay: index * 0.02, ease: 'easeOut' }}
                                style={{ minHeight: data.count > 0 ? '30px' : '8px', maxHeight: '100%' }}
                              />
                            </div>
                            <div 
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white mt-2 ${isToday ? 'ring-2 ring-emerald-500' : ''}`}
                              style={{ 
                                backgroundColor: `hsl(${(data.day - 1) * 12}, 70%, 60%)`
                              }}
                            >
                              {data.day}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {selectedMonth === null ? (
                <>
                  <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รวม</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {taxMonthlyData.reduce((sum, d) => sum + d.count, 0)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">เฉลี่ย/เดือน</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.round(taxMonthlyData.reduce((sum, d) => sum + d.count, 0) / 12)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รวมเดือนนี้</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {taxDailyData.reduce((sum, d) => sum + d.count, 0)} คัน
                    </p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">เฉลี่ย/วัน</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {taxDailyData.length > 0 ? Math.round(taxDailyData.reduce((sum, d) => sum + d.count, 0) / taxDailyData.length) : 0} คัน
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* กราฟเส้น 7 วันล่าสุด - Full Width */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                📈 สถิติ 7 วันล่าสุด
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                แนวโน้มการตรวจรถแบบเส้นโค้ง (กราฟเส้น)
              </p>
              
              {/* Legend */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-300"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">รย.1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-teal-400 to-teal-300"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">รย.2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-300"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">รย.3</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-green-300"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">รย.12</span>
                </div>
              </div>
            </div>
            
            {/* Bar Chart */}
            <div className="relative h-96 bg-gradient-to-br from-emerald-50/30 via-teal-50/30 to-cyan-50/30 dark:from-gray-900/20 dark:via-emerald-900/10 dark:to-gray-900/20 rounded-xl p-4">
              {(() => {
                const vehicleTypes = ['รย.1', 'รย.2', 'รย.3', 'รย.12'];
                const maxCount = Math.max(
                  ...inspection7DaysData.flatMap(d => 
                    vehicleTypes.map(type => d.byType[type] || 0)
                  ),
                  1
                );
                const maxScale = Math.ceil(maxCount / 10) * 10 + 10;
                const steps = 6;
                const stepValue = maxScale / steps;
                const yAxisLabels = Array.from({ length: steps + 1 }, (_, i) => Math.round(i * stepValue));
                
                return (
                  <>
                    {/* Y-axis Labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col-reverse justify-between py-4 pr-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {yAxisLabels.map((label, i) => (
                        <span key={i}>{label}</span>
                      ))}
                    </div>
                    
                    {/* Grid Lines Background */}
                    <div className="absolute inset-4 left-12 pointer-events-none">
                      {/* Y-axis Line */}
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"></div>
                      {/* X-axis Line */}
                      <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-300 dark:bg-gray-600"></div>
                      {/* Grid Lines */}
                      {[...Array(steps)].map((_, i) => (
                        <div 
                          key={i} 
                          className="absolute w-full border-t border-gray-200 dark:border-gray-700"
                          style={{ bottom: `${((i + 1) / steps) * 100}%` }}
                        />
                      ))}
                    </div>
                    
                    {/* Vertical Grid Lines */}
                    <div className="absolute inset-4 left-12 pointer-events-none">
                      {inspection7DaysData.map((_, i) => (
                        <div 
                          key={`v-${i}`}
                          className="absolute h-full border-l border-gray-100 dark:border-gray-800"
                          style={{ left: `${(i / inspection7DaysData.length) * 100}%` }}
                        />
                      ))}
                    </div>
                    
                    {/* Bar Chart Area */}
                    <div className="absolute inset-4 left-12 flex items-end justify-between gap-2">
                      {inspection7DaysData.map((data, index) => {
                        const colors = [
                          'bg-gradient-to-t from-emerald-400 to-emerald-300',
                          'bg-gradient-to-t from-teal-400 to-teal-300', 
                          'bg-gradient-to-t from-cyan-400 to-cyan-300',
                          'bg-gradient-to-t from-green-400 to-green-300'
                        ];
                        
                        return (
                          <div 
                            key={index} 
                            className="flex-1 flex flex-col items-center gap-2 h-full cursor-crosshair"
                            onMouseMove={(e) => {
                              setHoveredBar({
                                x: e.clientX,
                                y: e.clientY,
                                data: {
                                  label: data.date,
                                  count: data.count,
                                  details: data.byType
                                }
                              });
                            }}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
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
                                      className={`w-full rounded-t-md shadow-md transition-all ${colors[typeIndex]} hover:brightness-110`}
                                      initial={{ height: 0 }}
                                      animate={{ height: `${heightPercentage}%` }}
                                      transition={{ duration: 1, delay: index * 0.1 + typeIndex * 0.02, ease: 'easeOut' }}
                                      style={{ minHeight: count > 0 ? '25px' : '0', maxHeight: '100%' }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            <div 
                              className="px-2 py-1 rounded-md text-xs font-bold text-white mt-2"
                              style={{ 
                                backgroundColor: ['#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#10B981', '#0EA5E9', '#DB2777'][index]
                              }}
                            >
                              {data.date}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รวม 7 วัน</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {inspection7DaysData.reduce((sum, d) => sum + d.count, 0)} คัน
                </p>
              </div>
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.1</p>
                <p className="text-xl font-bold" style={{ color: '#9B87F5' }}>
                  {inspection7DaysData.reduce((sum, d) => sum + (d.byType['รย.1'] || 0), 0)} คัน
                </p>
              </div>
              <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.2</p>
                <p className="text-xl font-bold" style={{ color: '#7DD3C0' }}>
                  {inspection7DaysData.reduce((sum, d) => sum + (d.byType['รย.2'] || 0), 0)} คัน
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.3</p>
                <p className="text-xl font-bold" style={{ color: '#F97583' }}>
                  {inspection7DaysData.reduce((sum, d) => sum + (d.byType['รย.3'] || 0), 0)} คัน
                </p>
              </div>
              <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.12</p>
                <p className="text-xl font-bold" style={{ color: '#F5A3D0' }}>
                  {inspection7DaysData.reduce((sum, d) => sum + (d.byType['รย.12'] || 0), 0)} คัน
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* กราฟแท่งตรวจรถ - Full Width */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                    📋 สถิติการตรวจรถ (ตรอ.)
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {selectedInspectionMonth === null 
                      ? `ภาพรวมการตรวจรถทั้งปี ${selectedInspectionYear} (แยกตามเดือน)` 
                      : `รายละเอียดการตรวจรถในเดือน ${inspectionMonthlyData[selectedInspectionMonth]?.month || ''} ปี ${selectedInspectionYear}`}
                  </p>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-sky-400 to-sky-300"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">รย.1</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-blue-400 to-blue-300"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">รย.2</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-cyan-400 to-cyan-300"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">รย.3</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gradient-to-br from-green-400 to-green-300"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">รย.12</span>
                  </div>
                </div>
              </div>
              
              {/* Dropdown เลือกปีและเดือน */}
              <div className="flex gap-3">
                <div className="w-32">
                  <FilterDropdown
                    value={selectedInspectionYear.toString()}
                    onChange={(value) => setSelectedInspectionYear(parseInt(value))}
                    icon={faCalendarAlt}
                    placeholder="เลือกปี"
                    options={Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return { value: year.toString(), label: year.toString() };
                    })}
                    showClearButton={false}
                  />
                </div>
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
            </div>
            
            {/* Chart */}
            <div className="relative h-96 mb-4 bg-gradient-to-br from-sky-50/30 via-blue-50/30 to-cyan-50/30 dark:from-gray-900/20 dark:via-blue-900/10 dark:to-gray-900/20 rounded-xl p-4">
              {(() => {
                const vehicleTypes = ['รย.1', 'รย.2', 'รย.3', 'รย.12'];
                const maxCount = selectedInspectionMonth === null 
                  ? Math.max(
                      ...inspectionMonthlyData.flatMap(d => 
                        vehicleTypes.map(type => d.byType[type] || 0)
                      ),
                      1
                    )
                  : Math.max(
                      ...inspectionDailyData.flatMap(d => 
                        vehicleTypes.map(type => d.byType[type] || 0)
                      ),
                      1
                    );
                const maxScale = Math.ceil(maxCount / 10) * 10 + 10; // ปัดขึ้นเป็น 10
                const steps = 6;
                const stepValue = maxScale / steps;
                const yAxisLabels = Array.from({ length: steps + 1 }, (_, i) => Math.round(i * stepValue));
                
                return (
                  <>
                    {/* Y-axis Labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col-reverse justify-between py-4 pr-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {yAxisLabels.map((label, i) => (
                        <span key={i}>{label}</span>
                      ))}
                    </div>
                    
                      {/* Grid Lines Background */}
                      <div className="absolute inset-4 left-12 pointer-events-none">
                        {/* Y-axis Line */}
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"></div>
                        {/* X-axis Line */}
                        <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-300 dark:bg-gray-600"></div>
                        {/* Grid Lines */}
                        {[...Array(steps)].map((_, i) => (
                          <div 
                            key={i} 
                            className="absolute w-full border-t border-gray-200 dark:border-gray-700"
                            style={{ bottom: `${((i + 1) / steps) * 100}%` }}
                          />
                        ))}
                      </div>
                    </>
                  );
                })()}

              {selectedInspectionMonth === null ? (
                <>
                  {/* Vertical Grid Lines for Monthly */}
                  <div className="absolute inset-4 left-12 pointer-events-none">
                    {inspectionMonthlyData.map((_, i) => (
                      <div 
                        key={`v-${i}`}
                        className="absolute h-full border-l border-gray-100 dark:border-gray-800"
                        style={{ left: `${(i / inspectionMonthlyData.length) * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-4 left-12 flex items-end justify-between gap-2">
                    {inspectionMonthlyData.map((data, index) => {
                    const vehicleTypes = ['รย.1', 'รย.2', 'รย.3', 'รย.12'];
                    const colors = [
                      'bg-gradient-to-t from-sky-400 to-sky-300',
                      'bg-gradient-to-t from-blue-400 to-blue-300', 
                      'bg-gradient-to-t from-cyan-400 to-cyan-300',
                      'bg-gradient-to-t from-green-400 to-green-300'
                    ];
                    const maxCount = Math.max(
                      ...inspectionMonthlyData.flatMap(d => 
                        vehicleTypes.map(type => d.byType[type] || 0)
                      ),
                      1
                    );
                    const isCurrentMonth = new Date().getMonth() === data.monthNum;
                    
                    return (
                      <div 
                        key={index} 
                        className="flex-1 flex flex-col items-center gap-2 h-full cursor-crosshair"
                        onMouseMove={(e) => {
                          setHoveredBar({
                            x: e.clientX,
                            y: e.clientY,
                            data: {
                              label: data.month,
                              count: data.count,
                              details: data.byType
                            }
                          });
                        }}
                        onMouseLeave={() => setHoveredBar(null)}
                      >
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
                                  className={`w-full rounded-t-md shadow-md transition-all ${colors[typeIndex]} hover:brightness-110`}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${heightPercentage}%` }}
                                  transition={{ duration: 1, delay: index * 0.06 + typeIndex * 0.02, ease: 'easeOut' }}
                                  style={{ minHeight: count > 0 ? '25px' : '0', maxHeight: '100%' }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div 
                          className={`px-2 py-1 rounded-md text-xs font-bold text-white mt-2 ${isCurrentMonth ? 'ring-2 ring-emerald-500' : ''}`}
                          style={{ 
                            backgroundColor: ['#3B82F6', '#EC4899', '#10B981', '#F97316', '#22C55E', '#0EA5E9',
                                   '#8B5CF6', '#DB2777', '#84CC16', '#EA580C', '#059669', '#2563EB'][data.monthNum]
                          }}
                        >
                          {data.month}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </>
              ) : (
                <div className="overflow-x-auto -mx-4 px-4 pb-4">
                  <div className="relative flex items-end gap-2 h-80 pl-12" style={{ minWidth: `${inspectionDailyData.length * 60}px` }}>
                    {inspectionDailyData.map((data, index) => {
                        const vehicleTypes = ['รย.1', 'รย.2', 'รย.3', 'รย.12'];
                        const colors = [
                          'bg-gradient-to-t from-sky-400 to-sky-300',
                          'bg-gradient-to-t from-blue-400 to-blue-300', 
                          'bg-gradient-to-t from-cyan-400 to-cyan-300',
                          'bg-gradient-to-t from-green-400 to-green-300'
                        ];
                        const maxCount = Math.max(
                          ...inspectionDailyData.flatMap(d => 
                            vehicleTypes.map(type => d.byType[type] || 0)
                          ),
                          1
                        );
                        const isToday = new Date().getDate() === data.day && new Date().getMonth() === selectedInspectionMonth;
                        
                        return (
                          <div 
                            key={index} 
                            className="flex flex-col items-center gap-2 h-full cursor-crosshair" 
                            style={{ width: '50px' }}
                            onMouseMove={(e) => {
                              setHoveredBar({
                                x: e.clientX,
                                y: e.clientY,
                                data: {
                                  label: `วันที่ ${data.day}`,
                                  count: data.count,
                                  details: data.byType
                                }
                              });
                            }}
                            onMouseLeave={() => setHoveredBar(null)}
                          >
                            <div className="flex-1 w-full flex items-end justify-center gap-1">
                              {vehicleTypes.map((type, typeIndex) => {
                                const count = data.byType[type] || 0;
                                const heightPercentage = count > 0 ? Math.max((count / maxCount) * 100, 12) : 0;
                                
                                return (
                                  <div key={typeIndex} className="flex flex-col items-center justify-end h-full" style={{ width: '11px' }}>
                                    {count > 0 && (
                                      <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-0.5">
                                        {count}
                                      </span>
                                    )}
                                    <motion.div 
                                      className={`w-full rounded-t-md shadow-sm transition-all ${colors[typeIndex]} hover:brightness-110`}
                                      initial={{ height: 0 }}
                                      animate={{ height: `${heightPercentage}%` }}
                                      transition={{ duration: 0.8, delay: index * 0.01 + typeIndex * 0.01, ease: 'easeOut' }}
                                      style={{ minHeight: count > 0 ? '25px' : '0', maxHeight: '100%' }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            <div 
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white mt-2 ${isToday ? 'ring-2 ring-green-500' : ''}`}
                              style={{ 
                                backgroundColor: `hsl(${(data.day - 1) * 12}, 70%, 60%)`
                              }}
                            >
                              {data.day}
                            </div>
                          </div>
                        );
                      })}
                  </div>
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
                  <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.12</p>
                    <p className="text-xl font-bold text-teal-600 dark:text-teal-400">
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
                  <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">รย.12</p>
                    <p className="text-xl font-bold text-teal-600 dark:text-teal-400">
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
                    <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                      <FontAwesomeIcon 
                        icon={stat.icon} 
                        className="text-lg text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-1">
                      {stat.label}
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
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
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {nextYearTax.length} คัน
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
              {nextYearTax.length > 0 ? (
                nextYearTax.map((customer: Record<string, unknown>, index: number) => (
                  <div 
                    key={index} 
                    className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon icon={faCar} className="text-emerald-600 dark:text-emerald-400" />
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
                  className="text-emerald-600 dark:text-emerald-400 hover:underline text-sm font-medium"
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border-l-4 border-emerald-500">
                <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faBell} className="text-xl text-emerald-600 dark:text-emerald-400" />
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
