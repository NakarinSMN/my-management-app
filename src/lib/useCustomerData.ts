// src/lib/useCustomerData.ts
// Custom Hook สำหรับดึงข้อมูลลูกค้าพร้อม Cache

import useSWR from 'swr';
import { useEffect, useState } from 'react';

const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64svMYUFCSALwTEX4mYCHoDd6g/exec?getAll=1';
const CACHE_KEY = 'customer_data_cache';
const CACHE_TIMESTAMP_KEY = 'customer_data_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 นาที

interface RawCustomerDataItem {
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

// ฟังก์ชัน fetcher ที่มี localStorage cache
const fetcherWithCache = async (url: string) => {
  // ตรวจสอบ cache ใน localStorage ก่อน
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cached && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      if (age < CACHE_DURATION) {
        console.log('✅ ใช้ข้อมูลจาก localStorage cache (อายุ:', Math.round(age / 1000), 'วินาที)');
        return JSON.parse(cached);
      } else {
        console.log('⏰ Cache หมดอายุแล้ว กำลังดึงข้อมูลใหม่...');
      }
    }
  }

  // ดึงข้อมูลจาก API
  console.log('🌐 กำลังดึงข้อมูลจาก Google Sheets...');
  const response = await fetch(url);
  const data = await response.json();

  // บันทึกลง localStorage
  if (typeof window !== 'undefined' && data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log('💾 บันทึกข้อมูลลง cache แล้ว');
  }

  return data;
};

// ฟังก์ชันแปลงข้อมูลดิบเป็น CustomerData
export function formatCustomerData(item: RawCustomerDataItem): CustomerData {
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
    status: item['สถานะ'] || item['สถานะการเตือน'] || 'รอดำเนินการ',
    note: item['หมายเหตุ'] || '',
  };
}

// Custom Hook หลัก
export function useCustomerData() {
  const [formattedData, setFormattedData] = useState<CustomerData[]>([]);
  
  const { data: swrData, error: swrError, mutate, isLoading } = useSWR(
    GOOGLE_SHEET_API_URL,
    fetcherWithCache,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10000, // ไม่ให้โหลดซ้ำภายใน 10 วินาที
      revalidateIfStale: false, // ไม่ revalidate ถ้าข้อมูลยัง fresh
      revalidateOnMount: true,
      focusThrottleInterval: 30000, // throttle focus revalidation
    }
  );

  useEffect(() => {
    if (swrData && swrData.data) {
      const formatted: CustomerData[] = (swrData.data || []).map((item: RawCustomerDataItem) => 
        formatCustomerData(item)
      );
      
      // เรียงข้อมูลให้แถวล่าสุดอยู่บนสุด (reverse order)
      const reversedData = formatted.reverse();
      setFormattedData(reversedData);
    }
  }, [swrData]);

  // ฟังก์ชันสำหรับ clear cache
  const clearCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      console.log('🗑️ ล้าง cache แล้ว');
    }
    mutate(); // Revalidate ข้อมูลใหม่
  };

  // ฟังก์ชันสำหรับ refresh ข้อมูล
  const refreshData = async () => {
    clearCache();
    await mutate();
  };

  return {
    data: formattedData,
    rawData: swrData,
    error: swrError,
    isLoading,
    mutate,
    clearCache,
    refreshData,
  };
}

// Export API URL สำหรับใช้ใน forms
export { GOOGLE_SHEET_API_URL };


