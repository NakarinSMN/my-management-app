// src/app/components/Layout.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

// Font Awesome Imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faHandHoldingUsd,
  faUserCircle,
  faFileAlt,
  // faCalendarAlt,
  faAngleLeft,
  faBars,
  faClock,
  faMoneyBillWave,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useRenewalNotificationCount } from "@/lib/useRenewalNotificationCount";

interface MenuItemProps {
  href: string;
  icon: IconDefinition;
  text: string;
  isSidebarOpen: boolean;
  notificationCount?: number;
}

const SidebarMenuItem: React.FC<MenuItemProps> = ({ href, icon, text, notificationCount = 0 }) => {
  const pathname = usePathname();
  const isActive = pathname !== null && pathname.startsWith(href) && (pathname.length === href.length || pathname.charAt(href.length) === '/');
  const hasNotification = notificationCount > 0;

  return (
    <Link
      href={href}
      className={`flex items-center p-3.5 rounded-xl text-gray-700 dark:text-gray-200 transition-all duration-300 group relative
        ${isActive 
          ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white dark:from-emerald-600 dark:to-green-600 shadow-lg shadow-emerald-500/30" 
          : "hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 dark:hover:from-emerald-900/20 dark:hover:to-green-900/20 hover:shadow-md"
        }
        justify-start`}
      title={text}
    >
      <motion.div 
        whileHover={{ scale: 1.03, x: 3 }} 
        whileTap={{ scale: 0.98 }}
        className="flex items-center w-full"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 relative
          ${isActive 
            ? "bg-white/20 shadow-md" 
            : "bg-gray-100 dark:bg-gray-700 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/30"
          }`}
        >
          <FontAwesomeIcon icon={icon} className="text-lg" />
          {/* Badge แจ้งเตือน */}
          {hasNotification && (
            <>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-lg border border-white dark:border-gray-800">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            </>
          )}
        </div>
        <span className="font-semibold text-[14px] ml-3 flex-1">{text}</span>
        {/* วงกลมสีแดงที่ข้อความ */}
        {hasNotification && (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-2"></div>
        )}
      </motion.div>
    </Link>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // sidebar state (mobile เท่านั้น)
  const [isMobile, setIsMobile] = useState(false); // Mobile state
  const [sidebarWidth, setSidebarWidth] = useState(300); // default 300px
  
  // ดึงจำนวนแจ้งเตือน
  const { count: renewalNotificationCount } = useRenewalNotificationCount();

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setIsSidebarOpen(false); // ปิด sidebar เมื่อเข้า mobile
      } else {
        setIsSidebarOpen(true); // เปิด sidebar เมื่อเข้า PC
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // เรียกครั้งแรก
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarWidth(window.innerWidth);
    } else {
      setSidebarWidth(300);
    }
  }, [isMobile]);

  const toggleMobileSidebar = () => {
    if (isMobile) setIsSidebarOpen((open) => !open);
  };

  // กำหนดความกว้างของ Sidebar สำหรับ Tailwind CSS
  // w-64 = 256px, w-20 = 80px
  const sidebarWidthClass = isMobile ? 'w-full' : 'w-[300px]';

  // ใช้ state isMobile แทนการเช็ค window.innerWidth โดยตรง
  const marginLeftMain = isMobile ? '0px' : '300px'; // 256px = w-64, 80px = w-20

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Overlay for Mobile View when Sidebar is open */}
      {isMobile && isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5, display: 'block' }}
          exit={{ opacity: 0, display: 'none' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 bg-black z-30 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar - **นี่คือจุดที่สำคัญ** ให้ Sidebar เป็น fixed และกำหนดความกว้าง */}
      <motion.aside
        initial={{ x: 0 }}
        animate={{
          x: isMobile && !isSidebarOpen ? -sidebarWidth : 0,
          width: isMobile ? (isSidebarOpen ? '100%' : '0%') : '300px'
        }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0.0, 0.2, 1], // Custom easing for smoother animation
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        className={`fixed top-0 left-0 h-full ${sidebarWidthClass} bg-gradient-to-b from-white via-emerald-50/30 to-green-50/20 dark:from-gray-800 dark:via-emerald-950/20 dark:to-gray-800 shadow-2xl z-40
          flex flex-col border-r-2 border-emerald-100 dark:border-emerald-900/30
          lg:flex-shrink-0 lg:overflow-y-auto lg:transform-none lg:transition-all lg:duration-300 lg:ease-in-out`}
      // ลบคลาส lg:fixed ออกจาก Sidebar เพราะเราจะใช้ flexbox และ margin-left แทนการ fixed
      // **คำอธิบาย: จริงๆ แล้ว lg:fixed ใน aside ถูกต้องแล้วครับ เพื่อให้มันตรึงอยู่**
      // **ปัญหาคือ div main content ไม่ได้ใช้ margin-left/padding-left ที่ถูกต้องและ dynamic**
      // ผมจะกลับไปใช้ lg:fixed เหมือนเดิมใน aside และแก้ไขที่ main content
      >
        <div className="p-6 flex items-center justify-between border-b-2 border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-r from-emerald-50/50 to-green-50/30 dark:from-emerald-950/30 dark:to-gray-800">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 p-0.5 shadow-lg">
              <div className="w-full h-full rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center">
                <Image
                  className="h-6 w-auto"
                  src="/ToRoOo.png"
                  alt="Billing System Logo"
                  width={100}
                  height={100}
                  priority
                />
              </div>
            </div>
          </motion.div>

          {(isMobile || isSidebarOpen) && (
            <motion.h2
              className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent ml-3 flex-grow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              ตรอ.บังรีท่าอิฐ
            </motion.h2>
          )}

          {/* ปุ่มปิดเมนูสำหรับโหมดมือถือ */}
          {isMobile && (
            <motion.button
              onClick={toggleMobileSidebar}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lg:hidden p-2 rounded-xl text-gray-600 bg-white hover:bg-gradient-to-r hover:from-emerald-50 hover:to-green-50 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md"
              aria-label="ปิดเมนู"
            >
              <FontAwesomeIcon icon={faAngleLeft} className="text-lg" />
            </motion.button>
          )}

          {/* ลบปุ่มย่อ/ขยายสำหรับเดสก์ท็อป */}
          {/* <motion.button
            onClick={toggleDesktopSidebar}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden lg:block text-gray-600 dark:text-gray-300 focus:outline-none ml-2 transition-colors duration-200"
          >
            <FontAwesomeIcon icon={isDesktopSidebarExpanded ? faAngleLeft : faAngleRight} className="text-xl" />
          </motion.button> */}
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-300 dark:scrollbar-thumb-emerald-700 scrollbar-track-transparent">
          <ul className="space-y-2.5">
            <SidebarMenuItem
              href="/dashboard"
              icon={faTachometerAlt}
              text="แดชบอร์ด"
              isSidebarOpen={isMobile || isSidebarOpen}
            />
            <SidebarMenuItem
              href="/pricing"
              icon={faHandHoldingUsd}
              text="ราคางานบริการ"
              isSidebarOpen={isMobile || isSidebarOpen}
            />


            {/* Divider */}
            <div className="my-5 mx-3 border-t-2 border-emerald-100 dark:border-emerald-900/30"></div>
            
            <motion.h3
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-6 mb-3 px-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: (isMobile || isSidebarOpen) ? 1 : 0,
                x: (isMobile || isSidebarOpen) ? 0 : -20
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {(isMobile || isSidebarOpen) ? "ข้อมูลลูกค้า" : ""}
            </motion.h3>
            {/* <SidebarMenuItem
              href="/billing-main"
              icon={faFileAlt}
              text="ออกบิล"
              isSidebarOpen={isMobile || isSidebarOpen}
            /> */}
            <SidebarMenuItem
              href="/customer-info"
              icon={faUserCircle}
              text="ข้อมูลต่อภาษี"
              isSidebarOpen={isMobile || isSidebarOpen}
            />
            <SidebarMenuItem
              href="/installment-insurance"
              icon={faMoneyBillWave}
              text="ข้อมูลผ่อนประกัน"
              isSidebarOpen={isMobile || isSidebarOpen}
              notificationCount={renewalNotificationCount}
            />

            {/* <SidebarMenuItem
              href="/billing"
              icon={faCalendarAlt}
              text="ประวัติ"
              isSidebarOpen={isMobile || isSidebarOpen}
            /> */}


            {/* Divider */}
            <div className="my-5 mx-3 border-t-2 border-emerald-100 dark:border-emerald-900/30"></div>
            
            <motion.h3
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-6 mb-3 px-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: (isMobile || isSidebarOpen) ? 1 : 0,
                x: (isMobile || isSidebarOpen) ? 0 : -20
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >{(isMobile || isSidebarOpen) ? "คำนวณ" : ""}</motion.h3>

            <SidebarMenuItem
              href="/adjust-carpet"
              icon={faClock}
              text="ปรับรอบพรบ."
              isSidebarOpen={isMobile || isSidebarOpen}
            />

            <SidebarMenuItem
              href="/ev-tax-calculator"
              icon={faClock}
              text="คำนวณภาษีรถไฟฟ้า"
              isSidebarOpen={isMobile || isSidebarOpen}
            />

            {/* Divider */}
            <div className="my-5 mx-3 border-t-2 border-emerald-100 dark:border-emerald-900/30"></div>
            
            <motion.h3
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-6 mb-3 px-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: (isMobile || isSidebarOpen) ? 1 : 0,
                x: (isMobile || isSidebarOpen) ? 0 : -20
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >

              {(isMobile || isSidebarOpen) ? "Admin Menu" : ""}
            </motion.h3>
            <SidebarMenuItem
              href="/devtool"
              icon={faFileAlt}
              text="DevMenu"
              isSidebarOpen={isMobile || isSidebarOpen}
            />

            <motion.h3
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-6 mb-3 px-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: (isMobile || isSidebarOpen) ? 1 : 0,
                x: (isMobile || isSidebarOpen) ? 0 : -20
              }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />
          </ul>
        </nav>

        <motion.footer
          className={`p-4 text-center text-[10px] text-gray-500 dark:text-gray-400 border-t-2 border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-r from-emerald-50/30 to-green-50/20 dark:from-emerald-950/20 dark:to-gray-800`}
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: (isMobile || isSidebarOpen) ? 1 : 0,
            y: (isMobile || isSidebarOpen) ? 0 : 20
          }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          &copy; {new Date().getFullYear()} Management system.
        </motion.footer>
      </motion.aside>

      {/* Main Content Area - **นี่คือจุดที่สำคัญ** ใช้ marginLeft เพื่อดันเนื้อหาให้พ้น Sidebar */}
      <motion.div
        className={`flex-1 flex flex-col bg-gray-100 dark:bg-gray-900`}
        animate={{ marginLeft: marginLeftMain }}
        transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1], type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Mobile Header with Menu Button */}
        <motion.header
          className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between">
            <motion.button
              onClick={toggleMobileSidebar}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              aria-label="เปิดเมนู"
            >
              <FontAwesomeIcon icon={faBars} className="text-xl" />
            </motion.button>
            <motion.h1
              className="text-lg font-semibold text-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              ตรอ.บังรีท่าอิฐ
            </motion.h1>
          </div>
        </motion.header>

        <main className="flex-1 overflow-y-auto">
          {children} {/* children คือ BillingMainPage ของคุณ */}
        </main>
      </motion.div>
    </div>
  );
};

export default Layout;