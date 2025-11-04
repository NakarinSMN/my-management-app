// src/app/layout.tsx
import type { Metadata } from "next";
// นำเข้า Kanit พร้อมกับ Inter
import { Inter, Kanit } from "next/font/google";
import "./globals.css"; // Global styles, e.g., Tailwind CSS

import Layout from "./components/Layout"; // Import the main Layout component
import PageTransition from "./components/PageTransition";
import { ThemeProvider } from 'next-themes';
import { NotificationProvider } from './contexts/NotificationContext';
import { DialogProvider } from './contexts/DialogContext';
import NotificationManager from './components/NotificationManager';

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
    <html lang="th" suppressHydrationWarning>
      <body className={`${inter.variable} ${kanit.variable}`} suppressHydrationWarning={true}>
        <ThemeProvider attribute="class">
          <DialogProvider>
            <NotificationProvider>
              <Layout>
                <PageTransition>
                  {children}
                </PageTransition>
              </Layout>
              <NotificationManager />
            </NotificationProvider>
          </DialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
