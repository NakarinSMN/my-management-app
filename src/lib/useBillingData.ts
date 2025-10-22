// src/lib/useBillingData.ts
// Custom Hook สำหรับดึงข้อมูลบิลพร้อม Cache

import useSWR from 'swr';
import { useEffect, useState } from 'react';

const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbxN9rG3NhDyhlXVKgNndNcJ6kHopPaf5GRma_dRYjtP64svMYUFCSALwTEX4mYCHoDd6g/exec';
const CACHE_KEY = 'billing_data_cache';
const CACHE_TIMESTAMP_KEY = 'billing_data_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 นาที

// Interface สำหรับข้อมูลบิล
export interface BillingData {
  billNumber: string;
  customerName: string;
  service: string;
  category: string;
  price: number;
  date: string;
  phone: string;
  status: string;
  items?: string; // รายการเพิ่มเติม (JSON string)
  totalAmount?: number; // ยอดเงินรวม
}

interface RawBillingDataItem {
  'เลขที่บิล'?: string;
  'ลูกค้า'?: string;
  'บริการ'?: string;
  'หมวดหมู่'?: string;
  'ราคา'?: string | number;
  'วันที่'?: string;
  'เบอร์ติดต่อ'?: string | number;
  'สถานะ'?: string;
  'รายการและยอดเงิน'?: string;
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
        console.log('✅ ใช้ข้อมูลบิลจาก localStorage cache (อายุ:', Math.round(age / 1000), 'วินาที)');
        return JSON.parse(cached);
      } else {
        console.log('⏰ Cache บิลหมดอายุแล้ว กำลังดึงข้อมูลใหม่...');
      }
    }
  }

  // ดึงข้อมูลจาก API
  console.log('🌐 กำลังดึงข้อมูลบิลจาก Google Sheets...');
  const response = await fetch(`${url}?getBills=1`);
  const data = await response.json();

  // บันทึกลง localStorage
  if (typeof window !== 'undefined' && data) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log('💾 บันทึกข้อมูลบิลลง cache แล้ว');
  }

  return data;
};

// ฟังก์ชันแปลงข้อมูลดิบเป็น BillingData
export function formatBillingData(item: RawBillingDataItem): BillingData {
  // แปลงราคาเป็นตัวเลข
  let price = 0;
  if (typeof item['ราคา'] === 'number') {
    price = item['ราคา'];
  } else if (typeof item['ราคา'] === 'string') {
    price = parseFloat(item['ราคา'].replace(/[^0-9.-]/g, '')) || 0;
  }

  // แปลงเบอร์โทร
  const rawPhone: string = (item['เบอร์ติดต่อ'] || '').toString();
  const phone: string = rawPhone.startsWith('0') || rawPhone.length === 0 ? rawPhone : `0${rawPhone}`;

  // แปลง JSON รายการและยอดเงิน
  let items = '';
  let totalAmount = price;
  
  if (item['รายการและยอดเงิน']) {
    try {
      const parsed = JSON.parse(item['รายการและยอดเงิน']);
      items = item['รายการและยอดเงิน'];
      totalAmount = parsed.totalAmount || price;
    } catch {
      items = item['รายการและยอดเงิน'];
    }
  }
  
  return {
    billNumber: item['เลขที่บิล'] || '',
    customerName: item['ลูกค้า'] || '',
    service: item['บริการ'] || '',
    category: item['หมวดหมู่'] || '',
    price,
    date: item['วันที่'] || '',
    phone,
    status: item['สถานะ'] || 'รอดำเนินการ',
    items,
    totalAmount,
  };
}

// Custom Hook หลัก
export function useBillingData() {
  const [formattedData, setFormattedData] = useState<BillingData[]>([]);
  
  const { data: swrData, error: swrError, mutate, isLoading } = useSWR(
    GOOGLE_SHEET_API_URL,
    fetcherWithCache,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10000,
      revalidateIfStale: false,
      revalidateOnMount: true,
      focusThrottleInterval: 30000,
    }
  );

  useEffect(() => {
    if (swrData && swrData.data) {
      const formatted: BillingData[] = (swrData.data || []).map((item: RawBillingDataItem) => 
        formatBillingData(item)
      );
      
      // เรียงข้อมูลให้แถวล่าสุดอยู่บนสุด
      const reversedData = formatted.reverse();
      setFormattedData(reversedData);
    }
  }, [swrData]);

  // ฟังก์ชันสำหรับ clear cache
  const clearCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      console.log('🗑️ ล้าง cache บิลแล้ว');
    }
    mutate();
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


