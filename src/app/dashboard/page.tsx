"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedPage, { itemVariants } from '../components/AnimatedPage';
import { Card } from '../components/ui/Card';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, 
  faCalendarAlt, 
  faClock,
  faMoneyBillWave,
  faCar
} from '@fortawesome/free-solid-svg-icons';

// ⚡ ใช้ Custom Hook แทน useSWR
import { useCustomerData } from '@/lib/useCustomerData';
import { useBillingData } from '@/lib/useBillingData';

export default function DashboardPage() {
  // State สำหรับข้อมูลจริง
  const [thisMonthRenewals, setThisMonthRenewals] = useState(0);
  const [upcomingExpiry, setUpcomingExpiry] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  
  // State สำหรับข้อมูลบิล
  const [totalBills, setTotalBills] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [paidRevenue, setPaidRevenue] = useState(0);
  const [pendingRevenue, setPendingRevenue] = useState(0);
  const [recentBills, setRecentBills] = useState([]);
  const [nextYearTax, setNextYearTax] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);

  // ⚡ ใช้ Custom Hook พร้อม Cache
  const { rawData: customerData } = useCustomerData();
  const { rawData: billingData } = useBillingData();


  // คำนวณสถิติจากข้อมูลจริง
  useEffect(() => {
    if (customerData && customerData.data) {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      
      let monthCount = 0;
      let upcomingCount = 0;
      let overdueCount = 0;
      
      customerData.data.forEach((item: Record<string, unknown>) => {
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
      
      setThisMonthRenewals(monthCount);
      setUpcomingExpiry(upcomingCount);
      setOverdueCount(overdueCount);
    }
  }, [customerData]);

  // คำนวณข้อมูลบิล
  useEffect(() => {
    if (billingData && billingData.data) {
      let totalRevenue = 0;
      let paidRevenue = 0;
      let pendingRevenue = 0;
      
      // เรียงข้อมูลตามวันที่ล่าสุด
      const sortedBills = [...billingData.data].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const dateA = new Date(a.date as string || 0);
        const dateB = new Date(b.date as string || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      const recentBills = sortedBills.slice(0, 5); // 5 บิลล่าสุด
      
      billingData.data.forEach((bill: Record<string, unknown>) => {
        const price = bill.price || bill.totalAmount || 0;
        if (typeof price === 'number') {
          totalRevenue += price;
          
          if (bill.status === 'ชำระแล้ว') {
            paidRevenue += price;
          } else if (bill.status === 'รอชำระ') {
            pendingRevenue += price;
          }
        }
      });
      
      // คำนวณรายได้รายเดือนและรายวัน
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const today = now.toISOString().split('T')[0];
      
      let monthlyRevenue = 0;
      let todayRevenue = 0;
      
      billingData.data.forEach((bill: Record<string, unknown>) => {
        const billDate = new Date(bill.date || 0);
        const billDateStr = billDate.toISOString().split('T')[0];
        const price = bill.price || bill.totalAmount || 0;
        
        if (billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear) {
          monthlyRevenue += price;
        }
        
        if (billDateStr === today) {
          todayRevenue += price;
        }
      });
      
      setTotalBills(billingData.data.length);
      setTotalRevenue(totalRevenue);
      setPaidRevenue(paidRevenue);
      setPendingRevenue(pendingRevenue);
      setMonthlyRevenue(monthlyRevenue);
      setTodayRevenue(todayRevenue);
      setRecentBills(recentBills);
      
      // อัปเดตข้อมูลเพิ่มเติม
      console.log('📊 Dashboard Data Updated:', {
        totalBills: billingData.data.length,
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        monthlyRevenue,
        todayRevenue,
        recentBillsCount: recentBills.length
      });
    }
  }, [billingData]);

  // คำนวณภาษีครั้งถัดไป
  useEffect(() => {
    if (customerData && customerData.data) {
      const now = new Date();
      const nextYear = now.getFullYear() + 1;
      const nextYearTax = customerData.data.filter((item: Record<string, unknown>) => {
        const lastTaxDate = String(item['วันที่ชำระภาษีล่าสุด'] || '');
        if (lastTaxDate) {
          let year = 0;
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(lastTaxDate)) {
            const [, , yyyy] = lastTaxDate.split('/');
            year = parseInt(yyyy);
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(lastTaxDate)) {
            const [yyyy] = lastTaxDate.split('-');
            year = parseInt(yyyy);
          }
          return year === nextYear;
        }
        return false;
      });
      
      setNextYearTax(nextYearTax.slice(0, 10)); // 10 รายการแรก
    }
  }, [customerData]);

  const dashboardStats = [
    { 
      label: "รายการบิลทั้งหมด", 
      value: totalBills.toString(), 
      icon: faFileAlt, 
      description: "จำนวนบิลทั้งหมดในระบบ",
      color: "blue"
    },
    { 
      label: "ยอดรวมรายได้", 
      value: `฿${totalRevenue.toLocaleString()}`, 
      icon: faMoneyBillWave, 
      description: "ยอดรวมรายได้จากบิลทั้งหมด",
      color: "green"
    },
    { 
      label: "รายได้เดือนนี้", 
      value: `฿${monthlyRevenue.toLocaleString()}`, 
      icon: faCalendarAlt, 
      description: "รายได้ในเดือนปัจจุบัน",
      color: "purple"
    },
    { 
      label: "รายได้วันนี้", 
      value: `฿${todayRevenue.toLocaleString()}`, 
      icon: faClock, 
      description: "รายได้ในวันนี้",
      color: "orange"
    },
  ];




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
            แดชบอร์ดรายการบิลและภาษี
          </motion.h1>
          <motion.p
            className="text-xl text-gray-600 dark:text-gray-400 mt-2"
            variants={itemVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            ภาพรวมรายการบิล รายได้ และภาษีครั้งถัดไป
          </motion.p>
        </div>
        <motion.div variants={itemVariants} className="flex gap-2" transition={{ duration: 0.2 }}>
          <Link
            href="/billing"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faFileAlt} />
            รายการบิล
          </Link>
          <Link
            href="/tax-expiry-next-year"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faCalendarAlt} />
            ภาษีครั้งถัดไป
          </Link>
        </motion.div>
      </div>

       {/* SECTION 2: Summary and Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat, index) => (
          <motion.div 
            key={stat.label} 
            variants={itemVariants} 
            transition={{ duration: 0.2, delay: index * 0.1 }}
          >
            <Card title={stat.label} className="h-full">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-full ${
                  stat.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' :
                  stat.color === 'green' ? 'bg-green-100 dark:bg-green-900' :
                  stat.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900' :
                  'bg-orange-100 dark:bg-orange-900'
                }`}>
                  <FontAwesomeIcon 
                    icon={stat.icon} 
                    className={`text-2xl ${
                      stat.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                      stat.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      stat.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                      'text-orange-600 dark:text-orange-400'
                    }`}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* SECTION 3: Recent Bills and Next Year Tax */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Bills */}
        <motion.div variants={itemVariants} transition={{ duration: 0.2 }}>
          <Card title="รายการบิลล่าสุด" className="h-full">
            <div className="space-y-3">
              {recentBills.length > 0 ? (
                recentBills.map((bill: Record<string, unknown>, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                        <FontAwesomeIcon icon={faFileAlt} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{bill.billNumber || 'ไม่มีเลขที่บิล'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{bill.customerName || 'ไม่มีชื่อลูกค้า'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">฿{bill.price?.toLocaleString() || '0'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{bill.date || 'ไม่มีวันที่'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon icon={faFileAlt} className="text-4xl mb-2" />
                  <p>ไม่มีข้อมูลบิล</p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link 
                href="/billing"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faFileAlt} />
                ดูรายการบิลทั้งหมด
              </Link>
            </div>
          </Card>
        </motion.div>

        {/* Next Year Tax */}
        <motion.div variants={itemVariants} transition={{ duration: 0.2 }}>
          <Card title="ภาษีครั้งถัดไป" className="h-full">
            <div className="space-y-3">
              {nextYearTax.length > 0 ? (
                nextYearTax.map((customer: Record<string, unknown>, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                        <FontAwesomeIcon icon={faCar} className="text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{customer.licensePlate || 'ไม่มีทะเบียน'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{customer.customerName || 'ไม่มีชื่อลูกค้า'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">ปีถัดไป</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{customer.registerDate || 'ไม่มีวันที่'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-4xl mb-2" />
                  <p>ไม่มีข้อมูลภาษีปีถัดไป</p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link 
                href="/tax-expiry-next-year"
                className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 text-sm font-medium flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faCalendarAlt} />
                ดูภาษีครั้งถัดไปทั้งหมด
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* SECTION 4: Summary Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Summary */}
        <motion.div variants={itemVariants} transition={{ duration: 0.2 }}>
          <Card title="สรุปรายได้" className="h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                    <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-600 dark:text-green-400 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ยอดรวมรายได้</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">฿{totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">รายได้เดือนนี้</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">฿{monthlyRevenue.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">รายได้วันนี้</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">฿{todayRevenue.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">ชำระแล้ว</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">฿{paidRevenue.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">รอชำระ</p>
                  <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">฿{pendingRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tax Status Summary */}
        <motion.div variants={itemVariants} transition={{ duration: 0.2 }}>
          <Card title="สถานะภาษี" className="h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-orange-600 dark:text-orange-400 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">ภาษีปีถัดไป</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{nextYearTax.length} รายการ</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">กำลังจะครบกำหนด</p>
                  <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{upcomingExpiry}</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">เกินกำหนด</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{overdueCount}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">ต่อภาษีแล้ว</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {customerData?.data?.filter((item: Record<string, unknown>) => item.status === 'ต่อภาษีแล้ว').length || 0}
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">ต่อภาษีเดือนนี้</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{thisMonthRenewals}</p>
                </div>
              </div>
              
              {/* เพิ่มข้อมูลสถานะเพิ่มเติม */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">ครบกำหนดวันนี้</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {customerData?.data?.filter((item: Record<string, unknown>) => item.status === 'ครบกำหนดวันนี้').length || 0}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">รอดำเนินการ</p>
                  <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                    {customerData?.data?.filter((item: Record<string, unknown>) => item.status === 'รอดำเนินการ').length || 0}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* SECTION 5: Last Update Info */}
      <motion.div variants={itemVariants} className="mt-8 text-center" transition={{ duration: 0.2 }}>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ข้อมูลอัปเดตล่าสุด: {lastUpdate} เวลา {lastUpdateTime}
          </p>
        </div>
      </motion.div>
    </AnimatedPage>
  );
}