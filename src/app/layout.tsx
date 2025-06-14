// src/app/layout.tsx
import type { Metadata } from "next";
// นำเข้า Kanit พร้อมกับ Inter
import { Inter, Kanit } from "next/font/google";
import "./globals.css"; // Global styles, e.g., Tailwind CSS

import Layout from "./components/Layout"; // Import the main Layout component

// กำหนดฟอนต์ Inter และให้เป็น CSS variable
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// กำหนดฟอนต์ Kanit, ระบุ subsets ที่จำเป็น (เช่น "thai" และ "latin"),
// ระบุน้ำหนักฟอนต์ที่ต้องการโหลด และกำหนดให้เป็น CSS variable
const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"], // คุณสามารถเลือกน้ำหนักฟอนต์ที่ต้องการได้
  variable: "--font-kanit",
});

export const metadata: Metadata = {
  title: "ระบบจัดการงานบริการ ตรอ.บังรีท่าอิฐ",
  description: "Billing System",
  icons: {
    icon: "/packagemajor-svgrepo-com.svg", // Path to your favicon file
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // เพิ่ม className ของทั้งสองฟอนต์ลงในแท็ก <html>
    // ทำให้ตัวแปร CSS ของฟอนต์พร้อมใช้งานทั่วทั้งแอป
    <html lang="th" className={`${inter.variable} ${kanit.variable}`}>
      <body>
        {/*
          หมายเหตุ: การเช็ค `window.location.pathname` ไม่สามารถทำได้โดยตรงใน Server Component
          (เช่น layout.tsx) เพราะ `window` จะไม่มีอยู่บนเซิร์ฟเวอร์
          หากคุณต้องการ Layout ที่แตกต่างกันสำหรับหน้า Landing Page,
          คุณควรใช้ Route Groups หรือแยก Layout Component ออกไปต่างหาก
          สำหรับตอนนี้ เราจะใช้ <Layout> ห่อหุ้ม children ไว้ทั้งหมด
        */}
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
