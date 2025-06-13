import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // ถ้ายังใช้ Geist font อยู่
import "./globals.css";

// สมมติว่าคุณยังต้องการใช้ Geist font หรือคุณสามารถลบออกได้หากไม่ใช้แล้ว
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ระบบจัดการงานบริการ", // เปลี่ยนชื่อเว็บไซต์ตรงนี้ตามที่คุณต้องการ
  description: "Billing System Clone", // เปลี่ยนคำอธิบายตามที่คุณต้องการ
  icons: {
    icon: "/packagemajor-svgrepo-com.svg", // ตรวจสอบพาธของ favicon ของคุณ
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Font Awesome CDN (สำหรับ Web Fonts) */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}