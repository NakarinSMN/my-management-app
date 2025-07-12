"use client";
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-8 px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">ตั้งค่าทั่วไป</h1>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">ธีม</h2>
          <div className="flex gap-4">
            <button
              className={`px-4 py-2 rounded-lg font-medium border transition-colors ${theme === 'light' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
              onClick={() => setTheme('light')}
            >
              โหมดสว่าง
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium border transition-colors ${theme === 'dark' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
              onClick={() => setTheme('dark')}
            >
              โหมดมืด
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium border transition-colors ${theme === 'system' || (!theme && resolvedTheme === 'system') ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
              onClick={() => setTheme('system')}
            >
              ตามระบบ
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">เลือกธีมที่คุณต้องการสำหรับการใช้งานทุกหน้า</p>
        </div>
      </div>
    </div>
  );
} 