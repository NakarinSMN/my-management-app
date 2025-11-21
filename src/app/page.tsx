

// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // รอให้เช็ค session เสร็จก่อน
    if (status === "loading") {
      return;
    }

    // ถ้า login แล้วให้ redirect ไปหน้า dashboard
    if (status === "authenticated" && session) {
      router.replace("/dashboard");
    } else {
      // ถ้ายังไม่ login ให้ redirect ไปหน้า login
      router.replace("/login");
    }
  }, [router, status, session]);

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