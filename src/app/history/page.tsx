"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaSpinner, FaExclamationTriangle, FaCar, FaCalendarAlt, FaClock, FaUser, FaSearch, FaFilter, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import AnimatedPage from '../components/AnimatedPage';

interface HistoryItem {
  billNo: string;
  id: string;
  customerName: string;
  serviceName: string;
  serviceCategory: string;
  price: number;
  date: string;
  phone: string;
  status: 'สด' | 'โอน' | 'ค้างจ่าย';
  notes?: string;
}

const mockHistoryData: HistoryItem[] = [
  {
    billNo: 'B20240101',
    id: '1',
    customerName: 'คุณสมชาย ใจดี',
    serviceName: 'เปลี่ยนน้ำมันเครื่อง',
    serviceCategory: 'รถยนต์',
    price: 1200,
    date: '2024-01-15',
    phone: '081-111-1111',
    status: 'สด',
    notes: 'เปลี่ยนน้ำมันเครื่องและกรองอากาศ'
  },
  {
    billNo: 'B20240102',
    id: '2',
    customerName: 'คุณสมหญิง รักดี',
    serviceName: 'ล้างรถ',
    serviceCategory: 'รถยนต์',
    price: 300,
    date: '2024-01-14',
    phone: '081-222-2222',
    status: 'โอน'
  },
  {
    billNo: 'B20240103',
    id: '3',
    customerName: 'คุณสมศักดิ์ มั่นคง',
    serviceName: 'ตรวจสอบเบรก',
    serviceCategory: 'รถยนต์',
    price: 500,
    date: '2024-01-13',
    phone: '081-333-3333',
    status: 'สด',
    notes: 'ตรวจสอบและปรับเบรก'
  },
  {
    billNo: 'B20240104',
    id: '4',
    customerName: 'คุณสมปอง ใจเย็น',
    serviceName: 'เปลี่ยนยางรถ',
    serviceCategory: 'รถยนต์',
    price: 2500,
    date: '2024-01-12',
    phone: '081-444-4444',
    status: 'ค้างจ่าย'
  },
  {
    billNo: 'B20240105',
    id: '5',
    customerName: 'คุณสมศรี สวยงาม',
    serviceName: 'ล้างรถ',
    serviceCategory: 'รถยนต์',
    price: 300,
    date: '2024-01-11',
    phone: '081-555-5555',
    status: 'สด'
  },
  {
    billNo: 'B20240106',
    id: '6',
    customerName: 'คุณวราภรณ์ สายใจ',
    serviceName: 'เปลี่ยนแบตเตอรี่',
    serviceCategory: 'รถยนต์',
    price: 2200,
    date: '2024-01-10',
    phone: '081-666-6666',
    status: 'โอน'
  },
  {
    billNo: 'B20240107',
    id: '7',
    customerName: 'คุณประเสริฐ ทองดี',
    serviceName: 'ซ่อมแอร์',
    serviceCategory: 'รถยนต์',
    price: 1800,
    date: '2024-01-09',
    phone: '081-777-7777',
    status: 'สด',
    notes: 'เติมน้ำยาแอร์'
  },
  {
    billNo: 'B20240108',
    id: '8',
    customerName: 'คุณอรทัย สายสมร',
    serviceName: 'เปลี่ยนผ้าเบรก',
    serviceCategory: 'รถยนต์',
    price: 900,
    date: '2024-01-08',
    phone: '081-888-8888',
    status: 'โอน'
  },
  {
    billNo: 'B20240109',
    id: '9',
    customerName: 'คุณสมบัติ รักชาติ',
    serviceName: 'เปลี่ยนยางรถ',
    serviceCategory: 'รถยนต์',
    price: 2600,
    date: '2024-01-07',
    phone: '081-999-9999',
    status: 'ค้างจ่าย'
  },
  {
    billNo: 'B20240110',
    id: '10',
    customerName: 'คุณจิราภรณ์ สายทอง',
    serviceName: 'ล้างรถ',
    serviceCategory: 'รถยนต์',
    price: 350,
    date: '2024-01-06',
    phone: '081-000-0000',
    status: 'สด'
  },
  {
    billNo: 'B20240111',
    id: '11',
    customerName: 'คุณสมศักดิ์ ใจดี',
    serviceName: 'เปลี่ยนหลอดไฟ',
    serviceCategory: 'รถยนต์',
    price: 400,
    date: '2024-01-05',
    phone: '081-123-4567',
    status: 'โอน'
  },
  {
    billNo: 'B20240112',
    id: '12',
    customerName: 'คุณสมชาย สายใจ',
    serviceName: 'เปลี่ยนแบตเตอรี่',
    serviceCategory: 'รถยนต์',
    price: 2100,
    date: '2024-01-04',
    phone: '081-234-5678',
    status: 'สด'
  },
  {
    billNo: 'B20240113',
    id: '13',
    customerName: 'คุณสมหญิง ทองดี',
    serviceName: 'ล้างรถ',
    serviceCategory: 'รถยนต์',
    price: 320,
    date: '2024-01-03',
    phone: '081-345-6789',
    status: 'โอน'
  },
  {
    billNo: 'B20240114',
    id: '14',
    customerName: 'คุณสมปอง รักดี',
    serviceName: 'เปลี่ยนผ้าเบรก',
    serviceCategory: 'รถยนต์',
    price: 950,
    date: '2024-01-02',
    phone: '081-456-7890',
    status: 'ค้างจ่าย'
  },
  {
    billNo: 'B20240115',
    id: '15',
    customerName: 'คุณสมศรี สายสมร',
    serviceName: 'ซ่อมแอร์',
    serviceCategory: 'รถยนต์',
    price: 1750,
    date: '2024-01-01',
    phone: '081-567-8901',
    status: 'สด',
    notes: 'ลูกค้าแจ้งยกเลิก'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'สด':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'โอน':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'ค้างจ่าย':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'สด':
      return 'สด';
    case 'โอน':
      return 'โอน';
    case 'ค้างจ่าย':
      return 'ค้างจ่าย';
    default:
      return 'ไม่ทราบสถานะ';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatPrice = (price: number) => {
  return price.toLocaleString('th-TH');
};

const ROWS_PER_PAGE = 10;

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const rowsPerPage = ROWS_PER_PAGE;

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setHistoryData(mockHistoryData);
      } catch {
        setError('ไม่สามารถโหลดข้อมูลประวัติได้');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter data based on search and filters
  const filteredData = historyData.filter(item => {
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
  });

  // Pagination logic
  const totalRows = filteredData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const totalRevenue = filteredData
    .filter(item => item.status === 'สด')
    .reduce((sum, item) => sum + item.price, 0);

  const totalServices = filteredData.length;
  const completedServices = filteredData.filter(item => item.status === 'สด').length;

  return (
    <AnimatedPage>
      <main className="flex flex-col gap-8 items-center text-center w-full min-h-screen bg-gray-50 dark:bg-gray-900 pt-4 pb-12 px-4">
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 leading-tight">
            ประวัติการให้บริการ
          </h1>


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
            <div className="flex items-center justify-center text-base md:text-lg py-8 gap-3">
              <FaSpinner className="animate-spin" /> กำลังโหลดข้อมูล...
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center text-base md:text-lg py-8 text-red-500 gap-3">
              <FaExclamationTriangle /> {error}
            </div>
          )}

          {!isLoading && !error && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
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
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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
                        <tr key={item.id} className="h-16 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="align-middle text-center px-6 py-4 whitespace-nowrap font-mono font-bold text-blue-700 dark:text-blue-300">{item.billNo}</td>
                          <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <FaUser className="text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.customerName}
                              </span>
                            </div>
                          </td>
                          <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {item.serviceName}
                            </span>
                            {item.notes && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {item.notes}
                              </p>
                            )}
                          </td>
                          <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {item.serviceCategory}
                            </span>
                          </td>
                          <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              ฿{formatPrice(item.price)}
                            </span>
                          </td>
                          <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {formatDate(item.date)}
                            </span>
                          </td>
                          <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {item.phone}
                            </span>
                          </td>
                          <td className="align-middle text-center px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                              {getStatusText(item.status)}
                            </span>
                          </td>
                        </tr>
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