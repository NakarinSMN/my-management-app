// src/lib/useCustomerData.ts
// Custom Hook สำหรับดึงข้อมูลลูกค้าพร้อม Cache

import useSWR from 'swr';
import { useEffect, useState } from 'react';

// เปลี่ยนจาก Google Sheets API เป็น MongoDB API
const MONGODB_CUSTOMER_API_URL = '/api/customers';

interface RawCustomerDataItem {
  // MongoDB fields
  licensePlate?: string;
  brand?: string;
  customerName?: string;
  phone?: string;
  registerDate?: string;
  status?: string;
  note?: string;
  userId?: string;
  day?: number;
  // Google Sheets fields (เดิม)
  'ทะเบียนรถ'?: string;
  'ยี่ห้อ / รุ่น'?: string;
  'ชื่อลูกค้า'?: string;
  'เบอร์ติดต่อ'?: string | number;
  'วันที่ชำระภาษีล่าสุด'?: string;
  'สถานะ'?: string;
  'สถานะการเตือน'?: string;
  'หมายเหตุ'?: string;
}

export interface CustomerData {
  licensePlate: string;
  brand?: string;
  customerName: string;
  phone: string;
  registerDate: string;
  status: string;
  note?: string;
  userId?: string;
  day?: number;
}

// ฟังก์ชัน fetcher แบบง่ายๆ ไม่มี cache
const fetcher = async (url: string) => {
  console.log('🌐 กำลังดึงข้อมูลจาก MongoDB API...');
  const response = await fetch(url);
  const data = await response.json();
  console.log('✅ ดึงข้อมูลจาก MongoDB สำเร็จ');
  return data;
};

// ฟังก์ชันคำนวณสถานะตามวันที่ชำระภาษี
function calculateStatus(registerDate: string): string {
  if (!registerDate) return 'รอดำเนินการ';
  
  try {
    // แปลงวันที่เป็น Date object
    let date: Date;
    
    // ถ้าเป็น DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(registerDate)) {
      const [day, month, year] = registerDate.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // ถ้าเป็น YYYY-MM-DD
    else if (/^\d{4}-\d{2}-\d{2}$/.test(registerDate)) {
      date = new Date(registerDate);
    }
    // ถ้าเป็น ISO format
    else if (registerDate.includes('T')) {
      date = new Date(registerDate);
    }
    else {
      return 'รอดำเนินการ';
    }
    
    // คำนวณวันที่ครบกำหนด (1 ปีหลังจากวันที่ชำระ)
    const expiryDate = new Date(date);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    // คำนวณ gap (วันที่ครบกำหนด - วันนี้)
    const today = new Date();
    const gap = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // คำนวณสถานะตามสูตร
    if (gap < 0) {
      return 'เกินกำหนด';
    } else if (gap === 0) {
      return 'ครบกำหนดวันนี้';
    } else if (gap <= 90) {
      return 'กำลังจะครบกำหนด';
    } else {
      return 'ต่อภาษีแล้ว';
    }
  } catch (error) {
    console.error('Error calculating status:', error);
    return 'รอดำเนินการ';
  }
}

// ฟังก์ชันแปลงข้อมูลดิบเป็น CustomerData
export function formatCustomerData(item: RawCustomerDataItem): CustomerData {
  // ตรวจสอบว่าเป็นข้อมูลจาก MongoDB หรือ Google Sheets
  const isMongoDBData = item.licensePlate !== undefined;
  
  if (isMongoDBData) {
    // ข้อมูลจาก MongoDB
    const dtField: string = item.registerDate || '';
    
    // จัดการวันที่ให้ถูกต้อง
    let registerDate = '';
    if (dtField) {
      // ถ้าเป็น ISO format (YYYY-MM-DDTHH:mm:ss)
      if (dtField.includes('T')) {
        registerDate = dtField.split('T')[0];
      }
      // ถ้าเป็น DD/MM/YYYY อยู่แล้ว
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dtField)) {
        registerDate = dtField;
      }
      // ถ้าเป็น YYYY-MM-DD
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dtField)) {
        registerDate = dtField;
      }
      // อื่นๆ ใช้ค่าเดิม
      else {
        registerDate = dtField;
      }
    }
    
    const rawPhone: string = (item.phone || '').toString();
    const phone: string = rawPhone.startsWith('0') || rawPhone.length === 0 ? rawPhone : `0${rawPhone}`;
    
    return {
      licensePlate: item.licensePlate || '',
      brand: item.brand || '',
      customerName: item.customerName || '',
      phone,
      registerDate,
      status: calculateStatus(registerDate), // คำนวณสถานะอัตโนมัติ
      note: item.note || '',
      userId: item.userId || '',
      day: item.day || 365,
    };
  } else {
    // ข้อมูลจาก Google Sheets (เดิม)
    const dtField: string = item['วันที่ชำระภาษีล่าสุด'] || '';
    
    // จัดการวันที่ให้ถูกต้อง
    let registerDate = '';
    if (dtField) {
      // ถ้าเป็น ISO format (YYYY-MM-DDTHH:mm:ss)
      if (dtField.includes('T')) {
        registerDate = dtField.split('T')[0];
      }
      // ถ้าเป็น DD/MM/YYYY อยู่แล้ว
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dtField)) {
        registerDate = dtField;
      }
      // ถ้าเป็น YYYY-MM-DD
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dtField)) {
        registerDate = dtField;
      }
      // อื่นๆ ใช้ค่าเดิม
      else {
        registerDate = dtField;
      }
    }
    
    const rawPhone: string = (item['เบอร์ติดต่อ'] || '').toString();
    const phone: string = rawPhone.startsWith('0') || rawPhone.length === 0 ? rawPhone : `0${rawPhone}`;
    
    return {
      licensePlate: item['ทะเบียนรถ'] || '',
      brand: item['ยี่ห้อ / รุ่น'] || '',
      customerName: item['ชื่อลูกค้า'] || '',
      phone,
      registerDate,
      status: calculateStatus(registerDate), // คำนวณสถานะอัตโนมัติ
      note: item['หมายเหตุ'] || '',
    };
  }
}

// Custom Hook หลัก
export function useCustomerData() {
  const [formattedData, setFormattedData] = useState<CustomerData[]>([]);
  
  const { data: swrData, error: swrError, mutate, isLoading } = useSWR(
    MONGODB_CUSTOMER_API_URL,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0, // ไม่มี deduping
      revalidateIfStale: true,
      revalidateOnMount: true,
      refreshInterval: 0, // ไม่ auto refresh
    }
  );

  useEffect(() => {
    if (swrData && swrData.data) {
      console.log('🔍 [useCustomerData] Raw data received:', swrData.data);
      const formatted: CustomerData[] = (swrData.data || []).map((item: RawCustomerDataItem) => 
        formatCustomerData(item)
      );
      
      console.log('🔍 [useCustomerData] Formatted data:', formatted);
      
      // เรียงข้อมูลให้แถวล่าสุดอยู่บนสุด (reverse order)
      const reversedData = formatted.reverse();
      setFormattedData(reversedData);
    }
  }, [swrData]);

  // ฟังก์ชันสำหรับ refresh ข้อมูล
  const refreshData = async () => {
    await mutate();
  };

  return {
    data: formattedData,
    rawData: swrData,
    error: swrError,
    isLoading,
    mutate,
    refreshData,
  };
}

// Export API URL สำหรับใช้ใน forms
export { MONGODB_CUSTOMER_API_URL };


