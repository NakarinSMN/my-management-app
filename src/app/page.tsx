

// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect ไปหน้า login ทันทีเมื่อโหลดหน้าแรก
    router.replace("/login");
  }, [router]);

  // แสดง loading หรือ blank screen ขณะ redirect
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังเปลี่ยนเส้นทาง...</p>
      </div>
    </div>
  );
}