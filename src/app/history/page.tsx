"use client";

import React, { useState, useMemo, memo } from 'react';
import Link from 'next/link';
import { FaExclamationTriangle, FaCar, FaCalendarAlt, FaClock, FaUser, FaSearch, FaFilter, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import AnimatedPage from '../components/AnimatedPage';
import { useBillingData, BillingData } from '@/lib/useBillingData';

interface HistoryItem {
  billNo: string;
  id: string;
  customerName: string;
  serviceName: string;
  serviceCategory: string;
  price: number;
  date: string;
  phone: string;
  status: string;
  notes?: string;
  dateStr?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ชำระแล้ว':
    case 'สด':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'รอชำระ':
    case 'โอน':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'ค้างจ่าย':
    case 'ยกเลิก':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'รอดำเนินการ':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'ชำระแล้ว':
      return 'ชำระแล้ว';
    case 'รอชำระ':
      return 'รอชำระ';
    case 'ยกเลิก':
      return 'ยกเลิก';
    case 'รอดำเนินการ':
      return 'รอดำเนินการ';
    case 'สด':
      return 'สด';
    case 'โอน':
      return 'โอน';
    case 'ค้างจ่าย':
      return 'ค้างจ่าย';
    default:
      return status || 'ไม่ทราบสถานะ';
  }
};

const formatPrice = (price: number) => {
  return price.toLocaleString('th-TH');
};

const ROWS_PER_PAGE = 10;

// Table Row Memoized (ย้ายขึ้นมาไว้ก่อนใช้งาน)
const HistoryRow = memo(function HistoryRow({ item }: { item: HistoryItem }) {
  return (
    <tr key={item.id} className="h-16 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <td className="align-middle text-center px-6 py-4 whitespace-nowrap font-mono font-bold text-blue-700 dark:text-blue-300">{item.billNo}</td>
      <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
        <div className="flex items-center justify-center">
          <FaUser className="text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">{item.customerName}</span>
        </div>
      </td>
      <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900 dark:text-white">{item.serviceName}</span>
        {item.notes && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.notes}</p>
        )}
      </td>
      <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900 dark:text-white">{item.serviceCategory}</span>
      </td>
      <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-green-600 dark:text-green-400">฿{formatPrice(item.price)}</span>
      </td>
      <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900 dark:text-white">{item.dateStr}</span>
      </td>
      <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900 dark:text-white">{item.phone}</span>
      </td>
      <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>{getStatusText(item.status)}</span>
      </td>
    </tr>
  );
});

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = ROWS_PER_PAGE;

  // ใช้ Custom Hook สำหรับข้อมูลบิล
  const { data: billingData, error, isLoading, refreshData } = useBillingData();

  // แปลงข้อมูลบิลเป็น HistoryItem
  const historyData: HistoryItem[] = useMemo(() => {
    return billingData.map((bill: BillingData, index: number) => ({
      billNo: bill.billNumber || `B${Date.now()}${index}`,
      id: bill._id || `bill_${index}`,
      customerName: bill.customerName || 'ไม่มีชื่อลูกค้า',
      serviceName: bill.service || 'ไม่มีบริการ',
      serviceCategory: bill.category || 'ไม่ระบุหมวดหมู่',
      price: bill.price || bill.totalAmount || 0,
      date: bill.date || new Date().toISOString().split('T')[0],
      phone: bill.phone || 'ไม่มีเบอร์โทร',
      status: bill.status || 'รอดำเนินการ',
      notes: bill.notes || '',
      dateStr: bill.date ? new Date(bill.date).toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH')
    }));
  }, [billingData]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => historyData.filter(item => {
    const matchesSearch = 
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serviceCategory.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const itemDate = new Date(item.date);
      const today = new Date();
      
      if (dateFilter === 'today') {
        matchesDate = item.date === today.toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = itemDate >= weekAgo && itemDate <= today;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        matchesDate = itemDate >= monthAgo && itemDate <= today;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  }), [historyData, searchTerm, statusFilter, dateFilter]);

  // Pagination logic
  const totalRows = filteredData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paginatedData = useMemo(() => filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filteredData, page, rowsPerPage]);

  const totalRevenue = filteredData
    .filter(item => item.status === 'ชำระแล้ว' || item.status === 'สด')
    .reduce((sum, item) => sum + item.price, 0);

  const totalServices = filteredData.length;
  const completedServices = filteredData.filter(item => item.status === 'ชำระแล้ว' || item.status === 'สด').length;

  return (
    <AnimatedPage>
      <main className="flex flex-col gap-8 items-center text-center w-full min-h-screen bg-gray-50 dark:bg-gray-900 pt-4 pb-12 px-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
              ประวัติการให้บริการ
            </h1>
            <div className="flex gap-2">
              <button
                onClick={refreshData}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
                title="รีเฟรชข้อมูล"
              >
                <FaClock className={isLoading ? 'animate-spin' : ''} />
                รีเฟรช
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                กลับหน้าหลัก
              </Link>
            </div>
          </div>


          {/* สถิติสรุป */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center text-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">รายได้รวม</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ฿{formatPrice(totalRevenue)}
                  </p>
                </div>
                <FaCar className="text-green-500 text-2xl" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">บริการทั้งหมด</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalServices}
                  </p>
                </div>
                <FaCalendarAlt className="text-blue-500 text-2xl" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">เสร็จสิ้น</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {completedServices}
                  </p>
                </div>
                <FaClock className="text-purple-500 text-2xl" />
              </div>
            </div>
          </div>

          {/* ตัวกรองและค้นหา */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ช่องค้นหา */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="ค้นหาลูกค้า, บริการ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              {/* กรองสถานะ */}
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
                >
                  <option value="all">สถานะทั้งหมด</option>
                  <option value="ชำระแล้ว">ชำระแล้ว</option>
                  <option value="รอชำระ">รอชำระ</option>
                  <option value="ยกเลิก">ยกเลิก</option>
                  <option value="รอดำเนินการ">รอดำเนินการ</option>
                  <option value="สด">สด</option>
                  <option value="โอน">โอน</option>
                  <option value="ค้างจ่าย">ค้างจ่าย</option>
                </select>
              </div>

              {/* กรองวันที่ */}
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
                >
                  <option value="all">วันที่ทั้งหมด</option>
                  <option value="today">วันนี้</option>
                  <option value="week">7 วันล่าสุด</option>
                  <option value="month">30 วันล่าสุด</option>
                </select>
              </div>
            </div>
          </div>

          {/* ตารางประวัติ */}
          {isLoading && (
            <div className="flex items-center justify-center text-base md:text-lg py-8 gap-3 w-full">
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
          )}

          {error && (
            <div className="flex items-center justify-center text-base md:text-lg py-8 text-red-500 gap-3">
              <FaExclamationTriangle /> เกิดข้อผิดพลาดในการโหลดข้อมูล
              <button
                onClick={refreshData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-4"
              >
                ลองใหม่
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="align-middle text-center px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">เลขที่บิล</th>
                      <th className="align-middle text-center px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ลูกค้า</th>
                      <th className="align-middle text-center px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">บริการ</th>
                      <th className="align-middle text-center px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">หมวดหมู่</th>
                      <th className="align-middle text-center px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ราคา</th>
                      <th className="align-middle text-center px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">วันที่</th>
                      <th className="align-middle text-center px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">เบอร์ติดต่อ</th>
                      <th className="align-middle text-center px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr className="h-16">
                        <td colSpan={9} className="align-middle text-center px-6 py-8 text-gray-500 dark:text-gray-400">
                          {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                            ? 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา' 
                            : 'ไม่มีข้อมูลประวัติการให้บริการ'}
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((item) => (
                        <HistoryRow key={item.id} item={item} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    แสดง {totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1} ถึง {Math.min(page * rowsPerPage, totalRows)} จาก {totalRows} รายการ
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="px-2 py-1 rounded disabled:opacity-50"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      aria-label="หน้าก่อนหน้า"
                    >
                      <FaChevronLeft />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        className={`px-3 py-1 rounded ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'} font-semibold border border-gray-200 dark:border-gray-700`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      className="px-2 py-1 rounded disabled:opacity-50"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      aria-label="หน้าถัดไป"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ปุ่มกลับ */}
        <div className="mt-10 text-center">
          <Link 
            href="/" 
            className="inline-block px-6 py-2 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 font-semibold transition-colors text-sm md:text-base"
          >
            <FaCar className="inline mr-2" /> กลับหน้าหลัก
          </Link>
        </div>
      </main>
    </AnimatedPage>
  );
} 