// src/lib/useRenewalNotificationCount.ts
// Hook สำหรับนับจำนวนแจ้งเตือนกรมธรรม์ต่ออายุ

import { useInstallmentInsuranceData } from './useInstallmentInsuranceData';

// ฟังก์ชันคำนวณวันที่หมดอายุของกรมธรรม์
function calculateExpiryDate(startDate: string, installmentCount: number): string | null {
  if (!startDate || !installmentCount) return null;
  
  try {
    const start = new Date(startDate);
    const expiryDate = new Date(start);
    expiryDate.setMonth(expiryDate.getMonth() + installmentCount);
    
    const dd = String(expiryDate.getDate()).padStart(2, '0');
    const mm = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const yyyy = expiryDate.getFullYear();
    
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return null;
  }
}

// ฟังก์ชันคำนวณวันเหลือจนถึงวันหมดอายุ
function calculateDaysUntilExpiry(expiryDateStr: string): number | null {
  if (!expiryDateStr) return null;
  
  try {
    const [dd, mm, yyyy] = expiryDateStr.split('/');
    const expiry = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    const timeDiff = expiry.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  } catch {
    return null;
  }
}

// Type สำหรับ paidDates ที่รองรับทั้ง number และ string key
type PaidDates = { [key: number]: string } | { [key: string]: string } | Record<string | number, string>;

// ฟังก์ชันช่วยในการเข้าถึง paidDates
function getPaidDate(paidDates: PaidDates | undefined, key: number | string): string | undefined {
  if (!paidDates) return undefined;
  return (paidDates as Record<string | number, string>)[key] || (paidDates as Record<string | number, string>)[String(key)];
}

// ฟังก์ชันตรวจสอบว่าผ่อนครบแล้วหรือไม่
function isFullyPaid(paidDates?: PaidDates, installmentCount?: number): boolean {
  if (!installmentCount || installmentCount <= 0 || !paidDates) {
    return false;
  }
  
  // ตรวจสอบว่ามี paidDates ครบทุกงวดหรือไม่
  // รองรับทั้ง key เป็น number และ string
  for (let i = 1; i <= installmentCount; i++) {
    const paidDate = getPaidDate(paidDates, i);
    if (!paidDate || paidDate.trim() === '') {
      return false; // ยังมีงวดที่ยังไม่จ่าย
    }
  }
  
  return true; // จ่ายครบทุกงวดแล้ว
}

// ฟังก์ชันตรวจสอบว่าวันนี้เป็นวันที่ต้องผ่อนหรือไม่
function isPaymentDayToday(paymentDay: number, startDate: string, paidDates?: { [key: number]: string }, installmentCount?: number): boolean {
  if (!paymentDay || !startDate) {
    return false;
  }

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // ตรวจสอบว่าวันนี้ตรงกับ paymentDay หรือไม่
  // รองรับกรณีที่ paymentDay > วันที่ในเดือนนี้ (เช่น paymentDay = 31 แต่เดือนนี้มี 30 วัน)
  const isPaymentDay = currentDay === paymentDay || (currentDay === daysInCurrentMonth && paymentDay > daysInCurrentMonth);
  
  if (!isPaymentDay) {
    return false;
  }

  // คำนวณงวดที่ควรจะผ่อนในเดือนนี้
  try {
    const start = new Date(startDate);
    const startDay = start.getDate();
    const startMonth = start.getMonth();
    const startYear = start.getFullYear();
    
    // คำนวณจำนวนเดือนที่ผ่านมา
    let monthsDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth);
    
    // ถ้าวันที่ปัจจุบันยังไม่ถึงวันที่เริ่มผ่อนในเดือนนี้ ให้ลดเดือนลง 1
    if (currentDay < startDay) {
      monthsDiff -= 1;
    }
    
    const expectedInstallment = monthsDiff + 1;
    
    // ตรวจสอบว่าผ่อนครบแล้วหรือยัง (ถ้า expectedInstallment > installmentCount แสดงว่าผ่อนครบแล้ว)
    if (installmentCount && expectedInstallment > installmentCount) {
      return false;
    }
    
    // ตรวจสอบว่าผ่อนครบทุกงวดแล้วหรือไม่
    if (installmentCount && isFullyPaid(paidDates, installmentCount)) {
      return false;
    }
    
    // ตรวจสอบว่าจ่ายงวดนี้ไปแล้วหรือยัง (รองรับทั้ง key เป็น number และ string)
    const isPaid = paidDates && getPaidDate(paidDates, expectedInstallment);
    return !isPaid && expectedInstallment > 0; // ถ้ายังไม่จ่าย = ต้องแจ้งเตือน
  } catch {
    return false;
  }
}

// Hook สำหรับนับจำนวนแจ้งเตือน
export function useRenewalNotificationCount(shouldFetch = true) {
  const { data, isLoading } = useInstallmentInsuranceData(shouldFetch);
  const dataset = shouldFetch ? data : [];
  
  const count = dataset.filter(item => {
    // ข้ามรายการที่ผ่อนครบแล้ว (status = 'ผ่อนครบแล้ว' หรือจ่ายครบทุกงวดแล้ว)
    // ไม่แจ้งเตือนเลยถ้าผ่อนครบแล้ว
    const fullyPaid = isFullyPaid(item.paidDates, item.installmentCount);
    if (item.status === 'ผ่อนครบแล้ว' || fullyPaid) {
      return false; // ไม่แจ้งเตือนเลยสำหรับรายการที่ผ่อนครบแล้ว
    }
    
    // ตรวจสอบการแจ้งเตือน 2 ประเภท:
    
    // 1. ตรวจสอบว่าวันนี้เป็นวันที่ต้องผ่อนหรือไม่ (เฉพาะ status = 'กำลังผ่อน' และยังไม่ผ่อนครบ)
    if (item.status === 'กำลังผ่อน' && item.paymentDay && item.startDate) {
      if (isPaymentDayToday(item.paymentDay, item.startDate, item.paidDates, item.installmentCount)) {
        return true;
      }
    }
    
    // 2. ตรวจสอบกรมธรรม์ใกล้หมดอายุ (สำหรับรายการที่กำลังผ่อน)
    if (item.status === 'กำลังผ่อน') {
      if (item.startDate && item.installmentCount) {
        const expiryDate = calculateExpiryDate(item.startDate, item.installmentCount);
        if (expiryDate) {
          const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);
          if (daysUntilExpiry !== null && daysUntilExpiry <= 5) {
            return true;
          }
        }
      }
    }
    
    return false;
  }).length;

  return {
    count,
    isLoading: shouldFetch ? isLoading : false
  };
}

