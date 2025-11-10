// src/lib/useDebounce.ts
import { useEffect, useState } from 'react';

/**
 * Custom hook สำหรับ debounce value
 * @param value - ค่าที่ต้องการ debounce
 * @param delay - เวลาหน่วง (milliseconds) default 500ms
 * @returns debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // ตั้ง timer เพื่อ update debounced value หลังจาก delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear timeout ถ้า value เปลี่ยนก่อนหมดเวลา
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

