// src/app/customer-info/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { CustomerIcon } from '../components/icons/customer-icon'; // ตรวจสอบเส้นทางให้ถูกต้อง
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'; // สำคัญ: ต้อง Import IconDefinition

import {
  faSearch,
  faCalendarDay,
  faCalendarAlt,
  faCalendar,
  faClock,
  faCheckCircle,
  faExclamationTriangle, // <-- ตรวจสอบว่ามีบรรทัดนี้อยู่แล้วใน Import List
  faTimesCircle,
  faChevronLeft,
  faChevronRight,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

// กำหนด Interface สำหรับข้อมูลลูกค้าที่ถูกจัดรูปแบบแล้ว
interface CustomerData {
  licensePlate: string;
  customerName: string;
  phone: string;
  registerDate: string;
  status: string;
  // rowIndex?: number; // หาก Google Apps Script ส่ง rowIndex มาด้วย ให้เพิ่มบรรทัดนี้
}

// กำหนด Interface สำหรับข้อมูลดิบที่มาจาก Google Sheet API
// คีย์ต้องตรงกับชื่อคอลัมน์ใน Google Sheet และสิ่งที่ doGet ส่งมา
interface RawCustomerDataItem {
  'ทะเบียนรถ'?: string;
  'ชื่อลูกค้า'?: string;
  'เบอร์ติดต่อ'?: string | number;
  'วันที่ชำระภาษีล่าสุด'?: string;
  'สถานะ'?: string;
  'สถานะการเตือน'?: string;
  // rowIndex?: number; // หาก Google Apps Script ส่ง rowIndex มาด้วย ให้เพิ่มบรรทัดนี้
}


// Interfaces สำหรับ Component ลูก
interface SelectFilterProps {
  value: string;
  onChange: (value: string) => void;
  icon: IconDefinition;
  placeholder: string;
  options: string[];
}

interface PageButtonProps {
  onClick: () => void;
  disabled: boolean;
  icon: IconDefinition;
}


// Maps สำหรับสถานะและสี/ไอคอน
const statusColor: { [key: string]: string } = {
  'ต่อภาษีแล้ว': 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-white',
  'กำลังจะครบกำหนด': 'bg-yellow-200 dark:bg-yellow-600 text-yellow-800 dark:text-black',
  'ใกล้ครบกำหนด': 'bg-yellow-200 dark:bg-yellow-600 text-yellow-800 dark:text-black',
  'เกินกำหนด': 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-white',
  'รอดำเนินการ': 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-white',
};

const statusIcon: { [key: string]: IconDefinition } = {
  'ต่อภาษีแล้ว': faCheckCircle,
  'กำลังจะครบกำหนด': faExclamationTriangle,
  'ใกล้ครบกำหนด': faExclamationTriangle,
  'เกินกำหนด': faTimesCircle,
  'รอดำเนินการ': faClock,
};


// Component ลูก: SelectFilter
function SelectFilter({ value, onChange, icon, placeholder, options }: SelectFilterProps) {
  return (
    <div className="relative">
      <FontAwesomeIcon icon={icon} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-8 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-neutral-700 text-black dark:text-white focus:outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

// Component ลูก: PageButton
function PageButton({ onClick, disabled, icon }: PageButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 transition"
    >
      <FontAwesomeIcon icon={icon} />
    </button>
  );
}


export default function CustomerInfoPage() {
  const [search, setSearch] = useState<string>('');
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [data, setData] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // เพิ่ม state สำหรับ error message
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // **** เปลี่ยน URL นี้เป็น URL ของ Web App ของคุณจริงๆ ที่ได้จาก Google Apps Script ****
  const GOOGLE_SHEET_CUSTOMER_API_URL: string = 'https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64svMYUFCSALwTEX4mYCHoDd6g/exec?getAll=1';


  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null); // รีเซ็ต error ก่อนเริ่ม fetch ใหม่
    try {
      const res = await fetch(GOOGLE_SHEET_CUSTOMER_API_URL);

      if (!res.ok) {
        // ตรวจสอบสถานะ HTTP error
        const errorText = `HTTP error! Status: ${res.status}. ${res.statusText || ''}`;
        throw new Error(errorText);
      }

      const json: { data?: RawCustomerDataItem[]; error?: boolean; message?: string } = await res.json();

      if (json.error) {
        // ตรวจสอบ error ที่มาจาก Apps Script เอง (เช่น ถ้า Apps Script มี Bug)
        throw new Error(`Server Error: ${json.message || 'Unknown server error from Apps Script'}`);
      }

      const formatted: CustomerData[] = (json.data || []).map((item: RawCustomerDataItem) => {
        const dtField: string = item['วันที่ชำระภาษีล่าสุด'] || '';
        // ตรวจสอบรูปแบบวันที่ให้แน่ใจว่าเป็น yyyy-MM-dd
        const registerDate: string = dtField.includes('T') ? dtField.split('T')[0] : dtField;

        const rawPhone: string = (item['เบอร์ติดต่อ'] || '').toString();
        // เพิ่ม '0' หน้าเบอร์โทรศัพท์ ถ้ายังไม่มี
        const phone: string = rawPhone.startsWith('0') || rawPhone.length === 0 ? rawPhone : `0${rawPhone}`;

        return {
          licensePlate: item['ทะเบียนรถ'] || '',
          customerName: item['ชื่อลูกค้า'] || '',
          phone,
          registerDate,
          status: item['สถานะ'] || item['สถานะการเตือน'] || 'รอดำเนินการ',
          // rowIndex: item.rowIndex || 0, // หาก Google Apps Script ส่ง rowIndex มาด้วย ให้เพิ่มบรรทัดนี้
        };
      });
      setData(formatted);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('❌ ดึงข้อมูลลูกค้าไม่สำเร็จ:', err.message);
        setError(`ไม่สามารถโหลดข้อมูลลูกค้าได้: ${err.message}`);
      } else {
        console.error('❌ ดึงข้อมูลลูกค้าไม่สำเร็จ:', err);
        setError('ไม่สามารถโหลดข้อมูลลูกค้าได้ในขณะนี้');
      }
    } finally {
      setLoading(false);
    }
  }, [GOOGLE_SHEET_CUSTOMER_API_URL]); // dependency array

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetFilters = () => {
    setSearch('');
    setFilterDay('');
    setFilterMonth('');
    setFilterYear('');
    setCurrentPage(1); // เมื่อรีเซ็ตตัวกรอง ให้กลับไปหน้าแรก
  };

  const filteredData: CustomerData[] = data
    .filter(item => {
      // กรองรายการที่ไม่มีวันที่ลงทะเบียน หรือวันที่ไม่ถูกต้อง
      if (!item.registerDate || item.registerDate.split('-').length !== 3) {
        return false;
      }
      const [year, monthRaw, dayRaw] = item.registerDate.split('-');

      // แปลงวันและเดือนเป็นรูปแบบที่ใช้ในการกรอง (เช่น "1", "2" แทน "01", "02")
      const day: string = String(Number(dayRaw));
      const monthMap: string[] = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const month: string = monthMap[Number(monthRaw) - 1] || '';

      // เงื่อนไขการค้นหา (ไม่คำนึงถึงตัวพิมพ์เล็ก-ใหญ่)
      const matchSearch: boolean = item.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
                                   item.customerName.toLowerCase().includes(search.toLowerCase());
      // เงื่อนไขการกรองวันที่
      const matchDay: boolean = !filterDay || day === filterDay;
      const matchMonth: boolean = !filterMonth || month === filterMonth;
      const matchYear: boolean = !filterYear || year === filterYear;

      return matchSearch && matchDay && matchMonth && matchYear;
    });

  // Pagination Logic
  const startIdx: number = (currentPage - 1) * itemsPerPage;
  const paginatedData: CustomerData[] = filteredData.slice(startIdx, startIdx + itemsPerPage);
  const totalPages: number = Math.ceil(filteredData.length / itemsPerPage);

  // สร้างตัวเลือกสำหรับ dropdown
  const days: string[] = Array.from({ length: 31 }, (_, i) => `${i + 1}`);
  const months: string[] = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const currentYear: number = new Date().getFullYear();
  // สร้างปีสำหรับ 2 ปีก่อนหน้า ถึง 2 ปีในอนาคต (ปรับตามความต้องการ)
  const years: string[] = Array.from({ length: 5 }, (_, i) => `${currentYear + i - 2}`);


  return (
    <div className="flex min-h-screen flex-col items-center p-4 bg-gray-100 dark:bg-neutral-900 text-black dark:text-white transition-colors">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-center mb-4">
          <CustomerIcon className="w-6 h-6 mr-2 text-blue-500 dark:text-blue-400" /> {/* ตรวจสอบว่า CustomerIcon ใช้งานได้ */}
          <h1 className="text-2xl font-bold">ข้อมูลลูกค้า</h1>
        </div>
        <hr className="border-gray-300 dark:border-gray-700 mb-6" />

        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-md">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 items-center">
            <div className="relative flex-1">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                placeholder="ค้นหาทะเบียนรถ / ชื่อลูกค้า"
                className="w-full pl-10 py-2 rounded-lg bg-gray-50 dark:bg-neutral-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} // เมื่อค้นหาใหม่ ให้กลับไปหน้าแรก
              />
            </div>
            <SelectFilter value={filterDay} onChange={val => { setFilterDay(val); setCurrentPage(1); }} icon={faCalendarDay} placeholder="ทุกวัน" options={days} />
            <SelectFilter value={filterMonth} onChange={val => { setFilterMonth(val); setCurrentPage(1); }} icon={faCalendarAlt} placeholder="ทุกเดือน" options={months} />
            <SelectFilter value={filterYear} onChange={val => { setFilterYear(val); setCurrentPage(1); }} icon={faCalendar} placeholder="ทุกปี" options={years} />
            <div>
              <select
                className="py-2 px-3 rounded-lg bg-gray-50 dark:bg-neutral-700 text-black dark:text-white focus:outline-none"
                value={itemsPerPage}
                onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n} รายการ</option>)}
              </select>
            </div>
            <button onClick={resetFilters} className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition">ล้างตัวกรอง</button>
          </div>

          {/* Table or Loading or Error */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-700 dark:text-gray-200">
              <FontAwesomeIcon icon={faSpinner} spin className="text-4xl mb-4 text-blue-500 dark:text-blue-400" />
              <p className="text-lg">กำลังโหลดข้อมูล...</p>
            </div>
          ) : error ? ( // แสดง error message ถ้ามี
            <div className="flex flex-col items-center justify-center py-12 text-red-600 dark:text-red-400">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl mb-4" /> {/* ใช้ faExclamationTriangle */}
              <p className="text-lg">{error}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700 dark:text-gray-200">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-700">
                      {['ทะเบียนรถ', 'วันที่ชำระภาษี', 'ลูกค้า', 'เบอร์โทร', 'สถานะ'].map((label, i) => (
                        <th key={i} className="py-2 font-medium">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-gray-500 dark:text-gray-400">
                          ไม่พบข้อมูลที่ตรงกับตัวกรอง
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((item, idx) => (
                        <tr key={item.licensePlate + item.customerName + idx} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-neutral-700">
                          <td className="py-2">{item.licensePlate}</td>
                          <td className="py-2">{item.registerDate}</td>
                          <td className="py-2">{item.customerName}</td>
                          <td className="py-2">{item.phone}</td>
                          <td className="py-2">
                            <span className={`${statusColor[item.status] || 'bg-gray-200 dark:bg-gray-700'} px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1`}>
                              <FontAwesomeIcon icon={statusIcon[item.status] || faExclamationTriangle} className="w-3 h-3" />
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center mt-6 gap-2">
                <PageButton onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} icon={faChevronLeft} />
                <span className="text-gray-700 dark:text-gray-200">{currentPage} / {totalPages || 1}</span>
                <PageButton onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} icon={faChevronRight} />
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-8 text-gray-500 dark:text-gray-400">
          <Link href="/" className="inline-flex items-center gap-2 hover:underline">
            <FontAwesomeIcon icon={faChevronLeft} /> กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}