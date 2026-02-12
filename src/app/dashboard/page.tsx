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
  faExclamationCircle,
  faChartColumn,
  faChartBar,
  faClipboardCheck,
} from '@fortawesome/free-solid-svg-icons';

import { useCustomerData } from '@/lib/useCustomerData';
import { useDashboardSummary } from '@/lib/useDashboardSummary';
import FilterDropdown from '../components/FilterDropdown';

// Import Chart Components (ที่คุณแยกไฟล์ไว้)
import TaxChart from '../components/charts/TaxChart';
import InspectionStackedChart from '../components/charts/InspectionStackedChart';

export default function DashboardPage() {
  // --- 1. State Definitions ---
  const [thisMonthRenewals, setThisMonthRenewals] = useState(0);
  const [upcomingExpiry, setUpcomingExpiry] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [nextYearTax, setNextYearTax] = useState<Record<string, unknown>[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  
  // Tax Data States
  const [taxMonthlyData, setTaxMonthlyData] = useState<{ month: string, count: number, monthNum: number, byType: Record<string, number> }[]>([]);
  const [taxDailyData, setTaxDailyData] = useState<{ day: number, count: number, byType: Record<string, number> }[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  
  // Inspection Data States
  const [inspectionMonthlyData, setInspectionMonthlyData] = useState<{ month: string, count: number, monthNum: number, byType: Record<string, number> }[]>([]);
  const [inspectionDailyData, setInspectionDailyData] = useState<{ day: number, count: number, byType: Record<string, number> }[]>([]);
  const [selectedInspectionMonth, setSelectedInspectionMonth] = useState<number | null>(null);
  const [selectedInspectionYear, setSelectedInspectionYear] = useState<number>(new Date().getFullYear());
  const [inspection7DaysData, setInspection7DaysData] = useState<{ date: string, count: number, byType: Record<string, number> }[]>([]);
  
  // UI States
  const [lastUpdate, setLastUpdate] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState('');

  // Hooks
  const { rawData: customerData } = useCustomerData();
  const { data: summary } = useDashboardSummary();

  // --- 2. Data Fetching Logic (รวมกลับมาให้ครบถ้วน) ---

  // 2.1 Summary Data
  useEffect(() => {
    if (summary) {
      setTotalCustomers(summary.totalCustomers);
      setThisMonthRenewals(summary.thisMonthRenewals);
      setUpcomingExpiry(summary.upcomingExpiry);
      setOverdueCount(summary.overdueCount);
      setNextYearTax(summary.nextYearTax as unknown as Record<string, unknown>[]);
    }
  }, [summary]);

  // 2.2 Tax Data (Monthly)
  useEffect(() => {
    if (customerData && customerData.data) {
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const monthlyData: { [key: number]: { total: number, byType: Record<string, number> } } = {};
      for (let i = 0; i < 12; i++) monthlyData[i] = { total: 0, byType: {} };

      customerData.data.forEach((item: Record<string, unknown>) => {
        const tags = item['tags'] as string[] | undefined;
        if (!tags || !tags.includes('ภาษี')) return;

        const lastTaxDate = String(item['registerDate'] || item['วันที่ชำระภาษีล่าสุด'] || '');
        const vehicleType = String(item['vehicleType'] || '');

        if (lastTaxDate) {
          let month = -1;
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastTaxDate)) month = parseInt(lastTaxDate.split('/')[1]) - 1;
          else if (/^\d{4}-\d{2}-\d{2}$/.test(lastTaxDate)) month = parseInt(lastTaxDate.split('-')[1]) - 1;
          else if (lastTaxDate.includes('T')) month = new Date(lastTaxDate).getMonth();

          if (month >= 0 && month < 12) {
            monthlyData[month].total++;
            if (vehicleType) monthlyData[month].byType[vehicleType] = (monthlyData[month].byType[vehicleType] || 0) + 1;
          }
        }
      });

      setTaxMonthlyData(Object.entries(monthlyData).map(([m, d]) => ({
        month: monthNames[parseInt(m)], count: d.total, monthNum: parseInt(m), byType: d.byType
      })));
    }
  }, [customerData]);

  // 2.3 Tax Data (Daily)
  useEffect(() => {
    if (customerData && customerData.data && selectedMonth !== null) {
      const daysInMonth = new Date(new Date().getFullYear(), selectedMonth + 1, 0).getDate();
      const dailyData: { [key: number]: { total: number, byType: Record<string, number> } } = {};
      for (let i = 1; i <= daysInMonth; i++) dailyData[i] = { total: 0, byType: {} };

      customerData.data.forEach((item: Record<string, unknown>) => {
        const tags = item['tags'] as string[] | undefined;
        if (!tags || !tags.includes('ภาษี')) return;
        const lastTaxDate = String(item['registerDate'] || item['วันที่ชำระภาษีล่าสุด'] || '');
        const vehicleType = String(item['vehicleType'] || '');

        if (lastTaxDate) {
          let day = -1, month = -1;
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastTaxDate)) { const p = lastTaxDate.split('/'); day = parseInt(p[0]); month = parseInt(p[1]) - 1; }
          else if (/^\d{4}-\d{2}-\d{2}$/.test(lastTaxDate)) { const p = lastTaxDate.split('-'); day = parseInt(p[2]); month = parseInt(p[1]) - 1; }
          else if (lastTaxDate.includes('T')) { const d = new Date(lastTaxDate); day = d.getDate(); month = d.getMonth(); }

          if (month === selectedMonth && day >= 1 && day <= daysInMonth) {
            dailyData[day].total++;
            if (vehicleType) dailyData[day].byType[vehicleType] = (dailyData[day].byType[vehicleType] || 0) + 1;
          }
        }
      });
      setTaxDailyData(Object.entries(dailyData).map(([d, data]) => ({ day: parseInt(d), count: data.total, byType: data.byType })));
    }
  }, [customerData, selectedMonth]);

  // 2.4 Inspection Data (Monthly)
  useEffect(() => {
    if (customerData && customerData.data) {
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const monthlyData: { [key: number]: { total: number, byType: Record<string, number> } } = {};
      for (let i = 0; i < 12; i++) monthlyData[i] = { total: 0, byType: {} };

      customerData.data.forEach((item: Record<string, unknown>) => {
        const tags = item['tags'] as string[] | undefined;
        if (!tags || !tags.includes('ตรอ.')) return;
        const lastInspectionDate = String(item['inspectionDate'] || '');
        const vehicleType = String(item['vehicleType'] || '');

        if (lastInspectionDate) {
          let month = -1, year = -1;
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastInspectionDate)) { const p = lastInspectionDate.split('/'); month = parseInt(p[1]) - 1; year = parseInt(p[2]); }
          else if (/^\d{4}-\d{2}-\d{2}$/.test(lastInspectionDate)) { const p = lastInspectionDate.split('-'); month = parseInt(p[1]) - 1; year = parseInt(p[0]); }
          else if (lastInspectionDate.includes('T')) { const d = new Date(lastInspectionDate); month = d.getMonth(); year = d.getFullYear(); }

          if (month >= 0 && month < 12 && year === selectedInspectionYear) {
            monthlyData[month].total++;
            if (vehicleType) monthlyData[month].byType[vehicleType] = (monthlyData[month].byType[vehicleType] || 0) + 1;
          }
        }
      });
      setInspectionMonthlyData(Object.entries(monthlyData).map(([m, d]) => ({
        month: monthNames[parseInt(m)], count: d.total, monthNum: parseInt(m), byType: d.byType
      })));
    }
  }, [customerData, selectedInspectionYear]);

  // 2.5 Inspection Data (Daily)
  useEffect(() => {
    if (customerData && customerData.data && selectedInspectionMonth !== null) {
      const daysInMonth = new Date(selectedInspectionYear, selectedInspectionMonth + 1, 0).getDate();
      const dailyData: { [key: number]: { total: number, byType: Record<string, number> } } = {};
      for (let i = 1; i <= daysInMonth; i++) dailyData[i] = { total: 0, byType: {} };

      customerData.data.forEach((item: Record<string, unknown>) => {
        const tags = item['tags'] as string[] | undefined;
        if (!tags || !tags.includes('ตรอ.')) return;
        const lastInspectionDate = String(item['inspectionDate'] || '');
        const vehicleType = String(item['vehicleType'] || '');

        if (lastInspectionDate) {
          let day = -1, month = -1, year = -1;
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastInspectionDate)) { const p = lastInspectionDate.split('/'); day = parseInt(p[0]); month = parseInt(p[1]) - 1; year = parseInt(p[2]); }
          else if (/^\d{4}-\d{2}-\d{2}$/.test(lastInspectionDate)) { const p = lastInspectionDate.split('-'); day = parseInt(p[2]); month = parseInt(p[1]) - 1; year = parseInt(p[0]); }
          else if (lastInspectionDate.includes('T')) { const d = new Date(lastInspectionDate); day = d.getDate(); month = d.getMonth(); year = d.getFullYear(); }

          if (month === selectedInspectionMonth && year === selectedInspectionYear && day >= 1 && day <= daysInMonth) {
            dailyData[day].total++;
            if (vehicleType) dailyData[day].byType[vehicleType] = (dailyData[day].byType[vehicleType] || 0) + 1;
          }
        }
      });
      setInspectionDailyData(Object.entries(dailyData).map(([d, data]) => ({ day: parseInt(d), count: data.total, byType: data.byType })));
    }
  }, [customerData, selectedInspectionMonth, selectedInspectionYear]);

  // 2.6 Inspection Data (7 Days)
  useEffect(() => {
    if (customerData && customerData.data) {
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const data7Days: { [key: string]: { total: number, byType: Record<string, number> } } = {};
      last7Days.forEach(date => {
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
        data7Days[dateStr] = { total: 0, byType: {} };
      });

      customerData.data.forEach((item: Record<string, unknown>) => {
        const tags = item['tags'] as string[] | undefined;
        if (!tags || !tags.includes('ตรอ.')) return;
        const inspectionDate = String(item['inspectionDate'] || '');
        const vehicleType = String(item['vehicleType'] || '');

        if (inspectionDate) {
          let itemDate: Date | null = null;
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(inspectionDate)) { const p = inspectionDate.split('/'); itemDate = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0])); }
          else if (/^\d{4}-\d{2}-\d{2}$/.test(inspectionDate)) itemDate = new Date(inspectionDate);
          else if (inspectionDate.includes('T')) itemDate = new Date(inspectionDate);

          if (itemDate) {
            const dateStr = `${itemDate.getDate()}/${itemDate.getMonth() + 1}`;
            if (data7Days[dateStr]) {
              data7Days[dateStr].total++;
              if (vehicleType) data7Days[dateStr].byType[vehicleType] = (data7Days[dateStr].byType[vehicleType] || 0) + 1;
            }
          }
        }
      });
      setInspection7DaysData(last7Days.map(date => {
        const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
        return { date: dateStr, count: data7Days[dateStr].total, byType: data7Days[dateStr].byType };
      }));
    }
  }, [customerData]);

  // 2.7 Last Update
  useEffect(() => {
    setLastUpdate(new Date().toLocaleDateString('th-TH', { dateStyle: 'long', timeZone: 'Asia/Bangkok' }));
    setLastUpdateTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }));
  }, []);

  // --- 3. Data Transformation for Charts ---

  // Tax Chart Data
  const currentTaxData = selectedMonth === null ? taxMonthlyData : taxDailyData;
  const taxChartData = currentTaxData.map(d => ({
    label: selectedMonth === null ? d.month : `วันที่ ${d.day}`,
    count: d.count,
    active: selectedMonth === null 
      ? new Date().getMonth() === d.monthNum 
      : new Date().getDate() === d.day && new Date().getMonth() === selectedMonth
  }));

  // Inspection 7 Days Data
  const inspection7DaysChartData = inspection7DaysData.map(d => ({
    label: d.date,
    r1: d.byType['รย.1'] || 0,
    r2: d.byType['รย.2'] || 0,
    r3: d.byType['รย.3'] || 0,
    r12: d.byType['รย.12'] || 0,
  }));

  // Inspection Full Data (Monthly/Daily)
  const currentInspectionData = selectedInspectionMonth === null ? inspectionMonthlyData : inspectionDailyData;
  const inspectionFullChartData = currentInspectionData.map(d => ({
    label: selectedInspectionMonth === null ? d.month : `วันที่ ${d.day}`,
    r1: d.byType['รย.1'] || 0,
    r2: d.byType['รย.2'] || 0,
    r3: d.byType['รย.3'] || 0,
    r12: d.byType['รย.12'] || 0,
  }));

  const dashboardStats = [
    { label: "รถทั้งหมด", value: totalCustomers.toString(), icon: faCar, description: "จำนวนรถในระบบ" },
    { label: "ต่อภาษีเดือนนี้", value: thisMonthRenewals.toString(), icon: faCheckCircle, description: "รถที่ต่อภาษีในเดือนนี้" },
    { label: "กำลังจะครบกำหนด", value: upcomingExpiry.toString(), icon: faExclamationTriangle, description: "รถที่ใกล้ครบกำหนดต่อภาษี" },
    { label: "เกินกำหนด", value: overdueCount.toString(), icon: faExclamationCircle, description: "รถที่เกินกำหนดต่อภาษี" },
    { label: "ต้องต่อภาษีปีหน้า", value: nextYearTax.length.toString(), icon: faCalendarAlt, description: "รถที่ต้องต่อภาษีในปีถัดไป" },
    { label: "ต่อภาษีแล้ว", value: (summary?.alreadyTaxed ?? 0).toString(), icon: faCheckCircle, description: "รถที่ต่อภาษีเรียบร้อยแล้ว" },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className='flex items-center justify-between gap-3'>
            <FontAwesomeIcon icon={faChartColumn} className='text-3xl text-blue-950 p-5' />
            <div>
              <h1 className="text-3xl font-bold text-blue-950 mb-2">แดชบอร์ดภาษีรถยนต์</h1>
              <p className="text-sm text-blue-950/70">อัปเดต: {lastUpdate} {lastUpdateTime}</p>
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <motion.div variants={itemVariants} initial="hidden" animate="show" className="mb-8">
          <div className="bg-gradient-to-br from-blue-100/20 to-gray-100 shadow-md border-5 border-white rounded-3xl p-8 text-center">
             <p className="text-sm text-blue-950/70 mb-2">จำนวนรถทั้งหมดในระบบ</p>
             <p className="text-5xl font-semibold text-blue-950 mb-1">{totalCustomers.toLocaleString()}</p>
             <p className="text-lg text-blue-950/70">คัน</p>
          </div>
        </motion.div>

        {/* === Chart 1: กราฟภาษี (Bar Chart) === */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className='flex items-center gap-4'>
                <FontAwesomeIcon icon={faChartColumn} className='text-2xl text-gray-900 dark:text-gray-100' />
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">กราฟการต่อภาษี</h2>
                  <p className="text-xs text-gray-500">📌 แสดงเฉพาะรายการที่มีแท็ก "ภาษี"</p>
                </div>
              </div>
              <div className="w-48">
                <FilterDropdown
                  value={selectedMonth === null ? '' : selectedMonth.toString()}
                  onChange={(value) => setSelectedMonth(value === '' ? null : parseInt(value))}
                  icon={faCalendarAlt}
                  placeholder="เลือกเดือน"
                  options={[{ value: '', label: 'ทั้งปี' }, ...taxMonthlyData.map(d => ({ value: d.monthNum.toString(), label: d.month } ))]}
                />
              </div>
            </div>
            
            {/* เรียกใช้ Component กราฟภาษี */}
            <TaxChart data={taxChartData} />

            {/* Footer Stats */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
               <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">รวม</p>
                  <p className="text-xl font-bold text-gray-900">{currentTaxData.reduce((a, b) => a + b.count, 0)}</p>
               </div>
               <div className="text-center border-l border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">เฉลี่ย/{selectedMonth === null ? 'เดือน' : 'วัน'}</p>
                  <p className="text-xl font-bold text-slate-600">
                    {selectedMonth === null 
                      ? Math.round(currentTaxData.reduce((a, b) => a + b.count, 0) / 12)
                      : (currentTaxData.length ? Math.round(currentTaxData.reduce((a, b) => a + b.count, 0) / currentTaxData.length) : 0)}
                  </p>
               </div>
            </div>
          </div>
        </motion.div>

        {/* === Chart 2: สถิติ 7 วันล่าสุด (Stacked Bar) === */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-6 flex items-center gap-4">
               <FontAwesomeIcon icon={faChartBar} className='text-2xl text-gray-900 dark:text-gray-100' />
               <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">สถิติ 7 วันล่าสุด</h2>
                  <p className="text-xs text-gray-500">📈 แนวโน้มการตรวจรถแยกตามประเภท</p>
               </div>
            </div>

            {/* เรียกใช้ Component กราฟ Stacked */}
            <InspectionStackedChart data={inspection7DaysChartData} />
            
            {/* Simple Grid Stats */}
            <div className="grid grid-cols-5 gap-2 mt-4 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                <div>
                    <p className="text-[10px] text-gray-400 mb-1">รวม</p>
                    <p className="text-lg font-bold text-gray-900">{inspection7DaysData.reduce((s, d) => s + d.count, 0)}</p>
                </div>
                {['รย.1', 'รย.2', 'รย.3', 'รย.12'].map((key, i) => (
                    <div key={key} className="border-l border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] text-gray-400 mb-1">{key}</p>
                        <p className={`text-lg font-bold ${['text-emerald-500', 'text-sky-500', 'text-amber-500', 'text-rose-500'][i]}`}>
                            {inspection7DaysData.reduce((s, d) => s + (d.byType[key] || 0), 0)}
                        </p>
                    </div>
                ))}
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
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
                      <FontAwesomeIcon icon={stat.icon} className="text-lg text-emerald-600 dark:text-emerald-400" />
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

        {/* === Chart 3: สถิติการตรวจรถ รายเดือน/วัน (Stacked Bar) === */}
        <motion.div variants={itemVariants} className="mb-8">
           <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-2xl"><FontAwesomeIcon icon={faClipboardCheck} className="text-xl text-green-600" /></div>
                    <div>
                       <h2 className="text-lg font-bold text-gray-900">สถิติการตรวจรถ (ตรอ.)</h2>
                       <p className="text-xs text-gray-500">{selectedInspectionMonth === null ? `ภาพรวมทั้งปี ${selectedInspectionYear}` : `รายเดือน`}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <div className="w-28">
                        <FilterDropdown 
                            value={selectedInspectionYear.toString()} 
                            onChange={(v) => setSelectedInspectionYear(parseInt(v))} 
                            icon={faCalendarAlt} placeholder="เลือกปี" 
                            options={Array.from({length:5},(_,i)=>({value:(new Date().getFullYear()-i).toString(),label:(new Date().getFullYear()-i).toString()}))} 
                            showClearButton={false} 
                        />
                    </div>
                    <div className="w-32">
                        <FilterDropdown 
                            value={selectedInspectionMonth === null ? '' : selectedInspectionMonth.toString()} 
                            onChange={(v) => setSelectedInspectionMonth(v === '' ? null : parseInt(v))} 
                            icon={faCalendarAlt} placeholder="เลือกเดือน" 
                            options={[{value:'',label:'ทั้งปี'}, ...inspectionMonthlyData.map(d=>({value:d.monthNum.toString(), label:d.month}))]} 
                        />
                    </div>
                 </div>
              </div>

              {/* เรียกใช้ Component กราฟ Stacked (Reuse ตัวเดิมได้เลย!) */}
              <InspectionStackedChart data={inspectionFullChartData} />

              {/* Footer Stats */}
              <div className="grid grid-cols-5 gap-2 mt-4 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                  <div>
                      <p className="text-[10px] text-gray-400 mb-1">รวม</p>
                      <p className="text-lg font-bold text-gray-900">{currentInspectionData.reduce((s, d) => s + d.count, 0)}</p>
                  </div>
                  {['รย.1', 'รย.2', 'รย.3', 'รย.12'].map((key, i) => (
                      <div key={key} className="border-l border-gray-100 dark:border-gray-800">
                          <p className="text-[10px] text-gray-400 mb-1">{key}</p>
                          <p className={`text-lg font-bold ${['text-emerald-500', 'text-sky-500', 'text-amber-500', 'text-rose-500'][i]}`}>
                              {currentInspectionData.reduce((s, d) => s + (d.byType[key] || 0), 0)}
                          </p>
                      </div>
                  ))}
              </div>
           </div>
        </motion.div>

        {/* Next Year Tax List */}
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
                  <div key={index} className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all">
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
                <Link href="/tax-expiry-next-year" className="text-emerald-600 dark:text-emerald-400 hover:underline text-sm font-medium">
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