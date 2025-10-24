// src/lib/useBillingData.ts
// Custom Hook สำหรับดึงข้อมูลบิลพร้อม Cache

import useSWR from 'swr';
import { useEffect, useState } from 'react';

// เปลี่ยนจาก Google Sheets API เป็น MongoDB API
const MONGODB_BILLING_API_URL = '/api/billing';

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

// ฟังก์ชัน fetcher แบบง่ายๆ ไม่มี cache
const fetcher = async (url: string) => {
  console.log('🌐 กำลังดึงข้อมูลบิลจาก MongoDB API...');
  const response = await fetch(url);
  const data = await response.json();
  console.log('✅ ดึงข้อมูลบิลจาก MongoDB สำเร็จ');
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
    MONGODB_BILLING_API_URL,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0,
      revalidateIfStale: true,
      revalidateOnMount: true,
      refreshInterval: 0,
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
export { MONGODB_BILLING_API_URL };


