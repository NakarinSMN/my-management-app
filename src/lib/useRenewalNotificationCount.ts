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

// ฟังก์ชันตรวจสอบว่าวันนี้เป็นวันที่ต้องผ่อนหรือไม่
function isPaymentDayToday(paymentDay: number, startDate: string, paidDates?: { [key: number]: string }): boolean {
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
    
    // ตรวจสอบว่าจ่ายงวดนี้ไปแล้วหรือยัง
    const isPaid = paidDates && paidDates[expectedInstallment];
    return !isPaid && expectedInstallment > 0; // ถ้ายังไม่จ่าย = ต้องแจ้งเตือน
  } catch {
    return false;
  }
}

// Hook สำหรับนับจำนวนแจ้งเตือน
export function useRenewalNotificationCount() {
  const { data, isLoading } = useInstallmentInsuranceData();
  
  const count = data.filter(item => {
    // ตรวจสอบการแจ้งเตือน 2 ประเภท:
    
    // 1. ตรวจสอบว่าวันนี้เป็นวันที่ต้องผ่อนหรือไม่ (เฉพาะ status = 'กำลังผ่อน')
    if (item.status === 'กำลังผ่อน' && item.paymentDay && item.startDate) {
      if (isPaymentDayToday(item.paymentDay, item.startDate, item.paidDates)) {
        return true;
      }
    }
    
    // 2. ตรวจสอบกรมธรรม์ใกล้หมดอายุ
    if (item.status === 'กำลังผ่อน' || item.status === 'ผ่อนครบแล้ว') {
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
    isLoading
  };
}

