// src/lib/useInstallmentInsuranceData.ts
// Custom Hook สำหรับดึงข้อมูลผ่อนประกันพร้อม Cache

import useSWR from 'swr';
import { useEffect, useState } from 'react';

const MONGODB_INSTALLMENT_INSURANCE_API_URL = '/api/installment-insurance';

interface RawInstallmentInsuranceItem {
  // MongoDB fields
  _id?: string; // MongoDB ObjectId
  sequenceNumber?: number;
  licensePlate?: string;
  vehicleType?: string;
  brand?: string;
  customerName?: string;
  phone?: string;
  insuranceCompany?: string; // บริษัทประกัน
  insurancePremium?: number; // เบี้ยประกัน
  installmentCount?: number; // จำนวนงวดที่ผ่อน
  currentInstallment?: number; // งวดที่ผ่อนไปแล้ว
  startDate?: string; // วันที่เริ่มผ่อน
  paymentDay?: number; // วันที่ของเดือนที่ต้องจ่าย
  paidDates?: { [key: string]: string }; // วันที่จ่ายจริงของแต่ละงวด
  installmentAmounts?: { [key: string]: number }; // จำนวนเงินของแต่ละงวด
  tags?: string[];
  status?: string;
  note?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InstallmentInsuranceData {
  _id?: string; // MongoDB ObjectId
  sequenceNumber?: number; // เลขลำดับ 6 หลัก
  licensePlate: string;
  vehicleType?: string; // ประเภทรถ
  brand?: string; // ยี่ห้อ
  customerName: string;
  phone: string;
  insuranceCompany: string; // บริษัทประกัน
  insurancePremium: number; // เบี้ยประกันรวม
  installmentCount: number; // จำนวนงวดที่ผ่อน
  currentInstallment?: number; // งวดที่ผ่อนไปแล้ว
  startDate?: string; // วันที่เริ่มผ่อนงวดแรก
  paymentDay?: number; // วันที่ของเดือนที่ต้องจ่าย (1-31)
  paidDates?: { [installmentNumber: number]: string }; // วันที่จ่ายจริงของแต่ละงวด
  installmentAmounts?: { [installmentNumber: number]: number }; // จำนวนเงินของแต่ละงวด (กรณีไม่เท่ากัน)
  tags?: string[]; // แท็ก
  status: string;
  note?: string;
  userId?: string;
  createdAt?: string; // วันที่บันทึกข้อมูล
  updatedAt?: string; // วันที่อัปเดตล่าสุด
}

// ฟังก์ชัน fetcher แบบง่ายๆ ไม่มี cache
const fetcher = async (url: string) => {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    cache: 'no-store'
  });
  
  if (!res.ok) {
    const error = new Error('Failed to fetch installment insurance data') as Error & { status: number };
    error.status = res.status;
    throw error;
  }
  
  return res.json();
};

// ฟังก์ชันแปลงข้อมูลดิบเป็น InstallmentInsuranceData
export function formatInstallmentInsuranceData(item: RawInstallmentInsuranceItem): InstallmentInsuranceData {
  // แปลง paidDates จาก string keys เป็น number keys
  const paidDates: { [key: number]: string } = {};
  if (item.paidDates) {
    Object.keys(item.paidDates).forEach(key => {
      paidDates[parseInt(key)] = item.paidDates![key];
    });
  }

  // แปลง installmentAmounts จาก string keys เป็น number keys
  const installmentAmounts: { [key: number]: number } = {};
  if (item.installmentAmounts) {
    Object.keys(item.installmentAmounts).forEach(key => {
      installmentAmounts[parseInt(key)] = item.installmentAmounts![key];
    });
  }

  return {
    _id: item._id as string,
    sequenceNumber: item.sequenceNumber,
    licensePlate: item.licensePlate || '',
    vehicleType: item.vehicleType || '',
    brand: item.brand || '',
    customerName: item.customerName || '',
    phone: item.phone || '',
    insuranceCompany: item.insuranceCompany || '',
    insurancePremium: item.insurancePremium || 0,
    installmentCount: item.installmentCount || 0,
    currentInstallment: item.currentInstallment || 0,
    startDate: item.startDate || '',
    paymentDay: item.paymentDay || 1,
    paidDates: paidDates,
    installmentAmounts: installmentAmounts,
    tags: item.tags || [],
    status: item.status || 'กำลังผ่อน',
    note: item.note || '',
    userId: item.userId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

// Custom Hook หลัก
export function useInstallmentInsuranceData(shouldFetch = true) {
  const [formattedData, setFormattedData] = useState<InstallmentInsuranceData[]>([]);

  const { data: swrData, error: swrError, mutate, isLoading } = useSWR(
    shouldFetch ? MONGODB_INSTALLMENT_INSURANCE_API_URL : null,
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
      console.log('🔍 [useInstallmentInsuranceData] Raw data received:', swrData.data);
      const formatted: InstallmentInsuranceData[] = (swrData.data || []).map((item: RawInstallmentInsuranceItem) => 
        formatInstallmentInsuranceData(item)
      );
      
      console.log('🔍 [useInstallmentInsuranceData] Formatted data:', formatted);
      
      // เรียงข้อมูลตาม sequenceNumber จากมากไปน้อย (ข้อมูลใหม่อยู่บนสุด)
      const sortedData = formatted.sort((a, b) => {
        const seqA = a.sequenceNumber || 0;
        const seqB = b.sequenceNumber || 0;
        return seqB - seqA; // เรียงจากมากไปน้อย
      });
      
      setFormattedData(sortedData);
    } else if (!shouldFetch) {
      setFormattedData([]);
    }
  }, [swrData, shouldFetch]);

  // ฟังก์ชันสำหรับ refresh ข้อมูล
  const refreshData = async () => {
    await mutate();
  };

  return {
    data: formattedData,
    rawData: swrData,
    error: swrError,
    isLoading: shouldFetch ? isLoading : false,
    mutate,
    refreshData,
  };
}

// Export API URL สำหรับใช้ใน forms
export { MONGODB_INSTALLMENT_INSURANCE_API_URL };

